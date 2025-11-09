/**
 * Firebase Admin SDK設定
 */

import * as admin from 'firebase-admin';

// Firebase Admin SDKの初期化
admin.initializeApp();

// Firestoreインスタンスのエクスポート
export const db = admin.firestore();

// Firestoreのタイムスタンプ
export const FieldValue = admin.firestore.FieldValue;
