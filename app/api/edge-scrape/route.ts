export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 })
    }

    // HTMLを取得
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        'Cache-Control': 'no-cache',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    // 正規表現でデータ抽出
    const extractData = (html: string) => {
      // タイトル
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : ''

      // メタディスクリプション
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
      const description = descMatch ? descMatch[1] : ''

      // OGP情報
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
      
      // 価格情報の抽出（複数パターン）
      const pricePatterns = [
        // 初回限定価格
        /初回限定[\s]*[:：]?[\s]*([¥￥]?[\d,]+円)/gi,
        /初回[\s]*([¥￥]?[\d,]+円)/gi,
        /初回特別価格[\s]*[:：]?[\s]*([¥￥]?[\d,]+円)/gi,
        
        // お試し価格
        /お試し価格[\s]*[:：]?[\s]*([¥￥]?[\d,]+円)/gi,
        /トライアル[\s]*[:：]?[\s]*([¥￥]?[\d,]+円)/gi,
        
        // キャンペーン価格
        /今だけ[\s]*([¥￥]?[\d,]+円)/gi,
        /期間限定[\s]*([¥￥]?[\d,]+円)/gi,
        /特別価格[\s]*[:：]?[\s]*([¥￥]?[\d,]+円)/gi,
        
        // 一般的な価格表記
        /([¥￥][\d,]+)/g,
        /([\d,]+円)/g
      ]

      const prices: string[] = []
      for (const pattern of pricePatterns) {
        const matches = html.matchAll(pattern)
        for (const match of matches) {
          if (match[1]) {
            prices.push(match[0]) // 完全なマッチを保存（コンテキスト付き）
          }
        }
      }

      // 画像URLの抽出
      const imageMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
      const images: string[] = []
      for (const match of imageMatches) {
        const src = match[1]
        // 相対URLを絶対URLに変換
        try {
          const absoluteUrl = new URL(src, url).href
          if (absoluteUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
            images.push(absoluteUrl)
          }
        } catch {}
      }

      // JSON-LDの抽出
      const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi)
      const structuredData: any[] = []
      for (const match of jsonLdMatches) {
        try {
          structuredData.push(JSON.parse(match[1]))
        } catch {}
      }

      // 特徴の抽出（リスト項目など）
      const featurePatterns = [
        /<li[^>]*>([^<]+)<\/li>/gi,
        /<div[^>]+class=["'][^"']*feature[^"']*["'][^>]*>([^<]+)<\/div>/gi,
        /<span[^>]+class=["'][^"']*point[^"']*["'][^>]*>([^<]+)<\/span>/gi
      ]

      const features: string[] = []
      for (const pattern of featurePatterns) {
        const matches = html.matchAll(pattern)
        for (const match of matches) {
          const text = match[1].trim()
          if (text.length > 5 && text.length < 100 && !text.includes('<')) {
            features.push(text)
          }
        }
      }

      return {
        title,
        description,
        ogTitle: ogTitleMatch ? ogTitleMatch[1] : '',
        ogDescription: ogDescMatch ? ogDescMatch[1] : '',
        prices: [...new Set(prices)].slice(0, 10), // 重複削除、最大10個
        images: images.slice(0, 5), // 最大5個
        features: [...new Set(features)].slice(0, 10), // 重複削除、最大10個
        structuredData
      }
    }

    const data = extractData(html)

    // 価格情報の整形
    const priceInfo = data.prices.find(p => /初回|お試し|限定/.test(p)) || data.prices[0] || ''

    return Response.json({
      title: data.title,
      description: data.description,
      price: priceInfo,
      images: data.images,
      features: data.features,
      category: '', // カテゴリーは別途推測
      metaDescription: data.description,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      structuredData: data.structuredData,
      url: url,
      debug: {
        pricesFound: data.prices
      }
    })

  } catch (error: any) {
    console.error('Edge scraping error:', error)
    return Response.json({
      error: 'Scraping failed',
      message: error.message
    }, { status: 500 })
  }
}