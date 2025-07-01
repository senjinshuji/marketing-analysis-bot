#!/bin/bash

# Cloud Runのキャッシュを強制的にクリアする

PROJECT_ID="marketing-diagnosisbot"
SERVICE_NAME="diagnosi-bot"
REGION="asia-northeast1"

echo "🔧 キャッシュ問題を解決します..."

# 1. 環境変数を追加してリビジョンを強制更新
echo "📝 環境変数を追加してリビジョンを更新..."
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --update-env-vars="CACHE_BUST=$(date +%s)" \
  --no-traffic

# 2. 新しいリビジョンに100%トラフィックを向ける
echo "🔄 トラフィックを新しいリビジョンに切り替え..."
LATEST_REVISION=$(gcloud run revisions list \
  --service=$SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(REVISION)" \
  --limit=1)

gcloud run services update-traffic $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --to-revisions=$LATEST_REVISION=100

echo "✅ 完了！新しいリビジョン: $LATEST_REVISION"
echo "🌐 URL: https://diagnosi-bot-v4ppz3sz2q-an.a.run.app"