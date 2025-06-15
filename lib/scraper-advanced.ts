import { ScrapedData } from './scraper-simple'

export class AdvancedWebScraper {
  private scraperApiKey: string | undefined
  private brightDataKey: string | undefined
  
  constructor() {
    this.scraperApiKey = process.env.SCRAPER_API_KEY
    this.brightDataKey = process.env.BRIGHT_DATA_KEY
  }

  async scrapeUrl(url: string): Promise<ScrapedData> {
    console.log('高精度スクレイピング開始:', url)
    
    // 1. 複数のスクレイピング手法を並列実行
    const results = await Promise.allSettled([
      this.scrapeWithPuppeteerAPI(url),
      this.scrapeWithBrightData(url),
      this.scrapeWithScraperAPI(url),
      this.scrapeWithPlaywright(url)
    ])
    
    // 2. 最も詳細なデータを選択
    const successfulResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<ScrapedData>).value)
    
    if (successfulResults.length === 0) {
      throw new Error('すべてのスクレイピング手法が失敗しました')
    }
    
    // 3. データを統合して最も完全な情報を作成
    return this.mergeScrapedData(successfulResults)
  }

  // Puppeteer Cloud API (Browserless)
  private async scrapeWithPuppeteerAPI(url: string): Promise<ScrapedData> {
    const BROWSERLESS_KEY = process.env.BROWSERLESS_KEY
    if (!BROWSERLESS_KEY) throw new Error('Browserless key not found')

    const response = await fetch(`https://chrome.browserless.io/scrape?token=${BROWSERLESS_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        waitFor: 3000,
        elements: [
          { 
            selector: 'multiple', 
            name: 'prices',
            selectors: [
              // 価格セレクターを網羅的に
              '[class*="price"]:not([class*="regular"])',
              '[class*="campaign"]',
              '[class*="sale"]',
              '[class*="special"]',
              '[class*="初回"]',
              '[class*="限定"]',
              'span:contains("円"):contains("初回")',
              'div:contains("円"):contains("お試し")',
              'p:contains("円"):contains("トライアル")',
              '*:contains("980円")',
              '*:contains("1,980円")',
              '*:contains("2,980円")'
            ]
          },
          {
            selector: 'title',
            name: 'title'
          },
          {
            selector: 'meta[name="description"]',
            name: 'description',
            attr: 'content'
          },
          {
            selector: 'img',
            name: 'images',
            attr: 'src',
            all: true
          }
        ],
        // スクリーンショットも取得
        screenshot: true,
        // JavaScriptを実行してSPAも対応
        evaluate: `
          // 動的に生成される価格を探す
          const findPrices = () => {
            const priceElements = [];
            const walk = (node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent || '';
                if (/[0-9,]+円/.test(text)) {
                  const parent = node.parentElement;
                  if (parent) {
                    priceElements.push({
                      text: text.trim(),
                      context: parent.textContent?.trim() || '',
                      className: parent.className,
                      id: parent.id
                    });
                  }
                }
              }
              for (const child of node.childNodes) {
                walk(child);
              }
            };
            walk(document.body);
            return priceElements;
          };
          
          // 構造化データを取得
          const structuredData = Array.from(
            document.querySelectorAll('script[type="application/ld+json"]')
          ).map(s => {
            try {
              return JSON.parse(s.textContent || '{}');
            } catch {
              return null;
            }
          }).filter(Boolean);
          
          ({ prices: findPrices(), structuredData });
        `
      })
    })

    const data = await response.json()
    return this.parseScrapedData(data, url)
  }

  // Bright Data (旧Luminati) - 最高精度
  private async scrapeWithBrightData(url: string): Promise<ScrapedData> {
    if (!this.brightDataKey) throw new Error('Bright Data key not found')

    const response = await fetch('https://api.brightdata.com/dca/v1/collect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.brightDataKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        country: 'jp',
        // カスタムコレクター定義
        collector: {
          price_info: {
            selector: '[class*="price"], [id*="price"]',
            extract: 'text',
            all: true
          },
          campaign_price: {
            // XPathも使用可能
            xpath: '//*[contains(text(), "初回") or contains(text(), "限定")]//*[contains(text(), "円")]',
            extract: 'text'
          },
          features: {
            selector: '.feature-list li, .product-feature, ul li',
            extract: 'text',
            all: true
          }
        }
      })
    })

    return this.parseScrapedData(await response.json(), url)
  }

  // ScraperAPI - 安定性重視
  private async scrapeWithScraperAPI(url: string): Promise<ScrapedData> {
    if (!this.scraperApiKey) throw new Error('ScraperAPI key not found')

    const response = await fetch(`https://api.scraperapi.com/?api_key=${this.scraperApiKey}&url=${encodeURIComponent(url)}&render=true&country_code=jp`)
    const html = await response.text()

    // Cheerioライクな解析をクライアントサイドで
    return this.parseHTML(html, url)
  }

  // Playwright Cloud
  private async scrapeWithPlaywright(url: string): Promise<ScrapedData> {
    const PLAYWRIGHT_KEY = process.env.PLAYWRIGHT_CLOUD_KEY
    if (!PLAYWRIGHT_KEY) throw new Error('Playwright key not found')

    const response = await fetch('https://api.playwright.cloud/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLAYWRIGHT_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        viewport: { width: 1920, height: 1080 },
        // 複雑なインタラクションも可能
        actions: [
          { type: 'wait', selector: '[class*="price"]', timeout: 5000 },
          { type: 'scroll', direction: 'down', amount: 500 },
          { type: 'wait', time: 1000 }
        ],
        // データ抽出
        extract: {
          prices: {
            selector: '[class*="price"], [id*="price"], span:has-text("円")',
            attribute: 'innerText',
            multiple: true
          },
          title: {
            selector: 'h1, title',
            attribute: 'innerText'
          }
        }
      })
    })

    return this.parseScrapedData(await response.json(), url)
  }

  // HTMLパーサー
  private parseHTML(html: string, url: string): ScrapedData {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // 価格情報の高度な抽出
    const priceElements = doc.querySelectorAll(
      '[class*="price"], [id*="price"], span, div, p'
    )
    
    const prices: { text: string; context: string; score: number }[] = []
    
    priceElements.forEach(el => {
      const text = el.textContent || ''
      if (/[0-9,]+円/.test(text)) {
        // スコアリングで価格の重要度を判定
        let score = 0
        
        // キャンペーン価格の可能性
        if (/初回|限定|お試し|トライアル|キャンペーン/.test(text)) {
          score += 10
        }
        
        // フォントサイズが大きい
        const fontSize = window.getComputedStyle(el).fontSize
        if (parseInt(fontSize) > 20) {
          score += 5
        }
        
        // 色が目立つ（赤系）
        const color = window.getComputedStyle(el).color
        if (color.includes('255, 0') || color.includes('red')) {
          score += 3
        }
        
        // 位置がページ上部
        const rect = el.getBoundingClientRect()
        if (rect.top < 500) {
          score += 2
        }
        
        prices.push({
          text: text.trim(),
          context: (el.parentElement?.textContent || '').trim(),
          score
        })
      }
    })
    
    // スコア順にソート
    prices.sort((a, b) => b.score - a.score)
    
    return {
      title: doc.title,
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      price: prices[0]?.text || '',
      images: Array.from(doc.querySelectorAll('img')).map(img => img.src),
      features: this.extractFeatures(doc),
      category: this.detectCategory(doc),
      metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      ogTitle: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDescription: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
      structuredData: this.extractStructuredData(doc),
      url
    }
  }

  // 特徴抽出の高度化
  private extractFeatures(doc: Document): string[] {
    const features: string[] = []
    
    // 複数のパターンで特徴を探す
    const selectors = [
      '.feature-list li',
      '.product-feature',
      '[class*="point"] li',
      '[class*="benefit"]',
      'ul li:has(svg), ul li:has(i)', // アイコン付きリスト
      '[class*="spec"] td'
    ]
    
    selectors.forEach(selector => {
      doc.querySelectorAll(selector).forEach(el => {
        const text = (el.textContent || '').trim()
        if (text.length > 5 && text.length < 100) {
          features.push(text)
        }
      })
    })
    
    return [...new Set(features)]
  }

  // カテゴリー検出の高度化
  private detectCategory(doc: Document): string {
    // パンくずリストから
    const breadcrumb = doc.querySelector('[class*="breadcrumb"], [itemtype*="BreadcrumbList"]')
    if (breadcrumb) {
      const items = breadcrumb.querySelectorAll('a, span')
      if (items.length > 1) {
        return items[items.length - 2].textContent?.trim() || ''
      }
    }
    
    // 構造化データから
    const ldJson = doc.querySelector('script[type="application/ld+json"]')
    if (ldJson) {
      try {
        const data = JSON.parse(ldJson.textContent || '{}')
        if (data.category) return data.category
        if (data['@type'] === 'Product' && data.category) return data.category
      } catch {}
    }
    
    return ''
  }

  // 構造化データ抽出
  private extractStructuredData(doc: Document): any {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
    const data: any[] = []
    
    scripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent || '{}')
        data.push(json)
      } catch {}
    })
    
    return data
  }

  // データ統合
  private mergeScrapedData(results: ScrapedData[]): ScrapedData {
    // 各フィールドで最も詳細なデータを選択
    const merged: ScrapedData = {
      title: '',
      description: '',
      price: '',
      images: [],
      features: [],
      category: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      structuredData: null,
      url: results[0]?.url
    }
    
    // タイトル（最も長いもの）
    merged.title = results
      .map(r => r.title)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)[0] || ''
    
    // 価格（キャンペーン価格を優先）
    const allPrices = results.flatMap(r => r.price || [])
    merged.price = allPrices.find(p => /初回|限定|お試し/.test(p)) || allPrices[0] || ''
    
    // 画像（重複排除）
    merged.images = [...new Set(results.flatMap(r => r.images || []))]
    
    // 特徴（重複排除して統合）
    merged.features = [...new Set(results.flatMap(r => r.features || []))]
    
    // カテゴリー（最初に見つかったもの）
    merged.category = results.find(r => r.category)?.category || ''
    
    // 構造化データ（すべて統合）
    const allStructuredData = results
      .map(r => r.structuredData)
      .filter(Boolean)
      .flat()
    merged.structuredData = allStructuredData.length > 0 ? allStructuredData : null
    
    return merged
  }

  // レスポンスのパース
  private parseScrapedData(data: any, url: string): ScrapedData {
    return {
      title: data.title || data.elements?.title || '',
      description: data.description || data.elements?.description || '',
      price: this.extractBestPrice(data),
      images: data.images || data.elements?.images || [],
      features: data.features || [],
      category: data.category || '',
      metaDescription: data.metaDescription || '',
      ogTitle: data.ogTitle || '',
      ogDescription: data.ogDescription || '',
      structuredData: data.structuredData || null,
      url
    }
  }

  // 最適な価格を抽出
  private extractBestPrice(data: any): string {
    const prices = data.prices || data.elements?.prices || []
    
    // キャンペーン価格を最優先
    for (const price of prices) {
      const text = typeof price === 'string' ? price : price.text || ''
      if (/初回.*?([0-9,]+円)/.test(text)) {
        return text
      }
    }
    
    // その他の特別価格
    for (const price of prices) {
      const text = typeof price === 'string' ? price : price.text || ''
      if (/限定|お試し|トライアル|キャンペーン/.test(text) && /[0-9,]+円/.test(text)) {
        return text
      }
    }
    
    // 通常価格
    return prices[0] || ''
  }
}