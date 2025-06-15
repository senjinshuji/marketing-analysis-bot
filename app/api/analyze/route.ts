import { NextRequest, NextResponse } from 'next/server'
import { WebScraper } from '../../../lib/scraper-simple'
// import { APIWebScraper } from '../../../lib/scraper-api'
// import { HybridScraper } from '../../../lib/scraper-hybrid'
// import { FreeEnhancedScraper } from '../../../lib/scraper-free-enhanced'
// import { ComprehensiveScraper } from '../../../lib/scraper-comprehensive'
import { ScraperWithWait } from '../../../lib/scraper-with-wait'
import { GPTAnalyzer } from '../../../lib/gpt-analyzer'
import { marketingTemplate } from '../../../lib/marketing-template'
import { getRecommendedCreatives } from '../../../lib/creative-references'

// 実際のスクレイピングを使った分析関数
async function analyzeUrl(url: string) {
  console.log('Analyzing URL:', url)
  
  // Amazon等の大手サイトのトップページは分析対象外
  if (url === 'https://amazon.co.jp' || url === 'https://www.amazon.co.jp' || 
      url === 'https://amazon.co.jp/' || url === 'https://www.amazon.co.jp/') {
    return {
      productInfo: {
        productName: 'Amazon.co.jp',
        category: 'ECプラットフォーム',
        features: ['商品ページのURLを入力してください'],
        effects: ['例: https://www.amazon.co.jp/dp/B08... のような商品個別ページ']
      },
      classification: {
        marketType: '分析対象外',
        actionReason: '商品個別ページのURLが必要です',
        reasoning: 'トップページではなく、具体的な商品ページのURLを入力してください'
      },
      recommendations: {
        media: [],
        creative: []
      }
    }
  }
  
  // 待機時間付きスクレイパーを使用（動的コンテンツ対応）
  const scraper = new ScraperWithWait()
  
  try {
    // スクレイピング実行
    let scrapedData
    if (url.includes('tsukurioki.jp')) {
      scrapedData = await scraper.scrapeTsukurioki(url)
    } else {
      scrapedData = await scraper.scrapeUrl(url)
    }
    
    // URLをscrapedDataに追加
    scrapedData.url = url
    
    console.log('スクレイピング結果:', scrapedData)
    
    // GPT-4を使用して詳細分析を実行
    const apiKey = process.env.OPENAI_API_KEY
    
    if (apiKey && apiKey !== 'your-api-key-here') {
      try {
        const gptAnalyzer = new GPTAnalyzer(apiKey)
        const gptAnalysis = await gptAnalyzer.analyzeProduct(scrapedData, marketingTemplate)
        console.log('GPT-4分析結果:', gptAnalysis)
        return gptAnalysis
      } catch (gptError: any) {
        console.error('GPT-4分析エラー:', gptError)
        console.error('GPT-4エラー詳細:', {
          message: gptError.message,
          stack: gptError.stack,
          response: gptError.response?.data
        })
        // GPT-4エラー時は簡易分析にフォールバック
      }
    }
    
    // APIキーがない場合は簡易分析を実行
    const analysisResult = generateAnalysisFromScrapedData(scrapedData, url)
    return analysisResult
    
  } catch (error) {
    console.error('スクレイピングエラー:', error)
    
    // スクレイピング失敗時は模擬データを返す
    if (url.includes('tsukurioki.jp')) {
      return generateTsukuriokiMockData()
    }
    
    return generateDefaultMockData()
  } finally {
    await scraper.close()
  }
}

