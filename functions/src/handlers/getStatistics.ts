/**
 * getStatistics関数
 * サイト全体の統計情報を取得する
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { COLLECTIONS, PROFIT_RANKING_LIMIT } from '../utils/constants';
import type {
  StatisticsResponse,
  Post,
  DrinkRanking,
  ProfitRankingItem,
} from '../types';

/**
 * 統計情報取得ハンドラー
 * @returns 統計情報
 */
export async function getStatisticsHandler(): Promise<StatisticsResponse> {
  try {
    // 全投稿を取得
    const postsSnapshot = await db.collection(COLLECTIONS.POSTS).get();

    // データの集計
    const drinkCounts: { [key: string]: number } = {};
    let totalProfit = 0;
    const allPosts: Post[] = [];

    for (const doc of postsSnapshot.docs) {
      const data = doc.data();
      const post: Post = {
        id: doc.id,
        drink1Id: data.drink1Id ?? '', // マイグレーション前データ対応
        drink2Id: data.drink2Id ?? '', // マイグレーション前データ対応
        drink1Name: data.drink1Name,
        drink2Name: data.drink2Name,
        photoUrl: data.photoUrl,
        profit: data.profit,
        createdAt: data.createdAt,
      };

      allPosts.push(post);

      // ドリンクカウント
      drinkCounts[post.drink1Name] = (drinkCounts[post.drink1Name] || 0) + 1;
      drinkCounts[post.drink2Name] = (drinkCounts[post.drink2Name] || 0) + 1;

      // 累計お得額
      totalProfit += post.profit;
    }

    // ドリンク別排出率ランキング
    const drinkRanking: DrinkRanking[] = Object.entries(drinkCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // お得度ランキング
    const profitRanking: ProfitRankingItem[] = allPosts
      .sort((a, b) => b.profit - a.profit)
      .slice(0, PROFIT_RANKING_LIMIT)
      .map((post) => ({
        drink1Name: post.drink1Name,
        drink2Name: post.drink2Name,
        profit: post.profit,
        createdAt: post.createdAt,
      }));

    return {
      drinkRanking,
      profitRanking,
      totalProfit,
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw new HttpsError('internal', '統計情報の取得中にエラーが発生しました');
  }
}
