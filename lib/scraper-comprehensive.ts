// 包括的なLPデータ取得スクレイパー
import { ScrapedData } from './scraper-simple'

export class ComprehensiveScraper {
  async scrapeUrl(url: string): Promise<ScrapedData> {
    console.log('包括的スクレイピング開始:', url)
    
    try {
      // 複数の手法で並列スクレイピング
      const [edgeResult, proxyResult] = await Promise.allSettled([
        this.scrapeWithEnhancedEdge(url),
        this.scrapeWithMultipleProxies(url)
      ])
      
      // 成功した結果を統合
      const results = []
      if (edgeResult.status === 'fulfilled') results.push(edgeResult.value)
      if (proxyResult.status === 'fulfilled') results.push(proxyResult.value)
      
      if (results.length === 0) {
        throw new Error('すべてのスクレイピング手法が失敗しました')
      }
      
      // 最も完全なデータを作成
      return this.mergeAndValidateData(results, url)
    } catch (error) {
      console.error('包括的スクレイピングエラー:', error)
      throw error
    }
  }

  // 強化版Edge Functionスクレイピング
  private async scrapeWithEnhancedEdge(url: string): Promise<any> {
    const response = await fetch('/api/comprehensive-scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      throw new Error(`Edge scraping failed: ${response.status}`)
    }

    return await response.json()
  }

