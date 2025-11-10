/**
 * getPosts関数
 * 投稿のタイムラインを取得する
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { validatePostsLimit } from '../utils/validation';
import { COLLECTIONS, DEFAULT_POSTS_LIMIT } from '../utils/constants';
import type { GetPostsRequest, GetPostsResponse, Post } from '../types';

/**
 * 投稿一覧取得ハンドラー
 * @param data リクエストデータ
 * @returns 投稿の配列とページネーション情報
 */
export async function getPostsHandler(
  data: GetPostsRequest
): Promise<GetPostsResponse> {
  try {
    // 件数のバリデーション
    const limit = validatePostsLimit(data.limit) || DEFAULT_POSTS_LIMIT;

    // クエリの構築
    let query = db
      .collection(COLLECTIONS.POSTS)
      .orderBy('createdAt', 'desc')
      .limit(limit + 1); // hasMoreを判定するため+1件取得

    // ページネーション
    if (data.startAfter) {
      const startDoc = await db
        .collection(COLLECTIONS.POSTS)
        .doc(data.startAfter)
        .get();

      if (!startDoc.exists) {
        throw new HttpsError(
          'invalid-argument',
          '指定された投稿が見つかりません'
        );
      }

      query = query.startAfter(startDoc);
    }

    // クエリの実行
    const snapshot = await query.get();

    // 結果を配列に変換
    const posts: Post[] = [];
    const hasMore = snapshot.docs.length > limit;

    // limit件のみ返却（+1件は hasMore 判定用）
    const docsToReturn = snapshot.docs.slice(0, limit);

    for (const doc of docsToReturn) {
      const data = doc.data();
      posts.push({
        id: doc.id,
        drink1Id: data.drink1Id ?? '', // マイグレーション前データ対応
        drink2Id: data.drink2Id ?? '', // マイグレーション前データ対応
        drink1Name: data.drink1Name,
        drink2Name: data.drink2Name,
        photoUrl: data.photoUrl,
        profit: data.profit,
        createdAt: data.createdAt,
      });
    }

    return {
      posts,
      hasMore,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error getting posts:', error);
    throw new HttpsError('internal', '投稿の取得中にエラーが発生しました');
  }
}
