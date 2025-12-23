"use server";

import {
  FetchAndSaveRssToFirestore as fetchAndSaveRss,
} from "./api/FetchAndSaveRssToFirestore";

import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { RssItem, Latest200RssResponse } from "./types";



const parseLimit = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return fallback;
};

const DEFAULT_RSS_LIMIT = parseLimit(process.env.RSS_LATEST_LIMIT, 200);

export async function FetchAndSaveRssToFirestore(
  rssUrl: string,
  collectionName: string = "rss_items"
): Promise<number> {
  return fetchAndSaveRss(rssUrl, collectionName);
}

export async function getLatest200RssFromFirestore(
  collectionName: string = "rss_items",
  rowLimit?: number
): Promise<Latest200RssResponse> {
  try {
    const rssCollection = collection(db, collectionName);
    
    const q = query(
      rssCollection,
      orderBy("pubDate", "desc"),
      limit(rowLimit && rowLimit > 0 ? rowLimit : DEFAULT_RSS_LIMIT)
    );
    
    const querySnapshot = await getDocs(q);
    const items: RssItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
     
      
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
