# Firebase Cloud Functions API仕様書

## 概要

このドキュメントは、ガチャ自販機サイトで使用するFirebase Cloud Functionsの詳細なAPI仕様を定義します。

## 共通仕様

### エンドポイント

すべての関数は以下の形式でアクセスできます：

```
https://{region}-{project-id}.cloudfunctions.net/{functionName}
```

または、Firebase SDK経由で呼び出す場合：

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const functionName = httpsCallable(functions, 'functionName');
const result = await functionName(data);
```

### リージョン

- **asia-northeast1** (東京)

### CORS設定

開発環境ではすべてのオリジンを許可します。本番環境では特定のドメインのみに制限します。

### エラーレスポンス

すべての関数は以下の形式でエラーを返します：

```typescript
{
  code: string;        // エラーコード
  message: string;     // エラーメッセージ（日本語）
  details?: any;       // 追加のエラー詳細（オプション）
}
```

エラーコード一覧：

- `invalid-argument`: 不正な引数
- `not-found`: リソースが見つからない
- `internal`: 内部エラー
- `permission-denied`: 権限エラー

---

## API仕様

### 1. createPost（投稿作成）

ガチャ結果の投稿を作成し、お得度を自動計算します。

#### リクエスト

```typescript
{
  drink1Name: string;  // ドリンク1の名前（必須、最大50文字）
  drink2Name: string;  // ドリンク2の名前（必須、最大50文字）
  photoUrl?: string;   // 写真のURL（オプション）
}
```

#### レスポンス

```typescript
{
  postId: string;  // 作成された投稿のID
  profit: number;  // 計算されたお得度（円）
}
```

#### 処理フロー

1. `drink1Name`と`drink2Name`のバリデーション
   - 空文字チェック
   - 最大文字数チェック（50文字）
2. `photoUrl`のバリデーション（指定されている場合）
   - URL形式チェック
3. `drinkMaster`コレクションから両ドリンクの価格を取得
4. お得度の計算: `profit = (drink1Price + drink2Price) - GACHA_PRICE`
5. `posts`コレクションに新規ドキュメントを作成
6. 投稿IDとお得度を返却

#### エラーケース

- `invalid-argument`: 必須パラメータが不足、文字数超過、不正なURL
- `not-found`: 指定されたドリンクがマスターに存在しない
- `internal`: データベースエラー、その他の予期しないエラー

#### 使用例

```typescript
const createPost = httpsCallable(functions, 'createPost');

const result = await createPost({
  drink1Name: 'コカ・コーラ',
  drink2Name: 'ファンタ グレープ',
  photoUrl: 'https://example.com/photo.jpg'
});

console.log(`投稿ID: ${result.data.postId}`);
console.log(`お得度: ${result.data.profit}円`);
```

---

### 2. getPosts（投稿一覧取得）

投稿のタイムラインを取得します。

#### リクエスト

```typescript
{
  limit?: number;      // 取得件数（デフォルト: 50、最大: 100）
  startAfter?: string; // ページネーション用の投稿ID（前回の最後の投稿ID）
}
```

#### レスポンス

```typescript
{
  posts: Array<{
    id: string;
    drink1Name: string;
    drink2Name: string;
    photoUrl: string | null;
    profit: number;
    createdAt: Timestamp;
  }>;
  hasMore: boolean;  // さらに投稿があるかどうか
}
```

#### 処理フロー

1. `limit`のバリデーション（1〜100）
2. `posts`コレクションから`createdAt`降順でクエリ
3. `startAfter`が指定されている場合、そのドキュメント以降を取得
4. `limit + 1`件を取得し、`hasMore`を判定
5. `limit`件のみクライアントに返却

#### エラーケース

- `invalid-argument`: limitが範囲外、startAfter投稿が存在しない
- `internal`: データベースエラー

#### 使用例

```typescript
const getPosts = httpsCallable(functions, 'getPosts');

// 初回取得
const result = await getPosts({ limit: 20 });
console.log(`取得件数: ${result.data.posts.length}`);
console.log(`さらに投稿がある: ${result.data.hasMore}`);

// 次のページを取得
if (result.data.hasMore) {
  const lastPostId = result.data.posts[result.data.posts.length - 1].id;
  const nextResult = await getPosts({ 
    limit: 20, 
    startAfter: lastPostId 
  });
}
```

---

### 3. getStatistics（統計情報取得）

サイト全体の統計情報を取得します。

#### リクエスト

なし

#### レスポンス

```typescript
{
  drinkRanking: Array<{
    name: string;   // ドリンク名
    count: number;  // 排出回数
  }>;
  profitRanking: Array<{
    drink1Name: string;
    drink2Name: string;
    profit: number;
    createdAt: Timestamp;
  }>;
  totalProfit: number;  // サイト全体の累計お得額
}
```

#### 処理フロー

1. `posts`コレクションから全投稿を取得
2. ドリンク別排出回数を集計
3. お得度の高い順に投稿をソート（上位10件）
4. 累計お得額を計算
5. 統計データを返却

#### エラーケース

- `internal`: データベースエラー

#### 使用例

```typescript
const getStatistics = httpsCallable(functions, 'getStatistics');

