import OpenAI from 'openai'

export interface ScriptGenerationRequest {
  intentId: string
  productInfo: {
    productName: string
    offer: string
    price: string
    features: string[]
    target: string
    authority?: string
    guarantee?: string
  }
  videoConfig: {
    seconds: string
    structure: string
    detail: string
  }
  csvAnalysis: string // CSVから取得した分析データ
}

export class ImprovedGPTScriptGenerator {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async generateScript(request: ScriptGenerationRequest): Promise<string> {
    try {
      // ステップ1: 分析データから成功パターンを理解させる
      const analysisResult = await this.analyzePattern(request)
      
      // ステップ2: 分析結果を基に台本を生成
      const script = await this.generateFromAnalysis(analysisResult, request)
      
      return script
    } catch (error) {
      console.error('Script generation error:', error)
      throw error
    }
  }

  // ステップ1: パターン分析
  private async analyzePattern(request: ScriptGenerationRequest) {
    const analysisPrompt = `
あなたは動画広告の成功パターンを分析する専門家です。
以下のCSV分析データから、成功の本質を抽出してください。

【CSV分析データ】
${request.csvAnalysis}

【分析して抽出すべき要素】
1. フックの構造
   - どんな感情や好奇心を刺激しているか
   - 最初の3秒で何を提示しているか
   
2. 問題提起の方法
   - どんな課題や不満を顕在化させているか
   - 共感を生む具体的な状況設定
   
3. 解決策の提示方法
   - どのタイミングで商品を登場させるか
   - どんな文脈で自然に紹介しているか
   
4. 信頼性の構築要素
   - 権威付けの方法（実績、専門家、データ等）
   - 社会的証明の使い方
   
5. オファーの魅力的な見せ方
   - 価格の提示タイミングと方法
   - 限定性や緊急性の演出
   
6. 行動喚起の技術
   - どんな言葉で行動を促すか
   - 心理的ハードルの下げ方

各要素について、「なぜ効果的か」と「どう応用できるか」を含めて分析してください。
単なる要約ではなく、成功の本質を理解した深い分析をお願いします。
`

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'あなたは動画マーケティングの専門家です。' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })

    return completion.choices[0].message.content || ''
  }

  // ステップ2: 分析を基にした台本生成
  private async generateFromAnalysis(analysis: string, request: ScriptGenerationRequest) {
    const generatePrompt = `
先ほど分析した成功パターンを基に、以下の商品で台本を作成してください。

【成功パターンの分析結果】
${analysis}

【新商品情報】
商品名: ${request.productInfo.productName}
オファー: ${request.productInfo.offer}
価格: ${request.productInfo.price}
特徴: ${request.productInfo.features.join('、')}
ターゲット: ${request.productInfo.target}
${request.productInfo.authority ? `権威性: ${request.productInfo.authority}` : ''}
${request.productInfo.guarantee ? `保証: ${request.productInfo.guarantee}` : ''}

【動画設定】
長さ: ${request.videoConfig.seconds}
構成: ${request.videoConfig.structure}
詳細度: ${request.videoConfig.detail}

【台本作成のルール】
1. 分析で特定した成功要素をすべて組み込む
2. 商品情報は上記のものに完全に置き換える
3. 構造とリズムは分析結果に従う
4. ターゲットに合わせた言葉遣いにする
5. 具体的なセリフとト書きで構成する

【重要な注意点】
- 商品名、価格、オファーは必ず指定されたものを使用
- 成功パターンの本質は維持しつつ、商品に合わせて創造的に適用
- 視聴者の感情の流れを意識した構成にする

では、分析結果を活かした効果的な台本を作成してください。
`

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: `あなたは${request.intentId}の台本作成専門家です。分析結果を基に、商品に最適化された台本を作成します。` 
        },
        { role: 'user', content: generatePrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    return completion.choices[0].message.content || ''
  }
}

// 使用例
export const generateImprovedScript = async (
  intentId: string,
  productInfo: any,
  csvAnalysis: string,
  videoConfig: any
) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not found')
  }

  const generator = new ImprovedGPTScriptGenerator(apiKey)
  
  const request: ScriptGenerationRequest = {
    intentId,
    productInfo: {
      productName: productInfo.productName || '商品名',
      offer: productInfo.offer || '特別オファー',
      price: productInfo.price || '価格',
      features: productInfo.features || [],
      target: productInfo.target || 'ターゲット層',
      authority: productInfo.authority,
      guarantee: productInfo.guarantee
    },
    videoConfig,
    csvAnalysis
  }

  return await generator.generateScript(request)
}