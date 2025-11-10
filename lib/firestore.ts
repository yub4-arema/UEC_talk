/**
 * Firestore API関数群
 * docs/planning.md セクション8に基づいた実装
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  serverTimestamp,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Post,
  DrinkMaster,
  GachaConfig,
  DrinkRankingItem,
  CombinationRankingItem,
  PostDocument,
  DrinkMasterDocument,
  GachaConfigDocument,
} from './types';

// コレクション名定数
const COLLECTIONS = {
  POSTS: 'posts',
  DRINK_MASTER: 'drink_master',
  GACHA_CONFIG: 'gacha_config',
} as const;

// ガチャ設定のドキュメントID
const CONFIG_DOC_ID = 'config';

/**
 * Timestampを Date に変換するヘルパー関数
 */
function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * createPost: ガチャ結果を投稿する
 * 
 * @param drink1Name - ドリンク1の名前
 * @param drink2Name - ドリンク2の名前
 * @param photoUrl - (オプション) 写真URL
 * @returns 作成されたドキュメントID
 */
export async function createPost(
  drink1Name: string,
  drink2Name: string,
  photoUrl?: string
): Promise<string> {
  try {
    // ドリンクマスターから各ドリンクの価格を取得
    const drink1 = await getDrinkByName(drink1Name);
    const drink2 = await getDrinkByName(drink2Name);

    // ガチャ価格を取得
    const gachaConfig = await getGachaConfig();

    // profit = (price1 + price2) - gacha_price を計算
    const price1 = drink1?.price ?? 0;
    const price2 = drink2?.price ?? 0;
    const profit = price1 + price2 - gachaConfig.gacha_price;

    // posts に新規ドキュメントを作成
    const postData = {
      drink_1_name: drink1Name,
      drink_2_name: drink2Name,
      photo_url: photoUrl,
      profit,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.POSTS), postData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

/**
 * getPosts: タイムライン表示用の投稿一覧を取得（新順）
 * 
 * @param limit - 取得件数（デフォルト: 20）
 * @param startAfterDoc - (オプション) ページング用スナップショット
 * @returns Post[]
 */
export async function getPosts(
  limit: number = 20,
  startAfterDoc?: DocumentSnapshot
): Promise<Post[]> {
  try {
    const postsRef = collection(db, COLLECTIONS.POSTS);
    let q = query(
      postsRef,
      orderBy('created_at', 'desc'),
      firestoreLimit(limit)
    );

    if (startAfterDoc) {
      q = query(
        postsRef,
        orderBy('created_at', 'desc'),
        startAfter(startAfterDoc),
        firestoreLimit(limit)
      );
    }

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as PostDocument;
      posts.push({
        id: doc.id,
        drink_1_name: data.drink_1_name,
        drink_2_name: data.drink_2_name,
        photo_url: data.photo_url,
        profit: data.profit,
        created_at: timestampToDate(data.created_at),
        updated_at: timestampToDate(data.updated_at),
      });
    });

    return posts;
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
}

/**
 * getPostById: 特定の投稿を取得
 * 
 * @param postId - 投稿ID
 * @returns Post オブジェクト、見つからない場合は null
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const docRef = doc(db, COLLECTIONS.POSTS, postId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as PostDocument;
    return {
      id: docSnap.id,
      drink_1_name: data.drink_1_name,
      drink_2_name: data.drink_2_name,
      photo_url: data.photo_url,
      profit: data.profit,
      created_at: timestampToDate(data.created_at),
      updated_at: timestampToDate(data.updated_at),
    };
  } catch (error) {
    console.error('Error getting post by id:', error);
    throw error;
  }
}

/**
 * getDrinkMaster: 全ドリンクマスターデータを取得
 * 
 * @returns DrinkMaster[]
 */
export async function getDrinkMaster(): Promise<DrinkMaster[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.DRINK_MASTER));
    const drinks: DrinkMaster[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DrinkMasterDocument;
      drinks.push({
        id: doc.id,
        name: data.name,
        price: data.price,
        created_at: timestampToDate(data.created_at),
      });
    });

    return drinks;
  } catch (error) {
    console.error('Error getting drink master:', error);
    throw error;
  }
}

/**
 * getDrinkByName: ドリンク名からマスターデータを検索
 * 
 * @param name - ドリンク名
 * @returns DrinkMaster、見つからない場合は null
 */
export async function getDrinkByName(name: string): Promise<DrinkMaster | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.DRINK_MASTER),
      where('name', '==', name),
      firestoreLimit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as DrinkMasterDocument;

    return {
      id: doc.id,
      name: data.name,
      price: data.price,
      created_at: timestampToDate(data.created_at),
    };
  } catch (error) {
    console.error('Error getting drink by name:', error);
    throw error;
  }
}

/**
 * addDrinkMaster: 新しいドリンクをマスターに追加（管理画面用）
 * 
 * @param name - ドリンク名
 * @param price - 価格（円）
 * @returns 作成されたドキュメントID
 */
