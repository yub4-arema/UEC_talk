'use server'

import {
  FetchAndSaveRssToFirestore as fetchAndSaveRss,
} from "./api/FetchAndSaveRssToFirestore";

import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { RssItem, Latest200RssResponse } from "./types";

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


export async function FetchAndSaveRssToFirestore(rssUrl: string): Promise<number> {
  return fetchAndSaveRss(rssUrl);
}

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
