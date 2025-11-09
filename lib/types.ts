// 投稿データ型
export interface Post {
  id: string;
  drink_1_name: string;
  drink_2_name: string;
  photo_url?: string;
  created_at: number;
  profit: number;
}

// ドリンクマスター型
export interface DrinkMaster {
  id: string;
  name: string;
  price: number;
}
