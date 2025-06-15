// 日本市場の規模データと分析ロジック

export interface MarketData {
  marketSize: number // 億円単位
  marketCategory: string
  marketDefinition: string
  growthRate?: number // 年間成長率（%）
  confidence: 'high' | 'medium' | 'low'
}

// 日本の主要市場規模データ（2023-2024年基準）
export const JAPAN_MARKET_DATA: { [key: string]: MarketData } = {
  // 食品・飲料
  '健康食品': { marketSize: 9000, marketCategory: '食品・飲料', marketDefinition: '特定保健用食品、機能性表示食品、栄養機能食品を含む', growthRate: 3.5, confidence: 'high' },
  'サプリメント': { marketSize: 1500, marketCategory: '健康食品', marketDefinition: 'ビタミン、ミネラル、アミノ酸等の栄養補助食品', growthRate: 4.2, confidence: 'high' },
  '青汁': { marketSize: 1100, marketCategory: '健康食品', marketDefinition: '青汁製品全般（粉末、液体、錠剤）', growthRate: 2.8, confidence: 'high' },
  'プロテイン': { marketSize: 800, marketCategory: '健康食品', marketDefinition: 'プロテインパウダー、プロテインバー等', growthRate: 8.5, confidence: 'high' },
  '酵素': { marketSize: 600, marketCategory: '健康食品', marketDefinition: '酵素サプリメント、酵素ドリンク', growthRate: -2.1, confidence: 'medium' },
  '乳酸菌': { marketSize: 3500, marketCategory: '健康食品', marketDefinition: '乳酸菌飲料、ヨーグルト、サプリメント', growthRate: 5.2, confidence: 'high' },
  
  // 美容・化粧品
  '化粧品': { marketSize: 28000, marketCategory: '美容', marketDefinition: 'スキンケア、メイクアップ、ヘアケア製品全般', growthRate: 3.8, confidence: 'high' },
  'スキンケア': { marketSize: 12000, marketCategory: '化粧品', marketDefinition: '基礎化粧品（化粧水、美容液、クリーム等）', growthRate: 4.5, confidence: 'high' },
  '美容液': { marketSize: 3200, marketCategory: 'スキンケア', marketDefinition: '美容液、セラム製品', growthRate: 5.8, confidence: 'high' },
  'オールインワン': { marketSize: 1800, marketCategory: 'スキンケア', marketDefinition: 'オールインワンゲル、ジェル', growthRate: 6.2, confidence: 'high' },
  'シャンプー': { marketSize: 2400, marketCategory: 'ヘアケア', marketDefinition: 'シャンプー、トリートメント製品', growthRate: 2.1, confidence: 'high' },
  '育毛剤': { marketSize: 1700, marketCategory: 'ヘアケア', marketDefinition: '育毛剤、発毛剤、養毛剤', growthRate: 4.8, confidence: 'high' },
  '美顔器': { marketSize: 450, marketCategory: '美容機器', marketDefinition: '家庭用美顔器、美容機器', growthRate: 7.2, confidence: 'medium' },
  
  // ダイエット・健康
  'ダイエット食品': { marketSize: 2500, marketCategory: 'ダイエット', marketDefinition: 'ダイエット食品、置き換え食品、ダイエットサプリ', growthRate: 3.5, confidence: 'high' },
  '置き換えダイエット': { marketSize: 800, marketCategory: 'ダイエット食品', marketDefinition: 'ダイエットシェイク、スムージー等', growthRate: 2.8, confidence: 'medium' },
  'ダイエットサプリ': { marketSize: 1200, marketCategory: 'ダイエット食品', marketDefinition: '脂肪燃焼系、糖質カット系サプリメント', growthRate: 4.1, confidence: 'medium' },
  
  // 宅配・サービス
  '宅配食': { marketSize: 1500, marketCategory: '食品宅配', marketDefinition: '宅配弁当、冷凍宅配食、ミールキット', growthRate: 12.5, confidence: 'high' },
  'ミールキット': { marketSize: 600, marketCategory: '宅配食', marketDefinition: '食材キット、料理キット', growthRate: 18.2, confidence: 'high' },
  '冷凍宅配食': { marketSize: 900, marketCategory: '宅配食', marketDefinition: '冷凍弁当、冷凍おかず宅配', growthRate: 15.3, confidence: 'high' },
  
  // その他
  'ペットフード': { marketSize: 1700, marketCategory: 'ペット', marketDefinition: 'ドッグフード、キャットフード等', growthRate: 4.2, confidence: 'high' },
  'CBD': { marketSize: 180, marketCategory: '健康食品', marketDefinition: 'CBD製品（オイル、グミ、化粧品）', growthRate: 35.5, confidence: 'low' },
  '睡眠サポート': { marketSize: 450, marketCategory: '健康食品', marketDefinition: '睡眠改善サプリメント、機能性表示食品', growthRate: 8.8, confidence: 'medium' }
}

