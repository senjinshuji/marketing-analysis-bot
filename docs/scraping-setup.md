# スクレイピング機能セットアップガイド

## 概要

現在、3つのスクレイピング方法を実装しています：

1. **基本スクレイピング** (scraper-simple.ts) - デフォルト
2. **Edge Function スクレイピング** (/api/edge-scrape) - 無料、中精度
3. **API スクレイピング** (scraper-api.ts) - 有料、高精度

## 1. 基本セットアップ（無料）

現在の実装で動作します。追加設定は不要です。

### 制限事項：
- 実際のHTMLを取得しない
- 価格情報の精度が低い
- JavaScriptレンダリングなし

## 2. Edge Function スクレイピング（無料）

Vercel Edge Functionsを使用したスクレイピング。

### 特徴：
- 実際のHTMLを取得
- 正規表現でデータ抽出
- タイムアウトなし
- JavaScriptレンダリングなし

### 使用方法：
自動的にフォールバックとして使用されます。

## 3. ScrapingBee API（推奨）

高精度なスクレイピングが可能。

### セットアップ手順：

1. [ScrapingBee](https://www.scrapingbee.com/)でアカウント作成
2. APIキーを取得（1000リクエスト/月まで無料）
3. Vercelに環境変数を追加：

```bash
# ローカル開発用
echo "SCRAPINGBEE_API_KEY=your_api_key_here" >> .env.local

# Vercelデプロイ用
vercel env add SCRAPINGBEE_API_KEY
```

### 料金プラン：
- Free: 1,000 クレジット/月
- Freelance: $49/月 (150,000 クレジット)
- Business: $99/月 (500,000 クレジット)

### 特徴：
- JavaScriptレンダリング対応
- 日本のプロキシ使用可能
- 高い成功率
- 構造化データ抽出

## 4. その他の選択肢

### Browserless
```bash
BROWSERLESS_TOKEN=your_token_here
```

### Scrapfly
```bash
SCRAPFLY_API_KEY=your_key_here
```

## 実装の優先順位

1. **まずはEdge Functionを試す**
   - 無料で即座に使用可能
   - 基本的な価格情報は取得可能

2. **精度が必要な場合はScrapingBee**
   - 初回・キャンペーン価格を確実に取得
   - JavaScript動的コンテンツも取得

3. **大量処理が必要な場合**
   - 独自スクレイピングサーバーを構築
   - RailwayやRenderにデプロイ

## トラブルシューティング

### 価格が取得できない場合
1. URLが正しいか確認
2. Edge Function APIをテスト: `/api/edge-scrape`
3. ScrapingBee APIキーを設定

### タイムアウトする場合
1. Edge Functionを使用
2. より軽量なスクレイピング方法に切り替え

### CORSエラーが出る場合
1. サーバーサイドでスクレイピング実行
2. プロキシAPIを使用