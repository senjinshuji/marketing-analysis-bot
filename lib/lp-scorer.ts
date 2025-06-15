// LP診断スコア計算機能

export interface LPScoreResult {
  totalScore: number
  maxScore: number
  percentage: number
  categories: {
    productInfo: ScoreDetail
    valueProposition: ScoreDetail
    credibility: ScoreDetail
    targetClarity: ScoreDetail
    offerStrength: ScoreDetail
    userExperience: ScoreDetail
  }
  recommendation: string
  improvements: string[]
}

interface ScoreDetail {
  score: number
  maxScore: number
  items: {
    name: string
    found: boolean
    importance: 'high' | 'medium' | 'low'
  }[]
}

type CategoryKey = 'productInfo' | 'valueProposition' | 'credibility' | 'targetClarity' | 'offerStrength' | 'userExperience'

export function calculateLPScore(analysisData: any): LPScoreResult {
  const categories = {
    // 1. 商品情報の充実度（30点）
    productInfo: evaluateProductInfo(analysisData),
    
    // 2. 価値提案の明確さ（20点）
    valueProposition: evaluateValueProposition(analysisData),
    
    // 3. 信頼性・権威性（20点）
    credibility: evaluateCredibility(analysisData),
    
    // 4. ターゲットの明確さ（15点）
    targetClarity: evaluateTargetClarity(analysisData),
    
    // 5. オファーの魅力度（10点）
    offerStrength: evaluateOfferStrength(analysisData),
    
    // 6. ユーザー体験（5点）
    userExperience: evaluateUserExperience(analysisData)
  }
  
  const totalScore = Object.values(categories).reduce((sum, cat) => sum + cat.score, 0)
  const maxScore = 100
  const percentage = Math.round((totalScore / maxScore) * 100)
  
  return {
    totalScore,
    maxScore,
    percentage,
    categories,
    recommendation: getRecommendation(percentage),
    improvements: getImprovements(categories)
  }
}

function evaluateProductInfo(data: any): ScoreDetail {
  const items = [
    { name: '商品名', found: !!data.productInfo?.productName && data.productInfo.productName !== '取得中...', importance: 'high' as const },
    { name: 'カテゴリー', found: !!data.productInfo?.category && data.productInfo.category !== '分析中...', importance: 'medium' as const },
    { name: 'サイズ・容量', found: !!data.productInfo?.sizeCapacity, importance: 'medium' as const },
    { name: '機能・特徴（3つ以上）', found: data.productInfo?.features?.length >= 3, importance: 'high' as const },
    { name: '効果・ベネフィット', found: data.productInfo?.effects?.length > 0, importance: 'high' as const },
    { name: '価格情報', found: !!data.pricing?.regularPrice, importance: 'high' as const },
    { name: '商品画像', found: true, importance: 'medium' as const } // 画像は現状判定が難しいため仮でtrue
  ]
  
  const score = calculateCategoryScore(items, 30)
  return { score, maxScore: 30, items }
}

function evaluateValueProposition(data: any): ScoreDetail {
  const items = [
    { name: '機能的価値', found: data.valueProposition?.functionalValue?.length > 0, importance: 'high' as const },
    { name: '情緒的価値', found: !!data.valueProposition?.emotionalValue, importance: 'high' as const },
    { name: '独自性・差別化', found: checkUniqueness(data), importance: 'high' as const },
    { name: '課題解決の明示', found: checkProblemSolving(data), importance: 'medium' as const }
  ]
  
  const score = calculateCategoryScore(items, 20)
  return { score, maxScore: 20, items }
}

function evaluateCredibility(data: any): ScoreDetail {
  const items = [
    { name: 'RTB（根拠）', found: !!data.productInfo?.rtb && data.productInfo.rtb !== '信頼性を分析中...', importance: 'high' as const },
    { name: '権威性', found: !!data.productInfo?.authority && data.productInfo.authority !== '権威性を分析中...', importance: 'high' as const },
    { name: '実績・数値データ', found: checkPerformanceData(data), importance: 'medium' as const },
    { name: 'お客様の声', found: false, importance: 'medium' as const }, // 現状判定が難しい
    { name: '保証・返金制度', found: checkGuarantee(data), importance: 'low' as const }
  ]
  
  const score = calculateCategoryScore(items, 20)
  return { score, maxScore: 20, items }
}

