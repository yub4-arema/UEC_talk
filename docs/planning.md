# 要件定義書：ガチャ自販機サイト

## 1. 概要

### 1.1. プロジェクトの背景
大学のキャンパス内に設置された、特定の自動販売機に存在する「二人専用ランダムドリンクボタン」機能（以下、ガチャ）を対象とする。このガチャは、自販機内で最も安い飲料の2倍の価格で、ランダムなドリンクが2本排出される仕様となっており、利用者が金銭的に損をすることはない。

### 1.2. プロジェクトの目的
このガチャ体験をより楽しく、コミュニティで共有できるものにするため、結果の投稿・集計を行うWebサイトを開発する。利用者はガチャの結果を記録し、他の利用者の結果を閲覧し、統計情報を楽しむことができる。これにより、ガチャ体験に新たな価値を付与し、利用者間のコミュニケーションを誘発する。

---

## 2. 機能要件

### 2.1. 機能一覧
- **F-01**: ガチャ結果投稿機能
- **F-02**: 投稿タイムライン表示機能
- **F-03**: 統計情報表示機能
- **F-04**: 個人累計お得額表示機能

### 2.2. 機能詳細
- **F-01: ガチャ結果投稿機能**
    - ユーザーは、ガチャで排出されたドリンク2本の名前を入力する。
    - 任意で、結果の写真をアップロードできる。
    - 投稿日時はシステムが自動的に記録する。
    - AggregateData型のデータを全部加算する。
    - 投稿したPOSTのIdはローカルに保存する。

- **F-02: 投稿タイムライン表示機能**
    - すべてのユーザーの投稿を時系列（新しい順）で表示する。
    - 各投稿には、そのガチャで得した金額（お得度）を表示する。

- **F-03: 統計情報表示機能**
    - 現在の以下の統計情報を表示する。
        1.  **ドリンク別排出率ランキング**: これまで排出された現在のgachaListの全ドリンクの品目別ランキング。
        3.  **サイト全体の累計お得額**: 全ユーザーの総利益額。

- **F-04: 個人累計お得額表示機能**
    - サイト訪問者個人の、これまでのUser型のデータを保存する。
    - この記録は、ユーザー登録を不要とし、ブラウザのローカルストレージ等に保存する。

---

## 3. データ要件
types.ts に定義されたデータ型を使用する。

---

## 3.1 Firestore DB構造

### コレクション一覧

- **posts**
    - ガチャ投稿データ
    - 主なフィールド:
        - nickname: string
        - postedAt: Timestamp
        - drink1_id: number
        - drink2_id: number
        - pictureUrl: string
        - profits: number

- **gachaLists**
    - ガチャのバージョン・ドリンクリスト
    - 主なフィールド:
        - version: number
        - drinks: Drink[]
        - startDate: Timestamp
        - endDate: Timestamp
        - cost: number

- **aggregateData**
    - サイト全体の集計データ
    - ドキュメントID: summary
    - 主なフィールド:
        - totalProfit: number
        - totalGachaCount: number
        - totalDrinkCount: number

---

### データ型例

- Drink: { id: number, name: string, price: number, howManySold: number }
- gachaList: { version: number, drinks: Drink[], startDate: Date, endDate: Date, cost: number }
- Post: { id: string, nickname: string, postedAt: Date, drink1_id: number, drink2_id: number, pictureUrl: string, profits: number }
- AggregateData: { totalProfit: number, totalGachaCount: number, totalDrinkCount: number }


## 4. 技術要件

### 4.1. 技術スタック
- **フロントエンド**: Next.js 16, React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: Radix UI
- **バックエンド/データベース**: Firebase
  - **認証**: Firebase Authentication (不要の場合は省略可)
  - **データベース**: Firestore
  - **ストレージ**: Firebase Storage (写真アップロード用)

### 4.2. 開発環境
- **パッケージマネージャー**: npm
- **リンター**: ESLint
- **フォーマッター**: Prettier (必要に応じて)
- **バージョン管理**: Git/GitHub

---



---

## 8. Firestore 関数仕様

### 8.1. 投稿関連関数


#### 8.1.1. `createPost`
- **説明**: ガチャ結果を投稿する。ニックネーム・ドリンクID・お得額・画像（任意）を受け取り、画像はFirebase Storageにアップロード。Firestoreに投稿データを保存し、投稿IDを返す。型安全・エラーハンドリング対応。
- **引数**: nickname（string）, drink1_id（number）, drink2_id（number）, profits（number）, pictureFile（File, 任意）
- **返り値**: Promise<string>（投稿ID）

#### 8.1.2. `getPosts`
- **説明**: タイムライン表示用の投稿一覧を新しい順で取得。デフォルト50件。FirestoreのタイムスタンプをDate型に変換し、型安全に返却。
- **引数**: limitCount（number, 任意）
- **返り値**: Promise<Post[]>（投稿配列）

#### 8.1.3. `getPostById`
- **説明**: 投稿IDを指定して1件取得。存在しない場合はnullを返す。
- **引数**: postId（string）
- **返り値**: Promise<Post | null>

#### 8.1.4. `getMyPosts`
- **説明**: ローカルストレージから取得した投稿ID配列を受け取り、各投稿を取得して新しい順にソート。
- **引数**: postIds（string[]）
- **返り値**: Promise<Post[]>

**特徴**: TypeScript型安全性、JSDocコメント、エラーハンドリング、画像アップロード対応。


### 8.2. ドリンク関連関数

#### 8.2.1. `getDrinkList`
- **説明**: 現在有効なガチャリスト（endDateが未来）を取得。複数バージョンがある場合は最新版を返す。
- **引数**: なし
- **返り値**: Promise<gachaList | null>

#### 8.2.2. `getDrinkById`
- **説明**: ドリンクIDから個別のドリンク情報を取得。
- **引数**: drinkId（number）
- **返り値**: Promise<Drink | null>

**特徴**: 型安全、最新データ優先、エラーハンドリング。


### 8.3. 統計関連関数


#### 8.3.1. `getDrinkRanking`
- **説明**: 現在のgachaListの全ドリンクを対象に、排出数・排出率（パーセント）を計算し、降順でランキング化。
- **引数**: なし
- **返り値**: Promise<DrinkRanking[]>（ランキング配列）

#### 8.3.2. `getTotalProfit`
- **説明**: サイト全体の累計お得額を取得。集計データがなければ全投稿から計算。
- **引数**: なし
- **返り値**: Promise<number>

#### 8.3.3. `getAggregateData`
- **説明**: サイト全体の集計データ（累計お得額・総ガチャ回数・総ドリンク数）を取得。集計データがなければ全投稿から計算。
- **引数**: なし
- **返り値**: Promise<AggregateData>

**特徴**: パフォーマンス最適化（集計データ優先）、フォールバック機能、型安全、JSDocコメント、エラーハンドリング。
