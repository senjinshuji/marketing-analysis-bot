#!/bin/bash

# 完全にクリーンな状態からデプロイ

echo "🧹 キャッシュを完全にクリアして再デプロイします..."

# 1. ローカルのビルドキャッシュをクリア
echo "📦 ローカルビルドキャッシュをクリア..."
rm -rf .next
rm -rf node_modules/.cache

# 2. package.jsonのバージョンを更新（キャッシュバスト）
echo "📝 バージョンを更新..."
npm version patch --no-git-tag-version

# 3. コミットしてプッシュ
echo "🚀 変更をコミット..."
git add .
git commit -m "fix: キャッシュ問題解決のための強制再デプロイ $(date +%s)"
git push origin main

echo "✅ デプロイを開始しました！"
echo "⏰ 3-5分後に確認してください"
echo "🌐 https://diagnosi-bot-v4ppz3sz2q-an.a.run.app"