export async function addDrinkMaster(name: string, price: number): Promise<string> {
  try {
    const drinkData = {
      name,
      price,
      created_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.DRINK_MASTER), drinkData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding drink master:', error);
    throw error;
  }
}

/**
 * getDrinkRanking: ドリンク別排出率ランキングを取得
 * 
 * @param limit - 取得件数（デフォルト: 10）
 * @returns DrinkRankingItem[]
 */
export async function getDrinkRanking(limit: number = 10): Promise<DrinkRankingItem[]> {
  try {
    // posts から全投稿を取得
    const posts = await getAllPosts();
    
    // 飲料名を集計
    const drinkCounts: { [name: string]: number } = {};
    let totalDrinks = 0;

    posts.forEach((post) => {
      drinkCounts[post.drink_1_name] = (drinkCounts[post.drink_1_name] || 0) + 1;
      drinkCounts[post.drink_2_name] = (drinkCounts[post.drink_2_name] || 0) + 1;
      totalDrinks += 2;
    });

    // 出現回数でソートしてランキング化
    const ranking = Object.entries(drinkCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalDrinks > 0 ? (count / totalDrinks) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return ranking;
  } catch (error) {
    console.error('Error getting drink ranking:', error);
    throw error;
  }
}

/**
 * getProfitRanking: お得度ランキング（最も得した投稿組み合わせ）を取得
 * 
 * @param limit - 取得件数（デフォルト: 10）
 * @returns Post[]（profit 降順）
 */
export async function getProfitRanking(limit: number = 10): Promise<Post[]> {
  try {
    const postsRef = collection(db, COLLECTIONS.POSTS);
    const q = query(
      postsRef,
      orderBy('profit', 'desc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as PostDocument;
      posts.push({
        id: doc.id,
        drink_1_name: data.drink_1_name,
        drink_2_name: data.drink_2_name,
        photo_url: data.photo_url,
        profit: data.profit,
        created_at: timestampToDate(data.created_at),
        updated_at: timestampToDate(data.updated_at),
      });
    });

    return posts;
  } catch (error) {
    console.error('Error getting profit ranking:', error);
    throw error;
  }
}

/**
 * getTotalProfit: サイト全体の累計お得額を取得
 * 
 * @returns 合計額（円）
 */
export async function getTotalProfit(): Promise<number> {
  try {
    // posts の profit フィールドの合計
    const posts = await getAllPosts();
    const totalProfit = posts.reduce((sum, post) => sum + post.profit, 0);
    return totalProfit;
  } catch (error) {
    console.error('Error getting total profit:', error);
    throw error;
  }
}

/**
 * getDrinkCombinationRanking: ドリンク組み合わせランキングを取得
 * 
 * @param limit - 取得件数（デフォルト: 10）
 * @returns CombinationRankingItem[]
 */
export async function getDrinkCombinationRanking(
  limit: number = 10
): Promise<CombinationRankingItem[]> {
  try {
    const posts = await getAllPosts();
    
    // 組み合わせを集計（順序を統一: アルファベット順でソート）
    const combinations: {
      [key: string]: { count: number; totalProfit: number; drink1: string; drink2: string };
    } = {};

    posts.forEach((post) => {
      const drinks = [post.drink_1_name, post.drink_2_name].sort();
      const key = `${drinks[0]}|${drinks[1]}`;

      if (!combinations[key]) {
        combinations[key] = {
          count: 0,
          totalProfit: 0,
          drink1: drinks[0],
          drink2: drinks[1],
        };
      }

      combinations[key].count += 1;
      combinations[key].totalProfit += post.profit;
    });

    // 出現回数でソートしてランキング化
    const ranking = Object.values(combinations)
      .map((combo) => ({
        drink1: combo.drink1,
        drink2: combo.drink2,
        count: combo.count,
        totalProfit: combo.totalProfit,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return ranking;
  } catch (error) {
    console.error('Error getting drink combination ranking:', error);
    throw error;
  }
}

/**
 * getGachaConfig: ガチャ設定を取得
 * 
 * @returns GachaConfig
 */
async function getGachaConfig(): Promise<GachaConfig> {
  try {
    const docRef = doc(db, COLLECTIONS.GACHA_CONFIG, CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('ガチャ設定が見つかりません');
    }

    const data = docSnap.data() as GachaConfigDocument;
    return {
      id: docSnap.id,
      gacha_price: data.gacha_price,
      updated_at: timestampToDate(data.updated_at),
    };
  } catch (error) {
    console.error('Error getting gacha config:', error);
    throw error;
  }
}

/**
 * getAllPosts: すべての投稿を取得（内部ヘルパー関数）
 * 
 * @returns Post[]
 */
async function getAllPosts(): Promise<Post[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.POSTS));
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as PostDocument;
      posts.push({
        id: doc.id,
        drink_1_name: data.drink_1_name,
        drink_2_name: data.drink_2_name,
        photo_url: data.photo_url,
        profit: data.profit,
        created_at: timestampToDate(data.created_at),
        updated_at: timestampToDate(data.updated_at),
      });
    });

    return posts;
  } catch (error) {
    console.error('Error getting all posts:', error);
    throw error;
  }
}
