#!/bin/bash

echo "🚀 強制的にビルドキャッシュをクリアしてデプロイします..."

# 1. ビルドキャッシュを完全にクリア
echo "🧹 ビルドキャッシュを完全にクリア中..."
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

# 2. 依存関係を再インストール
echo "📦 依存関係を再インストール中..."
npm install

# 3. ビルドIDを強制的に変更
echo "🔑 ビルドIDを変更中..."
echo "BUILD_ID=$(date +%s)" > .env.production

# 4. 本番ビルド
echo "🔨 本番用ビルドを作成中..."
export OPENAI_API_KEY=dummy_for_build
npm run build

# 5. デプロイ
echo "☁️ Cloud Runに直接デプロイ中..."
gcloud run deploy diagnosi-bot \
  --source . \
  --region asia-northeast1 \
  --project marketing-diagnosisbot \
  --allow-unauthenticated \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest" \
  --timeout=300 \
  --memory=2Gi \
  --max-instances=10 \
  --update-env-vars="CACHE_BUST=$(date +%s)" \
  --quiet

echo "✅ デプロイ完了！"
echo "🌐 本番環境URL: https://diagnosi-bot-v4ppz3sz2q-an.a.run.app"
echo ""
echo "⏳ 完全に反映されるまで1-2分お待ちください..."