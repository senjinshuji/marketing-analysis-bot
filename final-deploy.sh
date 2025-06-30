#!/bin/bash

# 最終デプロイスクリプト
# 動画台本生成機能を完全に削除した状態で本番環境にデプロイ

echo "🚀 最終デプロイを開始します..."

# 1. ビルドキャッシュをクリア
echo "📦 ビルドキャッシュをクリアしています..."
rm -rf .next
rm -rf node_modules/.cache

# 2. 依存関係を再インストール
echo "📥 依存関係を再インストールしています..."
npm ci

# 3. ビルドを実行
echo "🔨 本番用ビルドを作成しています..."
export OPENAI_API_KEY=dummy_for_build
npm run build

# 4. コミットしてプッシュ（GitHub Actions自動デプロイをトリガー）
echo "📤 変更をプッシュして自動デプロイをトリガーします..."
git add .
git commit -m "force: 動画台本生成機能を完全削除した最終デプロイ

- 本番環境から動画台本生成機能を完全削除
- ビルドキャッシュをクリアして再ビルド
- GitHub Actions経由で自動デプロイ

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main

echo "✅ デプロイトリガー完了！"
echo "📊 GitHub Actionsの進捗は以下で確認できます："
echo "https://github.com/senjinshuji/marketing-analysis-bot/actions"
echo ""
echo "🌐 本番環境URL："
echo "https://diagnosi-bot-v4ppz3sz2q-an.a.run.app"