// スクレイピングデータから分析結果を生成
function generateAnalysisFromScrapedData(scrapedData: any, url: string) {
  // デフォルトはニッチ
  let marketType = 'ニッチ'
  let actionReason = '自分ごと化させて行動してもらう'
  
  // 価格情報の取得
  let price = 0
  if (scrapedData.price) {
    const priceMatch = scrapedData.price.match(/[\d,]+/)
    if (priceMatch) {
      price = parseInt(priceMatch[0].replace(',', ''))
    }
  }
  
  // カテゴリーから市場規模を推定
  const category = scrapedData.category || ''
  const title = scrapedData.title || ''
  const description = scrapedData.description || ''
  
  // マスマーケット判定
  // 1. 初回価格が3,000円以下で一般的なカテゴリー
  if (price > 0 && price <= 3000) {
    const massCategories = ['食品', '健康', '美容', 'サプリ', 'コスメ', '日用品']
    if (massCategories.some(cat => category.includes(cat) || title.includes(cat))) {
      marketType = 'マス向け'
      actionReason = 'オファーが魅力的、とにかく安い'
    }
  }
  
  // 2. 日用品・消耗品カテゴリー
  if (category.includes('日用') || category.includes('消耗') || 
      description.includes('毎日') || description.includes('日常')) {
    marketType = 'マス向け'
    actionReason = 'オファーが魅力的、とにかく安い'
  }
  
  // ニッチマーケット判定
  // 1. 高価格商品
  if (price > 5000) {
    marketType = 'ニッチ'
    actionReason = '訴求が強い、権威性がある、悩みが解決できる'
  }
  
  // 2. 専門性が高い商品
  const features = scrapedData.features || []
  const hasSpecializedFeatures = features.some((f: string) => 
    f.includes('専門') || f.includes('プロ') || f.includes('専用') || 
    f.includes('特化') || f.includes('B2B') || f.includes('法人')
  )
  
  if (hasSpecializedFeatures) {
    marketType = 'ニッチ'
    actionReason = '訴求が強い、権威性がある、悩みが解決できる'
  }

  return {
    productInfo: {
      productName: scrapedData.title || 'タイトル取得中...',
      category: scrapedData.category || 'カテゴリー分析中...',
      features: scrapedData.features.slice(0, 5) || ['特徴を分析中...'],
      effects: extractEffects(scrapedData),
      rtb: extractRTB(scrapedData),
      authority: extractAuthority(scrapedData)
    },
    pricing: {
      regularPrice: scrapedData.price || '価格情報取得中...',
      releaseDate: '分析中...',
      salesChannel: 'EC（Webサイト）'
    },
    demographics: {
      ageRange: predictAgeRange(scrapedData),
      gender: predictGender(scrapedData),
      otherCharacteristics: predictCharacteristics(scrapedData)
    },
    classification: {
      marketType,
      actionReason,
      reasoning: `${scrapedData.title}の特徴と価格帯から${marketType}と判定。${actionReason}の訴求が効果的と分析。`
    },
    persona: generatePersona(scrapedData, marketType),
    recommendations: generateRecommendations(marketType, actionReason),
    creativeReferences: []  // 簡易分析では空配列を返す
  }
}

// 効果の抽出
function extractEffects(scrapedData: any): string[] {
  const effects = []
  const features = scrapedData.features || []
  
  for (const feature of features) {
    if (feature.includes('効果') || feature.includes('改善') || feature.includes('解決')) {
      effects.push(feature)
    }
  }
  
  return effects.length > 0 ? effects : ['効果を分析中...']
}

// RTBの抽出
function extractRTB(scrapedData: any): string {
  const features = scrapedData.features || []
  
  for (const feature of features) {
    if (feature.includes('実証') || feature.includes('認定') || feature.includes('特許')) {
      return feature
    }
  }
  
  return '信頼性を分析中...'
}

// 権威性の抽出
function extractAuthority(scrapedData: any): string {
  const features = scrapedData.features || []
  const description = scrapedData.description || ''
  
  const authorityKeywords = ['監修', '認定', '医師', '専門家', '博士', '研究', '大学']
  
  for (const keyword of authorityKeywords) {
    if (description.includes(keyword)) {
      return `${keyword}による信頼性`
    }
  }
  
  return '権威性を分析中...'
}

// 年齢層予測
function predictAgeRange(scrapedData: any): string {
  const text = (scrapedData.description + scrapedData.features.join(' ')).toLowerCase()
  
  if (text.includes('学生') || text.includes('young')) return '10-20代'
  if (text.includes('子育て') || text.includes('family')) return '30-40代'
  if (text.includes('シニア') || text.includes('senior')) return '50代以上'
  
  return '30-40代'
}

