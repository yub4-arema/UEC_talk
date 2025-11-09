/**
 * バリデーション関数
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { MAX_DRINK_NAME_LENGTH, MAX_POSTS_LIMIT } from './constants';

/**
 * ドリンク名のバリデーション
 * @param name ドリンク名
 * @throws {HttpsError} バリデーションエラー
 */
export function validateDrinkName(name: unknown, fieldName: string): void {
  if (typeof name !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName}は文字列である必要があります`
    );
  }

  if (name.trim().length === 0) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName}は空にできません`
    );
  }

  if (name.length > MAX_DRINK_NAME_LENGTH) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName}は${MAX_DRINK_NAME_LENGTH}文字以内で入力してください`
    );
  }
}

/**
 * 写真URLのバリデーション（オプショナル）
 * @param url 写真URL
 * @throws {HttpsError} バリデーションエラー
 */
export function validatePhotoUrl(url: unknown): void {
  if (url === undefined || url === null) {
    return; // オプショナルなのでOK
  }

  if (typeof url !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'photoUrlは文字列である必要があります'
    );
  }

  // 簡易的なURL検証
  try {
    new URL(url);
  } catch {
    throw new HttpsError(
      'invalid-argument',
      'photoUrlは有効なURLである必要があります'
    );
  }
}

/**
 * 投稿取得の件数制限のバリデーション
 * @param limit 件数
 * @returns 検証済みの件数
 * @throws {HttpsError} バリデーションエラー
 */
export function validatePostsLimit(limit: unknown): number {
  if (limit === undefined || limit === null) {
    return 50; // デフォルト値
  }

  if (typeof limit !== 'number') {
    throw new HttpsError(
      'invalid-argument',
      'limitは数値である必要があります'
    );
  }

  if (!Number.isInteger(limit)) {
    throw new HttpsError(
      'invalid-argument',
      'limitは整数である必要があります'
    );
  }

  if (limit < 1 || limit > MAX_POSTS_LIMIT) {
    throw new HttpsError(
      'invalid-argument',
      `limitは1から${MAX_POSTS_LIMIT}の範囲で指定してください`
    );
  }

  return limit;
}
