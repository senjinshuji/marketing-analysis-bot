// 参考クリエイティブデータベース
// 自動生成されたファイル - 2025-06-13T09:52:41.331Z

export interface CreativeReference {
  id: string
  mediaId: string
  mediaName: string
  target: string
  method: string
  creativeUrl?: string
  description?: string
  performance?: string
  tags?: string[]
}

export const creativeReferences: CreativeReference[] = [
  {
    "id": "creative_001",
    "mediaId": "7",
    "mediaName": "デマンドロング",
    "target": "YT面限定",
    "method": "語り",
    "creativeUrl": "https://example.com/creative/001",
    "description": "共働き家庭の悩みを描いたストーリー動画",
    "performance": "CTR 2.5%・CVR 1.2%",
    "tags": [
      "共感型・ストーリー・家族"
    ]
  },
  {
    "id": "creative_002",
    "mediaId": "25",
    "mediaName": "meta",
    "target": "ストーリー・リールメイン",
    "method": "語り",
    "creativeUrl": "https://example.com/creative/002",
    "description": "実際の利用者の声を集めたショート動画",
    "performance": "CTR 3.1%・CVR 1.5%",
    "tags": [
      "UGC・実績訴求・リアル"
    ]
  },
  {
    "id": "creative_003",
    "mediaId": "31",
    "mediaName": "meta",
    "target": "正方形",
    "method": "バナー",
    "creativeUrl": "https://example.com/creative/003",
    "description": "商品画像と価格訴求のシンプルバナー",
    "performance": "CTR 1.8%・CVR 0.9%",
    "tags": [
      "価格訴求・シンプル・直接的"
    ]
  },
  {
    "id": "creative_004",
    "mediaId": "1",
    "mediaName": "リスティング",
    "target": "指名検索",
    "method": "指名入札",
    "creativeUrl": "https://example.com/creative/004",
    "description": "ブランド名での検索広告",
    "performance": "CTR 15%・CVR 5%",
    "tags": [
      "指名・ブランド・高CVR"
    ]
  },
  {
    "id": "creative_005",
    "mediaId": "2",
    "mediaName": "リスティング",
    "target": "一般検索",
    "method": "一般入札",
    "creativeUrl": "https://example.com/creative/005",
    "description": "課題解決型の検索広告文",
    "performance": "CTR 3.5%・CVR 2.1%",
    "tags": [
      "課題解決・一般・検索意図"
    ]
  },
  {
    "id": "creative_006",
    "mediaId": "19",
    "mediaName": "ByteDance",
    "target": "tiktok限定",
    "method": "語り",
    "creativeUrl": "https://example.com/creative/006",
    "description": "インフルエンサーによる商品紹介",
    "performance": "CTR 4.2%・CVR 1.8%",
    "tags": [
      "インフルエンサー・若年層・トレンド"
    ]
  },
  {
    "id": "creative_007",
    "mediaId": "10",
    "mediaName": "デマンドロング",
    "target": "YT面限定",
    "method": "ドラマ",
    "creativeUrl": "https://example.com/creative/007",
    "description": "日常の悩みを再現したドラマ仕立て",
    "performance": "CTR 2.8%・CVR 1.4%",
    "tags": [
      "ドラマ・共感・ストーリー"
    ]
  },
  {
    "id": "creative_008",
    "mediaId": "32",
    "mediaName": "LINE",
    "target": "apng",
    "method": "文字のみ",
    "creativeUrl": "https://example.com/creative/008",
    "description": "LINEトーク風の訴求",
    "performance": "CTR 2.2%・CVR 1.1%",
    "tags": [
      "LINE・親近感・コミュニケーション"
    ]
  }
];

// 市場タイプと行動理由から参考クリエイティブを取得
export function getRecommendedCreatives(
  marketType: string,
  actionReason: string,
  recommendedMediaIds: string[]
): CreativeReference[] {
  return creativeReferences.filter(creative => 
    recommendedMediaIds.includes(creative.mediaId)
  );
}
