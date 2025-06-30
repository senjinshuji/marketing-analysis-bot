import { NextRequest, NextResponse } from 'next/server'
import { generateImprovedScript } from '../../../lib/gpt-script-generator-improved'
import { getIntentAnalysis } from '../../../lib/intent-analysis-data'
import { getAnalysisFromStatic } from '../../../lib/csv-analysis-static'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      intentId, 
      productInfo, 
      videoConfig = {
        seconds: '60-90秒',
        structure: 'フック→問題提起→解決策→権威付け→オファー→CTA',
        detail: '具体的なセリフとト書き'
      }
    } = body

    // 意図IDから分析データを取得
    const intentAnalysis = getIntentAnalysis(intentId)
    if (!intentAnalysis) {
      return NextResponse.json(
        { error: '指定された意図IDが見つかりません' },
        { status: 400 }
      )
    }

    // CSVの静的分析データを取得
    const csvAnalysis = getAnalysisFromStatic(intentId)
    if (!csvAnalysis) {
      return NextResponse.json(
        { error: 'CSV分析データが見つかりません' },
        { status: 400 }
      )
    }

    // 改善されたGPT生成を実行
    const script = await generateImprovedScript(
      intentId,
      productInfo,
      csvAnalysis,
      videoConfig
    )

    return NextResponse.json({
      success: true,
      script,
      metadata: {
        intentId,
        intentName: intentAnalysis.intentName,
        generatedAt: new Date().toISOString(),
        method: 'two-step-gpt' // 2段階GPT処理
      }
    })

  } catch (error: any) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { 
        error: 'Script generation failed', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// 使用例のリクエストボディ
/*
{
  "intentId": "7-female-concept-denial",
  "productInfo": {
    "productName": "スカルプDボーテ",
    "offer": "初回限定1,680円（通常5,000円）",
    "price": "1,680円",
    "features": [
      "泡立たないクリームシャンプー",
      "天然由来成分95%",
      "ノンシリコン処方"
    ],
    "target": "30-40代女性",
    "authority": "Amazon売上No.1、美容雑誌掲載多数",
    "guarantee": "30日間返金保証"
  },
  "videoConfig": {
    "seconds": "60-90秒",
    "structure": "フック→問題提起→解決策→権威付け→オファー→CTA",
    "detail": "具体的なセリフとト書き"
  }
}
*/