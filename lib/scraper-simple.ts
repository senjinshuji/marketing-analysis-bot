// Vercel環境用のシンプルなスクレイパー（Puppeteerを使わない）

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

export class WebScraper {
  async init() {
    // 初期化不要
  }

  async close() {
    // クリーンアップ不要
  }

  async scrapeUrl(url: string): Promise<ScrapedData> {
    // Vercel環境では基本的なデータのみ返す
    console.log('簡易スクレイピング実行:', url)
    
    // URLから基本情報を推測
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    
    return {
      title: `${domain} - 商品ページ`,
      description: 'このURLの商品情報をGPT-4で分析します。実際のスクレイピングはローカル環境でのみ利用可能です。',
      price: '',
      images: [],
      features: ['URLから分析を実行します'],
      category: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      structuredData: null
    }
  }

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