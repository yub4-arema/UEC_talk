'use server'

import Parser from 'rss-parser';
import { collection, getDocs, query, orderBy, limit, writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { RssItem, Latest200RssResponse } from "./types";
import { createHash } from 'crypto';

/**
 * RSSアイテムの型ガード関数
 */
function isValidRssItem(data: any): data is RssItem {
  return (
    typeof data.title === 'string' &&
    typeof data.link === 'string' &&
    (data.pubDate instanceof Timestamp || data.pubDate instanceof Date || typeof data.pubDate === 'string')
  );
}

/**
 * NitterのRSSフィードから最新200件を取得してFirestoreに保存する
 * 
 * @param rssUrl NitterのRSSフィードURL
 * @returns 保存に成功した件数
 */
export async function fetchAndSaveRssToFirestore(rssUrl: string): Promise<number> {
  // URLバリデーション
  if (!rssUrl || typeof rssUrl !== 'string' || rssUrl.trim() === '') {
    throw new Error('RSS URLが空です。');
  }
  
  let url: URL;
  try {
    url = new URL(rssUrl);
  } catch (e) {
    throw new Error(`無効なURL形式です: ${rssUrl}`);
  }
  
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('HTTPまたはHTTPSプロトコルのURLのみサポートされています');
  }
  
  try {
    // RSSパーサーのインスタンスを作成（タイムアウト設定付き）
    const parser = new Parser({
      timeout: 10000, // 10秒のタイムアウト
      maxRedirects: 5,
    });
    
    // RSSフィードを取得・パース
    const feed = await parser.parseURL(rssUrl);
    
    // 最新200件を取得（RSSフィードが200件以上ある場合に備えて）
    const items = feed.items.slice(0, 200);
    
    // Firestoreにバッチで保存（効率的な一括書き込み）
    // バッチ書き込みの上限は500件なので、必要に応じて分割
    const BATCH_SIZE = 500;
    const rssCollection = collection(db, "rss_items");
    
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalSavedCount = 0;
    
    for (const item of items) {
      // RSSアイテムをRssItem型に変換
      const rssItem: RssItem = {
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        description: item.contentSnippet || item.content || '',
        author: item.creator || item.author,
        content: item.content,
        categories: item.categories,
        guid: item.guid || item.link,
      };
      
      // ハッシュを使用した安全なドキュメントID生成
      // （長いGUID/URLでもFirestoreのパス長制限を超えない）
      const docId = createHash('sha256')
        .update(rssItem.guid || rssItem.link)
        .digest('hex');
      const docRef = doc(rssCollection, docId);
      
      // Timestampに明示的に変換して保存
      batch.set(docRef, {
        ...rssItem,
        pubDate: Timestamp.fromDate(rssItem.pubDate)
      }, { merge: true });
      
      batchCount++;
      totalSavedCount++;
      
      // バッチサイズに達したらコミット
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
    
    // 残りのバッチをコミット
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log(`${totalSavedCount}件のRSSアイテムをFirestoreに保存しました`);
    return totalSavedCount;
    
  } catch (error) {
    console.error('RSSの取得または保存に失敗しました:', error);
    throw error;
  }
}

/**
 * Firestoreから最新200件のRSSアイテムを取得する
 * 
 * @returns 最新200件のRSSアイテム
 */
export async function getLatest200RssFromFirestore(): Promise<Latest200RssResponse> {
  try {
    const rssCollection = collection(db, "rss_items");
    
    // 公開日時の降順で最新200件を取得
    const q = query(
      rssCollection, 
      orderBy("pubDate", "desc"), 
      limit(200)
    );
    
    const querySnapshot = await getDocs(q);
    const items: RssItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // 型ガードを使用してデータを検証
      if (!isValidRssItem(data)) {
        console.warn(`無効なRSSアイテム: ${doc.id}`);
        return;
      }
      
      // FirestoreのTimestampをDateに変換
      items.push({
        ...data,
        pubDate: data.pubDate instanceof Timestamp 
          ? data.pubDate.toDate() 
          : (data.pubDate instanceof Date ? data.pubDate : new Date(data.pubDate)),
      } as RssItem);
    });
    
    console.log(`${items.length}件のRSSアイテムを取得しました`);
    return { items };
    
  } catch (error) {
    if (error instanceof Error && (error.message.includes('index') || error.message.includes('インデックス'))) {
      console.error('Firestoreインデックスが必要です。Firebase Consoleで「rss_items」コレクションの「pubDate」フィールドに降順インデックスを作成してください。', error);
    } else {
      console.error('RSSアイテムの取得に失敗しました:', error);
    }
    throw error;
  }
}