function evaluateTargetClarity(data: any): ScoreDetail {
  const items = [
    { name: 'ペルソナの具体性', found: !!data.persona?.profile?.age, importance: 'high' as const },
    { name: 'デモグラフィック情報', found: !!data.demographics?.ageRange, importance: 'medium' as const },
    { name: '課題・悩みの明確化', found: !!data.persona?.journey?.situation, importance: 'high' as const },
    { name: 'ライフスタイル情報', found: !!data.persona?.profile?.lifestyle, importance: 'low' as const }
  ]
  
  const score = calculateCategoryScore(items, 15)
  return { score, maxScore: 15, items }
}

function evaluateOfferStrength(data: any): ScoreDetail {
  const items = [
    { name: '特別価格・割引', found: !!data.pricing?.specialPrice, importance: 'high' as const },
    { name: 'キャンペーン情報', found: !!data.pricing?.campaign, importance: 'medium' as const },
    { name: '限定性（期間・数量）', found: checkLimitedOffer(data), importance: 'medium' as const },
    { name: '特典・ボーナス', found: false, importance: 'low' as const }
  ]
  
  const score = calculateCategoryScore(items, 10)
  return { score, maxScore: 10, items }
}

function evaluateUserExperience(data: any): ScoreDetail {
  const items = [
    { name: '購入方法の明確さ', found: !!data.pricing?.salesChannel, importance: 'high' as const },
    { name: 'FAQ・よくある質問', found: false, importance: 'low' as const },
    { name: 'お問い合わせ情報', found: false, importance: 'low' as const }
  ]
  
  const score = calculateCategoryScore(items, 5)
  return { score, maxScore: 5, items }
}

function calculateCategoryScore(items: { found: boolean; importance: 'high' | 'medium' | 'low' }[], maxScore: number): number {
  const weights = { high: 3, medium: 2, low: 1 }
  const totalWeight = items.reduce((sum, item) => sum + weights[item.importance], 0)
  const achievedWeight = items.reduce((sum, item) => item.found ? sum + weights[item.importance] : sum, 0)
  
  return Math.round((achievedWeight / totalWeight) * maxScore)
}

function checkUniqueness(data: any): boolean {
  const features = data.productInfo?.features || []
  const description = data.productInfo?.description || ''
  return features.some((f: string) => f.includes('独自') || f.includes('初') || f.includes('唯一')) ||
         description.includes('独自') || description.includes('初')
}

function checkProblemSolving(data: any): boolean {
  const features = data.productInfo?.features || []
  const effects = data.productInfo?.effects || []
  return features.some((f: string) => f.includes('解決') || f.includes('改善')) ||
         effects.some((e: string) => e.includes('解決') || e.includes('改善'))
}

function checkPerformanceData(data: any): boolean {
  const rtb = data.productInfo?.rtb || ''
  const authority = data.productInfo?.authority || ''
  return /\d+/.test(rtb) || /\d+/.test(authority) // 数値が含まれているかチェック
}

function checkGuarantee(data: any): boolean {
  const features = data.productInfo?.features || []
  const description = data.productInfo?.description || ''
  return features.some((f: string) => f.includes('保証') || f.includes('返金')) ||
         description.includes('保証') || description.includes('返金')
}

function checkLimitedOffer(data: any): boolean {
  const campaign = data.pricing?.campaign || ''
  return campaign.includes('限定') || campaign.includes('先着') || campaign.includes('期間')
}

function getRecommendation(percentage: number): string {
  if (percentage >= 80) {
    return '優秀：このLPは十分な情報を提供しており、広告運用を開始できます。'
  } else if (percentage >= 60) {
    return '良好：基本的な情報は揃っていますが、いくつかの改善点があります。'
  } else if (percentage >= 40) {
    return '要改善：広告効果を高めるために、LPの改善を推奨します。'
  } else {
    return '要再設計：商品コンセプトから見直し、LPを再設計することを強く推奨します。'
  }
}

function getImprovements(categories: LPScoreResult['categories']): string[] {
  const improvements: string[] = []
  
  Object.entries(categories).forEach(([key, detail]) => {
    const missingHighPriority = detail.items.filter((item) => 
      !item.found && item.importance === 'high'
    )
    
    missingHighPriority.forEach((item) => {
      switch(key as CategoryKey) {
        case 'productInfo':
          improvements.push(`商品情報：${item.name}を明記してください`)
          break
        case 'valueProposition':
          improvements.push(`価値提案：${item.name}を明確にしてください`)
          break
        case 'credibility':
          improvements.push(`信頼性：${item.name}を追加してください`)
          break
        case 'targetClarity':
          improvements.push(`ターゲット：${item.name}を具体化してください`)
          break
        case 'offerStrength':
          improvements.push(`オファー：${item.name}を検討してください`)
          break
      }
    })
  })
  
  return improvements.slice(0, 5) // 上位5つの改善点を返す
}