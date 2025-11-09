/**
 * 型定義ファイル
 * 
 * ガチャ自販機サイトで使用する共通の型定義
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * 投稿データ
 */
export interface Post {
  id: string;
  drink1Name: string;
  drink2Name: string;
  photoUrl: string | null;
  profit: number;
  createdAt: Timestamp;
}

/**
 * 投稿作成リクエスト
 */
export interface CreatePostRequest {
  drink1Name: string;
  drink2Name: string;
  photoUrl?: string;
}

/**
 * 投稿作成レスポンス
 */
export interface CreatePostResponse {
  postId: string;
  profit: number;
}

/**
 * 投稿一覧取得リクエスト
 */
export interface GetPostsRequest {
  limit?: number;
  startAfter?: string;
}

/**
 * 投稿一覧取得レスポンス
 */
export interface GetPostsResponse {
  posts: Post[];
  hasMore: boolean;
}

/**
 * ドリンクマスター
 */
export interface DrinkMaster {
  id: string;
  name: string;
  price: number;
}

/**
 * ドリンクマスター取得レスポンス
 */
export interface GetDrinkMasterResponse {
  drinks: DrinkMaster[];
}

/**
 * ドリンク別排出統計
 */
export interface DrinkRanking {
  name: string;
  count: number;
}

/**
 * お得度ランキングアイテム
 */
export interface ProfitRankingItem {
  drink1Name: string;
  drink2Name: string;
  profit: number;
  createdAt: Timestamp;
}

/**
 * 統計情報レスポンス
 */
export interface StatisticsResponse {
  drinkRanking: DrinkRanking[];
  profitRanking: ProfitRankingItem[];
  totalProfit: number;
}

/**
 * 統計情報ドキュメント（Firestoreに保存）
 */
export interface StatisticsDocument {
  drinkCounts: { [drinkName: string]: number };
  totalProfit: number;
  lastUpdated: Timestamp;
}
