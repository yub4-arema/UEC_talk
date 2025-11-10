/**
 * getSeasons関数
 * シーズンの一覧を取得する（アーカイブを含む）
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../utils/constants';
import type { GetSeasonsResponse, Season } from '../types';

/**
 * シーズン一覧取得ハンドラー
 * @returns シーズン一覧
 */
export async function getSeasonsHandler(): Promise<GetSeasonsResponse> {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.SEASONS)
      .orderBy('startDate', 'desc')
      .get();

    const seasons: Season[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      seasons.push({
        id: doc.id,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate || null,
        isActive: data.isActive || false,
      });
    }

    return {
      seasons,
    };
  } catch (error) {
    console.error('Error getting seasons:', error);
    throw new HttpsError(
      'internal',
      'シーズン一覧の取得中にエラーが発生しました'
    );
  }
}
