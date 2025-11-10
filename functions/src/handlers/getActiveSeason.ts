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
    
    // 必須フィールドの存在確認と型検証
    if (
      typeof data.ver !== 'number' ||
      typeof data.name !== 'string' ||
      typeof data.isActive !== 'boolean'
    ) {
      // 不正なデータの場合はnullを返す
      console.error('Invalid active season data:', doc.id);
      return {
        season: null,
      };
    }

    const season: Season = {
      id: doc.id,
      ver: data.ver,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate || null,
      isActive: data.isActive,
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