// キーワードと市場カテゴリーのマッピング
const KEYWORD_TO_MARKET: { [key: string]: string[] } = {
  // サプリメント系
  'サプリ': ['サプリメント'],
  'supplement': ['サプリメント'],
  'ビタミン': ['サプリメント'],
  'ミネラル': ['サプリメント'],
  'アミノ酸': ['サプリメント'],
  
  // 健康食品系
  '青汁': ['青汁'],
  'プロテイン': ['プロテイン'],
  'protein': ['プロテイン'],
  '酵素': ['酵素'],
  '乳酸菌': ['乳酸菌'],
  'ヨーグルト': ['乳酸菌'],
  
  // 美容系
  '化粧': ['化粧品', 'スキンケア'],
  'コスメ': ['化粧品'],
  'スキンケア': ['スキンケア'],
  '美容液': ['美容液'],
  'セラム': ['美容液'],
  'オールインワン': ['オールインワン'],
  'シャンプー': ['シャンプー'],
  '育毛': ['育毛剤'],
  '美顔器': ['美顔器'],
  
  // ダイエット系
  'ダイエット': ['ダイエット食品', 'ダイエットサプリ'],
  '痩せ': ['ダイエット食品'],
  '置き換え': ['置き換えダイエット'],
  'シェイク': ['置き換えダイエット'],
  
  // 宅配系
  '宅配': ['宅配食'],
  'ミールキット': ['ミールキット'],
  '冷凍弁当': ['冷凍宅配食'],
  '宅食': ['宅配食'],
  
  // その他
  'CBD': ['CBD'],
  '睡眠': ['睡眠サポート'],
  'スリープ': ['睡眠サポート']
}

export class MarketAnalyzer {
  // 商品情報から市場規模を分析
  analyzeMarket(productData: any): {
    marketSize: string
    marketCategory: string
    marketDefinition: string
    marketType: 'マス' | 'ニッチ'
    confidence: string
    reasoning: string[]
  } {
    const candidates = this.findMarketCandidates(productData)
    
    if (candidates.length === 0) {
      return this.estimateUnknownMarket(productData)
    }
    
    // 最も適合度の高い市場を選択
    const bestMatch = this.selectBestMarket(candidates, productData)
    
    // 市場タイプの判定
    const marketType = this.determineMarketType(bestMatch.market, productData)
    
    return {
      marketSize: `約${bestMatch.market.marketSize.toLocaleString()}億円`,
      marketCategory: bestMatch.market.marketCategory,
      marketDefinition: bestMatch.market.marketDefinition,
      marketType: marketType.type,
      confidence: bestMatch.confidence,
      reasoning: marketType.reasoning
    }
  }
  