// 性別予測
function predictGender(scrapedData: any): string {
  const text = (scrapedData.description + scrapedData.features.join(' ')).toLowerCase()
  
  if (text.includes('美容') || text.includes('beauty') || text.includes('コスメ')) return '女性中心'
  if (text.includes('メンズ') || text.includes('男性')) return '男性中心'
  
  return '男女両方'
}

// 特性予測
function predictCharacteristics(scrapedData: any): string {
  const text = (scrapedData.description + scrapedData.features.join(' ')).toLowerCase()
  
  if (text.includes('共働き') || text.includes('時短')) return '共働き世帯、時短ニーズ'
  if (text.includes('健康') || text.includes('health')) return '健康志向'
  if (text.includes('高級') || text.includes('premium')) return '高所得層'
  
  return '一般的な消費者層'
}

// ペルソナ生成
function generatePersona(scrapedData: any, marketType: string) {
  const basePersona = {
    age: marketType === 'ニッチ' ? '42歳' : '35歳',
    gender: predictGender(scrapedData) === '女性中心' ? '女性' : '男性',
    occupation: marketType === 'ニッチ' ? '専門職' : '事務職',
    income: marketType === 'ニッチ' ? '800万円' : '550万円',
    familyStructure: '配偶者、子供2人の4人家族',
    interests: generateInterests(scrapedData)
  }
  
  return basePersona
}

// 興味関心生成
function generateInterests(scrapedData: any): string {
  const category = scrapedData.category || ''
  
  if (category.includes('美容')) return '美容、健康、SNS'
  if (category.includes('食品')) return '料理、家族時間、健康管理'
  if (category.includes('健康')) return '健康、運動、栄養管理'
  
  return '家族、趣味、自己啓発'
}

// 推奨媒体生成
function generateRecommendations(marketType: string, actionReason: string) {
  // 行動理由に基づく媒体ID
  let mediaIds = []
  
  if (marketType === 'ニッチ' && actionReason.includes('自分ごと化')) {
    mediaIds = ['1', '2', '7', '19', '22', '23', '24', '25', '28', '29', '30', '31', '33']
  } else if (marketType === 'マス向け' && actionReason.includes('オファー')) {
    mediaIds = ['7', '10', '11', '13', '16', '17', '19', '21', '22', '24', '25', '27', '28', '30', '31']
  } else {
    mediaIds = ['7', '25', '31'] // デフォルト
  }

  const mediaDatabase: { [key: string]: { mediaName: string; target: string; method: string } } = {
    '1': { mediaName: 'リスティング', target: '指名検索', method: '指名入札' },
    '7': { mediaName: 'デマンドロング', target: 'YT面限定', method: '語り' },
    '25': { mediaName: 'meta', target: 'ストーリー、リールメイン', method: '語り' },
    '31': { mediaName: 'meta', target: '正方形', method: 'バナー' }
  }

  const recommendations = mediaIds.slice(0, 3).map(id => ({
    mediaId: id,
    mediaName: mediaDatabase[id]?.mediaName || 'デマンドロング',
    target: mediaDatabase[id]?.target || 'YT面限定',
    method: mediaDatabase[id]?.method || '語り',
    reason: `${marketType}向けの${actionReason}訴求に適している`
  }))

  return {
    media: recommendations,
    creative: [
      {
        mediaName: 'デマンドロング（語り）',
        idea: `${marketType}向けのストーリー動画。${actionReason}を軸とした訴求`,
        keyMessage: '商品の核心的価値を伝える',
        visualStyle: '親しみやすく信頼感のあるスタイル'
      }
    ]
  }
}

