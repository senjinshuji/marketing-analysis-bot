import axios from 'axios'

export interface ScrapedData {
  title: string
  description: string
  price: string
  images: string[]
  features: string[]
  category: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  structuredData: any
  url?: string
}

export class APIWebScraper {
  private apiKey: string | undefined

  constructor() {
    this.apiKey = process.env.SCRAPINGBEE_API_KEY
  }

  async scrapeUrl(url: string): Promise<ScrapedData> {
    // ScrapingBee APIを使用
    if (this.apiKey) {
      try {
        const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
          params: {
            api_key: this.apiKey,
            url: url,
            render_js: true,
            premium_proxy: true,
            country_code: 'jp',
            extract_rules: {
              title: 'title',
              description: 'meta[name="description"]@content',
              ogTitle: 'meta[property="og:title"]@content',
              ogDescription: 'meta[property="og:description"]@content',
              prices: {
                selector: '[class*="price"], [id*="price"], span:contains("円"), div:contains("円")',
                type: 'list'
              },
              images: {
                selector: 'img[src*="product"], img[src*="item"], img.main-image',
                type: 'list',
                output: '@src'
              },
              features: {
                selector: '.feature-list li, .product-feature, ul.features li',
                type: 'list'
              },
              structuredData: {
                selector: 'script[type="application/ld+json"]',
                type: 'list'
              }
            }
          }
        })

        const data = response.data

        // 価格情報の抽出と整形
        const priceInfo = this.extractPriceInfo(data.prices || [])

        return {
          title: data.title || '',
          description: data.description || '',
          price: priceInfo.displayPrice,
          images: data.images || [],
          features: this.extractFeatures(data),
          category: this.detectCategory(data),
          metaDescription: data.description || '',
          ogTitle: data.ogTitle || data.title || '',
          ogDescription: data.ogDescription || data.description || '',
          structuredData: this.parseStructuredData(data.structuredData),
          url: url
        }
      } catch (error) {
        console.error('ScrapingBee API error:', error)
        // フォールバック処理
      }
    }

    // APIキーがない場合は基本的なfetch
    return await this.basicFetch(url)
  }

  private extractPriceInfo(prices: string[]): { displayPrice: string; campaignPrice?: string; regularPrice?: string } {
    const pricePatterns = {
      campaign: /初回|お試し|トライアル|限定|キャンペーン/,
      regular: /通常|定価|本体価格/,
      numeric: /[¥￥]?\s*[\d,]+\s*円/g
    }

    let campaignPrice = ''
    let regularPrice = ''

    for (const priceText of prices) {
      const numbers = priceText.match(pricePatterns.numeric) || []
      
      if (pricePatterns.campaign.test(priceText) && numbers.length > 0) {
        campaignPrice = numbers[0] || ''
      } else if (pricePatterns.regular.test(priceText) && numbers.length > 0) {
        regularPrice = numbers[0] || ''
      }
    }

    // 表示価格の決定
    const displayPrice = campaignPrice 
      ? `${regularPrice ? `通常価格: ${regularPrice} → ` : ''}初回特別価格: ${campaignPrice}`
      : regularPrice || prices[0] || ''

    return { displayPrice, campaignPrice, regularPrice }
  }

  private extractFeatures(data: any): string[] {
    const features = data.features || []
    
    // 価格情報から特徴を抽出
    if (data.prices && data.prices.length > 0) {
      const priceFeatures = data.prices
        .filter((p: string) => /初回|限定|OFF|割引/.test(p))
        .slice(0, 3)
      features.unshift(...priceFeatures)
    }

    return features.slice(0, 10) // 最大10個まで
  }

  private detectCategory(data: any): string {
    const text = `${data.title} ${data.description} ${JSON.stringify(data.structuredData)}`.toLowerCase()
    
    const categories = {
      '健康食品・サプリメント': ['サプリ', 'supplement', '健康食品', 'ビタミン', '栄養'],
      '化粧品・コスメ': ['化粧', 'コスメ', 'スキンケア', '美容液', 'クリーム'],
      '食品・飲料': ['食品', '飲料', 'ドリンク', '食べ物', 'フード'],
      'ダイエット・健康': ['ダイエット', '痩せ', '減量', 'カロリー', '脂肪'],
      '美容機器': ['美顔器', '美容機器', 'エステ', 'マッサージ器'],
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category
      }
    }

    return 'その他'
  }

  private parseStructuredData(data: any[]): any {
    if (!data || data.length === 0) return null

    try {
      // 最初の有効なJSON-LDを解析
      for (const jsonLd of data) {
        if (typeof jsonLd === 'string') {
          return JSON.parse(jsonLd)
        }
      }
    } catch (error) {
      console.error('Structured data parse error:', error)
    }

    return null
  }

  private async basicFetch(url: string): Promise<ScrapedData> {
    try {
      const response = await fetch('/api/edge-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Basic fetch error:', error)
    }

    // 最終フォールバック
    return {
      title: `${new URL(url).hostname} - 商品ページ`,
      description: 'スクレイピング中にエラーが発生しました。URLを確認してください。',
      price: '',
      images: [],
      features: [],
      category: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      structuredData: null,
      url: url
    }
  }
}