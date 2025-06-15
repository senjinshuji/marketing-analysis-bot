// ハイブリッドスクレイピング戦略
import { ScrapedData } from './scraper-simple'

interface PriceInfo {
  regularPrice?: string
  campaignPrice?: string
  discountRate?: string
  priceContext?: string
}

export class HybridScraper {
  // 日本のECサイトでよく使われる価格セレクター
  private readonly PRICE_SELECTORS = [
    // 一般的なクラス名
    '.price', '.product-price', '.item-price', '.sale-price',
    '.campaign-price', '.special-price', '.discount-price',
    
    // ID
    '#price', '#product-price', '#sale-price',
    
    // 日本語を含むクラス
    '.価格', '.販売価格', '.特別価格', '.初回価格',
    
    // データ属性
    '[data-price]', '[data-sale-price]', '[data-campaign-price]',
    
    // 構造的セレクター
    '.price-box .price', '.price-wrapper span',
    'span[class*="price"]', 'div[class*="price"]',
    
    // テキストベース（XPath風）
    '*:contains("円"):contains("初回")',
    '*:contains("円"):contains("限定")',
    '*:contains("円"):contains("お試し")'
  ]

  async scrapeUrl(url: string): Promise<ScrapedData> {
    console.log('ハイブリッドスクレイピング開始:', url)
    
    try {
      // 1. まずVercel Edge Functionで基本情報を高速取得
      const edgeData = await this.scrapeWithEdge(url)
      
      // 2. 価格情報が不完全な場合は追加取得
      if (!this.hasCampaignPrice(edgeData)) {
        const enhancedData = await this.enhanceWithAPI(url, edgeData)
        return enhancedData
      }
      
      return edgeData
    } catch (error) {
      console.error('ハイブリッドスクレイピングエラー:', error)
      // フォールバック
      return this.generateFallbackData(url)
    }
  }

  // Edge Functionでの高速スクレイピング
  private async scrapeWithEdge(url: string): Promise<ScrapedData> {
    const response = await fetch('/api/edge-scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      throw new Error(`Edge scraping failed: ${response.status}`)
    }

    const data = await response.json()
    
    // 価格情報の解析を強化
    const priceInfo = this.analyzePrices(data.debug?.pricesFound || [])
    
    return {
      ...data,
      price: this.formatPrice(priceInfo),
      features: this.enhanceFeatures(data.features, priceInfo)
    }
  }

  // 価格情報の詳細解析
  private analyzePrices(pricesFound: string[]): PriceInfo {
    const info: PriceInfo = {}
    
    // 価格パターンの定義
    const patterns = {
      campaign: {
        regex: /初回限定.*?([¥￥]?[\d,]+円)/,
        keywords: ['初回', '限定', 'お試し', 'トライアル', 'キャンペーン', '特別']
      },
      regular: {
        regex: /通常価格.*?([¥￥]?[\d,]+円)/,
        keywords: ['通常', '定価', '本体価格', 'メーカー希望']
      },
      discount: {
        regex: /(\d+)[%％]OFF/,
        keywords: ['OFF', '割引', '値引き']
      }
    }
    
    for (const priceText of pricesFound) {
      // キャンペーン価格
      if (patterns.campaign.keywords.some(k => priceText.includes(k))) {
        const match = priceText.match(/([¥￥]?[\d,]+円)/)
        if (match) {
          info.campaignPrice = match[1]
          info.priceContext = priceText
        }
      }
      
      // 通常価格
      if (patterns.regular.keywords.some(k => priceText.includes(k))) {
        const match = priceText.match(/([¥￥]?[\d,]+円)/)
        if (match) {
          info.regularPrice = match[1]
        }
      }
      
      // 割引率
      const discountMatch = priceText.match(patterns.discount.regex)
      if (discountMatch) {
        info.discountRate = discountMatch[0]
      }
    }
    
    // 価格の妥当性チェック
    if (info.campaignPrice && info.regularPrice) {
      const campaign = this.parsePrice(info.campaignPrice)
      const regular = this.parsePrice(info.regularPrice)
      
      // キャンペーン価格が通常価格より高い場合は入れ替え
      if (campaign > regular) {
        [info.campaignPrice, info.regularPrice] = [info.regularPrice, info.campaignPrice]
      }
    }
    
    return info
  }

  // 価格のフォーマット
  private formatPrice(info: PriceInfo): string {
    if (info.campaignPrice && info.regularPrice && info.discountRate) {
      return `通常価格: ${info.regularPrice} → 初回特別価格: ${info.campaignPrice}（${info.discountRate}）`
    } else if (info.campaignPrice) {
      return `特別価格: ${info.campaignPrice}`
    } else if (info.regularPrice) {
      return info.regularPrice
    }
    return ''
  }

  // 価格を数値に変換
  private parsePrice(priceStr: string): number {
    const match = priceStr.match(/[\d,]+/)
    if (match) {
      return parseInt(match[0].replace(/,/g, ''))
    }
    return 0
  }

  // キャンペーン価格があるかチェック
  private hasCampaignPrice(data: ScrapedData): boolean {
    return !!(data.price && /初回|限定|お試し|キャンペーン/.test(data.price))
  }

  // APIで追加情報を取得
  private async enhanceWithAPI(url: string, baseData: ScrapedData): Promise<ScrapedData> {
    // 複数のAPIを試行
    const apiMethods = [
      () => this.tryScrapingBee(url),
      () => this.tryScraperAPI(url),
      () => this.tryProxyCrawl(url)
    ]
    
    for (const method of apiMethods) {
      try {
        const apiData = await method()
        if (apiData && this.hasCampaignPrice(apiData)) {
          // APIデータとEdgeデータをマージ
          return this.mergeData(baseData, apiData)
        }
      } catch (error) {
        console.warn('API method failed:', error)
        continue
      }
    }
    
    return baseData
  }

