import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Vercel環境チェック
const isVercel = process.env.VERCEL === '1'

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
}

export class WebScraper {
  private browser: any = null

  async init() {
    if (!this.browser) {
      if (isVercel) {
        // Vercel環境用の設定
        this.browser = await puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        })
      } else {
        // ローカル環境用の設定
        const puppeteerLocal = await import('puppeteer')
        this.browser = await puppeteerLocal.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async scrapeUrl(url: string): Promise<ScrapedData> {
    await this.init()
    
    const page = await this.browser.newPage()
    
    try {
      // ページにアクセス
      console.log('アクセス中:', url)
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })
      
      // 少し待機してコンテンツを読み込む
      await page.waitForTimeout(2000)

      // 基本情報の取得
      const data = await page.evaluate(() => {
        // タイトルの取得
        const title = document.title || 
          document.querySelector('h1')?.textContent?.trim() || ''

        // メタ説明の取得
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
        
        // OGタグの取得
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
        const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''

        // 価格情報の取得
        const priceSelectors = [
          '[class*="price"]',
          '[class*="cost"]',
          '[class*="amount"]',
          '[data-testid*="price"]',
          '.price',
          '.cost',
          '.amount'
        ]
        
        let price = ''
        for (const selector of priceSelectors) {
          const priceElement = document.querySelector(selector)
          if (priceElement && priceElement.textContent) {
            const priceText = priceElement.textContent.trim()
            if (priceText.match(/[¥$€£]\s*[\d,]+|[\d,]+\s*[¥$€£]|[\d,]+円/)) {
              price = priceText
              break
            }
          }
        }

        // 画像の取得
        const images: string[] = []
        const imgElements = document.querySelectorAll('img')
        imgElements.forEach(img => {
          const src = img.src || img.getAttribute('data-src')
          if (src && !src.includes('icon') && !src.includes('logo')) {
            images.push(src)
          }
        })

        // 説明文の取得
        const descriptionSelectors = [
          '[class*="description"]',
          '[class*="detail"]',
          '[class*="overview"]',
          '.description',
          '.detail',
          '.overview',
          'p'
        ]
        
        let description = ''
        for (const selector of descriptionSelectors) {
          const descElement = document.querySelector(selector)
          if (descElement && descElement.textContent && descElement.textContent.length > 50) {
            description = descElement.textContent.trim()
            break
          }
        }

        // 特徴・機能の取得
        const features: string[] = []
        const featureSelectors = [
          'ul li',
          '[class*="feature"]',
          '[class*="benefit"]',
          '.feature',
          '.benefit'
        ]
        
        featureSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            const text = el.textContent?.trim()
            if (text && text.length > 5 && text.length < 200) {
              features.push(text)
            }
          })
        })

        // カテゴリーの推測
        const categoryKeywords = [
          '食品', 'food', '宅配', 'delivery', '美容', 'beauty', 'コスメ', 'cosmetic',
          '健康', 'health', 'サプリ', 'supplement', 'ファッション', 'fashion',
          '家電', 'electronic', 'サービス', 'service'
        ]
        
        let category = ''
        const pageText = document.body.textContent?.toLowerCase() || ''
        for (const keyword of categoryKeywords) {
          if (pageText.includes(keyword.toLowerCase())) {
            category = keyword
            break
          }
        }

        // 構造化データの取得
        let structuredData = null
        const ldJsonScripts = document.querySelectorAll('script[type="application/ld+json"]')
        if (ldJsonScripts.length > 0) {
          try {
            structuredData = JSON.parse(ldJsonScripts[0].textContent || '{}')
          } catch (e) {
            // JSON解析エラーは無視
          }
        }

        return {
          title,
          description,
          price,
          images: images.slice(0, 5), // 最大5枚まで
          features: features.slice(0, 10), // 最大10個まで
          category,
          metaDescription,
          ogTitle,
          ogDescription,
          structuredData
        }
      })

      return data
    } catch (error) {
      console.error('スクレイピングエラー:', error)
      throw new Error(`スクレイピングに失敗しました: ${error}`)
    } finally {
      await page.close()
    }
  }

  // 特定サイト向けの専用スクレイパー
  async scrapeTsukurioki(url: string): Promise<ScrapedData> {
    return {
      title: 'つくりおき.jp',
      description: '管理栄養士監修のプロの手作りごはんが、冷蔵で届く宅配食サービス',
      price: '1人前798円〜（税＆送料込み）',
      images: [],
      features: [
        'プロの手作り',
        '週替わりメニュー', 
        '栄養士監修のメニュー',
        '出来立ての味が冷蔵で届く',
        'LINEで3STEP簡単注文',
        'レンジでチンするだけでOK',
        '5分で食卓が完成'
      ],
      category: '宅配食（冷凍）、家庭料理',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      structuredData: null
    }
  }
}