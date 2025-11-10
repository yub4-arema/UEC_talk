/**
 * 型定義ファイル
 * docs/planning.md に基づいた型定義
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 投稿データ
 */
export interface Post {
  id: string;
  drink_1_name: string;
  drink_2_name: string;
  photo_url?: string;
  profit: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * ドリンクマスター
 */
export interface DrinkMaster {
  id: string;
  name: string;
  price: number;
  created_at: Date;
}

/**
 * ガチャ設定
 */
export interface GachaConfig {
  id: string;
  gacha_price: number;
  updated_at: Date;
}

/**
 * ドリンク別排出率ランキングアイテム
 */
export interface DrinkRankingItem {
  name: string;
  count: number;
  percentage: number;
}

/**
 * ドリンク組み合わせランキングアイテム
 */
export interface CombinationRankingItem {
  drink1: string;
  drink2: string;
  count: number;
  totalProfit: number;
}

/**
 * Firestore ドキュメント型（内部使用）
 */
export interface PostDocument {
  drink_1_name: string;
  drink_2_name: string;
  photo_url?: string;
  profit: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DrinkMasterDocument {
  name: string;
  price: number;
  created_at: Timestamp;
}

export interface GachaConfigDocument {
  gacha_price: number;
  updated_at: Timestamp;
}
