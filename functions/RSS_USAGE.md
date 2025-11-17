# RSS Functions - 使用例

このドキュメントは、`functions/rss.ts`に実装されたRSS関連関数の使用方法を説明します。

## 概要

NitterのRSSフィードから最新200件の投稿を取得し、Firestoreに保存・取得する機能を提供します。

## 関数一覧

### 1. fetchAndSaveRssToFirestore

NitterのRSSフィードURLから最新200件を取得してFirestoreに保存します。

```typescript
import { fetchAndSaveRssToFirestore } from './functions/rss';

// 使用例
const rssUrl = 'https://nitter.example.com/user/rss';
const savedCount = await fetchAndSaveRssToFirestore(rssUrl);
console.log(`${savedCount}件のRSSアイテムを保存しました`);
```

**引数:**
- `rssUrl` (string): NitterのRSSフィードURL

**戻り値:**
- Promise<number>: 保存に成功した件数

**特徴:**
- 重複防止機能付き（GUID/リンクベース）
- バッチ書き込みで効率的に保存
- 最新200件のみを保存

### 2. getLatest200RssFromFirestore

Firestoreに保存されている最新200件のRSSアイテムを取得します。

```typescript
import { getLatest200RssFromFirestore } from './functions/rss';
import type { Latest200RssResponse } from './functions/types';

// 使用例
const response: Latest200RssResponse = await getLatest200RssFromFirestore();
console.log(`${response.items.length}件のRSSアイテムを取得しました`);

// RSSアイテムを表示
response.items.forEach(item => {
  console.log(`タイトル: ${item.title}`);
  console.log(`リンク: ${item.link}`);
  console.log(`公開日: ${item.pubDate}`);
  console.log('---');
});
```

**戻り値:**
- Promise<Latest200RssResponse>: 最新200件のRSSアイテムを含むレスポンス

**特徴:**
- 公開日時の降順でソート
- FirestoreのTimestampを自動的にDateオブジェクトに変換

## Firestoreのデータ構造

### コレクション名
`rss_items`

### ドキュメント構造（RssItem型）

```typescript
{
  title: string;           // タイトル
  link: string;            // リンクURL
  pubDate: Date;           // 公開日時
  description?: string;    // 説明文・本文
  author?: string;         // 著者名
  content?: string;        // コンテンツ（HTML形式の場合もある）
  categories?: string[];   // カテゴリ
  guid?: string;          // GUID（一意識別子）
}
```

## talk.tsでの利用

`talk.ts`では、RSSデータを自動的に取得してAIプロンプトに含めています。

```typescript
// talk.ts内部で自動的に実行
const latestRss = await getLatest200RssFromFirestore();
// RSSデータをCSV形式に変換してAIプロンプトに含める
```

## エラーハンドリング

両方の関数はエラーが発生した場合、コンソールにエラーログを出力してエラーをスローします。

```typescript
try {
  await fetchAndSaveRssToFirestore(rssUrl);
} catch (error) {
  console.error('RSS保存エラー:', error);
  // エラー処理
}
```

## 注意事項

1. **環境変数**: Firebaseの設定が必要です（`functions/firebase.ts`参照）
2. **インデックス**: Firestoreで`pubDate`フィールドに降順インデックスを設定することを推奨します
3. **レート制限**: NitterのRSSフィード取得時にはレート制限に注意してください  
   ※レート制限は関数内部で自動的に処理されません。必要に応じて呼び出し側で制御してください。
4. **権限**: Firestoreの読み書き権限が適切に設定されていることを確認してください
