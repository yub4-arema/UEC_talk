# ファイル構造と主な役割

- functions/talk.ts: Groq 呼び出しのエントリ。最新データ取得 → プロンプト組み立て → 生成結果保存。取得済み CSV をそのまま渡す（行トリムなし）。
- functions/talk/prompt.ts: システムプロンプト構築。current_time・postsCSV・student_rss_csv・official_rss_csv・会話ログ・質問を挿入。
- functions/talk/fetchers.ts: Firestore から投稿と RSS を limit 付きで取得し CSV 化。`RSS_ITEMS_FETCH_LIMIT` と `RSS_ITEMS_2_FETCH_LIMIT` で学生/公式 RSS を分離管理。
- functions/rss.ts: Firestore クエリ本体。`getLatest200RssFromFirestore(collectionName, rowLimit)` が limit をクエリに適用。
- functions/posts.ts: 投稿取得。`POSTS_LATEST_LIMIT` をクエリ limit に適用。
- functions/api/fetchAllRssFeeds.ts / functions/api/FetchAndSaveRssToFirestore.ts: 外部 RSS を取得し Firestore に保存するバッチ。
- functions/types.ts: Post/RSS/TalkLog などの型定義。
- app/api/rss/route.ts: RSS 公開用 API ルート。
- app/layout.tsx / app/page.tsx: Next.js レイアウトとトップページ。
- lib/data.ts / lib/utils.ts: 時間割・学習要覧データと共通ユーティリティ。
- components/*: UI コンポーネント群（card, button, tabs など再利用パーツ）。
- app/globals.css: 全体スタイル設定。

---

## 環境変数ガイド（.env.local）

### RSS 取得フェーズ（`FetchAndSaveRssToFirestore`）
外部 RSS フィードからデータを取得して Firestore に保存するプロセスで使用される変数。

- **RSS_MAX_ITEMS** = 200
  - 1つの RSS フィードから**一度に取得する最大記事数**
  - Parser が RSS を解析した後、最初の200件のみ処理対象になる
  - 用途：API レスポンスが大きい場合のサイズ制限

- **RSS_FETCH_INTERVAL_MINUTES** = 30
  - 同じコレクション（rss_items）への**再実行の最小間隔（分）**
  - Firestore の `rss_metadata` に前回実行時刻を記録し、指定分数経過するまで処理をスキップ
  - 用途：外部 RSS の無駄な連続リクエスト防止

- **RSS_REQUEST_TIMEOUT_MS** = 10000（ミリ秒）
  - RSS Parser のリクエストが**タイムアウトするまでの時間**
  - 用途：通信が遅い場合は値を増やす（ただし Vercel 関数のタイムアウト制限には注意）

- **RSS_REQUEST_MAX_REDIRECTS** = 5
  - HTTP リダイレクトで**最大5回までしか追従しない**
  - 用途：無限リダイレクト攻撃対策

### Firestore 保存フェーズ（`FetchAndSaveRssToFirestore` 内）
取得した RSS 記事を Firestore に保存・管理するプロセスで使用される変数。

- **RSS_BATCH_SIZE** = 500
  - Firestore の**バッチ書き込み/削除のサイズ**
  - Firestore は1回のバッチで最大500操作が仕様
  - 用途：大量アイテム保存時のコミット分割

- **RSS_SAVE_LIMIT** = 200
  - Firestore に保存する**記事の最大件数**
  - 超過分は古い順に自動削除される
  - 用途：Firestore ストレージ容量制御

### AI 学習フェーズ（TalkAi 質問応答時、`buildTalkDataContext` 内）
ユーザーが AI に質問したときに、AI が参照するデータを準備するプロセスで使用される変数。

- **RSS_ITEMS_FETCH_LIMIT** = 200
  - AI に学習させる**「学生向け RSS」の記事数**
  - `rss_items` コレクションから最新200件を取得・CSV 化
  - 用途：デフォルト。トークンが余裕ならこの値を上げる

- **RSS_ITEMS_2_FETCH_LIMIT** = 20
  - AI に学習させる**「公式 RSS」の記事数**
  - `rss_items_2` コレクションから最新20件を取得・CSV 化
  - 用途：学生向けより少なく設定。トークン削減とノイズ低減

- **POSTS_LATEST_LIMIT** = 40
  - AI に学習させる**ユーザー投稿の件数**
  - `posts` コレクションから最新40件を取得・CSV 化
  - 用途：ローカルデータの重要度を上げる場合は増やす

### その他の設定

- **RSS_ALLOWED_HOSTS** = nitter.privacyredirect.com,nitter.shibadogcap.com
  - 許可する RSS ホスト（カンマ区切り）
  - 用途：セキュリティ。指定ホスト以外の RSS URL は処理されない

- **RSS_FEEDS** （複数指定用）
  - 形式：`url|collectionName` を改行またはカンマで区切る
  - 用途：`RSS_URL_1`/`RSS_URL_2` より優先される（複数フィード対応）

- **RSS_URL_1 / RSS_URL_2** （単体指定用）
  - RSS_FEEDS が空の場合に使用
  - 用途：シンプルな2フィード構成

---

## データフロー図

```
外部 RSS
   ↓
[RSS_MAX_ITEMS で制限 → Parser が最初の200件のみ取得]
   ↓
[RSS_FETCH_INTERVAL_MINUTES チェック → 30分経過していない場合はスキップ]
   ↓
[RSS_REQUEST_TIMEOUT_MS, RSS_REQUEST_MAX_REDIRECTS で通信制御]
   ↓
Firestore へ保存
[RSS_BATCH_SIZE で500件ずつコミット]
[RSS_SAVE_LIMIT チェック → 200件超過時は古い記事を削除]
   ↓
（ユーザーが質問）
   ↓
AI 用データ取得・CSV 化
[RSS_ITEMS_FETCH_LIMIT: 200件 取得]
[RSS_ITEMS_2_FETCH_LIMIT: 20件 取得]
[POSTS_LATEST_LIMIT: 40件 取得]
   ↓
Groq API に CSV 形式で入力 → AI 応答
```