  // 市場候補を探す
  private findMarketCandidates(productData: any): Array<{market: MarketData, score: number, matchedKeywords: string[]}> {
    const candidates: Array<{market: MarketData, score: number, matchedKeywords: string[]}> = []
    
    // 分析対象のテキストを結合
    const searchText = this.createSearchText(productData).toLowerCase()
    
    // キーワードマッチング
    for (const [keyword, markets] of Object.entries(KEYWORD_TO_MARKET)) {
      if (searchText.includes(keyword.toLowerCase())) {
        for (const marketName of markets) {
          const market = JAPAN_MARKET_DATA[marketName]
          if (market) {
            const existingCandidate = candidates.find(c => c.market === market)
            if (existingCandidate) {
              existingCandidate.score += 10
              existingCandidate.matchedKeywords.push(keyword)
            } else {
              candidates.push({
                market: { ...market, marketCategory: marketName },
                score: 10,
                matchedKeywords: [keyword]
              })
            }
          }
        }
      }
    }
    
    // カテゴリー情報からの推測
    if (productData.category) {
      const categoryLower = productData.category.toLowerCase()
      for (const [marketName, market] of Object.entries(JAPAN_MARKET_DATA)) {
        if (categoryLower.includes(marketName.toLowerCase()) || 
            market.marketCategory.toLowerCase() === categoryLower) {
          const existingCandidate = candidates.find(c => c.market === market)
          if (existingCandidate) {
            existingCandidate.score += 20
          } else {
            candidates.push({
              market: { ...market, marketCategory: marketName },
              score: 20,
              matchedKeywords: ['カテゴリー一致']
            })
          }
        }
      }
    }
    
    // 構造化データからの推測
    if (productData.structuredData) {
      const structuredText = JSON.stringify(productData.structuredData).toLowerCase()
      for (const [keyword, markets] of Object.entries(KEYWORD_TO_MARKET)) {
        if (structuredText.includes(keyword.toLowerCase())) {
          for (const marketName of markets) {
            const market = JAPAN_MARKET_DATA[marketName]
            if (market) {
              const existingCandidate = candidates.find(c => c.market === market)
              if (existingCandidate) {
                existingCandidate.score += 5
              }
            }
          }
        }
      }
    }
    
    return candidates.sort((a, b) => b.score - a.score)
  }
  
  // 検索用テキストの作成
  private createSearchText(productData: any): string {
    const texts = [
      productData.productName || '',
      productData.title || '',
      productData.category || '',
      productData.description || '',
      ...(productData.features || []),
      ...(productData.effects || [])
    ]
    
    return texts.join(' ')
  }
  
  // 最適な市場を選択
  private selectBestMarket(
    candidates: Array<{market: MarketData, score: number, matchedKeywords: string[]}>,
    productData: any
  ): {market: MarketData, confidence: 'high' | 'medium' | 'low'} {
    const bestCandidate = candidates[0]
    
    // 信頼度の判定
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (bestCandidate.score >= 30) {
      confidence = 'high'
    } else if (bestCandidate.score >= 20) {
      confidence = 'medium'
    }
    
    // 市場の信頼度も考慮
    if (bestCandidate.market.confidence === 'low') {
      confidence = 'low'
    }
    
    return {
      market: bestCandidate.market,
      confidence
    }
  }
  
