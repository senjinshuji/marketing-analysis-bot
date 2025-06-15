export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    console.log('包括的Edge Scraping:', url)

    // 複数のアプローチで取得を試行
    const strategies = [
      () => fetchWithStandardHeaders(url),
      () => fetchWithMobileUA(url),
      () => fetchWithCurlEmulation(url),
      () => fetchWithGoogleBot(url)
    ]

    let html = ''
    let successfulStrategy = ''

    for (let index = 0; index < strategies.length; index++) {
      const strategy = strategies[index]
      try {
        const result = await strategy()
        if (result.html) {
          html = result.html
          successfulStrategy = result.strategy
          break
        }
      } catch (error) {
        console.error(`Strategy ${index + 1} failed:`, error)
        continue
      }
    }

    if (!html) {
      // 最後の手段：簡易フェッチ
      const response = await fetch(url)
      html = await response.text()
      successfulStrategy = 'simple-fetch'
    }

    // データ抽出
    const extractedData = extractComprehensiveData(html, url)

    return Response.json({
      ...extractedData,
      debug: {
        strategy: successfulStrategy,
        htmlLength: html.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('包括的スクレイピングエラー:', error)
    return Response.json({
      error: 'Comprehensive scraping failed',
      message: error.message
    }, { status: 500 })
  }
}

// 標準的なヘッダーでフェッチ
async function fetchWithStandardHeaders(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }
  })
  
  if (response.ok) {
    return { html: await response.text(), strategy: 'standard-headers' }
  }
  throw new Error(`Standard fetch failed: ${response.status}`)
}

// モバイルUAでフェッチ
async function fetchWithMobileUA(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja-JP,ja;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  })
  
  if (response.ok) {
    return { html: await response.text(), strategy: 'mobile-ua' }
  }
  throw new Error(`Mobile fetch failed: ${response.status}`)
}

// cURLエミュレーション
async function fetchWithCurlEmulation(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'curl/7.88.1',
      'Accept': '*/*'
    }
  })
  
  if (response.ok) {
    return { html: await response.text(), strategy: 'curl-emulation' }
  }
  throw new Error(`Curl fetch failed: ${response.status}`)
}

// GoogleBotエミュレーション（最終手段）
async function fetchWithGoogleBot(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  })
  
  if (response.ok) {
    return { html: await response.text(), strategy: 'googlebot' }
  }
  throw new Error(`GoogleBot fetch failed: ${response.status}`)
}

// 包括的なデータ抽出
function extractComprehensiveData(html: string, url: string): any {
  const data: any = {}

  // 1. 基本情報
  data.title = extractTitle(html)
  data.productName = extractProductName(html)
  data.description = extractDescription(html)
  data.category = extractCategory(html)

  // 2. 価格情報（最重要）
  data.prices = extractAllPrices(html)

  // 3. 商品詳細
  data.features = extractFeatures(html)
  data.effects = extractEffects(html)
  data.ingredients = extractIngredients(html)

  // 4. 販売情報
  data.company = extractCompany(html)
  data.campaign = extractCampaign(html)
  data.guarantee = extractGuarantee(html)

  // 5. 信頼性情報
  data.authority = extractAuthority(html)
  data.testimonialCount = countTestimonials(html)

  // 6. メディア
  data.images = extractImages(html, url)

  // 7. 構造化データ
  data.structuredData = extractStructuredData(html)

  // 8. メタ情報
  data.ogTitle = extractOGTag(html, 'og:title')
  data.ogDescription = extractOGTag(html, 'og:description')
  data.ogImage = extractOGTag(html, 'og:image')

  return data
}

// タイトル抽出
function extractTitle(html: string): string {
  const patterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1].trim()
  }
  
  return ''
}

