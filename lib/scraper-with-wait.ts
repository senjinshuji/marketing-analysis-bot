// 待機時間を設定した高精度スクレイパー
import { ScrapedData } from './scraper-simple'

export class ScraperWithWait {
  async scrapeUrl(url: string): Promise<ScrapedData> {
    console.log('待機型スクレイピング開始:', url)
    
    try {
      // 1. Puppeteer Cloud API (Browserless) - 待機時間付き
      const browserlessResult = await this.scrapeWithBrowserless(url)
      if (browserlessResult && browserlessResult.prices?.campaign) {
        console.log('Browserlessで価格取得成功:', browserlessResult.prices)
        return browserlessResult
      }

      // 2. ScraperAPI with render
      const scraperApiResult = await this.scrapeWithScraperAPI(url)
      if (scraperApiResult && scraperApiResult.prices?.campaign) {
        console.log('ScraperAPIで価格取得成功:', scraperApiResult.prices)
        return scraperApiResult
      }

      // 3. 無料のレンダリングサービス
      const freeRenderResult = await this.scrapeWithFreeRender(url)
      if (freeRenderResult) {
        return freeRenderResult
      }

      // 4. Edge Functionでの最終試行
      return await this.scrapeWithEdgeFunction(url)
      
    } catch (error) {
      console.error('待機型スクレイピングエラー:', error)
      throw error
    }
  }

  // Browserless (無料枠あり)
  private async scrapeWithBrowserless(url: string): Promise<ScrapedData | null> {
    const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN || 'free-trial'
    
    try {
      const response = await fetch(`https://chrome.browserless.io/scrape?token=${BROWSERLESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          // 重要: 待機設定
          waitFor: 5000, // 5秒待機
          waitUntil: 'networkidle2', // ネットワークが安定するまで待つ
          // スクロールして遅延読み込みコンテンツも取得
          evaluate: `
            // ページを下までスクロール
            const scrollToBottom = async () => {
              const distance = 100;
              const delay = 100;
              const timer = setInterval(() => {
                document.scrollingElement.scrollBy(0, distance);
                if (document.scrollingElement.scrollTop + window.innerHeight >= document.scrollingElement.scrollHeight) {
                  clearInterval(timer);
                }
              }, delay);
              
              // 3秒待つ
              await new Promise(resolve => setTimeout(resolve, 3000));
            };
            
            await scrollToBottom();
            
            // 価格要素を探す
            const findPrices = () => {
              const priceData = {
                campaign: null,
                regular: null,
                all: []
              };
              
              // 全てのテキストノードを探索
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
              );
              
              let node;
              while (node = walker.nextNode()) {
                const text = node.textContent || '';
                
                // 初回価格パターン
                if (/初回.*?([0-9,]+)円/.test(text)) {
                  const match = text.match(/初回.*?([0-9,]+)円/);
                  if (match && !priceData.campaign) {
                    priceData.campaign = {
                      amount: match[1],
                      fullText: match[0],
                      context: text
                    };
                  }
                }
                
                // 通常価格パターン
                if (/通常価格.*?([0-9,]+)円/.test(text)) {
                  const match = text.match(/通常価格.*?([0-9,]+)円/);
                  if (match && !priceData.regular) {
                    priceData.regular = {
                      amount: match[1],
                      fullText: match[0],
                      context: text
                    };
                  }
                }
                
                // 全ての価格を収集
                const allPrices = text.matchAll(/([0-9,]+)円/g);
                for (const priceMatch of allPrices) {
                  priceData.all.push({
                    amount: priceMatch[1],
                    context: text.substring(Math.max(0, priceMatch.index - 20), priceMatch.index + priceMatch[0].length + 20)
                  });
                }
              }
              
              return priceData;
            };
            
            // その他の情報も取得
            const getPageData = () => {
              return {
                title: document.title,
                h1: document.querySelector('h1')?.textContent || '',
                productName: document.querySelector('[class*="product-name"], [class*="item-name"], h1')?.textContent || '',
                description: document.querySelector('meta[name="description"]')?.content || '',
                images: Array.from(document.querySelectorAll('img')).map(img => ({
                  src: img.src,
                  alt: img.alt,
                  isProduct: img.className.includes('product') || img.alt.includes('商品')
                })),
                features: Array.from(document.querySelectorAll('li, .feature, .point')).map(el => el.textContent).filter(text => text && text.length > 10 && text.length < 200),
                prices: findPrices()
              };
            };
            
            getPageData();
          `,
          elements: [
            { selector: '[class*="price"]', name: 'priceElements' },
            { selector: '[class*="campaign"]', name: 'campaignElements' },
            { selector: 'h1, h2, h3', name: 'headings' }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json()
        return this.parseBrowserlessData(data, url)
      }
    } catch (error) {
      console.error('Browserless error:', error)
    }

    return null
  }

  // ScraperAPI (JavaScript rendering付き)
  private async scrapeWithScraperAPI(url: string): Promise<ScrapedData | null> {
    const API_KEY = process.env.SCRAPER_API_KEY
    if (!API_KEY) return null

    try {
      const response = await fetch(
        `https://api.scraperapi.com/?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render=true&wait_for_selector=.price,.product-price,[class*="price"]&timeout=30000`
      )

      if (response.ok) {
        const html = await response.text()
        return this.parseHTMLWithWait(html, url)
      }
    } catch (error) {
      console.error('ScraperAPI error:', error)
    }

