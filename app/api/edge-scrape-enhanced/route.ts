export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { url, options } = await request.json()
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    console.log('Enhanced Edge Scraping:', url)

    // 複数のUser-Agentを試す
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    ]

    let html = ''
    let successfulUA = ''

    // 各User-Agentで試行
    for (const ua of userAgents) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://www.google.com/'
          },
          // Cloudflareなどのボット検出を回避
          redirect: 'follow'
        })

        if (response.ok) {
          html = await response.text()
          successfulUA = ua
          break
        }
      } catch (error) {
        console.error(`Failed with UA ${ua}:`, error)
        continue
      }
    }

    if (!html) {
      throw new Error('Failed to fetch content with all user agents')
    }

    // 高度なデータ抽出
    const extractedData = await extractDataFromHTML(html, url, options)

    return Response.json({
      ...extractedData,
      debug: {
        userAgent: successfulUA,
        htmlLength: html.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Enhanced Edge scraping error:', error)
    return Response.json({
      error: 'Enhanced scraping failed',
      message: error.message
    }, { status: 500 })
  }
}

// 高度なHTML解析
async function extractDataFromHTML(html: string, url: string, options: any) {
  const data: any = {
    prices: [],
    features: [],
    images: [],
    structuredData: []
  }

  // 1. 基本情報の抽出
  data.title = extractTitle(html)
  data.description = extractMetaDescription(html)
  data.ogTitle = extractOGTag(html, 'og:title')
  data.ogDescription = extractOGTag(html, 'og:description')
  data.ogImage = extractOGTag(html, 'og:image')

  // 2. 価格情報の詳細抽出
  if (options?.extractPrices) {
    data.prices = extractPrices(html)
  }

  // 3. 特徴の抽出
  if (options?.extractFeatures) {
    data.features = extractFeatures(html)
  }

  // 4. 画像の抽出
  if (options?.extractImages) {
    data.images = extractImages(html, url)
  }

  // 5. 構造化データの抽出
  if (options?.extractStructuredData) {
    data.structuredData = extractStructuredData(html)
  }

  // 6. カテゴリー推測
  data.category = inferCategory(html, data.structuredData)

  // 7. 最終的な価格決定
  data.price = determineBestPrice(data.prices)

  return data
}

// タイトル抽出
function extractTitle(html: string): string {
  // 複数の方法でタイトルを探す
  const patterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return ''
}

// メタディスクリプション抽出
function extractMetaDescription(html: string): string {
  const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
  return match ? match[1] : ''
}

// OGタグ抽出
function extractOGTag(html: string, property: string): string {
  const regex = new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i')
  const match = html.match(regex)
  return match ? match[1] : ''
}

// 価格の詳細抽出
function extractPrices(html: string): any[] {
  const prices: any[] = []
  
  // 価格パターンの定義（優先順位順）
  const pricePatterns = [
    // 最優先: 初回限定価格
    {
      type: 'initialPrice',
      patterns: [
        /初回限定[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /初回特別価格[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /初回のみ[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /初回[^0-9]{0,10}([¥￥]?[\d,]+)円/gi
      ]
    },
    // お試し価格
    {
      type: 'trialPrice',
      patterns: [
        /お試し価格[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /トライアル[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /モニター価格[^0-9]{0,20}([¥￥]?[\d,]+)円/gi
      ]
    },
    // キャンペーン価格
    {
      type: 'campaignPrice',
      patterns: [
        /今だけ[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /期間限定[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /特別価格[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /キャンペーン[^0-9]{0,20}([¥￥]?[\d,]+)円/gi
      ]
    },
    // 定期価格
    {
      type: 'subscriptionPrice',
      patterns: [
        /定期初回[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /定期便[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /定期コース[^0-9]{0,20}([¥￥]?[\d,]+)円/gi
      ]
    },
    // 通常価格
    {
      type: 'regularPrice',
      patterns: [
        /通常価格[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /定価[^0-9]{0,20}([¥￥]?[\d,]+)円/gi,
        /本体価格[^0-9]{0,20}([¥￥]?[\d,]+)円/gi
      ]
    }
  ]

  // 各パターンで価格を探す
  for (const { type, patterns } of pricePatterns) {
    for (const pattern of patterns) {
      const matches = Array.from(html.matchAll(pattern))
      for (const match of matches) {
        const fullMatch = match[0]
        const priceOnly = match[1] || fullMatch.match(/([¥￥]?[\d,]+)円/)?.[1]
        
        if (priceOnly) {
          // HTMLタグの位置も記録（重要度判定用）
          const position = match.index || 0
          prices.push({
            type,
            price: priceOnly + '円',
            context: fullMatch.trim(),
            position,
            // ページ上部にあるほど高スコア
            score: calculatePriceScore(type, position, fullMatch)
          })
        }
      }
    }
  }

  // 一般的な価格も抽出（タイプ不明）
  const genericPricePattern = /([¥￥][\d,]+|[\d,]+円)/g
  const genericMatches = Array.from(html.matchAll(genericPricePattern))
  
  for (const match of genericMatches.slice(0, 20)) { // 最大20個まで
    const priceText = match[0]
    const position = match.index || 0
    
    // 既に抽出済みでないか確認
    const alreadyExtracted = prices.some(p => 
      Math.abs(p.position - position) < 50
    )
    
    if (!alreadyExtracted) {
      prices.push({
        type: 'generic',
        price: priceText,
        context: extractContext(html, position, 50),
        position,
        score: 1
      })
    }
  }

  // スコアでソート
  return prices.sort((a, b) => b.score - a.score)
}

// 価格のスコア計算
function calculatePriceScore(type: string, position: number, context: string): number {
  let score = 0
  
  // タイプ別基本スコア
  const typeScores: { [key: string]: number } = {
    initialPrice: 100,
    trialPrice: 90,
    campaignPrice: 80,
    subscriptionPrice: 70,
    regularPrice: 50,
    generic: 10
  }
  
  score += typeScores[type] || 0
  
  // 位置スコア（ページ上部ほど高い）
  if (position < 1000) score += 50
  else if (position < 5000) score += 30
  else if (position < 10000) score += 10
  
  // コンテキストスコア
  if (context.includes('限定')) score += 20
  if (context.includes('今だけ')) score += 15
  if (context.includes('%OFF') || context.includes('％OFF')) score += 25
  if (context.match(/\d+名様/)) score += 10
  
  return score
}

// コンテキスト抽出
function extractContext(html: string, position: number, length: number): string {
  const start = Math.max(0, position - length)
  const end = Math.min(html.length, position + length)
  return html.slice(start, end).replace(/<[^>]+>/g, ' ').trim()
}

// 特徴の抽出
function extractFeatures(html: string): string[] {
  const features: string[] = []
  
  // 特徴的なHTMLパターン
  const patterns = [
    // リスト項目
    /<li[^>]*>([^<]{10,200})<\/li>/gi,
    // 特徴的なクラス名を持つ要素
    /<[^>]+class=["'][^"']*(?:feature|point|benefit|merit)[^"']*["'][^>]*>([^<]+)<\/[^>]+>/gi,
    // チェックマーク付きテキスト
    /<[^>]*>[✓✔️☑️]\s*([^<]+)<\/[^>]+>/gi,
    // 番号付きリスト
    /<[^>]*>(?:①|②|③|④|⑤|1\.|2\.|3\.)\s*([^<]+)<\/[^>]+>/gi
  ]
  
  const extractedTexts = new Set<string>()
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern))
    for (const match of matches) {
      const text = match[1].trim()
      // 適切な長さで、HTMLタグを含まない
      if (text.length >= 10 && text.length <= 200 && !text.includes('<')) {
        extractedTexts.add(text)
      }
    }
  }
  
  return Array.from(extractedTexts).slice(0, 20) // 最大20個
}

// 画像の抽出
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  const imagePattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  const matches = Array.from(html.matchAll(imagePattern))
  
  for (const match of matches.slice(0, 10)) { // 最大10個
    let src = match[1]
    
    // 相対URLを絶対URLに変換
    if (!src.startsWith('http')) {
      try {
        src = new URL(src, baseUrl).href
      } catch {
        continue
      }
    }
    
    // 有効な画像URLのみ
    if (src.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
      images.push(src)
    }
  }
  
  return [...new Set(images)] // 重複削除
}

// 構造化データの抽出
function extractStructuredData(html: string): any[] {
  const structuredData: any[] = []
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi
  const matches = Array.from(html.matchAll(pattern))
  
  for (const match of matches) {
    try {
      const json = JSON.parse(match[1])
      structuredData.push(json)
    } catch (error) {
      console.error('Failed to parse JSON-LD:', error)
    }
  }
  
  return structuredData
}

// カテゴリー推測
function inferCategory(html: string, structuredData: any[]): string {
  // 構造化データから
  for (const data of structuredData) {
    if (data?.category) return data.category
    if (data?.['@type'] === 'Product' && data?.category) return data.category
  }
  
  // パンくずリストから
  const breadcrumbPattern = /<[^>]+(?:breadcrumb|パンくず)[^>]*>([^<]+)<\/[^>]+>/gi
  const breadcrumbMatch = html.match(breadcrumbPattern)
  if (breadcrumbMatch) {
    const categories = breadcrumbMatch[0].split(/[>›]/);
    if (categories.length > 1) {
      return categories[categories.length - 2].trim()
    }
  }
  
  // キーワードから推測
  const text = html.toLowerCase()
  if (text.includes('サプリメント') || text.includes('supplement')) return '健康食品・サプリメント'
  if (text.includes('化粧品') || text.includes('コスメ')) return '化粧品・美容'
  if (text.includes('ダイエット')) return 'ダイエット・健康'
  if (text.includes('食品') || text.includes('フード')) return '食品・飲料'
  
  return ''
}

// 最適な価格の決定
function determineBestPrice(prices: any[]): string {
  if (!prices || prices.length === 0) return ''
  
  // 最高スコアの価格を選択
  const bestPrice = prices[0]
  
  // キャンペーン価格と通常価格のペアを探す
  const campaignTypes = ['initialPrice', 'trialPrice', 'campaignPrice', 'subscriptionPrice']
  const campaign = prices.find(p => campaignTypes.includes(p.type))
  const regular = prices.find(p => p.type === 'regularPrice')
  
  if (campaign && regular) {
    return `${regular.context} → ${campaign.context}`
  }
  
  return bestPrice.context || bestPrice.price
}