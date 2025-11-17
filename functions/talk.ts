'use server'

import { GoogleGenAI } from "@google/genai";
import { getLatest50Posts } from "./posts";
import { getLatest200RssFromFirestore } from "./rss";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || ""});

// Common CSV utility functions
const escapeCsvValue = (val: any) => {
  if (val === undefined || val === null) return '';
  const s = String(val);
  // Replace line breaks with spaces and escape double quotes by doubling them
  return '"' + s.replace(/\r?\n+/g, ' ').replace(/"/g, '""') + '"';
};

const convertToISOString = (date: any): string => {
  try {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  } catch {
    return '';
  }
};

const TalkAi = async (question: string) => {
  try {
    const latestPosts = await getLatest50Posts();
    
    // Add error handling for RSS fetch
    const latestRss = await getLatest200RssFromFirestore().catch(err => {
      console.error('RSS取得エラー:', err);
      return { items: [] };
    });

    // Convert posts to a compact CSV. Include all parameters except `id`.
    // - createdAt: ISO string
    // - content: keep as-is but remove newlines (CSV needs single-line fields)
    // - other optional fields included with empty string fallback
    const toCSV = (p: any) => {
      if (!p?.posts || p.posts.length === 0) return '最新投稿はありません。';

      // Collect unique keys from first post + values in Post type.
      // We'll use the fields from the Post type explicitly to control order.
      const headers = [
        'authorName',
        'createdAt',
        'content',
        'category',
        'targetYear',
        'targetMajor',
        'targetClass',
        'likeCount',
      ];

      const rows = p.posts.map((post: any) => {
        // Exclude id if exists — we don't include it in headers
        return headers.map((h) => {
          switch (h) {
            case 'createdAt':
              return escapeCsvValue(convertToISOString(post.createdAt));
            case 'content':
              // keep content as-is, but strip newlines
              return escapeCsvValue(post.content ?? '');
            default:
              return escapeCsvValue(post[h]);
          }
        }).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      return csv;
    };

    const postsCSV = toCSV(latestPosts);

    // Convert RSS items to CSV format
    const toRssCSV = (r: any) => {
      if (!r?.items || r.items.length === 0) return '最新のRSSフィードはありません。';

      const headers = [
        'title',
        'link',
        'pubDate',
        'description',
        'author',
      ];

      const rows = r.items.map((item: any) => {
        return headers.map((h) => {
          switch (h) {
            case 'pubDate':
              return escapeCsvValue(convertToISOString(item.pubDate));
            default:
              return escapeCsvValue(item[h]);
          }
        }).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');
      return csv;
    };

    const rssCSV = toRssCSV(latestRss);

    // Build the system prompt (configurable via env var)

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
      現在の時間は${new Date().toISOString()}です。曜日は${new Date().toLocaleDateString('ja-JP', { weekday: 'long' })}です。
      あなたは国立大学法人、電気通信大学について情報をユーザーに教えるAIです。
      
      最近の学内投稿情報:
      ${postsCSV}
      
      最近のRSSフィード情報（外部ソース）:
      ${rssCSV}
      
      さて、ユーザーからの質問に答えてください。回答はユーザーと対話している形式にしてください。質問は次のとおりです。
      ${question}`
    });

    
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      text: text,
      success: true
    };
  } catch (error) {
    console.error('AI API エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Show detailed error in dev or when env var is enabled
    const showDetails = process.env.GEMINI_SHOW_ERROR_DETAILS === 'true' || process.env.NODE_ENV !== 'production';
    const fallbackText = showDetails ? `エラー。作者の財布が尽きたようです。\n\n詳細: ${errorMessage}` : 'エラー。作者の財布が尽きたようです。';

    return {
      text: fallbackText,
      success: false,
      error: errorMessage,
      stack: showDetails ? errorStack : undefined,
    };
  }
}

export default TalkAi;