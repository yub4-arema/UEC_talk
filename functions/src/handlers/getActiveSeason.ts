/**
 * getActiveSeason関数
 * 現在アクティブなシーズンを取得する
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../utils/constants';
import type { GetActiveSeasonResponse, Season } from '../types';

/**
 * アクティブシーズン取得ハンドラー
 * @returns 現在アクティブなシーズン（存在しない場合はnull）
 */
export async function getActiveSeasonHandler(): Promise<GetActiveSeasonResponse> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.SEASONS)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        season: null,
      };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const season: Season = {
      id: doc.id,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate || null,
      isActive: data.isActive || false,
    };

    return {
      season,
    };
  } catch (error) {
    console.error('Error getting active season:', error);
    throw new HttpsError(
      'internal',
      'アクティブシーズンの取得中にエラーが発生しました'
    );
  }
}
