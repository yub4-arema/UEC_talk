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
      .orderBy('ver', 'desc')
      .get();

    const seasons: Season[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // 必須フィールドの存在確認と型検証
      if (
        typeof data.ver !== 'number' ||
        typeof data.name !== 'string' ||
        typeof data.isActive !== 'boolean'
      ) {
        console.error('Invalid season data:', doc.id);
        continue; // 不正なデータはスキップ
      }

      seasons.push({
        id: doc.id,
        ver: data.ver,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate || null,
        isActive: data.isActive,
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
