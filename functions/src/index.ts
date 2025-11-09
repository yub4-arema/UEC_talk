/**
 * Firebase Cloud Functions エントリーポイント
 * 
 * ガチャ自販機サイトのバックエンド関数を定義
 */

import { onCall } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { createPostHandler } from './handlers/createPost';
import { getPostsHandler } from './handlers/getPosts';
import { getStatisticsHandler } from './handlers/getStatistics';
import { getDrinkMasterHandler } from './handlers/getDrinkMaster';
import { updateStatisticsHandler } from './handlers/updateStatistics';
import { COLLECTIONS } from './utils/constants';

/**
 * 投稿作成関数
 * ガチャ結果を投稿し、お得度を自動計算する
 */
export const createPost = onCall(
  {
    region: 'asia-northeast1',
    cors: true,
  },
  async (request) => {
    return await createPostHandler(request.data);
  }
);

/**
 * 投稿一覧取得関数
 * タイムライン用の投稿一覧を取得する
 */
export const getPosts = onCall(
  {
    region: 'asia-northeast1',
    cors: true,
  },
  async (request) => {
    return await getPostsHandler(request.data);
  }
);

/**
 * 統計情報取得関数
 * サイト全体の統計情報を取得する
 */
export const getStatistics = onCall(
  {
    region: 'asia-northeast1',
    cors: true,
  },
  async () => {
    return await getStatisticsHandler();
  }
);

/**
 * ドリンクマスター取得関数
 * 利用可能なドリンク一覧を取得する
 */
export const getDrinkMaster = onCall(
  {
    region: 'asia-northeast1',
    cors: true,
  },
  async () => {
    return await getDrinkMasterHandler();
  }
);

/**
 * 統計更新トリガー関数
 * 投稿が作成された際に統計情報を自動更新する
 */
export const updateStatistics = onDocumentCreated(
  {
    document: `${COLLECTIONS.POSTS}/{postId}`,
    region: 'asia-northeast1',
  },
  async (event) => {
    await updateStatisticsHandler(event.data);
  }
);
