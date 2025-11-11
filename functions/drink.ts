import {
  collection,
  getDocs,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Drink, gachaList } from './types';

/**
 * Firestore DocumentDataをDrink型に変換する
 * @param data - Firestoreのドキュメントデータ
 * @returns Drink型のオブジェクト
 */
function convertToDrink(data: DocumentData): Drink {
  return {
    id: data.id,
    name: data.name,
    price: data.price,
    howManySold: data.howManySold || 0,
  };
}

/**
 * Firestore DocumentDataをgachaList型に変換する
 * @param data - Firestoreのドキュメントデータ
 * @returns gachaList型のオブジェクト
 */
function convertToGachaList(data: DocumentData): gachaList {
  return {
    version: data.version,
    drinks: data.drinks.map((drink: DocumentData) => convertToDrink(drink)),
    startDate: data.startDate.toDate(),
    endDate: data.endDate.toDate(),
    cost: data.cost,
  };
}

/**
 * ドリンク一覧を取得
 * 現在有効なガチャリストを取得する（endDateが現在より未来のもの）
 * @returns ガチャリスト、見つからない場合はnull
 */
export async function getDrinkList(): Promise<gachaList | null> {
  try {
    const gachaListsRef = collection(db, 'gachaLists');
    const now = new Date();

    // 全てのガチャリストを取得してフィルタリング
    const querySnapshot = await getDocs(gachaListsRef);

    let currentGachaList: gachaList | null = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const endDate = data.endDate.toDate();

      // 終了日が現在より未来のものを取得
      if (endDate > now) {
        const gachaList = convertToGachaList(data);
        // より新しいバージョンのガチャリストを優先
        if (!currentGachaList || gachaList.version > currentGachaList.version) {
          currentGachaList = gachaList;
        }
      }
    });

    return currentGachaList;
  } catch (error) {
    console.error('ドリンク一覧の取得に失敗しました:', error);
    throw new Error(`ドリンク一覧の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 特定のドリンク情報を取得
 * @param drinkId - ドリンクID
 * @returns Drink型のオブジェクト、見つからない場合はnull
 */
export async function getDrinkById(drinkId: number): Promise<Drink | null> {
  try {
    const gachaList = await getDrinkList();

    if (!gachaList) {
      return null;
    }

    const drink = gachaList.drinks.find((d) => d.id === drinkId);
    return drink || null;
  } catch (error) {
    console.error('ドリンク情報の取得に失敗しました:', error);
    throw new Error(`ドリンク情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}