  // 市場タイプの判定
  private determineMarketType(
    market: MarketData,
    productData: any
  ): {type: 'マス' | 'ニッチ', reasoning: string[]} {
    const reasoning: string[] = []
    let massPoints = 0
    let nichePoints = 0
    
    // 1. 市場規模による判定
    if (market.marketSize >= 1000) {
      massPoints += 3
      reasoning.push(`市場規模が${market.marketSize.toLocaleString()}億円と大規模`)
    } else if (market.marketSize >= 500) {
      massPoints += 2
      reasoning.push(`市場規模が${market.marketSize.toLocaleString()}億円と中規模`)
    } else if (market.marketSize < 100) {
      nichePoints += 3
      reasoning.push(`市場規模が${market.marketSize.toLocaleString()}億円と小規模`)
    } else {
      nichePoints += 1
      reasoning.push(`市場規模が${market.marketSize.toLocaleString()}億円`)
    }
    
    // 2. 価格による判定
    const price = this.extractPrice(productData)
    if (price && price.campaign) {
      if (price.campaign <= 3000 && market.marketSize >= 100) {
        massPoints += 3
        reasoning.push(`初回価格${price.campaign}円で100億円以上の市場`)
      } else if (price.campaign > 5000) {
        nichePoints += 2
        reasoning.push(`初回価格${price.campaign}円と高価格帯`)
      }
    }
    
    // 3. カテゴリーによる判定
    const massCategories = ['健康食品', '化粧品', '食品・飲料', '日用品']
    const nicheCategories = ['美容機器', 'CBD', 'プレミアム', 'オーガニック']
    
    if (massCategories.includes(market.marketCategory)) {
      massPoints += 1
      reasoning.push(`${market.marketCategory}は一般消費財カテゴリー`)
    }
    
    if (nicheCategories.some(cat => market.marketCategory.includes(cat))) {
      nichePoints += 2
      reasoning.push(`${market.marketCategory}は専門性の高いカテゴリー`)
    }
    
    // 4. 成長率による判定
    if (market.growthRate && market.growthRate > 10) {
      nichePoints += 1
      reasoning.push(`年間成長率${market.growthRate}%の成長市場`)
    }
    
    // 5. ターゲットの広さ
    const targetKeywords = ['家族', '毎日', '日常', '誰でも', '簡単']
    const searchText = this.createSearchText(productData).toLowerCase()
    
    if (targetKeywords.some(keyword => searchText.includes(keyword))) {
      massPoints += 1
      reasoning.push('幅広いターゲット層を想定')
    }
    
    // 最終判定
    const type = massPoints > nichePoints ? 'マス' : 'ニッチ'
    
    return { type, reasoning }
  }
  
  // 価格情報の抽出
  private extractPrice(productData: any): {regular?: number, campaign?: number} | null {
    const priceInfo: {regular?: number, campaign?: number} = {}
    
    // specialPriceから
    if (productData.pricing?.specialPrice) {
      const match = productData.pricing.specialPrice.match(/[\d,]+/)
      if (match) {
        priceInfo.campaign = parseInt(match[0].replace(/,/g, ''))
      }
    }
    
    // regularPriceから
    if (productData.pricing?.regularPrice) {
      const match = productData.pricing.regularPrice.match(/[\d,]+/)
      if (match) {
        priceInfo.regular = parseInt(match[0].replace(/,/g, ''))
      }
    }
    
    // priceフィールドから
    if (!priceInfo.campaign && productData.price) {
      const priceText = productData.price.toString()
      const campaignMatch = priceText.match(/初回[^0-9]*?([\d,]+)/)
      if (campaignMatch) {
        priceInfo.campaign = parseInt(campaignMatch[1].replace(/,/g, ''))
      }
    }
    
    return Object.keys(priceInfo).length > 0 ? priceInfo : null
  }
  
  // 不明な市場の推定
  private estimateUnknownMarket(productData: any): any {
    const reasoning: string[] = ['市場データが不明なため推定値を使用']
    
    // カテゴリーから大まかな市場規模を推定
    let estimatedSize = 100 // デフォルト
    let category = 'その他'
    
    const categoryText = (productData.category || '').toLowerCase()
    
    if (categoryText.includes('食') || categoryText.includes('food')) {
      estimatedSize = 500
      category = '食品関連'
      reasoning.push('食品カテゴリーとして推定')
    } else if (categoryText.includes('美容') || categoryText.includes('化粧')) {
      estimatedSize = 300
      category = '美容関連'
      reasoning.push('美容カテゴリーとして推定')
    } else if (categoryText.includes('健康')) {
      estimatedSize = 200
      category = '健康関連'
      reasoning.push('健康カテゴリーとして推定')
    }
    
    // 価格から市場タイプを推定
    const price = this.extractPrice(productData)
    let marketType: 'マス' | 'ニッチ' = 'ニッチ'
    
    if (price?.campaign && price.campaign <= 3000) {
      marketType = 'マス'
      reasoning.push('低価格帯のためマス市場と推定')
    }
    
    return {
      marketSize: `約${estimatedSize}億円（推定）`,
      marketCategory: category,
      marketDefinition: '詳細な市場データなし',
      marketType,
      confidence: 'low',
      reasoning
    }
  }
}