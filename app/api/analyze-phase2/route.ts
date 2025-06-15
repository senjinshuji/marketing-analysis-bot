import { NextRequest, NextResponse } from 'next/server'
import { GPTAnalyzer } from '../../../lib/gpt-analyzer'
import { marketingTemplate } from '../../../lib/marketing-template'
import { getRecommendedCreatives } from '../../../lib/creative-references'

export async function POST(request: NextRequest) {
  try {
    const { phase1Result, scrapedData, debugData } = await request.json()
    
    if (!phase1Result || !scrapedData) {
      return NextResponse.json({ error: 'フェーズ1の結果が必要です' }, { status: 400 })
    }
    
    // フェーズ2を実行
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && apiKey !== 'your-api-key-here') {
      const gptAnalyzer = new GPTAnalyzer(apiKey)
      const startTime = Date.now()
      const phase2Result = await gptAnalyzer.executePhase2Analysis(scrapedData, phase1Result, marketingTemplate)
      const timing = Date.now() - startTime
      
      // 推奨媒体IDを取得
      const recommendedMediaIds = phase2Result.recommendations?.media?.map((m: any) => m.mediaId) || []
      
      // 参考クリエイティブを取得
      const creativeReferences = getRecommendedCreatives(
        phase2Result.classification?.marketType || '',
        phase2Result.classification?.actionReason || '',
        recommendedMediaIds
      )
      
      // 結果を統合
      const finalResult = {
        ...phase1Result,
        ...phase2Result,
        demographics: phase1Result.demographics || {
          ageRange: `${phase1Result.persona?.profile?.age || '35歳'}を中心とした年齢層`,
          gender: phase1Result.persona?.profile?.gender || '男女両方',
          otherCharacteristics: phase1Result.persona?.profile?.familyStructure || '一般的な消費者層'
        },
        creativeReferences,
        // スクレイピングデータを含める（LP診断用）
        scrapedData: scrapedData,
        debug: {
          ...debugData,
          phase2: {
            prompt: gptAnalyzer.getLastPhase2Prompt(),
            response: phase2Result,
            timing: timing
          }
        }
      }
      
      return NextResponse.json(finalResult)
    }
    
    // APIキーがない場合
    return NextResponse.json({
      error: 'APIキーが設定されていません'
    }, { status: 500 })
    
  } catch (error) {
    console.error('フェーズ2エラー:', error)
    return NextResponse.json(
      { error: 'フェーズ2の分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}