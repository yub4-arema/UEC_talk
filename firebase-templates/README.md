# Firebase 設定テンプレート

このディレクトリには、Firebase設定ファイルのテンプレートが含まれています。

## 使用方法

`firebase init`コマンドを実行した後、生成されたファイルをこれらのテンプレートの内容で上書きしてください。

### ファイル一覧

- `firebase.json.template` - Firebase プロジェクト設定
- `firestore.rules.template` - Firestore セキュリティルール
- `firestore.indexes.json.template` - Firestore インデックス設定
- `storage.rules.template` - Storage セキュリティルール

### セットアップ手順

1. プロジェクトルートで`firebase init`を実行
2. 生成されたファイルをテンプレートの内容で上書き：

```bash
# 例：Firestoreルールをコピー
cp firebase-templates/firestore.rules.template firestore.rules
cp firebase-templates/firestore.indexes.json.template firestore.indexes.json
cp firebase-templates/storage.rules.template storage.rules
cp firebase-templates/firebase.json.template firebase.json
```

3. 必要に応じてプロジェクト固有の設定を追加

## 注意事項

- これらの設定ファイルは`.gitignore`に含まれており、リポジトリにコミットされません
- 各開発者が個別に`firebase init`を実行して設定する必要があります
- テンプレートファイルのみがバージョン管理されます