  // 複数プロキシでのスクレイピング
  private async scrapeWithMultipleProxies(url: string): Promise<any> {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://thingproxy.freeboard.io/fetch/${url}`,
      `https://cors-proxy.htmldriven.com/?url=${url}`,
      `https://yacdn.org/proxy/${url}`
    ]

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml'
          }
        })
        
        if (response.ok) {
          const html = await response.text()
          return this.extractAllDataFromHTML(html, url)
        }
      } catch (error) {
        continue
      }
    }

    throw new Error('All proxy attempts failed')
  }

  // HTMLから全データを抽出
  private extractAllDataFromHTML(html: string, url: string): any {
    const data: any = {
      // 基本情報
      title: this.extractTitle(html),
      description: this.extractDescription(html),
      
      // 価格情報（最重要）
      prices: this.extractAllPrices(html),
      
      // 商品情報
      productName: this.extractProductName(html),
      category: this.extractCategory(html),
      features: this.extractFeatures(html),
      effects: this.extractEffects(html),
      ingredients: this.extractIngredients(html),
      
      // 販売情報
      company: this.extractCompany(html),
      campaign: this.extractCampaign(html),
      guarantee: this.extractGuarantee(html),
      
      // メディア
      images: this.extractImages(html, url),
      
      // 構造化データ
      structuredData: this.extractStructuredData(html),
      
      // 信頼性情報
      authority: this.extractAuthority(html),
      testimonials: this.extractTestimonials(html),
      
      // その他
      url: url
    }

    return data
  }

  // タイトル抽出（複数手法）
  private extractTitle(html: string): string {
    // 1. titleタグ
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) return titleMatch[1].trim()
    
    // 2. h1タグ
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match) return h1Match[1].trim()
    
    // 3. OGタイトル
    const ogMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    if (ogMatch) return ogMatch[1].trim()
    
    return ''
  }

  // 商品名の抽出
  private extractProductName(html: string): string {
    // 商品名特有のパターン
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

    // タイトルから商品名を推測
    const title = this.extractTitle(html)
    if (title) {
      // 「公式」「通販」などを除去
      return title.replace(/[|｜\-－【】\[\]].*/g, '').trim()
    }

    return ''
  }

  // 価格の包括的抽出
  private extractAllPrices(html: string): any {
    const priceData: any = {
      campaign: null,
      regular: null,
      subscription: null,
      all: []
    }

    // 価格パターン（優先順位順）
    const patterns = [
      // 初回限定価格
      {
        type: 'campaign',
        regex: /初回限定[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 10
      },
      {
        type: 'campaign',
        regex: /初回[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 9
      },
      {
        type: 'campaign',
        regex: /お試し[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 8
      },
      {
        type: 'campaign',
        regex: /トライアル[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 8
      },
      {
        type: 'campaign',
        regex: /今だけ[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 7
      },
      {
        type: 'campaign',
        regex: /期間限定[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 7
      },
      {
        type: 'campaign',
        regex: /特別価格[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 6
      },
      
      // 定期価格
      {
        type: 'subscription',
        regex: /定期[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 5
      },
      
      // 通常価格
      {
        type: 'regular',
        regex: /通常価格[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 4
      },
      {
        type: 'regular',
        regex: /定価[^<]*?([¥￥]?[\d,]+)\s*円/gi,
        priority: 3
      },
      
      // 一般的な価格表記
      {
        type: 'generic',
        regex: /([¥￥][\d,]+)/g,
        priority: 1
      },
      {
        type: 'generic',
        regex: /([\d,]+円)/g,
        priority: 1
      }
    ]

    // 各パターンで価格を探す
    const foundPrices = []
    for (const pattern of patterns) {
      const matches = Array.from(html.matchAll(pattern.regex))
      for (const match of matches) {
        const priceText = match[1] || match[0]
        const position = match.index || 0
        
        foundPrices.push({
          type: pattern.type,
          price: priceText.replace(/[¥￥]/g, '').trim(),
          fullMatch: match[0],
          position,
          priority: pattern.priority
        })
      }
    }

    // 重複を除去し、優先順位でソート
    const uniquePrices = this.deduplicatePrices(foundPrices)
    uniquePrices.sort((a, b) => b.priority - a.priority)

    // タイプ別に分類
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

  // 価格の重複除去
  private deduplicatePrices(prices: any[]): any[] {
    const unique = []
    const seen = new Set()

    for (const price of prices) {
      const key = `${price.price}-${price.type}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(price)
      }
    }

    return unique
  }

  // カテゴリー抽出
  private extractCategory(html: string): string {
    // パンくずリストから
    const breadcrumbPattern = /<nav[^>]*breadcrumb[^>]*>([\s\S]*?)<\/nav>/i
    const breadcrumbMatch = html.match(breadcrumbPattern)
    if (breadcrumbMatch) {
      const items = breadcrumbMatch[1].match(/>([^<]+)</g)
      if (items && items.length > 2) {
        return items[items.length - 2].replace(/[><]/g, '').trim()
      }
    }

    // カテゴリー関連のクラスから
    const categoryPattern = /<[^>]+class=["'][^"']*category[^"']*["'][^>]*>([^<]+)<\/[^>]+>/i
    const categoryMatch = html.match(categoryPattern)
    if (categoryMatch) {
      return categoryMatch[1].trim()
    }

    // 構造化データから
    const structuredData = this.extractStructuredData(html)
    if (structuredData && Array.isArray(structuredData)) {
      for (const data of structuredData) {
        if (data.category) return data.category
      }
    }

    return ''
  }

  // 特徴の抽出
  private extractFeatures(html: string): string[] {
    const features: string[] = []
    
    // 特徴的なリスト項目
    const patterns = [
      /<li[^>]*>([^<]{10,200})<\/li>/gi,
      /<div[^>]+class=["'][^"']*feature[^"']*["'][^>]*>([^<]+)<\/div>/gi,
      /<div[^>]+class=["'][^"']*point[^"']*["'][^>]*>([^<]+)<\/div>/gi,
      /<span[^>]+class=["'][^"']*merit[^"']*["'][^>]*>([^<]+)<\/span>/gi,
      /[✓✔☑]\s*([^<\n]{10,100})/gi
    ]

    for (const pattern of patterns) {
      const matches = Array.from(html.matchAll(pattern))
      for (const match of matches.slice(0, 20)) {
        const text = match[1].trim()
        if (text && !text.includes('<') && !features.includes(text)) {
          features.push(text)
        }
      }
    }

    return features.slice(0, 10)
  }

  // 効果の抽出
  private extractEffects(html: string): string[] {
    const effects = []
    
    // 効果・効能に関するキーワード
    const effectKeywords = ['効果', '効能', '改善', '解消', 'ケア', 'サポート', '向上']
    
    // テキスト全体から効果を探す
    const textBlocks = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || []
    
    for (const block of textBlocks) {
      const text = block.replace(/<[^>]+>/g, '').trim()
      if (effectKeywords.some(keyword => text.includes(keyword)) && text.length < 100) {
        effects.push(text)
      }
    }

    return effects.slice(0, 5)
  }

  // 成分の抽出
  private extractIngredients(html: string): string[] {
    const ingredients = []
    
    // 成分表示のパターン
    const patterns = [
      /成分[：:]\s*([^<\n]+)/gi,
      /配合成分[：:]\s*([^<\n]+)/gi,
      /原材料[：:]\s*([^<\n]+)/gi
    ]

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const text = match[1].trim()
        if (text) {
          // カンマや・で区切られた成分を分割
          const items = text.split(/[、,・]/).map(s => s.trim())
          ingredients.push(...items)
        }
      }
    }

    return [...new Set(ingredients)].slice(0, 10)
  }

  // 会社情報の抽出
  private extractCompany(html: string): string {
    const patterns = [
      /販売元[：:]\s*([^<\n]+)/i,
      /製造元[：:]\s*([^<\n]+)/i,
      /会社名[：:]\s*([^<\n]+)/i,
      /<[^>]+class=["'][^"']*company[^"']*["'][^>]*>([^<]+)<\/[^>]+>/i
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) return match[1].trim()
    }

    return ''
  }

  // キャンペーン情報の抽出
  private extractCampaign(html: string): string {
    const patterns = [
      /キャンペーン[^<]*?([^<]{10,100})/i,
      /期間限定[^<]*?([^<]{10,100})/i,
      /今だけ[^<]*?([^<]{10,100})/i,
      /先着[^<]*?([^<]{10,100})/i
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) return match[0].trim()
    }

    return ''
  }

  // 保証情報の抽出
  private extractGuarantee(html: string): string {
    const patterns = [
      /返金保証[^<]*?([^<]{0,50})/i,
      /返品保証[^<]*?([^<]{0,50})/i,
      /満足保証[^<]*?([^<]{0,50})/i,
      /(\d+日間)返金保証/i
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) return match[0].trim()
    }

    return ''
  }

  // 権威性の抽出
  private extractAuthority(html: string): string[] {
    const authority = []
    
    const patterns = [
      /医師監修/gi,
      /薬剤師監修/gi,
      /栄養士監修/gi,
      /専門家監修/gi,
      /特許[取得済]*[^<]{0,20}/gi,
      /受賞[^<]{0,50}/gi,
      /ランキング[^<]*?1位/gi
    ]

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        authority.push(match[0].trim())
      }
    }

    return [...new Set(authority)]
  }

  // お客様の声の抽出
  private extractTestimonials(html: string): number {
    // お客様の声の数をカウント
    const patterns = [
      /お客様の声/gi,
      /口コミ/gi,
      /レビュー/gi,
      /体験談/gi
    ]

    let count = 0
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern)
      count += Array.from(matches).length
    }

    return count
  }

  // 説明文の抽出
  private extractDescription(html: string): string {
    const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    if (metaDesc) return metaDesc[1]

    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    if (ogDesc) return ogDesc[1]

    return ''
  }

  // 画像の抽出
  private extractImages(html: string, baseUrl: string): string[] {
    const images = []
    const imagePattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    const matches = Array.from(html.matchAll(imagePattern))
    
    for (const match of matches.slice(0, 10)) {
      let src = match[1]
      
      // 相対URLを絶対URLに変換
      if (!src.startsWith('http')) {
        try {
          src = new URL(src, baseUrl).href
        } catch {
          continue
        }
      }
      
      // 商品画像の可能性が高いものを優先
      if (src.match(/product|item|main|hero|feature/i) || 
          src.match(/\.(jpg|jpeg|png|webp)$/i)) {
        images.push(src)
      }
    }
    
    return [...new Set(images)].slice(0, 5)
  }

  // 構造化データの抽出
  private extractStructuredData(html: string): any[] {
    const structuredData = []
    const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi
    const matches = Array.from(html.matchAll(pattern))
    
    for (const match of matches) {
      try {
        const json = JSON.parse(match[1])
        structuredData.push(json)
      } catch {}
    }
    
    return structuredData
  }

  // データの統合と検証
  private mergeAndValidateData(results: any[], url: string): ScrapedData {
    // 最も完全なデータを選択
    let bestData = results[0]
    let bestScore = 0

    for (const data of results) {
      const score = this.calculateDataCompleteness(data)
      if (score > bestScore) {
        bestScore = score
        bestData = data
      }
    }

    // 価格情報の整形
    const priceInfo = this.formatPriceInfo(bestData.prices)

    // 必須フィールドの検証と整形
    return {
      title: bestData.productName || bestData.title || '',
      description: bestData.description || '',
      price: priceInfo,
      images: bestData.images || [],
      features: bestData.features || [],
      category: bestData.category || '',
      metaDescription: bestData.description || '',
      ogTitle: bestData.title || '',
      ogDescription: bestData.description || '',
      structuredData: bestData.structuredData || null,
      url: url,
      
      // 追加情報
      additionalData: {
        effects: bestData.effects || [],
        ingredients: bestData.ingredients || [],
        company: bestData.company || '',
        campaign: bestData.campaign || '',
        guarantee: bestData.guarantee || '',
        authority: bestData.authority || [],
        testimonialCount: bestData.testimonials || 0
      }
    }
  }

  // データ完全性スコアの計算
  private calculateDataCompleteness(data: any): number {
    let score = 0

    // 価格情報の重要度最大
    if (data.prices?.campaign) score += 30
    if (data.prices?.regular) score += 20
    
    // その他の重要フィールド
    if (data.productName) score += 15
    if (data.category) score += 10
    if (data.features?.length > 0) score += 10
    if (data.effects?.length > 0) score += 5
    if (data.authority?.length > 0) score += 5
    if (data.images?.length > 0) score += 5

    return score
  }

  // 価格情報のフォーマット
  private formatPriceInfo(prices: any): string {
    if (!prices) return ''

    // キャンペーン価格と通常価格の両方がある場合
    if (prices.campaign && prices.regular) {
      const campaignPrice = prices.campaign.price + '円'
      const regularPrice = prices.regular.price + '円'
      
      // 割引率を計算
      const campaign = parseInt(prices.campaign.price.replace(/,/g, ''))
      const regular = parseInt(prices.regular.price.replace(/,/g, ''))
      const discountRate = Math.round((1 - campaign / regular) * 100)
      
      return `通常価格: ${regularPrice} → ${prices.campaign.fullMatch}（${discountRate}%OFF）`
    }

    // キャンペーン価格のみ
    if (prices.campaign) {
      return prices.campaign.fullMatch
    }

    // 通常価格のみ
    if (prices.regular) {
      return `価格: ${prices.regular.price}円`
    }

    // その他の価格
    if (prices.all?.length > 0) {
      return `価格: ${prices.all[0].price}円`
    }

    return ''
  }
}