import { ScrapedData } from './scraper-simple'

// 無料で使える高精度スクレイピング
export class FreeEnhancedScraper {
  // 日本のLPでよく使われる価格表示パターン
  private readonly PRICE_PATTERNS = {
    // 初回価格パターン（最優先）
    initialPrice: [
      /初回限定[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /初回特別価格[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /初回のみ[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /初回[\s\S]{0,5}([¥￥]?[\d,]+円)/,
      /はじめての方限定[\s\S]{0,10}([¥￥]?[\d,]+円)/
    ],
    
    // お試し価格パターン
    trialPrice: [
      /お試し価格[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /トライアル[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /モニター価格[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /お試し[\s\S]{0,5}([¥￥]?[\d,]+円)/,
      /体験価格[\s\S]{0,10}([¥￥]?[\d,]+円)/
    ],
    
    // キャンペーン価格パターン
    campaignPrice: [
      /今だけ[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /期間限定[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /特別価格[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /キャンペーン価格[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /限定価格[\s\S]{0,10}([¥￥]?[\d,]+円)/
    ],
    
    // 定期購入パターン
    subscriptionPrice: [
      /定期初回[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /定期便初回[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /定期コース[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /定期特別価格[\s\S]{0,10}([¥￥]?[\d,]+円)/
    ],
    
    // 通常価格パターン
    regularPrice: [
      /通常価格[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /定価[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /標準価格[\s\S]{0,10}([¥￥]?[\d,]+円)/,
      /メーカー希望小売価格[\s\S]{0,10}([¥￥]?[\d,]+円)/
    ],
    
    // 割引表示
    discount: [
      /(\d+)[%％]\s*OFF/,
      /(\d+)[%％]\s*オフ/,
      /(\d+)割引/,
      /半額/
    ]
  }

  async scrapeUrl(url: string): Promise<ScrapedData> {
    console.log('無料高精度スクレイピング開始:', url)
    
    try {
      // 1. Edge Functionで詳細スクレイピング
      const edgeData = await this.enhancedEdgeScrape(url)
      
      // 2. 無料プロキシ経由でバックアップ取得
      const proxyData = await this.scrapeViaFreeProxy(url)
      
      // 3. データを統合
      return this.mergeAndEnhanceData(edgeData, proxyData, url)
      
    } catch (error) {
      console.error('スクレイピングエラー:', error)
      // URLパターンから推測
      return this.inferDataFromUrl(url)
    }
  }

  // 強化されたEdge Function スクレイピング
  private async enhancedEdgeScrape(url: string): Promise<any> {
    const response = await fetch('/api/edge-scrape-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url,
        options: {
          extractPrices: true,
          extractImages: true,
          extractFeatures: true,
          extractStructuredData: true
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Edge scraping failed: ${response.status}`)
    }

    return await response.json()
  }

  // 無料プロキシ経由でのスクレイピング
  private async scrapeViaFreeProxy(url: string): Promise<any> {
    // 無料のCORSプロキシサービスを使用
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`,
      `https://cors.bridged.cc/${url}`,
      `https://cors-proxy.htmldriven.com/?url=${url}`
    ]

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          const html = await response.text()
          return this.parseHTMLContent(html)
        }
      } catch (error) {
        continue // 次のプロキシを試す
      }
    }

    return null
  }

  // HTMLコンテンツの解析
  private parseHTMLContent(html: string): any {
    const data: any = {
      prices: [],
      features: [],
      images: []
    }

    // タイトル抽出
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    data.title = titleMatch ? titleMatch[1].trim() : ''

    // 価格抽出（全パターンを試行）
    for (const [type, patterns] of Object.entries(this.PRICE_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = html.matchAll(new RegExp(pattern, 'gi'))
        for (const match of matches) {
          data.prices.push({
            type,
            price: match[1] || match[0],
            context: match[0],
            index: match.index
          })
        }
      }
    }

    // メタ情報
    const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    data.description = metaDesc ? metaDesc[1] : ''

    // OGP情報
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    data.ogTitle = ogTitle ? ogTitle[1] : ''
    data.ogDescription = ogDesc ? ogDesc[1] : ''

    // 構造化データ
    const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi)
    data.structuredData = []
    for (const match of jsonLdMatches) {
      try {
        data.structuredData.push(JSON.parse(match[1]))
      } catch {}
    }

    // 特徴抽出（リスト項目）
    const featurePatterns = [
      /<li[^>]*>([^<]{10,100})<\/li>/gi,
      /<div[^>]+class=["'][^"']*feature[^"']*["'][^>]*>([^<]+)<\/div>/gi,
      /<p[^>]+class=["'][^"']*point[^"']*["'][^>]*>([^<]+)<\/p>/gi
    ]

    for (const pattern of featurePatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const text = match[1].trim()
        if (!text.includes('<') && !text.includes('>')) {
          data.features.push(text)
        }
      }
    }

    return data
  }

  // データの統合と強化
  private mergeAndEnhanceData(edgeData: any, proxyData: any, url: string): ScrapedData {
    // 価格情報の統合と最適化
    const allPrices = [
      ...(edgeData?.prices || []),
      ...(proxyData?.prices || [])
    ]

    const priceInfo = this.selectBestPrice(allPrices)
    
    // 特徴の統合（重複排除）
    const allFeatures = [
      ...(edgeData?.features || []),
      ...(proxyData?.features || [])
    ]
    const uniqueFeatures = [...new Set(allFeatures)]

    // カテゴリー推測
    const category = this.inferCategory(edgeData, proxyData, url)

    return {
      title: edgeData?.title || proxyData?.title || this.extractDomainName(url),
      description: edgeData?.description || proxyData?.description || '',
      price: this.formatPriceDisplay(priceInfo),
      images: [...new Set([...(edgeData?.images || []), ...(proxyData?.images || [])])],
      features: this.prioritizeFeatures(uniqueFeatures, priceInfo),
      category,
      metaDescription: edgeData?.description || proxyData?.description || '',
      ogTitle: edgeData?.ogTitle || proxyData?.ogTitle || '',
      ogDescription: edgeData?.ogDescription || proxyData?.ogDescription || '',
      structuredData: this.mergeStructuredData(edgeData?.structuredData, proxyData?.structuredData),
      url
    }
  }

  // 最適な価格を選択
  private selectBestPrice(prices: any[]): any {
    if (!prices || prices.length === 0) return null

    // 優先順位でソート
    const priorityOrder = ['initialPrice', 'trialPrice', 'campaignPrice', 'subscriptionPrice', 'regularPrice']
    
    prices.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.type)
      const bIndex = priorityOrder.indexOf(b.type)
      return aIndex - bIndex
    })

    // キャンペーン価格と通常価格のペアを探す
    const campaignPrice = prices.find(p => ['initialPrice', 'trialPrice', 'campaignPrice'].includes(p.type))
    const regularPrice = prices.find(p => p.type === 'regularPrice')

    return {
      campaign: campaignPrice,
      regular: regularPrice,
      all: prices
    }
  }

  // 価格表示のフォーマット
  private formatPriceDisplay(priceInfo: any): string {
    if (!priceInfo) return ''

    if (priceInfo.campaign && priceInfo.regular) {
      // 割引率を計算
      const campaignNum = this.extractPriceNumber(priceInfo.campaign.price)
      const regularNum = this.extractPriceNumber(priceInfo.regular.price)
      
      if (campaignNum && regularNum && regularNum > campaignNum) {
        const discountRate = Math.round((1 - campaignNum / regularNum) * 100)
        return `通常価格: ${priceInfo.regular.price} → ${priceInfo.campaign.context}（${discountRate}%OFF）`
      }
    }

    if (priceInfo.campaign) {
      return priceInfo.campaign.context
    }

    if (priceInfo.regular) {
      return priceInfo.regular.price
    }

    return priceInfo.all?.[0]?.price || ''
  }

  // 価格から数値を抽出
  private extractPriceNumber(priceStr: string): number | null {
    const match = priceStr.match(/[\d,]+/)
    if (match) {
      return parseInt(match[0].replace(/,/g, ''))
    }
    return null
  }

  // 特徴の優先順位付け
  private prioritizeFeatures(features: string[], priceInfo: any): string[] {
    const prioritized: string[] = []

    // 価格関連の特徴を最優先
    if (priceInfo?.campaign) {
      prioritized.push(`💰 ${priceInfo.campaign.context}`)
    }

    // 割引情報
    const discountFeature = features.find(f => /\d+[%％]OFF/.test(f))
    if (discountFeature) {
      prioritized.push(`🏷️ ${discountFeature}`)
    }

    // その他の特徴
    const otherFeatures = features
      .filter(f => !prioritized.includes(f))
      .filter(f => f.length > 5 && f.length < 100)
      .slice(0, 8)

    return [...prioritized, ...otherFeatures]
  }

  // カテゴリー推測
  private inferCategory(edgeData: any, proxyData: any, url: string): string {
    // 構造化データから
    const structuredData = edgeData?.structuredData || proxyData?.structuredData
    if (structuredData && Array.isArray(structuredData)) {
      for (const data of structuredData) {
        if (data?.category) return data.category
        if (data?.['@type'] === 'Product' && data?.category) return data.category
      }
    }

    // URLから推測
    const urlLower = url.toLowerCase()
    if (urlLower.includes('supplement') || urlLower.includes('sapuri')) return '健康食品・サプリメント'
    if (urlLower.includes('cosme') || urlLower.includes('beauty')) return '化粧品・美容'
    if (urlLower.includes('diet')) return 'ダイエット・健康'
    if (urlLower.includes('food')) return '食品・飲料'

    return ''
  }

  // URLから推測（最終手段）
  private inferDataFromUrl(url: string): ScrapedData {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    
    // ドメイン名から推測
    let category = ''
    let estimatedPrice = ''
    
    if (domain.includes('supplement') || domain.includes('health')) {
      category = '健康食品・サプリメント'
      estimatedPrice = '初回限定980円（推定）'
    } else if (domain.includes('cosme') || domain.includes('beauty')) {
      category = '化粧品・美容'
      estimatedPrice = '初回限定1,980円（推定）'
    }

    return {
      title: `${domain} - 商品ページ`,
      description: 'URLから推測した情報です。実際の価格はLPをご確認ください。',
      price: estimatedPrice,
      images: [],
      features: ['詳細情報を取得中...', estimatedPrice ? `推定価格: ${estimatedPrice}` : ''],
      category,
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      structuredData: null,
      url
    }
  }

  // ドメイン名抽出
  private extractDomainName(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return 'Unknown'
    }
  }

  // 構造化データの統合
  private mergeStructuredData(data1: any, data2: any): any {
    if (!data1 && !data2) return null
    if (!data1) return data2
    if (!data2) return data1
    
    // 両方ある場合は配列として統合
    const merged = []
    if (Array.isArray(data1)) merged.push(...data1)
    else merged.push(data1)
    
    if (Array.isArray(data2)) merged.push(...data2)
    else merged.push(data2)
    
    return merged
  }
}