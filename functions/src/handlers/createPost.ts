/**
 * createPost関数
 * ガチャ結果の投稿を作成し、お得度を自動計算する
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db, FieldValue } from '../config/firebase';
import { validateDrinkName, validatePhotoUrl } from '../utils/validation';
import { COLLECTIONS, GACHA_PRICE } from '../utils/constants';
import type {
  CreatePostRequest,
  CreatePostResponse,
  DrinkMaster,
} from '../types';

/**
 * 投稿作成ハンドラー
 * @param data リクエストデータ
 * @returns 作成された投稿のIDとお得度
 */
export async function createPostHandler(
  data: CreatePostRequest
): Promise<CreatePostResponse> {
  // 入力値のバリデーション
  validateDrinkName(data.drink1Name, 'drink1Name');
  validateDrinkName(data.drink2Name, 'drink2Name');
  validatePhotoUrl(data.photoUrl);

  try {
    // ドリンクマスターから価格を取得
    const drink1Price = await getDrinkPrice(data.drink1Name);
    const drink2Price = await getDrinkPrice(data.drink2Name);

    // お得度を計算
    const profit = drink1Price + drink2Price - GACHA_PRICE;

    // 投稿データを作成
    const postData = {
      drink1Name: data.drink1Name.trim(),
      drink2Name: data.drink2Name.trim(),
      photoUrl: data.photoUrl || null,
      profit,
      createdAt: FieldValue.serverTimestamp(),
    };

    // Firestoreに保存
    const postRef = await db.collection(COLLECTIONS.POSTS).add(postData);

    return {
      postId: postRef.id,
      profit,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Error creating post:', error);
    throw new HttpsError('internal', '投稿の作成中にエラーが発生しました');
  }
}

/**
 * ドリンクマスターから価格を取得
 * @param drinkName ドリンク名
 * @returns 価格
 * @throws {HttpsError} ドリンクが見つからない場合
 */
async function getDrinkPrice(drinkName: string): Promise<number> {
  const snapshot = await db
    .collection(COLLECTIONS.DRINK_MASTER)
    .where('name', '==', drinkName.trim())
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpsError(
      'not-found',
      `ドリンク「${drinkName}」が見つかりません`
    );
  }

  const drinkDoc = snapshot.docs[0];
  const drink = drinkDoc.data() as DrinkMaster;

  return drink.price;
}
