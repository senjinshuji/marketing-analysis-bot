import Anthropic from '@anthropic-ai/sdk'

export class ClaudeAnalyzer {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey: apiKey,
    })
  }

  async analyzeProduct(scrapedData: any, marketingTemplate: any): Promise<any> {
    const prompt = this.createAnalysisPrompt(scrapedData, marketingTemplate)
    
    try {
      const message = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type === 'text') {
        return JSON.parse(content.text)
      }
      
      throw new Error('予期しないレスポンス形式')
    } catch (error) {
      console.error('Claude API エラー:', error)
      throw error
    }
  }

  private createAnalysisPrompt(scrapedData: any, marketingTemplate: any): string {
    return `あなたはマーケティング戦略の専門家です。以下の商品情報を分析し、指定されたフォーマットでJSON形式で出力してください。

## 商品情報
- タイトル: ${scrapedData.title}
- 説明: ${scrapedData.description}
- 価格: ${scrapedData.price}
- カテゴリー: ${scrapedData.category}
- 特徴: ${JSON.stringify(scrapedData.features)}

## 分析項目（CSVテンプレートに基づく）

### 1. 商品・製品情報
- 商品名
- カテゴリー
- サイズ・容量
- 機能（箇条書きで5つ以上）
- 効果（箇条書きで3つ以上）
- RTB（Reason to Believe）
- 権威性

### 2. 価格・販売情報
- 通常価格
- 特別オファー価格
- キャンペーン情報
- 発売日（推定）
- 販売チャネル

### 3. デモグラフィック分析
- 年齢層
- 性別比率
- その他特性（世帯構成、職業等）

### 4. 提供価値分析
- 機能価値（3つ以上）
- 情緒価値（誰が/どんな状況で/どう感じる）

### 5. 市場分析
- 市場定義
- 市場カテゴリー
- 市場規模（推定）
- 戦略ターゲット
- コアターゲット

### 6. N1ペルソナ分析
- 年齢、性別、居住地、職業、役職、業種、年収、学歴
- 家族構成、生活リズム、趣味・興味関心、利用メディア
- カスタマージャーニー（状況、体感、本能、知覚、感情、欲求、需要）

### 7. 市場タイプ分類
- ニッチマーケット狙い or マスマーケット狙い
- 理由と根拠

### 8. 行動理由分類
以下から最も適切なものを選択：
- ニッチ：自分ごと化させて行動してもらう
- ニッチ：to B向けに適した配信
- マス向け：オファーが魅力的、とにかく安い
- マス向け：訴求が強い、権威性がある、悩みが解決できる
- マス向け：新事実系、テクスチャーが特徴的

### 9. 推奨広告媒体（上記分類に基づいて3つ選択）
${JSON.stringify(marketingTemplate.mediaDatabase)}から適切なIDを選択

### 10. クリエイティブ提案
選択した媒体それぞれに対して：
- 具体的なクリエイティブアイデア
- キーメッセージ
- ビジュアルスタイル

## 出力形式
以下のJSON形式で出力してください：

{
  "productInfo": {
    "productName": "",
    "category": "",
    "sizeCapacity": "",
    "features": [],
    "effects": [],
    "rtb": "",
    "authority": ""
  },
  "pricing": {
    "regularPrice": "",
    "specialPrice": "",
    "campaign": "",
    "releaseDate": "",
    "salesChannel": ""
  },
  "demographics": {
    "ageRange": "",
    "gender": "",
    "otherCharacteristics": ""
  },
  "valueProposition": {
    "functionalValue": [],
    "emotionalValue": ""
  },
  "marketAnalysis": {
    "marketDefinition": "",
    "marketCategory": "",
    "marketSize": "",
    "strategyTarget": "",
    "coreTarget": ""
  },
  "persona": {
    "profile": {
      "age": "",
      "gender": "",
      "location": "",
      "occupation": "",
      "position": "",
      "industry": "",
      "income": "",
      "education": "",
      "familyStructure": "",
      "lifestyle": "",
      "interests": "",
      "mediaUsage": ""
    },
    "journey": {
      "situation": "",
      "sensory": "",
      "instinct": "",
      "perception": "",
      "emotion": "",
      "desire": "",
      "demand": ""
    }
  },
  "classification": {
    "marketType": "",
    "actionReason": "",
    "reasoning": ""
  },
  "recommendations": {
    "media": [
      {
        "mediaId": "",
        "mediaName": "",
        "target": "",
        "method": "",
        "reason": ""
      }
    ],
    "creative": [
      {
        "mediaName": "",
        "idea": "",
        "keyMessage": "",
        "visualStyle": ""
      }
    ]
  }
}`
  }
}