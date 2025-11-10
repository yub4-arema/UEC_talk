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
  drink1Id: string;  // ドリンク1のID（必須）
  drink2Id: string;  // ドリンク2のID（必須）
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

1. `drink1Id`と`drink2Id`のバリデーション
   - 空文字チェック
2. `photoUrl`のバリデーション（指定されている場合）
   - URL形式チェック
3. `drinkMaster`コレクションから両ドリンクの情報（名前、価格）を取得
4. お得度の計算: `profit = (drink1Price + drink2Price) - GACHA_PRICE`
5. `posts`コレクションに新規ドキュメントを作成（ID、名前の両方を保存）
6. 投稿IDとお得度を返却

#### エラーケース

- `invalid-argument`: 必須パラメータが不足、不正なURL
- `not-found`: 指定されたドリンクIDがマスターに存在しない
- `internal`: データベースエラー、その他の予期しないエラー

#### 使用例

```typescript
const createPost = httpsCallable(functions, 'createPost');

const result = await createPost({
  drink1Id: 'drink_001',
  drink2Id: 'drink_002',
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
    drink1Id: string;
    drink2Id: string;
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

現在アクティブなシーズンで利用可能なドリンクの一覧を取得します。

#### リクエスト

なし

#### レスポンス

```typescript
{
  drinks: Array<{
    id: string;       // ドリンクID
    name: string;     // ドリンク名
    price: number;    // 通常価格（円）
    seasonId: string; // 所属するシーズンのID
  }>;
}
```

#### 処理フロー

1. `seasons`コレクションから現在アクティブなシーズン（`isActive: true`）を取得
2. アクティブなシーズンが存在しない場合は空の配列を返却
3. `drinkMaster`コレクションから該当シーズンのドリンク情報を取得
4. 名前順でソートして返却

#### エラーケース

- `internal`: データベースエラー

#### 使用例

```typescript
const getDrinkMaster = httpsCallable(functions, 'getDrinkMaster');

const result = await getDrinkMaster();
console.log('利用可能なドリンク:', result.data.drinks);

// セレクトボックスに表示
result.data.drinks.forEach(drink => {
  console.log(`${drink.name} - ${drink.price}円 (ID: ${drink.id})`);
});
```

---

### 5. getSeasons（シーズン一覧取得）

すべてのシーズン（過去のアーカイブを含む）を取得します。

#### リクエスト

なし

#### レスポンス

```typescript
{
  seasons: Array<{
    id: string;                    // シーズンID
    ver: number;                   // バージョン番号（人が順番を判別できるように）
    name: string;                  // シーズン名
    startDate: Timestamp;          // 開始日時
    endDate: Timestamp | null;     // 終了日時（nullの場合は現在アクティブ）
    isActive: boolean;             // アクティブフラグ
  }>;
}
```

#### 処理フロー

1. `seasons`コレクションから全シーズンを取得
2. バージョン番号の降順でソート（新しいシーズンが先頭）
3. シーズン一覧を返却

#### エラーケース

- `internal`: データベースエラー

#### 使用例

```typescript
const getSeasons = httpsCallable(functions, 'getSeasons');

const result = await getSeasons();
console.log('シーズン一覧:', result.data.seasons);

// アクティブなシーズンを探す
const activeSeason = result.data.seasons.find(s => s.isActive);
console.log('現在のシーズン:', activeSeason?.name);
```

---

### 6. getActiveSeason（現在アクティブなシーズン取得）

現在アクティブなシーズンを取得します。

#### リクエスト

なし

#### レスポンス

```typescript
{
  season: {
    id: string;                    // シーズンID
    ver: number;                   // バージョン番号（人が順番を判別できるように）
    name: string;                  // シーズン名
    startDate: Timestamp;          // 開始日時
    endDate: Timestamp | null;     // 終了日時（nullの場合は現在アクティブ）
    isActive: boolean;             // アクティブフラグ
  } | null;  // アクティブなシーズンがない場合はnull
}
```

#### 処理フロー

1. `seasons`コレクションから`isActive: true`のシーズンを取得
2. 存在しない場合は`null`を返却
3. 存在する場合はシーズン情報を返却

#### エラーケース

- `internal`: データベースエラー

#### 使用例

```typescript
const getActiveSeason = httpsCallable(functions, 'getActiveSeason');

const result = await getActiveSeason();
if (result.data.season) {
  console.log('現在のシーズン:', result.data.season.name);
} else {
  console.log('現在アクティブなシーズンはありません');
}
```

---

### 7. updateStatistics（統計更新トリガー）

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
  drink1Id: string;          // ドリンク1のID
  drink2Id: string;          // ドリンク2のID
  drink1Name: string;        // ドリンク1の名前（表示用）
  drink2Name: string;        // ドリンク2の名前（表示用）
  photoUrl: string | null;   // 写真のURL
  profit: number;            // お得度（円）
  createdAt: Timestamp;      // 投稿日時（サーバータイムスタンプ）
}
```

### drinkMasterコレクション

```typescript
{
  name: string;      // ドリンク名
  price: number;     // 通常価格（円）
  seasonId: string;  // 所属するシーズンのID
}
```

### seasonsコレクション

```typescript
{
  ver: number;                   // バージョン番号（人が順番を判別できるように、例: 1, 2, 3...）
  name: string;                  // シーズン名（例: "2024年春", "2024年夏"）
  startDate: Timestamp;          // シーズン開始日時
  endDate: Timestamp | null;     // シーズン終了日時（nullの場合は現在アクティブ）
  isActive: boolean;             // アクティブフラグ（同時に1つのみtrue）
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
    
    // seasonsコレクション
    match /seasons/{seasonId} {
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
   - `seasonId`（昇順）+ `name`（昇順）の複合インデックス
   - `name`（昇順）

3. **seasonsコレクション**
   - `isActive`（昇順）
   - `ver`（降順）

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
      drink1Id: 'drink_001',
      drink2Id: 'drink_002'
    });
    
    expect(result.postId).toBeDefined();
    expect(result.profit).toBeGreaterThanOrEqual(0);
  });
  
  it('should throw error for invalid drink ID', async () => {
    await expect(
      createPostHandler({
        drink1Id: '',
        drink2Id: 'drink_002'
      })
    ).rejects.toThrow('drink1Idは空にできません');
  });
  
  it('should throw error for non-existent drink', async () => {
    await expect(
      createPostHandler({
        drink1Id: 'non_existent_drink',
        drink2Id: 'drink_002'
      })
    ).rejects.toThrow('が見つかりません');
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
firebase deploy --only functions:createPost,functions:getPosts,functions:getSeasons
```

### デプロイ後の確認

```bash
# 関数の一覧表示
firebase functions:list

# ログの確認
firebase functions:log
```
