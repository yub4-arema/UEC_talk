/**
 * updateStatistics関数
 * 投稿が追加された際に統計情報を自動更新する（Firestoreトリガー）
 */

import { DocumentSnapshot } from 'firebase-functions/v2/firestore';
import { db, FieldValue } from '../config/firebase';
import { COLLECTIONS, STATISTICS_DOC_ID } from '../utils/constants';

/**
 * 統計更新ハンドラー
 * @param snapshot 新規投稿のスナップショット
 */
export async function updateStatisticsHandler(
  snapshot: DocumentSnapshot
): Promise<void> {
  try {
    const postData = snapshot.data();
    if (!postData) {
      console.error('Post data is undefined');
      return;
    }

    const { drink1Name, drink2Name, profit } = postData;

    // 統計ドキュメントへの参照
    const statsRef = db
      .collection(COLLECTIONS.STATISTICS)
      .doc(STATISTICS_DOC_ID);

    // トランザクションで統計を更新
    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);

      if (!statsDoc.exists) {
        // 統計ドキュメントが存在しない場合は初期化
        transaction.set(statsRef, {
          drinkCounts: {
            [drink1Name]: 1,
            [drink2Name]: 1,
          },
          totalProfit: profit,
          lastUpdated: FieldValue.serverTimestamp(),
        });
      } else {
        // 既存の統計を更新
        const currentStats = statsDoc.data();
        const drinkCounts = currentStats?.drinkCounts || {};

        // ドリンクカウントを増加
        drinkCounts[drink1Name] = (drinkCounts[drink1Name] || 0) + 1;
        drinkCounts[drink2Name] = (drinkCounts[drink2Name] || 0) + 1;

        transaction.update(statsRef, {
          drinkCounts,
          totalProfit: (currentStats?.totalProfit || 0) + profit,
          lastUpdated: FieldValue.serverTimestamp(),
        });
      }
    });

    console.log('Statistics updated successfully');
  } catch (error) {
    console.error('Error updating statistics:', error);
    // トリガー関数なのでエラーをログに記録するのみ
    // 再試行は自動的に行われる
  }
}
