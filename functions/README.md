# Firebase Cloud Functions - ガチャ自販機サイト

このディレクトリには、ガチャ自販機サイトのFirebase Cloud Functions仕様と実装が含まれています。

## 概要

本プロジェクトでは、以下のCloud Functionsを使用してバックエンド機能を実装します：

1. **createPost** - ガチャ結果の投稿作成
2. **getPosts** - 投稿一覧の取得
3. **getStatistics** - 統計情報の取得
4. **getDrinkMaster** - ドリンクマスター情報の取得
5. **updateStatistics** - 統計情報の自動更新（トリガー関数）

詳細な仕様については、`docs/planning.md`の「8. Firestore 関数仕様」を参照してください。

## セットアップ

### 前提条件

- Node.js 20以上
- Firebase CLI
- Firebaseプロジェクトの作成

### インストール

```bash
# functionsディレクトリに移動
cd functions

# 依存関係のインストール
npm install
```

## 開発

### ローカル開発

Firebase Emulator Suiteを使用してローカルで関数をテストできます：

```bash
# エミュレーターの起動
firebase emulators:start

# 特定の関数のみエミュレート
firebase emulators:start --only functions
```

### テスト

```bash
# ユニットテストの実行
npm test

# テストカバレッジの確認
npm run test:coverage
```

## デプロイ

### 全関数のデプロイ

```bash
firebase deploy --only functions
```

### 特定の関数のみデプロイ

```bash
firebase deploy --only functions:createPost
```

## 環境変数

以下の環境変数を設定する必要があります：

- `GACHA_PRICE`: ガチャの価格（円）- デフォルト: 200

環境変数の設定：

```bash
firebase functions:config:set app.gacha_price=200
```

## ディレクトリ構造

```
functions/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── types/                # 型定義
│   │   └── index.ts
│   ├── handlers/             # 関数ハンドラー
│   │   ├── createPost.ts
│   │   ├── getPosts.ts
│   │   ├── getStatistics.ts
│   │   ├── getDrinkMaster.ts
│   │   └── updateStatistics.ts
│   ├── utils/                # ユーティリティ関数
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── config/               # 設定
│       └── firebase.ts
├── package.json
├── tsconfig.json
└── README.md
```

## セキュリティ

- すべての書き込み操作はCloud Functions経由でのみ実行されます
- Firestore Security Rulesでクライアントからの直接書き込みを防止しています
- 入力値の検証を徹底しています

## トラブルシューティング

### デプロイエラー

デプロイ時にエラーが発生した場合：

1. Firebase CLIが最新版であることを確認
   ```bash
   npm install -g firebase-tools@latest
   ```

2. ログインし直す
   ```bash
   firebase login --reauth
   ```

3. プロジェクトが正しく設定されているか確認
   ```bash
   firebase use --add
   ```

### エミュレーターが起動しない

1. ポートが使用されていないか確認
2. Firebase設定ファイル（firebase.json）が正しいか確認

## 参考リンク

- [Firebase Cloud Functions ドキュメント](https://firebase.google.com/docs/functions)
- [TypeScript での Cloud Functions の記述](https://firebase.google.com/docs/functions/typescript)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
