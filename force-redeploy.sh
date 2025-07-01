#!/bin/bash

# Force redeploy to Cloud Run with cache busting

PROJECT_ID="marketing-diagnosisbot"
SERVICE_NAME="diagnosi-bot"
REGION="asia-northeast1"
TIMESTAMP=$(date +%s)

echo "🚀 Starting force redeploy with timestamp: $TIMESTAMP"

# Add timestamp to Dockerfile to force rebuild
echo "# Force rebuild at $TIMESTAMP" >> Dockerfile

# Commit and push
git add Dockerfile
git commit -m "force: redeploy with cache bust at $TIMESTAMP"
git push origin main

echo "✅ Pushed to GitHub. GitHub Actions will handle the deployment."
echo "🕐 Check deployment status at: https://github.com/senjinshuji/marketing-analysis-bot/actions"

# Revert the timestamp change locally
git reset --hard HEAD~1

echo "📋 Deployment initiated. Wait 3-5 minutes for completion."