  // ScrapingBee API
  private async tryScrapingBee(url: string): Promise<ScrapedData | null> {
    if (!process.env.SCRAPINGBEE_API_KEY) return null
    
    const { APIWebScraper } = await import('./scraper-api')
    const scraper = new APIWebScraper()
    return await scraper.scrapeUrl(url)
  }

  // ScraperAPI
  private async tryScraperAPI(url: string): Promise<ScrapedData | null> {
    if (!process.env.SCRAPER_API_KEY) return null
    
    const response = await fetch(
      `https://api.scraperapi.com/?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true`
    )
    
    const html = await response.text()
    return this.parseHTMLWithPriceLogic(html, url)
  }

  // ProxyCrawl API
  private async tryProxyCrawl(url: string): Promise<ScrapedData | null> {
    if (!process.env.PROXYCRAWL_TOKEN) return null
    
    const response = await fetch(
      `https://api.proxycrawl.com/?token=${process.env.PROXYCRAWL_TOKEN}&url=${encodeURIComponent(url)}&format=json`
    )
    
    const data = await response.json()
    return this.parseProxyCrawlResponse(data, url)
  }

  // HTMLから価格情報を抽出（高精度版）
  private parseHTMLWithPriceLogic(html: string, url: string): ScrapedData {
    // 仮想DOMを作成
    const virtualDoc = this.createVirtualDOM(html)
    
    // 価格要素を重要度でスコアリング
    const priceElements = this.findAndScorePriceElements(virtualDoc)
    
    // 最も可能性の高い価格を選択
    const bestPrice = priceElements[0]
    
    return {
      title: virtualDoc.title || '',
      description: virtualDoc.querySelector('meta[name="description"]')?.content || '',
      price: bestPrice?.text || '',
      images: this.extractImages(virtualDoc),
      features: this.extractFeatures(virtualDoc),
      category: this.detectCategory(virtualDoc),
      metaDescription: virtualDoc.querySelector('meta[name="description"]')?.content || '',
      ogTitle: virtualDoc.querySelector('meta[property="og:title"]')?.content || '',
      ogDescription: virtualDoc.querySelector('meta[property="og:description"]')?.content || '',
      structuredData: this.extractStructuredData(virtualDoc),
      url
    }
  }

  // 仮想DOM作成（サーバーサイド用）
  private createVirtualDOM(html: string): any {
    // 簡易的なDOM構造を作成
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const metaMatches = html.matchAll(/<meta[^>]+>/gi)
    
    return {
      title: titleMatch ? titleMatch[1] : '',
      querySelector: (selector: string) => {
        // メタタグの場合
        if (selector.startsWith('meta')) {
          for (const match of metaMatches) {
            const metaTag = match[0]
            if (metaTag.includes(selector.replace('meta[', '').replace(']', ''))) {
              const contentMatch = metaTag.match(/content=["']([^"']+)["']/)
              return { content: contentMatch ? contentMatch[1] : '' }
            }
          }
        }
        return null
      }
    }
  }

  // 価格要素をスコアリング
  private findAndScorePriceElements(doc: any): Array<{text: string, score: number}> {
    const elements: Array<{text: string, score: number}> = []
    
    // この実装では正規表現ベースで価格を抽出
    // 実際のDOMがある場合はより高度な解析が可能
    
    return elements.sort((a, b) => b.score - a.score)
  }

  // 特徴の抽出と強化
  private enhanceFeatures(features: string[], priceInfo: PriceInfo): string[] {
    const enhanced = [...features]
    
    // 価格情報を特徴として追加
    if (priceInfo.campaignPrice) {
      enhanced.unshift(`初回特別価格: ${priceInfo.campaignPrice}`)
    }
    if (priceInfo.discountRate) {
      enhanced.unshift(`${priceInfo.discountRate}OFF`)
    }
    
    return enhanced
  }

  // データのマージ
  private mergeData(base: ScrapedData, additional: ScrapedData): ScrapedData {
    return {
      ...base,
      price: additional.price || base.price,
      images: [...new Set([...base.images, ...additional.images])],
      features: [...new Set([...base.features, ...additional.features])],
      category: additional.category || base.category,
      structuredData: additional.structuredData || base.structuredData
    }
  }

  // フォールバックデータ生成
  private generateFallbackData(url: string): ScrapedData {
    return {
      title: 'スクレイピングエラー',
      description: 'データの取得に失敗しました。URLを確認してください。',
      price: '',
      images: [],
      features: [],
      category: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      structuredData: null,
      url
    }
  }

  // その他のヘルパーメソッド
  private extractImages(doc: any): string[] {
    // 実装省略
    return []
  }

  private extractFeatures(doc: any): string[] {
    // 実装省略
    return []
  }

  private detectCategory(doc: any): string {
    // 実装省略
    return ''
  }

  private extractStructuredData(doc: any): any {
    // 実装省略
    return null
  }

  private parseProxyCrawlResponse(data: any, url: string): ScrapedData {
    // ProxyCrawl特有のレスポンス形式をパース
    return {
      title: data.title || '',
      description: data.description || '',
      price: data.price || '',
      images: data.images || [],
      features: data.features || [],
      category: data.category || '',
      metaDescription: data.meta_description || '',
      ogTitle: data.og_title || '',
      ogDescription: data.og_description || '',
      structuredData: data.structured_data || null,
      url
    }
  }
}