export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    console.log('遅延付きスクレイピング開始:', url)

    // 複数回の取得試行
    const attempts = [
      { delay: 0, description: '即時取得' },
      { delay: 2000, description: '2秒待機後' },
      { delay: 5000, description: '5秒待機後' }
    ]

    let bestResult = null
    let bestScore = 0

    for (const attempt of attempts) {
      try {
        // 待機
        if (attempt.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, attempt.delay))
        }

        // フェッチ実行
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })

        if (!response.ok) {
          console.error(`取得失敗 (${attempt.description}):`, response.status)
          continue
        }

        const html = await response.text()
        console.log(`HTML取得成功 (${attempt.description}):`, html.length, 'bytes')

        // データ抽出
        const extractedData = extractDataWithPatternMatching(html, url)
        
        // スコア計算（価格情報の完全性）
        const score = calculateDataScore(extractedData)
        console.log(`データスコア (${attempt.description}):`, score)

        if (score > bestScore) {
          bestScore = score
          bestResult = extractedData
        }

        // 十分なデータが取得できたら終了
        if (score >= 80) {
          break
        }

      } catch (error) {
        console.error(`エラー (${attempt.description}):`, error)
        continue
      }
    }

    if (!bestResult) {
      throw new Error('すべての取得試行が失敗しました')
    }

    return Response.json({
      ...bestResult,
      debug: {
        score: bestScore,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('遅延スクレイピングエラー:', error)
    return Response.json({
      error: 'Delayed scraping failed',
      message: error.message
    }, { status: 500 })
  }
}

// パターンマッチングによるデータ抽出
function extractDataWithPatternMatching(html: string, url: string): any {
  // HTMLタグを除去してテキストを抽出
  const textContent = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // scriptタグ除去
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // styleタグ除去
    .replace(/<[^>]+>/g, ' ') // その他のタグ除去
    .replace(/\s+/g, ' ') // 連続する空白を1つに
    .trim()

  const data: any = {
    title: extractTitle(html),
    description: extractDescription(html),
    prices: extractAllPrices(html, textContent),
    features: extractFeatures(html, textContent),
    images: extractImages(html, url),
    category: extractCategory(html, textContent),
    company: extractCompany(textContent),
    campaign: extractCampaign(textContent),
    authority: extractAuthority(textContent),
    structuredData: extractStructuredData(html)
  }

  // 最適な価格を選択
  data.price = selectBestPrice(data.prices)

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

// 価格の包括的抽出
function extractAllPrices(html: string, textContent: string): any[] {
  const prices: any[] = []
  
  // 価格パターンのリスト（優先順位順）
  const pricePatterns = [
    // 初回限定価格
    { pattern: /初回限定[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'campaign', priority: 100 },
    { pattern: /初回特別価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'campaign', priority: 99 },
    { pattern: /初回のみ[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'campaign', priority: 98 },
    { pattern: /初回[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'campaign', priority: 97 },
    
    // お試し価格
    { pattern: /お試し価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'trial', priority: 90 },
    { pattern: /トライアル価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'trial', priority: 89 },
    { pattern: /モニター価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'trial', priority: 88 },
    
    // キャンペーン価格
    { pattern: /今だけ[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'campaign', priority: 80 },
    { pattern: /期間限定[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'campaign', priority: 79 },
    { pattern: /特別価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'campaign', priority: 78 },
    
    // 定期価格
    { pattern: /定期初回[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'subscription', priority: 70 },
    { pattern: /定期便[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'subscription', priority: 69 },
    
    // 通常価格
    { pattern: /通常価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'regular', priority: 50 },
    { pattern: /定価[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'regular', priority: 49 },
    { pattern: /本体価格[\s：:]*([¥￥]?[\d,]+)\s*円/g, type: 'regular', priority: 48 },
    
    // 一般的な価格
    { pattern: /([¥￥][\d,]+)/g, type: 'generic', priority: 10 },
    { pattern: /([\d,]+円)/g, type: 'generic', priority: 9 }
  ]

  // HTMLから価格を探す
  for (const { pattern, type, priority } of pricePatterns) {
    const matches = Array.from(html.matchAll(pattern))
    for (const match of matches) {
      const amount = match[1].replace(/[¥￥,]/g, '')
      if (amount && !isNaN(parseInt(amount))) {
        prices.push({
          type,
          amount: parseInt(amount),
          text: match[0],
          priority,
          source: 'html'
        })
      }
    }
  }

  // テキストコンテンツからも探す（HTMLで見つからない場合）
  for (const { pattern, type, priority } of pricePatterns) {
    const matches = Array.from(textContent.matchAll(pattern))
    for (const match of matches) {
      const amount = match[1].replace(/[¥￥,]/g, '')
      if (amount && !isNaN(parseInt(amount))) {
        // 既に同じ金額・同じタイプがあるかチェック
        const exists = prices.some(p => p.amount === parseInt(amount) && p.type === type)
        if (!exists) {
          prices.push({
            type,
            amount: parseInt(amount),
            text: match[0].trim(),
            priority: priority - 5, // テキストからの抽出は優先度を少し下げる
            source: 'text'
          })
        }
      }
    }
  }

  // 優先度でソート
  prices.sort((a, b) => b.priority - a.priority)

  return prices
}

// 最適な価格を選択
function selectBestPrice(prices: any[]): string {
  if (!prices || prices.length === 0) return ''

  // キャンペーン価格と通常価格を探す
  const campaignPrice = prices.find(p => p.type === 'campaign' || p.type === 'trial')
  const regularPrice = prices.find(p => p.type === 'regular')

  if (campaignPrice && regularPrice) {
    // 割引率を計算
    const discountRate = Math.round((1 - campaignPrice.amount / regularPrice.amount) * 100)
    return `通常価格: ${regularPrice.amount.toLocaleString()}円 → ${campaignPrice.text}（${discountRate}%OFF）`
  }

  if (campaignPrice) {
    return campaignPrice.text
  }

  if (regularPrice) {
    return `価格: ${regularPrice.amount.toLocaleString()}円`
  }

  // その他の価格
  if (prices.length > 0) {
    return `価格: ${prices[0].amount.toLocaleString()}円`
  }

  return ''
}

// 特徴抽出
function extractFeatures(html: string, textContent: string): string[] {
  const features: string[] = []
  
  // HTMLから特徴を抽出
  const htmlPatterns = [
    /<li[^>]*>([^<]{20,200})<\/li>/gi,
    /<div[^>]+class=["'][^"']*feature[^"']*["'][^>]*>([^<]+)<\/div>/gi,
    /<div[^>]+class=["'][^"']*point[^"']*["'][^>]*>([^<]+)<\/div>/gi
  ]
  
  for (const pattern of htmlPatterns) {
    const matches = Array.from(html.matchAll(pattern))
    for (const match of matches) {
      const text = match[1].trim()
      if (text && !features.includes(text)) {
        features.push(text)
      }
    }
  }
  
  // テキストから特徴的な文を抽出
  const sentences = textContent.split(/[。！？\n]/)
  for (const sentence of sentences) {
    if (sentence.length >= 20 && sentence.length <= 200) {
      if (sentence.includes('特徴') || sentence.includes('ポイント') || 
          sentence.includes('こだわり') || sentence.includes('配合')) {
        if (!features.includes(sentence.trim())) {
          features.push(sentence.trim())
        }
      }
    }
  }
  
  return features.slice(0, 10)
}

// 画像抽出
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
  
  for (const match of matches) {
    let src = match[1]
    
    if (!src.startsWith('http')) {
      try {
        src = new URL(src, baseUrl).href
      } catch {
        continue
      }
    }
    
    // 商品画像の可能性が高いものを優先
    const img = match[0]
    if (img.includes('product') || img.includes('item') || 
        img.includes('main') || src.includes('product')) {
      images.unshift(src) // 先頭に追加
    } else {
      images.push(src)
    }
  }
  
  return [...new Set(images)].slice(0, 5)
}

// カテゴリー抽出
function extractCategory(html: string, textContent: string): string {
  // パンくずリストから
  const breadcrumbMatch = html.match(/<[^>]*breadcrumb[^>]*>([\s\S]*?)<\/[^>]+>/i)
  if (breadcrumbMatch) {
    const items = breadcrumbMatch[1].match(/>([^<]+)</g)
    if (items && items.length > 2) {
      return items[items.length - 2].replace(/[><]/g, '').trim()
    }
  }
  
  // カテゴリータグから
  const categoryMatch = html.match(/<[^>]+class=["'][^"']*category[^"']*["'][^>]*>([^<]+)<\/[^>]+>/i)
  if (categoryMatch) {
    return categoryMatch[1].trim()
  }
  
  // テキストから推測
  if (textContent.includes('サプリメント')) return '健康食品・サプリメント'
  if (textContent.includes('化粧品') || textContent.includes('コスメ')) return '化粧品・美容'
  if (textContent.includes('ダイエット')) return 'ダイエット・健康'
  
  return ''
}

// 会社名抽出
function extractCompany(textContent: string): string {
  const patterns = [
    /販売元[\s：:]*([^\n]+)/,
    /製造元[\s：:]*([^\n]+)/,
    /会社名[\s：:]*([^\n]+)/
  ]
  
  for (const pattern of patterns) {
    const match = textContent.match(pattern)
    if (match) return match[1].trim()
  }
  
  return ''
}

// キャンペーン情報抽出
function extractCampaign(textContent: string): string {
  const patterns = [
    /キャンペーン[^。！\n]*[。！\n]/,
    /期間限定[^。！\n]*[。！\n]/,
    /先着[\d,]+名[^。！\n]*/
  ]
  
  for (const pattern of patterns) {
    const match = textContent.match(pattern)
    if (match) return match[0].trim()
  }
  
  return ''
}

// 権威性抽出
function extractAuthority(textContent: string): string[] {
  const authority: string[] = []
  const patterns = [
    /医師監修/g,
    /薬剤師監修/g,
    /栄養士監修/g,
    /特許[取得済]*/g,
    /受賞[^。\n]{0,50}/g,
    /ランキング.*?[1１]位/g
  ]
  
  for (const pattern of patterns) {
    const matches = textContent.matchAll(pattern)
    for (const match of matches) {
      if (!authority.includes(match[0])) {
        authority.push(match[0])
      }
    }
  }
  
  return authority
}

// 構造化データ抽出
function extractStructuredData(html: string): any[] {
  const data: any[] = []
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi)
  
  for (const match of matches) {
    try {
      const json = JSON.parse(match[1])
      data.push(json)
    } catch {}
  }
  
  return data
}

// データスコア計算
function calculateDataScore(data: any): number {
  let score = 0
  
  // 価格情報のスコア（最重要）
  if (data.prices && data.prices.length > 0) {
    const hasCampaign = data.prices.some((p: any) => p.type === 'campaign' || p.type === 'trial')
    const hasRegular = data.prices.some((p: any) => p.type === 'regular')
    
    if (hasCampaign) score += 40
    if (hasRegular) score += 20
    if (hasCampaign && hasRegular) score += 10 // 両方ある場合はボーナス
  }
  
  // その他の情報
  if (data.title) score += 5
  if (data.description) score += 5
  if (data.features && data.features.length > 0) score += 10
  if (data.images && data.images.length > 0) score += 5
  if (data.category) score += 5
  
  return score
}