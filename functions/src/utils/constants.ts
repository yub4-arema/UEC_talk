/**
 * 定数定義
 */

/**
 * ガチャの価格（円）
 * 環境変数から取得、デフォルトは200円
 */
export const GACHA_PRICE = Number(process.env.GACHA_PRICE) || 200;

/**
 * 投稿一覧取得のデフォルト件数
 */
export const DEFAULT_POSTS_LIMIT = 50;

/**
 * 投稿一覧取得の最大件数
 */
export const MAX_POSTS_LIMIT = 100;

/**
 * ドリンク名の最大文字数
 */
export const MAX_DRINK_NAME_LENGTH = 50;

/**
 * お得度ランキングの表示件数
 */
export const PROFIT_RANKING_LIMIT = 10;

/**
 * Firestoreコレクション名
 */
export const COLLECTIONS = {
  POSTS: 'posts',
  DRINK_MASTER: 'drinkMaster',
  STATISTICS: 'statistics',
} as const;

/**
 * 統計情報ドキュメントID
 */
export const STATISTICS_DOC_ID = 'global';
