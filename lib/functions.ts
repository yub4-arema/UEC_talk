import type { Post, DrinkMaster } from './types';

// ガチャ価格（最安値ドリンクの2倍）
const GACHA_PRICE = 200; // 仮の価格、実際には最安値の2倍を設定

// 利益を計算
export const calculateProfit = (price1: number, price2: number): number => 
  price1 + price2 - GACHA_PRICE;

// ドリンク名から価格を取得
export const getDrinkPrice = (drinkName: string, drinkMasters: DrinkMaster[]): number => {
  const drink = drinkMasters.find(d => d.name === drinkName);
  return drink?.price ?? 0;
};

// 投稿データを作成
export const createPost = (
  drink1: string,
  drink2: string,
  drinkMasters: DrinkMaster[],
  photoUrl?: string
): Post => {
  const price1 = getDrinkPrice(drink1, drinkMasters);
  const price2 = getDrinkPrice(drink2, drinkMasters);
  return {
    id: crypto.randomUUID(),
    drink_1_name: drink1,
    drink_2_name: drink2,
    photo_url: photoUrl,
    created_at: Date.now(),
    profit: calculateProfit(price1, price2)
  };
};
