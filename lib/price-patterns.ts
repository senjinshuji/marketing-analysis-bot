// Common price patterns found in Japanese landing pages
export const pricePatterns = {
  // 初回限定価格パターン
  initialPrice: [
    '初回限定',
    '初回特別価格',
    '初回お試し価格',
    '初回のみ',
    '初回購入',
    '初回半額',
    '初回割引'
  ],
  
  // トライアル価格パターン
  trialPrice: [
    'お試し価格',
    'トライアル価格',
    'お試しセット',
    'トライアルセット',
    'モニター価格',
    'サンプル価格',
    '体験価格'
  ],
  
  // キャンペーン価格パターン
  campaignPrice: [
    '今だけ',
    '期間限定',
    'キャンペーン価格',
    '特別価格',
    '限定価格',
    'セール価格',
    '割引価格'
  ],
  
  // 定期購入初回価格パターン
  subscriptionPrice: [
    '定期初回',
    '定期便初回',
    '定期コース初回',
    '定期購入初回',
    '定期申込',
    '定期特価'
  ],
  
  // 価格表示パターン（980円などの特徴的な価格）
  commonPrices: [
    '980円',
    '1,980円',
    '2,980円',
    '500円',
    '1,500円',
    '100円',
    '1円'
  ],
  
  // 割引率パターン
  discountPatterns: [
    '%OFF',
    '%オフ',
    '割引',
    '半額',
    'HALF',
    '○○%引き'
  ]
}

// LP価格検出のヒント
export function generatePriceDetectionHints(url: string): string {
  const domain = new URL(url).hostname.toLowerCase()
  
  // ドメインに基づいた推測
  let hints = '【価格検出のヒント】\n'
  
  // 健康食品・サプリメント系
  if (domain.includes('supplement') || domain.includes('health') || domain.includes('diet')) {
    hints += '- 健康食品/サプリメント系LPでは初回980円、1,980円が一般的\n'
    hints += '- 定期購入の初回特別価格を探してください\n'
  }
  
  // 化粧品・美容系
  if (domain.includes('cosme') || domain.includes('beauty') || domain.includes('skin')) {
    hints += '- 化粧品系LPでは初回1,980円、2,980円が一般的\n'
    hints += '- トライアルセット価格を探してください\n'
  }
  
  // 食品・宅配系
  if (domain.includes('food') || domain.includes('delivery') || domain.includes('takuhai')) {
    hints += '- 食品宅配系では初回お試し価格が設定されていることが多い\n'
    hints += '- 送料込みの価格表示に注意してください\n'
  }
  
  hints += '\n一般的なLP構成：\n'
  hints += '1. ファーストビューに大きく初回価格を表示\n'
  hints += '2. 通常価格からの割引率（50%OFF、80%OFFなど）を強調\n'
  hints += '3. 「今だけ」「期間限定」などの限定性アピール\n'
  hints += '4. 購入ボタン付近に価格を再度表示\n'
  
  return hints
}