// 商品名抽出
function extractProductName(html: string): string {
  // 商品名らしきパターンを探す
  const patterns = [
    /<h1[^>]*class=["'][^"']*product[^"']*["'][^>]*>([^<]+)<\/h1>/i,
    /<[^>]+class=["'][^"']*product-name[^"']*["'][^>]*>([^<]+)<\/[^>]+>/i,
    /<[^>]+class=["'][^"']*item-name[^"']*["'][^>]*>([^<]+)<\/[^>]+>/i,
    /<[^>]+itemprop=["']name["'][^>]*>([^<]+)<\/[^>]+>/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1].trim()
  }
  
  // タイトルから推測
  const title = extractTitle(html)
  if (title) {
    // 余計な文字を削除
    const cleaned = title
      .split(/[|｜\-－]/)[0]
      .replace(/【.*?】/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/公式.*$/g, '')
      .replace(/通販.*$/g, '')
      .trim()
    
    return cleaned
  }
  
  return ''
}

// 説明文抽出
function extractDescription(html: string): string {
  const patterns = [
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  
  return ''
}

// カテゴリー抽出
function extractCategory(html: string): string {
  // パンくずリスト
  const breadcrumbPattern = /<[^>]*(?:breadcrumb|パンくず)[^>]*>([\s\S]*?)<\/[^>]+>/i
  const breadcrumbMatch = html.match(breadcrumbPattern)
  if (breadcrumbMatch) {
    const items = breadcrumbMatch[1].match(/>([^<]+)</g)
    if (items && items.length > 2) {
      return items[items.length - 2].replace(/[><]/g, '').trim()
    }
  }
  
  // カテゴリータグ
  const categoryPattern = /<[^>]+class=["'][^"']*category[^"']*["'][^>]*>([^<]+)<\/[^>]+>/i
  const categoryMatch = html.match(categoryPattern)
  if (categoryMatch) return categoryMatch[1].trim()
  
  return ''
}

// 全価格情報の抽出
function extractAllPrices(html: string): any {
  const priceData: any = {
    campaign: null,
    regular: null,
    subscription: null,
    all: []
  }
  
  // HTMLタグを除去してテキストのみにする
  const textOnly = html.replace(/<[^>]+>/g, ' ')
  
  // 価格パターンと優先度
  const patterns = [
    // 最優先：初回限定価格
    { type: 'campaign', regex: /初回限定[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 100 },
    { type: 'campaign', regex: /初回特別価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 99 },
    { type: 'campaign', regex: /初回のみ[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 98 },
    { type: 'campaign', regex: /初回[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 97 },
    
    // お試し・トライアル
    { type: 'campaign', regex: /お試し価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 90 },
    { type: 'campaign', regex: /トライアル価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 89 },
    { type: 'campaign', regex: /モニター価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 88 },
    
    // キャンペーン価格
    { type: 'campaign', regex: /今だけ[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 80 },
    { type: 'campaign', regex: /期間限定[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 79 },
    { type: 'campaign', regex: /特別価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 78 },
    { type: 'campaign', regex: /キャンペーン価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 77 },
    
    // 定期価格
    { type: 'subscription', regex: /定期初回[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 70 },
    { type: 'subscription', regex: /定期便価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 69 },
    { type: 'subscription', regex: /定期購入[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 68 },
    
    // 通常価格
    { type: 'regular', regex: /通常価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 50 },
    { type: 'regular', regex: /定価[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 49 },
    { type: 'regular', regex: /標準価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 48 },
    { type: 'regular', regex: /本体価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, priority: 47 },
    
    // 一般的な価格表記
    { type: 'generic', regex: /([¥￥][\d,]+)/g, priority: 10 },
    { type: 'generic', regex: /([\d,]+円)/g, priority: 9 }
  ]
  
  // 各パターンで価格を探す
  const foundPrices = []
  
  // まずHTMLから探す
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern.regex))
    for (const match of matches) {
      const priceAmount = match[1].replace(/[¥￥,]/g, '').trim()
      if (priceAmount && !isNaN(parseInt(priceAmount))) {
        foundPrices.push({
          type: pattern.type,
          amount: parseInt(priceAmount),
          text: match[0],
          priority: pattern.priority
        })
      }
    }
  }
  
  // 次にテキストのみから探す（HTMLで見つからなかった場合）
  if (foundPrices.length === 0) {
    for (const pattern of patterns) {
      const matches = Array.from(textOnly.matchAll(pattern.regex))
      for (const match of matches) {
        const priceAmount = match[1].replace(/[¥￥,]/g, '').trim()
        if (priceAmount && !isNaN(parseInt(priceAmount))) {
          foundPrices.push({
            type: pattern.type,
            amount: parseInt(priceAmount),
            text: match[0].trim(),
            priority: pattern.priority
          })
        }
      }
    }
  }
  
  // 優先度でソート
  foundPrices.sort((a, b) => b.priority - a.priority)
  
  // 重複を除去（同じ金額・同じタイプ）
  const uniquePrices = []
  const seen = new Set()
  
  for (const price of foundPrices) {
    const key = `${price.amount}-${price.type}`
    if (!seen.has(key)) {
      seen.add(key)
      uniquePrices.push(price)
    }
  }
  
  // タイプ別に振り分け
  for (const price of uniquePrices) {
    if (price.type === 'campaign' && !priceData.campaign) {
      priceData.campaign = price
    } else if (price.type === 'regular' && !priceData.regular) {
      priceData.regular = price
    } else if (price.type === 'subscription' && !priceData.subscription) {
      priceData.subscription = price
    }
    priceData.all.push(price)
  }
  
  return priceData
}

// 特徴抽出
function extractFeatures(html: string): string[] {
  const features = []
  
  // 特徴的なパターン
  const patterns = [
    /<li[^>]*>([^<]{10,200})<\/li>/gi,
    /<div[^>]+class=["'][^"']*feature[^"']*["'][^>]*>([^<]+)<\/div>/gi,
    /<div[^>]+class=["'][^"']*point[^"']*["'][^>]*>([^<]+)<\/div>/gi,
    /<span[^>]+class=["'][^"']*merit[^"']*["'][^>]*>([^<]+)<\/span>/gi,
    /[✓✔☑●]\s*([^<\n]{10,100})/gi
  ]
  
  const extracted = new Set<string>()
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern))
    for (const match of matches) {
      const text = match[1].trim()
      if (text && !text.includes('<') && text.length >= 10 && text.length <= 200) {
        extracted.add(text)
      }
    }
  }
  
  return Array.from(extracted).slice(0, 10)
}

// 効果抽出
function extractEffects(html: string): string[] {
  const effects = []
  const keywords = ['効果', '効能', '改善', '解消', 'ケア', 'サポート']
  
  // 効果に関する文章を探す
  const sentences = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || []
  
  for (const sentence of sentences) {
    const text = sentence.replace(/<[^>]+>/g, '').trim()
    if (keywords.some(kw => text.includes(kw)) && text.length < 150) {
      effects.push(text)
    }
  }
  
  return effects.slice(0, 5)
}

// 成分抽出
function extractIngredients(html: string): string[] {
  const ingredients = []
  
  const patterns = [
    /成分[\s：:]*([^<\n]+)/i,
    /配合成分[\s：:]*([^<\n]+)/i,
    /原材料[\s：:]*([^<\n]+)/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      const items = match[1].split(/[、,・]/).map(s => s.trim())
      ingredients.push(...items)
    }
  }
  
  return Array.from(new Set(ingredients)).slice(0, 10)
}

// 会社情報抽出
function extractCompany(html: string): string {
  const patterns = [
    /販売元[\s：:]*([^<\n]+)/i,
    /製造元[\s：:]*([^<\n]+)/i,
    /会社名[\s：:]*([^<\n]+)/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1].trim()
  }
  
  return ''
}

// キャンペーン情報抽出
function extractCampaign(html: string): string {
  const patterns = [
    /キャンペーン[^<]*?([^<]{10,100})/i,
    /期間限定[^<]*?([^<]{10,100})/i,
    /先着[\d,]+名[^<]*/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[0].trim()
  }
  
  return ''
}

// 保証情報抽出
function extractGuarantee(html: string): string {
  const patterns = [
    /(\d+日間)?返金保証/i,
    /(\d+日間)?返品保証/i,
    /満足保証/i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[0]
  }
  
  return ''
}

// 権威性抽出
function extractAuthority(html: string): string[] {
  const authority = []
  const patterns = [
    /医師監修/gi,
    /薬剤師監修/gi,
    /栄養士監修/gi,
    /特許[取得済]*/gi,
    /受賞[^<]{0,50}/gi,
    /ランキング.*?1位/gi
  ]
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern))
    for (const match of matches) {
      authority.push(match[0])
    }
  }
  
  return Array.from(new Set(authority))
}

// お客様の声カウント
function countTestimonials(html: string): number {
  const patterns = [/お客様の声/gi, /口コミ/gi, /レビュー/gi, /体験談/gi]
  let count = 0
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern))
    count += matches.length
  }
  
  return count
}

// 画像抽出
function extractImages(html: string, baseUrl: string): string[] {
  const images = []
  const pattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  const matches = Array.from(html.matchAll(pattern))
  
  for (const match of matches.slice(0, 10)) {
    let src = match[1]
    
    if (!src.startsWith('http')) {
      try {
        src = new URL(src, baseUrl).href
      } catch {
        continue
      }
    }
    
    if (src.match(/\.(jpg|jpeg|png|webp)$/i)) {
      images.push(src)
    }
  }
  
  return Array.from(new Set(images)).slice(0, 5)
}

// 構造化データ抽出
function extractStructuredData(html: string): any[] {
  const data = []
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi
  const matches = Array.from(html.matchAll(pattern))
  
  for (const match of matches) {
    try {
      data.push(JSON.parse(match[1]))
    } catch {}
  }
  
  return data
}

// OGタグ抽出
function extractOGTag(html: string, property: string): string {
  const regex = new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i')
  const match = html.match(regex)
  return match ? match[1] : ''
}