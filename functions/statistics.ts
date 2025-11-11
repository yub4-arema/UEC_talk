import {
  collection,
  getDocs,
  getDoc,
  doc,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Drink, AggregateData } from './types';
import { getDrinkList } from './drink';

/**
 * ドリンク排出情報（ランキング用）
 */
export interface DrinkRanking {
  id: number;
  name: string;
  price: number;
  count: number;
  rate: number; // 排出率（パーセント）
}

/**
 * ドリンク別排出率ランキングを取得
 * 現在のgachaListの全ドリンクを対象に、排出数でランキングを作成
 * @returns ドリンクランキングの配列（排出数降順）
 */
export async function getDrinkRanking(): Promise<DrinkRanking[]> {
  try {
    // 現在のガチャリストを取得
    const gachaList = await getDrinkList();

    if (!gachaList) {
      throw new Error('有効なガチャリストが見つかりません');
    }

    // 全投稿を取得して各ドリンクの排出数をカウント
    const postsRef = collection(db, 'posts');
    const postsSnapshot = await getDocs(postsRef);

    // ドリンクIDごとの排出数をカウント
    const drinkCounts = new Map<number, number>();
    let totalCount = 0;

    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      const drink1_id = data.drink1_id;
      const drink2_id = data.drink2_id;

      // drink1のカウント
      drinkCounts.set(drink1_id, (drinkCounts.get(drink1_id) || 0) + 1);
      totalCount++;

      // drink2のカウント
      drinkCounts.set(drink2_id, (drinkCounts.get(drink2_id) || 0) + 1);
      totalCount++;
    });

    // ランキングデータを作成
    const ranking: DrinkRanking[] = gachaList.drinks.map((drink) => {
      const count = drinkCounts.get(drink.id) || 0;
      const rate = totalCount > 0 ? (count / totalCount) * 100 : 0;

      return {
        id: drink.id,
        name: drink.name,
        price: drink.price,
        count,
        rate: Math.round(rate * 100) / 100, // 小数点第2位まで
      };
    });

    // 排出数の降順でソート
    ranking.sort((a, b) => b.count - a.count);

    return ranking;
  } catch (error) {
    console.error('ドリンクランキングの取得に失敗しました:', error);
    throw new Error('ドリンクランキングの取得に失敗しました');
  }
}

/**
 * サイト全体の累計お得額を取得
 * aggregateDataコレクションから集計データを取得
 * @returns 累計お得額
 */
export async function getTotalProfit(): Promise<number> {
  try {
    // aggregateDataドキュメントから集計データを取得
    const aggregateRef = doc(db, 'aggregateData', 'summary');
    const aggregateSnap = await getDoc(aggregateRef);

    if (!aggregateSnap.exists()) {
      // 集計データが存在しない場合は全投稿から計算
      return await calculateTotalProfitFromPosts();
    }

    const data = aggregateSnap.data();
    return data.totalProfit || 0;
  } catch (error) {
    console.error('累計お得額の取得に失敗しました:', error);
    throw new Error('累計お得額の取得に失敗しました');
  }
}

/**
 * 全投稿から累計お得額を計算（集計データが存在しない場合のフォールバック）
 * @returns 累計お得額
 */
async function calculateTotalProfitFromPosts(): Promise<number> {
  try {
    const postsRef = collection(db, 'posts');
    const postsSnapshot = await getDocs(postsRef);

    let totalProfit = 0;

    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      totalProfit += data.profits || 0;
    });

    return totalProfit;
  } catch (error) {
    console.error('投稿からの累計お得額計算に失敗しました:', error);
    return 0;
  }
}

/**
 * サイト全体の集計データを取得
 * @returns AggregateData型のオブジェクト
 */
export async function getAggregateData(): Promise<AggregateData> {
  try {
    const aggregateRef = doc(db, 'aggregateData', 'summary');
    const aggregateSnap = await getDoc(aggregateRef);

    if (!aggregateSnap.exists()) {
      // 集計データが存在しない場合は全投稿から計算
      return await calculateAggregateDataFromPosts();
    }

    const data = aggregateSnap.data();

    return {
      totalProfit: data.totalProfit || 0,
      totalGachaCount: data.totalGachaCount || 0,
      totalDrinkCount: data.totalDrinkCount || 0,
    };
  } catch (error) {
    console.error('集計データの取得に失敗しました:', error);
    throw new Error('集計データの取得に失敗しました');
  }
}

/**
 * 全投稿から集計データを計算（集計データが存在しない場合のフォールバック）
 * @returns AggregateData型のオブジェクト
 */
async function calculateAggregateDataFromPosts(): Promise<AggregateData> {
  try {
    const postsRef = collection(db, 'posts');
    const postsSnapshot = await getDocs(postsRef);

    let totalProfit = 0;
    let totalGachaCount = 0;
    let totalDrinkCount = 0;

    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      totalProfit += data.profits || 0;
      totalGachaCount += 1;
      totalDrinkCount += 2; // 1回のガチャで2本
    });

    return {
      totalProfit,
      totalGachaCount,
      totalDrinkCount,
    };
  } catch (error) {
    console.error('投稿からの集計データ計算に失敗しました:', error);
    return {
      totalProfit: 0,
      totalGachaCount: 0,
      totalDrinkCount: 0,
    };
  }
}
