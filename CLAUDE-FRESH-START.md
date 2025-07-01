# Diagnosi-Bot Fresh Start Guide

## プロジェクト概要

Diagnosi-Botのクリーンインストール版。LP分析からカスタマージャーニー生成までの機能のみを含む、シンプルなバージョンです。

**重要**: 以下の機能は含みません
- ❌ 推奨広告戦略
- ❌ クリエイティブ提案
- ❌ 台本生成機能
- ❌ チャット機能

## 機能仕様

### 含まれる機能
1. **LP分析機能**
   - URLからの自動スクレイピング
   - 商品情報・価格・特徴の抽出
   - 画像内OCR（価格、キャンペーン情報）
   - 手動価格入力サポート

2. **市場分析**
   - 市場規模・カテゴリー分析
   - 市場タイプ分類（ニッチ/マス）
   - 行動理由分類

3. **ペルソナ分析**
   - N1ペルソナ自動生成
   - デモグラフィック分析
   - カスタマージャーニー作成

4. **LP品質評価**
   - LP構成要素分析
   - コンバージョン要因評価

## セットアップ手順

### 1. 新規フォルダでのセットアップ
```bash
# 新しいフォルダを作成
mkdir ~/Desktop/diagnosi-bot-fresh
cd ~/Desktop/diagnosi-bot-fresh

# Gitリポジトリを初期化
git init

# 必要なファイルのみをコピー
# (以下のファイル構成セクションを参照)
```

### 2. 必要なファイル構成
```
diagnosi-bot-fresh/
├── app/
│   ├── api/
│   │   ├── analyze-phase1/route.ts    # Phase1分析のみ
│   │   └── health/route.ts            # ヘルスチェック
│   ├── components/
│   │   ├── URLInput.tsx               # URL入力
│   │   ├── AnalysisResult.tsx         # 結果表示（カスタマージャーニーまで）
│   │   ├── LPScoreCard.tsx           # LP評価
│   │   └── AnalysisDebug.tsx         # デバッグ表示
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── gpt-analyzer-simple.ts        # GPT分析（Phase1のみ）
│   ├── image-analyzer.ts             # OCR機能
│   ├── market-analyzer.ts            # 市場分析
│   ├── scraper-enhanced-basic.ts     # スクレイピング
│   ├── lp-scorer.ts                  # LP評価
│   └── types.ts                      # 型定義
├── public/
├── .env.local
├── .env.production
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── Dockerfile
├── .dockerignore
├── cloudbuild.yaml
└── CLAUDE-FRESH-START.md
```

### 3. package.json
```json
{
  "name": "diagnosi-bot-simple",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.3",
    "react": "^18",
    "react-dom": "^18",
    "openai": "^4.20.1",
    "tailwindcss": "^3",
    "typescript": "^5"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "postcss": "^8",
    "eslint": "^8",
    "eslint-config-next": "14.0.3"
  }
}
```

### 4. 環境変数設定
```bash
# .env.local
OPENAI_API_KEY=sk-proj-your-api-key-here
NODE_ENV=development

# .env.production  
NODE_ENV=production
# OpenAI APIキーはSecret Managerで管理
```

### 5. 簡略化されたpage.tsx
```typescript
'use client'

import { useState } from 'react'
import URLInput from './components/URLInput'
import AnalysisResult from './components/AnalysisResult'

export default function Home() {
  const [analysisData, setAnalysisData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async (url: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analyze-phase1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      
      if (!response.ok) throw new Error('分析に失敗しました')
      
      const data = await response.json()
      setAnalysisData(data.phase1)
    } catch (error) {
      console.error('分析エラー:', error)
      alert('分析に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LP分析・ペルソナ生成Bot
          </h1>
          <p className="text-xl text-gray-600">
            商品URLを入力するだけで、市場分析とカスタマージャーニーを自動生成
          </p>
        </header>

        <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        
        {analysisData && (
          <AnalysisResult data={analysisData} />
        )}
      </div>
    </main>
  )
}
```

