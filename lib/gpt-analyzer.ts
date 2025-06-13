import OpenAI from 'openai'

export class GPTAnalyzer {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
    })
  }

  async analyzeProduct(scrapedData: any, marketingTemplate: any): Promise<any> {
    const prompt = this.createAnalysisPrompt(scrapedData, marketingTemplate)
    
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [
          {
            role: 'system',
            content: `あなたは日本のデジタルマーケティング戦略の専門家です。10年以上の実務経験を持ち、特に以下の分野に精通しています：
- 日本市場特有の消費者行動と購買パターン
- 各種デジタル広告媒体の特性と効果的な活用方法
- データドリブンなペルソナ設計とターゲティング戦略
- ROIを最大化するメディアミックス戦略

以下の厳格なルールに従って分析を行ってください：
1. 全ての数値データは日本市場の実態に基づいた現実的な推定値を使用
2. 媒体選定は必ず論理的な根拠と共に提示
3. ペルソナは実在する人物のように具体的に描写
4. 必ず指定されたJSON形式で出力（余計な説明文は含めない）
5. CSVテンプレートの全項目を漏れなく埋める`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })

      const content = completion.choices[0].message.content
      if (content) {
        return JSON.parse(content)
      }
      
      throw new Error('予期しないレスポンス形式')
    } catch (error) {
      console.error('OpenAI API エラー:', error)
      throw error
    }
  }

  private createAnalysisPrompt(scrapedData: any, marketingTemplate: any): string {
    return `日本のEC市場における商品分析を実施します。以下の商品情報を基に、CSVテンプレートの全項目を漏れなく分析し、JSON形式で出力してください。

## 分析対象商品情報
- タイトル: ${scrapedData.title}
- 説明: ${scrapedData.description}
- 価格: ${scrapedData.price}
- カテゴリー: ${scrapedData.category}
- 特徴: ${JSON.stringify(scrapedData.features)}

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