// つくりおき.jp用の模擬データ
function generateTsukuriokiMockData() {
  return {
    productInfo: {
      productName: 'つくりおき.jp',
      category: '宅配食（冷凍）、家庭料理',
      features: [
        'プロの手作り',
        '週替わりメニュー',
        '栄養士監修のメニュー',
        '出来立ての味が冷蔵で届く',
        'LINEで3STEP簡単注文'
      ],
      effects: [
        '5分で食卓が完成',
        '家庭的な味でおいしい'
      ],
      rtb: 'レンジでチンするだけでOK',
      authority: '栄養士監修'
    },
    pricing: {
      regularPrice: '1人前798円〜（税＆送料込み）',
      releaseDate: '2020年頃',
      salesChannel: 'EC（公式サイト）'
    },
    demographics: {
      ageRange: '30-40代',
      gender: '女性89.1%、男性10.3%',
      otherCharacteristics: '共働き、3or4人家族が7割'
    },
    classification: {
      marketType: 'マスマーケット狙い',
      actionReason: 'マス向け：オファーが魅力的、とにかく安い（価格訴求型）',
      reasoning: '1人前798円という低価格帯で、宅配食市場（約1,500億円規模）をターゲット。共働き家庭という大きなセグメントを狙い、時短・便利さを訴求。'
    },
    persona: {
      age: '35歳',
      gender: '女性',
      occupation: '事務職',
      income: '550万円',
      familyStructure: '夫（36歳）、子供2人（5歳・3歳）の4人家族',
      interests: '家族旅行、美容、資産運用（NISA）、子育て関連情報収集'
    },
    recommendations: {
      media: [
        {
          mediaId: '7',
          mediaName: 'デマンドロング',
          target: 'YT面限定',
          method: '語り',
          reason: '共働き家庭の悩みに共感を示すストーリー訴求が効果的'
        },
        {
          mediaId: '25',
          mediaName: 'meta',
          target: 'ストーリー、リールメイン',
          method: '語り',
          reason: 'Instagram/Facebookで子育て世代にリーチ'
        },
        {
          mediaId: '31',
          mediaName: 'meta',
          target: '正方形',
          method: 'バナー',
          reason: '商品画像と価格訴求でコンバージョン狙い'
        }
      ],
      creative: [
        {
          mediaName: 'デマンドロング（語り）',
          idea: '共働きママの一日を描いたストーリー動画。夕方の慌ただしさから、つくりおき.jpで解放される様子を描く',
          keyMessage: '5分で家庭的な夕飯が完成、家族時間が増える',
          visualStyle: '実写、温かみのある家庭的な雰囲気'
        },
        {
          mediaName: 'meta（ストーリー・リール）',
          idea: '実際の利用者の声を集めたショート動画。子供が喜んで食べる様子と親の安心感を表現',
          keyMessage: '子供が喜ぶ家庭的な味、ママも安心',
          visualStyle: 'UGC風、自然な家庭の風景'
        }
      ]
    },
    creativeReferences: getRecommendedCreatives(
      'mass',
      'オファーが魅力的、とにかく安い（無料、500円オファー、LINE追加など）',
      ['7', '25', '31']  // つくりおき.jpの推奨媒体ID
    )
  }
}

// デフォルト模擬データ
function generateDefaultMockData() {
  return {
    productInfo: {
      productName: '商品名を取得中...',
      category: 'カテゴリーを分析中...',
      features: ['特徴を分析中...'],
      effects: ['効果を分析中...']
    },
    classification: {
      marketType: '分析中...',
      actionReason: '分析中...',
      reasoning: '詳細な分析を実行中です...'
    },
    recommendations: {
      media: [],
      creative: []
    },
    creativeReferences: null
  }
}

// Vercel Free planは10秒、Proは60秒のタイムアウト
export const maxDuration = 60; // Pro plan用の設定

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      )
    }
    
    // URL形式の検証
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: '有効なURLを入力してください' },
        { status: 400 }
      )
    }
    
    console.log('分析開始:', url)
    const startTime = Date.now()
    
    const analysisResult = await analyzeUrl(url)
    
    const processingTime = Date.now() - startTime
    console.log(`分析完了: ${processingTime}ms`)
    
    return NextResponse.json(analysisResult)
    
  } catch (error) {
    console.error('分析エラー:', error)
    return NextResponse.json(
      { error: '分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}