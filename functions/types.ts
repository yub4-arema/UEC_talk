
// 投稿のカテゴリ
// フィルタリング（絞り込み）のUIで使いやすいように、固定の値を定義しておきます。
type PostCategory = "授業" |  "その他";

// posts コレクションのドキュメント型
interface Post {
  // --- 必須の基本情報 ---
  
  /** 投稿の本文 */
  content: string;
 
  authorName: string;

  createdAt: Date;

  // --- カテゴリ・タグ情報 ---
  
  /** 投稿のカテゴリ */
  category: PostCategory;

  // --- 投稿の対象者情報 (フィルタリング用) ---
  
  /** 対象学年 (例: 1年生 [cite: 24]) */
  targetYear?: number | null;

  /** 対象類 (例: "I類" , "II類" [cite: 8]) */
  targetMajor?: "I類" | "II類" | "III類" | null;
  
  /** 対象クラス (例: "Aクラス" , "Bクラス" [cite: 14]) */
  targetClass?: string | null;  

  // --- インタラクション情報 ---
  
  /** 「いいね」の数 */
  likeCount: number;
}

interface Latest50PostsResponse {
  posts: Post[];
}

// --- RSS関連の型定義 ---

/** RSSアイテムの型定義 */
interface RssItem {
  /** タイトル */
  title: string;
  
  /** リンクURL */
  link: string;
  
  /** 公開日時 */
  pubDate: Date;
  
  /** 説明文・本文 */
  description?: string;
  
  /** 著者名 */
  author?: string;
  
  /** コンテンツ（HTML形式の場合もある） */
  content?: string;
  
  /** カテゴリ */
  categories?: string[];
  
  /** GUID（一意識別子） */
  guid?: string;
}

/** Firestoreから取得する最新200件のRSS応答型 */
interface Latest200RssResponse {
  items: RssItem[];
}

export type { Post, PostCategory, Latest50PostsResponse, RssItem, Latest200RssResponse };