/**
 * getDrinkMaster関数
 * 利用可能なドリンクの一覧を取得する
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../utils/constants';
import type { GetDrinkMasterResponse, DrinkMaster } from '../types';

/**
 * ドリンクマスター取得ハンドラー
 * @returns ドリンク一覧
 */
export async function getDrinkMasterHandler(): Promise<GetDrinkMasterResponse> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.DRINK_MASTER)
      .orderBy('name')
      .get();

    const drinks: DrinkMaster[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      drinks.push({
        id: doc.id,
        name: data.name,
        price: data.price,
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