### 6. GPT分析プロンプト（Phase1のみ）
```typescript
// lib/gpt-analyzer-simple.ts
const prompt = `
以下の商品を分析してください。

## 分析対象
- URL: ${scrapedData.url}
- タイトル: ${scrapedData.title}
- 説明: ${scrapedData.description}
- 価格: ${scrapedData.price}

## 必須分析項目
1. 商品情報（名称、カテゴリー、特徴、効果、RTB、権威性）
2. 価格情報
3. デモグラフィック
4. 提供価値（機能的/情緒的）
5. 市場分析
6. N1ペルソナとカスタマージャーニー
7. 市場タイプ分類（ニッチ/マス）
8. 行動理由分類

JSON形式で出力してください。
`
```

### 7. デプロイ設定

#### Dockerfile（シンプル版）
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
ENV OPENAI_API_KEY=dummy_build_key
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 8080
ENV PORT 8080
CMD ["node", "server.js"]
```

#### cloudbuild.yaml
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/diagnosi-bot-simple:latest', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/diagnosi-bot-simple:latest']
  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: [
      'run', 'deploy', 'diagnosi-bot-simple',
      '--image', 'gcr.io/$PROJECT_ID/diagnosi-bot-simple:latest',
      '--region', 'asia-northeast1',
      '--platform', 'managed',
      '--allow-unauthenticated',
      '--memory', '2Gi',
      '--cpu', '2',
      '--timeout', '300',
      '--max-instances', '10',
      '--set-env-vars', 'NODE_ENV=production',
      '--set-secrets', 'OPENAI_API_KEY=openai-api-key:latest'
    ]

timeout: '1200s'
options:
  logging: CLOUD_LOGGING_ONLY
```

### 8. 初期セットアップコマンド
```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルドテスト
npm run build

# GCPデプロイ（新しいサービスとして）
gcloud builds submit --config=cloudbuild.yaml --project=marketing-diagnosisbot
```

## 重要な設計方針

1. **シンプルさ優先**
   - Phase1（LP分析〜カスタマージャーニー）のみ
   - 広告戦略・媒体選定は含まない
   - 台本生成機能は含まない

2. **価格帯別分類ルール**
   - 0円〜500円: 自動的に「マスマーケット狙い」「マス向け：オファーが魅力的」
   - 501円以上: 商品特性に基づいて判断

3. **キャッシュ対策**
   - 新しいサービス名（diagnosi-bot-simple）
   - 完全に新しいCloud Runサービスとしてデプロイ
   - Next.jsのキャッシュ設定を最小限に

## トラブルシューティング

### ビルドエラー
```bash
# TypeScriptエラーチェック
npx tsc --noEmit

# ESLintチェック
npm run lint
```

### デプロイエラー
```bash
# Docker認証
gcloud auth configure-docker

# API有効化
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## 移行時の注意点

1. **削除するファイル**
   - `app/api/analyze-phase2/`
   - `app/api/generate-script*/`
   - `app/components/ScriptChat.tsx`
   - `app/components/ChatInterface.tsx`
   - `app/components/CreativeReferences.tsx`
   - `lib/gpt-script-generator*.ts`
   - `lib/intent-analysis-data.ts`

2. **修正が必要なファイル**
   - `lib/gpt-analyzer.ts` → Phase1のみの`gpt-analyzer-simple.ts`に
   - `app/components/AnalysisResult.tsx` → カスタマージャーニーまでで終了

3. **環境変数**
   - 新しいSecret Manager設定が必要
   - プロジェクトIDは同じ（marketing-diagnosisbot）

## 最終チェックリスト

- [ ] 不要な機能のコードを完全に削除
- [ ] package.jsonの依存関係を最小限に
- [ ] GPTプロンプトからPhase2部分を削除
- [ ] UIからすべての広告関連表示を削除
- [ ] 新しいCloud Runサービス名を使用
- [ ] ビルドとデプロイのテスト完了

---

このガイドに従って、クリーンな状態から必要最小限の機能のみを含むDiagnosi-Botを構築できます。