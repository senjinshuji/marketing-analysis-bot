import OpenAI from 'openai'
import { generatePriceDetectionHints } from './price-patterns'
import { MarketAnalyzer } from './market-analyzer'

export class GPTAnalyzer {
  private client: OpenAI
  private marketAnalyzer: MarketAnalyzer
  private lastPhase1Prompt: string = ''
  private lastPhase2Prompt: string = ''

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
    })
    this.marketAnalyzer = new MarketAnalyzer()
  }

  async analyzeProduct(scrapedData: any, marketingTemplate: any): Promise<any> {
    try {
      console.log('GPTAnalyzer: 分析開始', { url: scrapedData.url, title: scrapedData.title })
      
      // 単一の統合プロンプトで高速化
      const result = await this.executeCombinedAnalysis(scrapedData, marketingTemplate)
      
      // 市場分析の精度向上
      if (result.marketAnalysis) {
        const marketData = this.marketAnalyzer.analyzeMarket(result)
        result.marketAnalysis = {
          ...result.marketAnalysis,
          marketSize: marketData.marketSize,
          marketCategory: marketData.marketCategory,
          marketDefinition: marketData.marketDefinition || result.marketAnalysis.marketDefinition
        }
        
        // 市場タイプの再判定
        if (result.classification) {
          result.classification.marketType = marketData.marketType + 'マーケット狙い'
          result.classification.reasoning = marketData.reasoning.join('、')
        }
      }
      
      console.log('分析完了')
      return result
    } catch (error) {
      console.error('GPTAnalyzer分析エラー:', error)
      throw error
    }
  }

  private async executeCombinedAnalysis(scrapedData: any, marketingTemplate: any): Promise<any> {
    const prompt = this.createCombinedPrompt(scrapedData, marketingTemplate)
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',  // より高速なモデル
        messages: [
          {
            role: 'system',
            content: `あなたは日本のデジタルマーケティング戦略の専門家です。商品分析と媒体戦略を一度に行います。`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const content = completion.choices[0].message.content
      if (content) {
        return JSON.parse(content)
      }
      
      throw new Error('予期しないレスポンス形式')
    } catch (error) {
      console.error('統合分析エラー:', error)
      throw error
    }
  }

  async executePhase1Analysis(scrapedData: any): Promise<any> {
    const prompt = this.createPhase1Prompt(scrapedData)
    this.lastPhase1Prompt = prompt
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `あなたは日本のデジタルマーケティング戦略の専門家です。日本の市場データに精通しています。

【フェーズ1: マーケティングリサーチ分析】
目的: 商品の詳細分析と市場理解

Step1: マスターデータ化
- A列＝セクション見出し（商品、N1、提供価値など）として抽出
- B列＝分類観点（プロフィール、機能価値など）を紐づける
- 全体構造を「商品情報」「ペルソナ」「市場」「提供価値」にマッピング

Step2: 詳細要素抽出
- 各セクションの詳細項目（年齢、職業、趣味、RTBなど）を構造的にまとめる
- 提供価値は機能・情緒に分けて整理
- N1は年齢・生活リズム・メディア接触などに分解
- 市場情報はカテゴリー・規模・コアターゲットなどに整理

分析ルール:
1. 日本市場の実態に基づいた現実的な推定値を使用
2. ペルソナは実在する人物のように具体的に描写
3. 必ずJSON形式で出力`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const content = completion.choices[0].message.content
      if (content) {
        return JSON.parse(content)
      }
      
      throw new Error('フェーズ1: 予期しないレスポンス形式')
    } catch (error) {
      console.error('フェーズ1分析エラー:', error)
      throw error
    }
  }

  async executePhase2Analysis(scrapedData: any, phase1Result: any, marketingTemplate: any): Promise<any> {
    // 市場分析を先に実施
    const marketData = this.marketAnalyzer.analyzeMarket(phase1Result)
    
    // 市場データをphase1Resultに追加
    phase1Result.marketAnalysis = {
      ...phase1Result.marketAnalysis,
      ...marketData
    }
    
    const prompt = this.createPhase2Prompt(scrapedData, phase1Result, marketingTemplate)
    this.lastPhase2Prompt = prompt
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `あなたは日本のデジタルマーケティング戦略の専門家です。

【フェーズ2: 媒体分類・獲得戦略】
目的: 広告配信設計と媒体選定

Step1: ジャンル分類
- 商品の性質やターゲットの絞り込み度から、ニッチ市場かマスマーケットかを分類
- 指名検索や専門課題訴求はニッチ、広範な属性への単純ベネフィット訴求はマスと判断

Step2: 行動動機の分類
- ユーザーが行動を起こす理由（悩み解決、自分ごと化、価格訴求、情緒的価値など）を抽出
- 商品特性ごとに分類し、広告訴求文・クリエイティブ設計の根幹となる心理要因を明確化

Step3: 獲得媒体の選定
- 行動動機に対応した最適な媒体（リスティング、GDN、TikTok、LINEなど）を選定
- 動機ベースの最適媒体設計により、媒体別パフォーマンスを最大化

Step4: 参考クリエイティブIDの参照
- 各動機×媒体における制作アイディアを提供
- 演出や構成の具体的なイメージを提示

分析ルール:
1. 媒体選定は必ず論理的な根拠と共に提示
2. 必ずJSON形式で出力`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })

      const content = completion.choices[0].message.content
      if (content) {
        return JSON.parse(content)
      }
      
      throw new Error('フェーズ2: 予期しないレスポンス形式')
    } catch (error) {
      console.error('フェーズ2分析エラー:', error)
      throw error
    }
  }

  private createPhase1Prompt(scrapedData: any): string {
    const priceHints = scrapedData.url ? generatePriceDetectionHints(scrapedData.url) : ''
    
    return `【フェーズ1: マーケティングリサーチ分析】

## 分析対象商品情報
- URL: ${scrapedData.url || 'N/A'}
- タイトル: ${scrapedData.title}
- 説明: ${scrapedData.description}
- 価格: ${scrapedData.price}
- カテゴリー: ${scrapedData.category}
- 特徴: ${JSON.stringify(scrapedData.features)}

${priceHints}

## 最重要指示：スクレイピングデータの正確な使用

**注意：以下のスクレイピングデータが提供されています。これらは実際のLPから取得したデータです。**

### スクレイピングされた価格情報：
${JSON.stringify(scrapedData.prices || {}, null, 2)}

### 画像内の価格情報の可能性：
${scrapedData.additionalData?.hasPriceInImage ? '**重要: 価格が画像内に表示されている可能性があります。特にcv01.jpg, cv02.jpgなどの画像に初回価格（980円など）が含まれている可能性が高いです。**' : '画像内価格は検出されませんでした。'}

### スクレイピングされたその他の情報：
- 商品名: ${scrapedData.productName || scrapedData.title}
- カテゴリー: ${scrapedData.category}
- 会社: ${scrapedData.company || ''}
- キャンペーン: ${scrapedData.campaign || ''}
- 保証: ${scrapedData.guarantee || ''}
- 権威性: ${JSON.stringify(scrapedData.authority || [])}

**重要：上記のスクレイピングデータを必ず使用してください。価格情報は絶対に推測せず、スクレイピングデータのみを使用してください。**
**データが不足している場合は「データなし」または「取得できず」と記載し、決して一般的な例や推測値を使用しないでください。**

## 分析指示
以下の構造に従って、スクレイピングデータを基に分析を行ってください。

### セクション1: 商品情報（スクレイピングデータを使用）
- 商品名: ${scrapedData.productName || scrapedData.title || 'スクレイピングデータを参照'}
- カテゴリー: ${scrapedData.category || 'スクレイピングデータを参照'}
- サイズ・容量: スクレイピングデータまたは構造化データから抜粋
- 機能: ${scrapedData.features?.length > 0 ? 'スクレイピングされた特徴を使用' : 'データから分析'}
- 効果: ${scrapedData.effects?.length > 0 ? 'スクレイピングされた効果を使用' : 'データから分析'}
- RTB (Reason to Believe): スクレイピングデータの権威性情報から抜粋
- 権威性: ${scrapedData.authority?.length > 0 ? JSON.stringify(scrapedData.authority) : 'データから分析'}

### セクション2: 価格・販売情報（スクレイピングデータを使用）
- 通常価格: ${scrapedData.prices?.regular ? scrapedData.prices.regular.text : 'スクレイピングデータになし'}
- 特別オファー: ${scrapedData.prices?.campaign ? scrapedData.prices.campaign.text : 'スクレイピングデータになし'}
- キャンペーン情報: ${scrapedData.campaign || 'スクレイピングデータになし'}
- 発売日: スクレイピングデータから推定
- 販売チャネル: オンライン（${scrapedData.url}）

### セクション3: 市場分析（重要：日本の実際の市場データに基づいて分析）
- 市場定義: 商品が属する市場の明確な定義
- 市場カテゴリー: 大分類/中分類/小分類
- 市場規模: 日本市場での実際の規模（億円単位）
  注：以下は参考データですが、実際の商品カテゴリーに基づいて適切な市場規模を判断してください
  - 健康食品市場 約9,000億円、サプリメント市場 約1,500億円
  - 化粧品市場 約2兆8,000億円、スキンケア市場 約1兆2,000億円
  - 宅配食市場 約1,500億円、ダイエット食品市場 約2,500億円
- 戦略ターゲット: マーケティング戦略上の広いターゲット層
- コアターゲット: 最も重要な購買層（全体の30-40%）

### セクション4: 提供価値（スクレイピングデータから分析）
- 機能価値: ${scrapedData.effects?.length > 0 ? 'スクレイピングされた効果から分析' : '特徴から推測'}
  - スクレイピングされた効果: ${JSON.stringify(scrapedData.effects || [])}
- 情緒価値: ターゲットと商品特性から分析

### セクション5: N1ペルソナ
具体的な一人の人物として以下を設定：
- プロフィール: 年齢、性別、居住地、職業、役職、年収、最終学歴
- ライフスタイル: 家族構成、平日/休日の過ごし方、趣味
- メディア接触: よく利用するメディア・SNS
- カスタマージャーニー:
  - 状況: 購買検討のきっかけ
  - 体感: その時の身体的な感覚
  - 本能: 根源的な欲求
  - 知覚: 何に気づいたか
  - 感情: どんな感情を抱いたか
  - 欲求: 具体的に何を求めたか
  - 需要: 最終的にどんな商品を必要としたか

## 出力形式
{
  "productInfo": {
    "productName": "string",
    "category": "string",
    "sizeCapacity": "string",
    "features": ["string"],
    "effects": ["string"],
    "rtb": "string",
    "authority": "string"
  },
  "pricing": {
    "regularPrice": "string",
    "specialPrice": "string",
    "campaign": "string",
    "releaseDate": "string",
    "salesChannel": "string"
  },
  "marketAnalysis": {
    "marketDefinition": "string",
    "marketCategory": "string",
    "marketSize": "string",
    "strategyTarget": "string",
    "coreTarget": "string"
  },
  "valueProposition": {
    "functionalValue": ["string"],
    "emotionalValue": "string"
  },
  "persona": {
    "profile": {
      "age": "string",
      "gender": "string",
      "location": "string",
      "occupation": "string",
      "position": "string",
      "industry": "string",
      "income": "string",
      "education": "string",
      "familyStructure": "string",
      "lifestyle": "string",
      "interests": "string",
      "mediaUsage": "string"
    },
    "journey": {
      "situation": "string",
      "sensory": "string",
      "instinct": "string",
      "perception": "string",
      "emotion": "string",
      "desire": "string",
      "demand": "string"
    }
  }
}`
  }

  private createPhase2Prompt(scrapedData: any, phase1Result: any, marketingTemplate: any): string {
    return `【フェーズ2: 媒体分類・獲得戦略】

## フェーズ1分析結果
${JSON.stringify(phase1Result, null, 2)}

## 分析指示

### Step1: ジャンル分類
以下の基準で判定してください：

**重要：フェーズ1で取得した価格情報と市場データを使用して判定**

※実際の価格：${phase1Result.pricing?.specialPrice || phase1Result.pricing?.regularPrice || 'データなし'}
※市場規模：${phase1Result.marketAnalysis?.marketSize || '不明'}
※市場カテゴリー：${phase1Result.marketAnalysis?.marketCategory || '不明'}

**マスマーケット判定基準**（以下のいずれかに該当）:
1. スクレイピングで取得した初回価格が3,000円以下（送料込み）で、かつ市場規模が100億円以上
2. 市場規模が500億円以上
3. ターゲット層が全人口の20%以上を占める一般的な悩み・ニーズ
4. 日用品・消耗品カテゴリー

**ニッチマーケット判定基準**（以下のいずれかに該当）:
1. 初回価格が5,000円以上、または市場規模が100億円未満
2. 専門的な知識・技術が必要な商品
3. ターゲット層が限定的（全人口の5%未満）
4. B2B向け商品・サービス
5. 高級品・嗜好品カテゴリー

※価格は「specialPrice」フィールドを優先し、なければ「regularPrice」を使用

### Step2: 行動動機の分類
以下から最適なものを1つ選択：
- ニッチ：自分ごと化させて行動してもらう（共感型）
- ニッチ：to B向けに適した配信（ビジネス利用）
- マス向け：オファーが魅力的、とにかく安い（価格訴求型）
- マス向け：訴求が強い、権威性がある、悩みが解決できる（課題解決型）
- マス向け：新事実系、テクスチャーが特徴的（新規性・差別化型）

### Step3: 獲得媒体の選定
分類に基づいて、以下の対応表から最適な媒体を3つ選択：

【分類別推奨媒体ID】
- ニッチ×自分ごと化: 1,2,7,19,22,23,24,25,28,29,30,31,33
- ニッチ×toB向け: 1,2,3,4,5,6,7,25,28,29,30,31
- マス×オファー魅力: 7,10,11,13,16,17,19,21,22,24,25,27,28,30,31
- マス×権威性: 7,8,11,12,13,14,17,18,19,22,23,24,25,28,29,31
- マス×新事実: 7,25,32,33

【利用可能な媒体データベース】
${JSON.stringify(marketingTemplate.fullMediaDatabase, null, 2)}

### Step4: クリエイティブ提案
選択した3つの媒体それぞれに対して：
- 具体的なクリエイティブアイデア
- キーメッセージ（15文字以内）
- ビジュアルスタイル

## 出力形式
{
  "classification": {
    "marketType": "ニッチマーケット狙い または マスマーケット狙い",
    "actionReason": "選択した行動理由分類",
    "reasoning": "この分類を選んだ3つ以上の具体的根拠"
  },
  "recommendations": {
    "media": [
      {
        "mediaId": "1",
        "mediaName": "媒体名",
        "target": "ターゲット",
        "method": "手法",
        "reason": "選定理由（100文字以上）"
      }
    ],
    "creative": [
      {
        "mediaName": "媒体名",
        "idea": "クリエイティブアイデア",
        "keyMessage": "キーメッセージ（15文字以内）",
        "visualStyle": "ビジュアルスタイル"
      }
    ]
  }
}`
  }

  private mergeAnalysisResults(phase1Result: any, phase2Result: any): any {
    return {
      ...phase1Result,
      ...phase2Result,
      demographics: phase1Result.demographics || {
        ageRange: `${phase1Result.persona.profile.age}を中心とした年齢層`,
        gender: phase1Result.persona.profile.gender,
        otherCharacteristics: phase1Result.persona.profile.familyStructure
      }
    }
  }

  private createCombinedPrompt(scrapedData: any, marketingTemplate: any): string {
    return `以下の商品を分析し、マーケティング戦略と広告媒体を提案してください。

## 分析対象
- URL: ${scrapedData.url || 'N/A'}
- タイトル: ${scrapedData.title}
- 説明: ${scrapedData.description}
- 価格: ${scrapedData.price}
- 特徴: ${JSON.stringify(scrapedData.features)}

## スクレイピングデータから取得した情報：
${JSON.stringify(scrapedData, null, 2)}

**重要：上記のスクレイピングデータは実際のLPから取得したものです。このデータのみを使用し、価格の推測や一般的な例は絶対に使用しないでください。**
**価格情報が取得できていない場合は「価格データ取得できず」と明記し、カテゴリーから価格を推測することは避けてください。**

## 必須分析項目
1. 商品情報（名称、カテゴリー、特徴、効果、RTB、権威性）
2. 価格情報
3. デモグラフィック
4. 提供価値（機能的/情緒的）
5. 市場分析
6. N1ペルソナ
7. 市場タイプ分類（ニッチ/マス）
8. 行動理由分類
9. 推奨広告媒体（3つ選択）

## 媒体選択ルール
- ニッチ×自分ごと化: 1,2,7,19,22,23,24,25,28,29,30,31,33
- ニッチ×toB: 1,2,3,4,5,6,7,25,28,29,30,31
- マス×オファー: 7,10,11,13,16,17,19,21,22,24,25,27,28,30,31
- マス×権威性: 7,8,11,12,13,14,17,18,19,22,23,24,25,28,29,31
- マス×新事実: 7,25,32,33

## 媒体データベース
${JSON.stringify(marketingTemplate.fullMediaDatabase, null, 2)}

## 出力形式
JSON形式で、全ての項目を漏れなく出力してください。`
  }

  getLastPhase1Prompt(): string {
    return this.lastPhase1Prompt
  }

  getLastPhase2Prompt(): string {
    return this.lastPhase2Prompt
  }

  private createAnalysisPrompt(scrapedData: any, marketingTemplate: any): string {
    return `日本のEC市場における商品分析を実施します。以下の商品情報を基に、CSVテンプレートの全項目を漏れなく分析し、JSON形式で出力してください。

## 分析対象商品情報
- URL: ${scrapedData.url || 'N/A'}
- タイトル: ${scrapedData.title}
- 説明: ${scrapedData.description}
- 価格: ${scrapedData.price}
- カテゴリー: ${scrapedData.category}
- 特徴: ${JSON.stringify(scrapedData.features)}

## スクレイピングデータの活用
以下のスクレイピングデータを必ず使用して分析してください：
- 価格情報: ${JSON.stringify(scrapedData.prices || {})}
- 特徴: ${JSON.stringify(scrapedData.features || [])}
- 効果: ${JSON.stringify(scrapedData.effects || [])}
- 成分: ${JSON.stringify(scrapedData.ingredients || [])}
- 権威性: ${JSON.stringify(scrapedData.authority || [])}
- 保証: ${scrapedData.guarantee || ''}

## 必須分析項目と具体的な指示

### 1. 商品・製品情報
- 商品名: 正式な商品名を記載
- カテゴリー: 業界標準のカテゴリー分類を使用
- サイズ・容量: 具体的な数値と単位を含める（推定の場合は業界平均を参考に）
- 機能: 最低5つ以上、具体的な機能を箇条書き（技術的特徴も含む）
- 効果: 最低3つ以上、ユーザーが得られる具体的な効果・ベネフィット
- RTB: 効果を裏付ける科学的根拠、実績、エビデンス等
- 権威性: 認証、受賞歴、専門家の推薦等

### 2. 価格・販売情報
- 通常価格: 税込価格を明記
- 特別オファー価格: キャンペーン価格があれば記載（割引率も併記）
- キャンペーン情報: 期間限定、数量限定等の詳細
- 発売日: 推定の場合は「20XX年X月頃（推定）」の形式で
- 販売チャネル: オンライン/オフライン、具体的な販売場所

### 3. デモグラフィック分析（日本市場データに基づく）
- 年齢層: 「XX歳〜XX歳（中心：XX歳）」の形式
- 性別比率: 「男性XX%：女性XX%」の形式
- その他特性: 世帯年収、家族構成、居住地域の傾向等

### 4. 提供価値分析
- 機能価値: 最低3つ、商品が解決する具体的な問題や提供する利便性
- 情緒価値: 「誰が（具体的なシーン）/どんな状況で/どう感じる」を明確に記述

### 5. 市場分析（日本市場の実データを参考に）
- 市場定義: 商品が属する市場を明確に定義
- 市場カテゴリー: 大分類・中分類・小分類で整理
- 市場規模: 「約XX億円（20XX年、日本市場）」の形式で現実的な推定値
- 戦略ターゲット: マーケティング戦略上の広いターゲット層
- コアターゲット: 最も重要な購買層（全体の30-40%を占める層）

### 6. N1ペルソナ分析（日本の典型的な購買者像）
具体的な一人の人物として以下を設定：
- 基本属性: 年齢（XX歳）、性別、居住地（都道府県レベル）、職業（具体的な業種・職種）、役職、年収（XXX万円）、最終学歴
- ライフスタイル: 家族構成（配偶者の有無、子供の年齢等）、平日/休日の過ごし方、趣味（具体的な活動）、よく利用するメディア・SNS
- カスタマージャーニー:
  - 状況: 購買検討のきっかけとなった具体的な状況
  - 体感: その時の身体的な感覚
  - 本能: 根源的な欲求（安全、承認、自己実現等）
  - 知覚: 何に気づいたか
  - 感情: どんな感情を抱いたか
  - 欲求: 具体的に何を求めたか
  - 需要: 最終的にどんな商品/サービスを必要としたか

### 7. 市場タイプ分類と根拠
以下のいずれかを選択し、3つ以上の具体的根拠を提示：
- ニッチマーケット狙い: 特定層への深い訴求が必要な理由
- マスマーケット狙い: 幅広い層への訴求が可能な理由

### 8. 行動理由分類（購買行動の主要トリガー）
以下から最適なものを1つ選択し、なぜその分類になるか説明：
- ニッチ：自分ごと化させて行動してもらう（共感型）
- ニッチ：to B向けに適した配信（ビジネス利用）
- マス向け：オファーが魅力的、とにかく安い（価格訴求型）
- マス向け：訴求が強い、権威性がある、悩みが解決できる（課題解決型）
- マス向け：新事実系、テクスチャーが特徴的（新規性・差別化型）

### 9. 推奨広告媒体（必ず3つ選択）
市場タイプと行動理由の分類に基づき、以下の対応表を参考に最適な媒体を選択してください：

【分類別推奨媒体ID】
- ニッチ×自分ごと化: 1,2,7,19,22,23,24,25,28,29,30,31,33
- ニッチ×toB向け: 1,2,3,4,5,6,7,25,28,29,30,31
- マス×オファー魅力: 7,10,11,13,16,17,19,21,22,24,25,27,28,30,31
- マス×権威性: 7,8,11,12,13,14,17,18,19,22,23,24,25,28,29,31
- マス×新事実: 7,25,32,33

【利用可能な媒体データベース】
${JSON.stringify(marketingTemplate.fullMediaDatabase, null, 2)}

【追加の全媒体情報】
1: リスティング・指名検索
2: リスティング・一般検索
3: GDN静止画・ブロード
4: GDN静止画・リターゲティング
5: デマンド静止画・discover/Youtube
6: デマンド静止画・gmail
7: デマンドロング・YT面・語り
8: デマンドロング・YT面・文字
9: デマンドロング・YT面・漫画
10: デマンドロング・YT面・ドラマ
11: デマンドロング・YT面・イラスト/AI
12: デマンドロング・YT面・通常
13-18: デマンドshorts・YT面（各種形式）
19-24: ByteDance・TikTok（各種形式）
25-31: Meta・Instagram/Facebook（各種形式）
32-35: LINE（各種形式）

選定基準：
- 分類に対応する推奨IDから優先的に選択
- ターゲット層とのマッチング度
- 商品特性との相性
- 期待されるROI
- 競合の出稿状況（推定）

### 10. クリエイティブ提案
選択した3つの媒体それぞれに対して：
- 具体的なクリエイティブアイデア: 実際の広告内容の詳細な説明
- キーメッセージ: 15文字以内のメインコピー案
- ビジュアルスタイル: 色調、雰囲気、使用する要素等の具体的な指示

## 出力形式
以下のJSON形式で厳密に出力してください。全ての項目を必ず埋めること：

{
  "productInfo": {
    "productName": "正式な商品名",
    "category": "業界標準のカテゴリー分類",
    "sizeCapacity": "具体的な数値と単位（例：500ml、30錠入り）",
    "features": ["機能1", "機能2", "機能3", "機能4", "機能5"],
    "effects": ["効果1", "効果2", "効果3"],
    "rtb": "科学的根拠や実績データ",
    "authority": "認証・受賞歴・専門家推薦等"
  },
  "pricing": {
    "regularPrice": "X,XXX円（税込）",
    "specialPrice": "X,XXX円（税込）※XX%OFF",
    "campaign": "キャンペーンの詳細内容",
    "releaseDate": "20XX年X月頃（推定）",
    "salesChannel": "オンライン：公式サイト、Amazon等 / オフライン：ドラッグストア等"
  },
  "demographics": {
    "ageRange": "XX歳〜XX歳（中心：XX歳）",
    "gender": "男性XX%：女性XX%",
    "otherCharacteristics": "世帯年収XXX万円以上、子育て世代等の具体的特性"
  },
  "valueProposition": {
    "functionalValue": ["価値1：具体的な説明", "価値2：具体的な説明", "価値3：具体的な説明"],
    "emotionalValue": "30代の働く女性が、朝の準備時間に使用することで、1日を前向きに始められる自信を得る"
  },
  "marketAnalysis": {
    "marketDefinition": "日本のXX市場（具体的な定義）",
    "marketCategory": "大分類：XX / 中分類：XX / 小分類：XX",
    "marketSize": "約XXX億円（2024年、日本市場）",
    "strategyTarget": "XX〜XX歳の男女、年収XXX万円以上の層",
    "coreTarget": "XX歳〜XX歳の女性、都市部在住、フルタイム勤務"
  },
  "persona": {
    "profile": {
      "age": "35歳",
      "gender": "女性",
      "location": "東京都世田谷区",
      "occupation": "IT企業マーケティング部",
      "position": "主任",
      "industry": "情報通信業",
      "income": "年収650万円",
      "education": "4年制大学卒（経済学部）",
      "familyStructure": "既婚、子供なし、夫（38歳・会社員）",
      "lifestyle": "平日7時起床22時帰宅、週末はヨガとカフェ巡り",
      "interests": "ヨガ、料理、韓国ドラマ、美容",
      "mediaUsage": "Instagram（毎日）、YouTube（週3-4回）、Twitter（週1-2回）"
    },
    "journey": {
      "situation": "仕事のプレゼン前日、肌の調子が気になり始めた",
      "sensory": "鏡を見て肌のくすみとハリのなさを感じた",
      "instinct": "承認欲求（きれいに見られたい）、自己実現欲求",
      "perception": "今のスキンケアでは限界があることに気づいた",
      "emotion": "不安と焦り、同時に変化への期待",
      "desire": "明日までに少しでも肌の調子を整えたい",
      "demand": "即効性のある高品質なスキンケア商品"
    }
  },
  "classification": {
    "marketType": "ニッチマーケット狙い または マスマーケット狙い",
    "actionReason": "選択した行動理由分類",
    "reasoning": "この分類を選んだ3つ以上の具体的根拠"
  },
  "recommendations": {
    "media": [
      {
        "mediaId": "media_001等の実際のID",
        "mediaName": "実際の媒体名",
        "target": "この媒体のメインターゲット層",
        "method": "配信方法（ターゲティング、配信面等）",
        "reason": "この媒体を選んだ具体的な理由（100文字以上）"
      },
      {
        "mediaId": "media_002等の実際のID",
        "mediaName": "実際の媒体名",
        "target": "この媒体のメインターゲット層",
        "method": "配信方法",
        "reason": "選定理由"
      },
      {
        "mediaId": "media_003等の実際のID",
        "mediaName": "実際の媒体名",
        "target": "この媒体のメインターゲット層",
        "method": "配信方法",
        "reason": "選定理由"
      }
    ],
    "creative": [
      {
        "mediaName": "1つ目の媒体名",
        "idea": "ビフォーアフター形式で、朝と夜の肌の違いを表現。実際の使用者の声を活用",
        "keyMessage": "朝の5分で変わる肌実感",
        "visualStyle": "明るく清潔感のある白基調、朝日をイメージしたゴールドのアクセント"
      },
      {
        "mediaName": "2つ目の媒体名",
        "idea": "クリエイティブの具体的内容",
        "keyMessage": "15文字以内のコピー",
        "visualStyle": "ビジュアルの詳細指示"
      },
      {
        "mediaName": "3つ目の媒体名",
        "idea": "クリエイティブの具体的内容",
        "keyMessage": "15文字以内のコピー",
        "visualStyle": "ビジュアルの詳細指示"
      }
    ]
  }
}`
  }
}