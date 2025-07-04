# 価格検出精度の改善

## 実施した改善内容

### 1. GPTプロンプトの強化 (`lib/gpt-analyzer.ts`)

#### Phase 1プロンプトの改善
- 価格検出を「最重要指示」として明確化
- 日本のLPで一般的な価格パターンを具体例として提示
  - 初回限定価格（980円、1,980円、2,980円）
  - お試し/トライアル価格
  - 定期購入初回価格
  - キャンペーン価格
- カテゴリー別の価格帯目安を追加
  - 健康食品→980円
  - 化粧品→1,980円
  - 高級美容機器→2,980円

#### Phase 2プロンプトの改善
- Phase 1で取得した初回価格を必ず使用するよう明記
- specialPriceフィールドを優先、なければregularPriceを使用

### 2. 価格パターンライブラリの追加 (`lib/price-patterns.ts`)

新規作成したファイルで、以下の機能を実装：
- 一般的な価格パターンの定義
- ドメインベースの価格推測ヒント生成
- LP構成に関する一般的なパターン説明

### 3. スクレイパーの改善 (`lib/scraper-simple.ts`)

- 価格検出に関するヒントをfeaturesに追加
- GPTがLPに価格情報があることを認識しやすくする説明を追加

## テスト方法

1. 通常の分析を実行
```
URL入力例: https://example-supplement.jp/lp
```

2. 価格情報が正しく検出されているか確認
- Phase 1の結果で`pricing.specialPrice`に初回価格が入っているか
- 市場タイプ分類が初回価格を基準に判定されているか

## 期待される効果

1. **初回価格の検出率向上**
   - 980円などのキャンペーン価格を見逃さない
   - 定期購入の初回特別価格も正しく認識

2. **市場タイプ分類の精度向上**
   - 初回価格3,000円以下＋市場規模100億円以上→マスマーケット
   - 正しい価格に基づいた分類が可能に

3. **広告戦略の最適化**
   - 価格帯に応じた適切な媒体選定
   - オファー訴求型の戦略を正しく提案

## 今後の改善案

1. **実際のスクレイピング機能の強化**
   - Puppeteer等を使用した実際のDOM解析
   - 価格要素の自動検出アルゴリズム

2. **価格パターンの学習**
   - 成功事例の蓄積
   - カテゴリー別の価格帯データベース構築

3. **ユーザーフィードバック機能**
   - 価格検出が正しくない場合の修正機能
   - 修正データを使った改善