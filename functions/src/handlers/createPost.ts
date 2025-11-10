/**
 * createPost関数
 * ガチャ結果の投稿を作成し、お得度を自動計算する
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db, FieldValue } from '../config/firebase';
import { validateDrinkId, validatePhotoUrl } from '../utils/validation';
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
  validateDrinkId(data.drink1Id, 'drink1Id');
  validateDrinkId(data.drink2Id, 'drink2Id');
  validatePhotoUrl(data.photoUrl);

  try {
    // アクティブなシーズンIDを取得
    const activeSeasonSnapshot = await db
      .collection(COLLECTIONS.SEASONS)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (activeSeasonSnapshot.empty) {
      throw new HttpsError(
        'failed-precondition',
        '現在アクティブなシーズンがありません'
      );
    }
    
    const activeSeasonId = activeSeasonSnapshot.docs[0].id;

    // ドリンクマスターから情報を取得
    const drink1Info = await getDrinkInfo(data.drink1Id);
    const drink2Info = await getDrinkInfo(data.drink2Id);

    // ドリンクがアクティブなシーズンに属しているか検証
    if (drink1Info.seasonId !== activeSeasonId) {
      throw new HttpsError(
        'invalid-argument',
        `ドリンクID「${data.drink1Id}」は現在のシーズンで利用できません`
      );
    }
    if (drink2Info.seasonId !== activeSeasonId) {
      throw new HttpsError(
        'invalid-argument',
        `ドリンクID「${data.drink2Id}」は現在のシーズンで利用できません`
      );
    }

    // お得度を計算
    const profit = drink1Info.price + drink2Info.price - GACHA_PRICE;

    // 投稿データを作成
    const postData = {
      drink1Id: data.drink1Id,
      drink2Id: data.drink2Id,
      drink1Name: drink1Info.name,
      drink2Name: drink2Info.name,
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
 * ドリンクマスターから情報を取得
 * @param drinkId ドリンクID
 * @returns ドリンク情報
 * @throws {HttpsError} ドリンクが見つからない場合
 */
async function getDrinkInfo(drinkId: string): Promise<DrinkMaster> {
  const drinkDoc = await db
    .collection(COLLECTIONS.DRINK_MASTER)
    .doc(drinkId)
    .get();

  if (!drinkDoc.exists) {
    throw new HttpsError(
      'not-found',
      `ドリンクID「${drinkId}」が見つかりません`
    );
  }

  const data = drinkDoc.data();
  if (!data) {
    throw new HttpsError(
      'not-found',
      `ドリンクID「${drinkId}」のデータが不正です`
    );
  }

  // データ型の検証
  if (
    typeof data.name !== 'string' ||
    typeof data.price !== 'number' ||
    typeof data.seasonId !== 'string'
  ) {
    throw new HttpsError(
      'internal',
      `ドリンクID「${drinkId}」のデータ形式が不正です`
    );
  }

  return {
    id: drinkDoc.id,
    name: data.name,
    price: data.price,
    seasonId: data.seasonId,
  };
}