const result = await getStatistics();
console.log('ドリンクランキング:', result.data.drinkRanking);
console.log('お得度ランキング:', result.data.profitRanking);
console.log('累計お得額:', result.data.totalProfit);
```

#### 最適化の推奨事項

統計情報は頻繁に変更されないため、以下の最適化を推奨：

1. `updateStatistics`トリガー関数で事前計算
2. 計算結果を`statistics`コレクションに保存
3. `getStatistics`関数は保存済みデータを返すだけ

---

### 4. getDrinkMaster（ドリンクマスター取得）

利用可能なドリンクの一覧を取得します。

#### リクエスト

なし

#### レスポンス

```typescript
{
  drinks: Array<{
    id: string;     // ドリンクID
    name: string;   // ドリンク名
    price: number;  // 通常価格（円）
  }>;
}
```

#### 処理フロー

1. `drinkMaster`コレクションから全ドリンク情報を取得
2. 名前順でソートして返却

#### エラーケース

- `internal`: データベースエラー

#### 使用例

```typescript
const getDrinkMaster = httpsCallable(functions, 'getDrinkMaster');

const result = await getDrinkMaster();
console.log('利用可能なドリンク:', result.data.drinks);

// セレクトボックスに表示
result.data.drinks.forEach(drink => {
  console.log(`${drink.name} - ${drink.price}円`);
});
```

---

### 5. updateStatistics（統計更新トリガー）

投稿が追加された際に統計情報を自動更新します。

#### トリガー条件

- **イベント**: `onCreate`
- **パス**: `posts/{postId}`

#### 処理フロー

1. 新規投稿データを取得
2. `statistics/global`ドキュメントをトランザクションで更新
   - ドリンク別カウントを増加
   - 累計お得額を加算
   - 最終更新日時を記録

#### 備考

- この関数はバックグラウンドで自動実行されます
- クライアントから直接呼び出すことはできません
- エラーが発生した場合、自動的に再試行されます

---

## データモデル

### postsコレクション

```typescript
{
  drink1Name: string;        // ドリンク1の名前
  drink2Name: string;        // ドリンク2の名前
  photoUrl: string | null;   // 写真のURL
  profit: number;            // お得度（円）
  createdAt: Timestamp;      // 投稿日時（サーバータイムスタンプ）
}
```

### drinkMasterコレクション

```typescript
{
  name: string;   // ドリンク名
  price: number;  // 通常価格（円）
}
```

### statisticsコレクション

```typescript
{
  drinkCounts: {
    [drinkName: string]: number;  // ドリンク名ごとの排出回数
  };
  totalProfit: number;            // 累計お得額
  lastUpdated: Timestamp;         // 最終更新日時
}
```

---

## セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // postsコレクション
    match /posts/{postId} {
      allow read: if true;                    // 全員が読み取り可能
      allow write: if false;                  // Cloud Functions経由でのみ作成
    }
    
    // drinkMasterコレクション
    match /drinkMaster/{drinkId} {
      allow read: if true;                    // 全員が読み取り可能
      allow write: if false;                  // 管理者のみ（コンソール経由）
    }
    
    // statisticsコレクション
    match /statistics/{docId} {
      allow read: if true;                    // 全員が読み取り可能
      allow write: if false;                  // Cloud Functions経由でのみ更新
    }
  }
}
```

---

## パフォーマンス最適化

### インデックス

以下のインデックスを作成してください：

1. **postsコレクション**
   - `createdAt`（降順）

2. **drinkMasterコレクション**
   - `name`（昇順）

### キャッシュ戦略

1. **ドリンクマスター**: クライアント側でキャッシュ（めったに変更されない）
2. **統計情報**: サーバー側で事前計算してキャッシュ
3. **投稿一覧**: ページネーションで必要な分だけ取得

---

## テスト

### ユニットテスト例

```typescript
import { createPostHandler } from './handlers/createPost';

describe('createPost', () => {
  it('should create a post with correct profit', async () => {
    const result = await createPostHandler({
      drink1Name: 'コカ・コーラ',
      drink2Name: 'ファンタ グレープ'
    });
    
    expect(result.postId).toBeDefined();
    expect(result.profit).toBeGreaterThanOrEqual(0);
  });
  
  it('should throw error for invalid drink name', async () => {
    await expect(
      createPostHandler({
        drink1Name: '',
        drink2Name: 'ファンタ グレープ'
      })
    ).rejects.toThrow('drink1Nameは空にできません');
  });
});
```

---

## デプロイ

### 環境変数の設定

```bash
firebase functions:config:set app.gacha_price=200
```

### デプロイコマンド

```bash
# 全関数をデプロイ
firebase deploy --only functions

# 特定の関数のみデプロイ
firebase deploy --only functions:createPost,functions:getPosts
```

### デプロイ後の確認

```bash
# 関数の一覧表示
firebase functions:list

# ログの確認
firebase functions:log
```