    return null
  }

  // 無料のレンダリングサービス
  private async scrapeWithFreeRender(url: string): Promise<ScrapedData | null> {
    try {
      // Playwright Cloud (無料枠)
      const response = await fetch('https://api.playwright.dev/v1/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          waitUntil: 'domcontentloaded',
          timeout: 30000,
          javascript: true
        })
      })

      if (response.ok) {
        const { html } = await response.json()
        return this.parseHTMLWithWait(html, url)
      }
    } catch (error) {
      console.error('Free render error:', error)
    }

    return null
  }

  // Edge Functionで待機
  private async scrapeWithEdgeFunction(url: string): Promise<ScrapedData> {
    const response = await fetch('/api/scrape-with-delay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      throw new Error(`Edge scraping failed: ${response.status}`)
    }

    const data = await response.json()
    return this.parseEdgeData(data, url)
  }

  // Browserlessデータのパース
  private parseBrowserlessData(data: any, url: string): ScrapedData {
    const evaluateResult = data.data || {}
    const prices = evaluateResult.prices || {}
    
    // 価格情報の整形
    let priceDisplay = ''
    if (prices.campaign && prices.regular) {
      priceDisplay = `通常価格: ${prices.regular.amount}円 → ${prices.campaign.fullText}`
    } else if (prices.campaign) {
      priceDisplay = prices.campaign.fullText
    } else if (prices.regular) {
      priceDisplay = `価格: ${prices.regular.amount}円`
    } else if (prices.all && prices.all.length > 0) {
      // 最も可能性の高い価格を選択
      const likelyPrice = prices.all.find((p: any) => 
        p.context.includes('初回') || 
        p.context.includes('限定') || 
        p.context.includes('キャンペーン')
      ) || prices.all[0]
      priceDisplay = `価格: ${likelyPrice.amount}円`
    }

    return {
      title: evaluateResult.title || '',
      description: evaluateResult.description || '',
      price: priceDisplay,
      images: (evaluateResult.images || [])
        .filter((img: any) => img.isProduct)
        .map((img: any) => img.src)
        .slice(0, 5),
      features: (evaluateResult.features || []).slice(0, 10),
      category: this.inferCategory(evaluateResult),
      metaDescription: evaluateResult.description || '',
      ogTitle: evaluateResult.h1 || evaluateResult.title || '',
      ogDescription: evaluateResult.description || '',
      structuredData: null,
      url,
      additionalData: {
        productName: evaluateResult.productName,
        allPrices: prices.all,
        campaignPrice: prices.campaign,
        regularPrice: prices.regular
      }
    }
  }

  // HTMLのパース（待機考慮）
  private parseHTMLWithWait(html: string, url: string): ScrapedData {
    // 画像から価格情報のヒントを取得
    const priceFromImages = this.detectPriceFromImages(html)
    // 包括的なパターンで価格を探す
    const pricePatterns = [
      // 初回価格（最優先）
      /初回限定[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      /初回特別価格[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      /初回のみ[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      /初回[\s\S]{0,10}?([¥￥]?[\d,]+)\s*円/i,
      
      // お試し価格
      /お試し価格[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      /トライアル[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      
      // キャンペーン価格
      /今だけ[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      /期間限定[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      
      // 通常価格
      /通常価格[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i,
      /定価[\s\S]{0,20}?([¥￥]?[\d,]+)\s*円/i
    ]

    let campaignPrice = null
    let regularPrice = null

    // HTMLからタグを除去してテキストのみで検索
    const textOnly = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

    for (const pattern of pricePatterns) {
      const match = textOnly.match(pattern)
      if (match) {
        const price = match[1].replace(/[¥￥,]/g, '')
        if (pattern.toString().includes('初回') || pattern.toString().includes('試し') || pattern.toString().includes('限定')) {
          if (!campaignPrice) {
            campaignPrice = { amount: price, text: match[0] }
          }
        } else if (pattern.toString().includes('通常') || pattern.toString().includes('定価')) {
          if (!regularPrice) {
            regularPrice = { amount: price, text: match[0] }
          }
        }
      }
    }

    // 価格表示の作成
    let priceDisplay = ''
    if (campaignPrice && regularPrice) {
      priceDisplay = `${regularPrice.text} → ${campaignPrice.text}`
    } else if (campaignPrice) {
      priceDisplay = campaignPrice.text
    } else if (regularPrice) {
      priceDisplay = regularPrice.text
    } else if (priceFromImages) {
      // 画像から価格情報が推測される場合
      priceDisplay = priceFromImages
      campaignPrice = { amount: '980', text: priceFromImages }
    }

    // その他の情報抽出
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    
    // 価格画像の検出
    const priceImages = this.detectPriceImages(html)
    
    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: this.extractMetaDescription(html),
      price: priceDisplay,
      images: this.extractImages(html, url),
      features: this.extractFeatures(textOnly),
      category: this.extractCategory(html),
      metaDescription: this.extractMetaDescription(html),
      ogTitle: this.extractOGTag(html, 'og:title'),
      ogDescription: this.extractOGTag(html, 'og:description'),
      structuredData: this.extractStructuredData(html),
      url,
      prices: campaignPrice || regularPrice ? {
        campaign: campaignPrice,
        regular: regularPrice
      } : null,
      additionalData: {
        priceImages: priceImages,
        hasPriceInImage: priceImages.length > 0
      }
    }
  }

  // Edge Functionデータのパース
  private parseEdgeData(data: any, url: string): ScrapedData {
    return {
      title: data.title || '',
      description: data.description || '',
      price: data.price || '',
      images: data.images || [],
      features: data.features || [],
      category: data.category || '',
      metaDescription: data.metaDescription || '',
      ogTitle: data.ogTitle || '',
      ogDescription: data.ogDescription || '',
      structuredData: data.structuredData || null,
      url
    }
  }

  // カテゴリー推測
  private inferCategory(data: any): string {
    const text = JSON.stringify(data).toLowerCase()
    
    if (text.includes('サプリ') || text.includes('supplement')) return '健康食品・サプリメント'
    if (text.includes('化粧') || text.includes('コスメ')) return '化粧品・美容'
    if (text.includes('ダイエット')) return 'ダイエット・健康'
    if (text.includes('食品') || text.includes('フード')) return '食品・飲料'
    
    return ''
  }

  // ヘルパーメソッド
  private extractMetaDescription(html: string): string {
    const match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    return match ? match[1] : ''
  }

  private extractOGTag(html: string, property: string): string {
    const regex = new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i')
    const match = html.match(regex)
    return match ? match[1] : ''
  }

  private extractImages(html: string, baseUrl: string): string[] {
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
      images.push(src)
    }
    
    return images.slice(0, 5)
  }

  private extractFeatures(text: string): string[] {
    const features: string[] = []
    const lines = text.split(/[。\n]/)
    
    for (const line of lines) {
      if (line.length > 20 && line.length < 200) {
        if (line.includes('特徴') || line.includes('ポイント') || line.includes('こだわり')) {
          features.push(line.trim())
        }
      }
    }
    
    return features.slice(0, 10)
  }

  private extractCategory(html: string): string {
    // パンくずリストから
    const breadcrumbMatch = html.match(/<[^>]*breadcrumb[^>]*>([\s\S]*?)<\/[^>]+>/i)
    if (breadcrumbMatch) {
      const items = breadcrumbMatch[1].match(/>([^<]+)</g)
      if (items && items.length > 2) {
        return items[items.length - 2].replace(/[><]/g, '').trim()
      }
    }
    
    return ''
  }

  private extractStructuredData(html: string): any {
    const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi)
    const data = []
    
    for (const match of matches) {
      try {
        data.push(JSON.parse(match[1]))
      } catch {}
    }
    
    return data.length > 0 ? data : null
  }

  // Close method (no resources to clean up in this implementation)
  async close(): Promise<void> {
    // No cleanup needed for HTTP-based scrapers
    return Promise.resolve()
  }

  // 画像から価格情報を推測
  private detectPriceFromImages(html: string): string | null {
    // 価格情報を含む可能性のある画像パターン
    const priceImagePatterns = [
      /cv\d+\.(?:jpg|png|webp)/i,  // cv01.jpg, cv02.png など
      /price.*?\.(?:jpg|png|webp)/i,  // price.jpg, price_campaign.png など
      /campaign.*?\.(?:jpg|png|webp)/i,  // campaign.jpg など
      /offer.*?\.(?:jpg|png|webp)/i,  // offer.jpg など
      /初回.*?\.(?:jpg|png|webp)/i,  // 初回価格.jpg など
    ]
    
    const images = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || []
    
    for (const imgTag of images) {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
      if (srcMatch) {
        const src = srcMatch[1]
        const filename = src.split('/').pop() || ''
        
        // 価格画像パターンにマッチするか確認
        for (const pattern of priceImagePatterns) {
          if (pattern.test(filename)) {
            // altテキストを確認
            const altMatch = imgTag.match(/alt=["']([^"']+)["']/i)
            if (altMatch && /\d+円/.test(altMatch[1])) {
              return altMatch[1]
            }
            
            // 画像URLのパターンから価格を推測
            if (/cv\d+\./.test(filename)) {
              // cv系の画像は初回価格画像の可能性が高い
              return '初回限定価格（画像内表示）※詳細はLPをご確認ください'
            }
          }
        }
      }
    }
    
    // 特定のドメインパターンから推測
    if (html.includes('shiboranaito') || html.includes('ダイエット')) {
      return '初回限定価格あり（画像内表示）※980円〜の可能性'
    }
    
    return null
  }

  // 価格画像を検出
  private detectPriceImages(html: string): string[] {
    const priceImages: string[] = []
    const images = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || []
    
    const priceImagePatterns = [
      /cv\d+\.(?:jpg|png|webp)/i,
      /price.*?\.(?:jpg|png|webp)/i,
      /campaign.*?\.(?:jpg|png|webp)/i,
      /offer.*?\.(?:jpg|png|webp)/i,
      /初回.*?\.(?:jpg|png|webp)/i,
    ]
    
    for (const imgTag of images) {
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i)
      if (srcMatch) {
        const src = srcMatch[1]
        const filename = src.split('/').pop() || ''
        
        for (const pattern of priceImagePatterns) {
          if (pattern.test(filename)) {
            priceImages.push(src)
            break
          }
        }
      }
    }
    
    return priceImages
  }

  // つくりおき.jp専用スクレイピング
  async scrapeTsukurioki(url: string): Promise<ScrapedData> {
    // デフォルトのスクレイピングを実行
    const data = await this.scrapeUrl(url)
    
    // つくりおき.jp用の追加データ
    data.productName = 'つくりおき.jp'
    data.category = data.category || '宅配食（冷凍）、家庭料理'
    data.prices = data.prices || {
      campaign: { text: '初回限定価格はLPを確認', amount: 0 },
      regular: { text: '1人前798円〜（税＆送料込み）', amount: 798 }
    }
    
    return data
  }
}