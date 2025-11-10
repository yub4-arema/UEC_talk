/**
 * getDrinkMaster関数
 * 利用可能なドリンクの一覧を取得する（現在アクティブなシーズンのみ）
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../utils/constants';
import type { GetDrinkMasterResponse, DrinkMaster } from '../types';

/**
 * ドリンクマスター取得ハンドラー
 * @returns 現在アクティブなシーズンのドリンク一覧
 */
export async function getDrinkMasterHandler(): Promise<GetDrinkMasterResponse> {
  try {
    // アクティブなシーズンを取得
    const activeSeasonSnapshot = await db
      .collection(COLLECTIONS.SEASONS)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (activeSeasonSnapshot.empty) {
      // アクティブなシーズンがない場合は空の配列を返す
      return {
        drinks: [],
      };
    }

    const activeSeasonId = activeSeasonSnapshot.docs[0].id;

    // アクティブなシーズンのドリンクのみを取得
    const snapshot = await db
      .collection(COLLECTIONS.DRINK_MASTER)
      .where('seasonId', '==', activeSeasonId)
      .orderBy('name')
      .get();

    const drinks: DrinkMaster[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      drinks.push({
        id: doc.id,
        name: data.name,
        price: data.price,
        seasonId: data.seasonId,
      });
    }

    return {
      drinks,
    };
  } catch (error) {
    console.error('Error getting drink master:', error);
    throw new HttpsError(
      'internal',
      'ドリンクマスターの取得中にエラーが発生しました'
    );
  }
}
