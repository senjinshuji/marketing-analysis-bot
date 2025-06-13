import { NextRequest, NextResponse } from 'next/server'
import { GPTAnalyzer } from '../../../lib/gpt-analyzer'
import { marketingTemplate } from '../../../lib/marketing-template'

export async function POST(request: NextRequest) {
  try {
    const { phase1Result, scrapedData } = await request.json()
    
    if (!phase1Result || !scrapedData) {
      return NextResponse.json({ error: 'フェーズ1の結果が必要です' }, { status: 400 })
    }
    
    // フェーズ2を実行
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey && apiKey !== 'your-api-key-here') {
      const gptAnalyzer = new GPTAnalyzer(apiKey)
      const phase2Result = await gptAnalyzer.executePhase2Analysis(scrapedData, phase1Result, marketingTemplate)
      
      // 結果を統合
      const finalResult = {
        ...phase1Result,
        ...phase2Result,
        demographics: phase1Result.demographics || {
          ageRange: `${phase1Result.persona?.profile?.age || '35歳'}を中心とした年齢層`,
          gender: phase1Result.persona?.profile?.gender || '男女両方',
          otherCharacteristics: phase1Result.persona?.profile?.familyStructure || '一般的な消費者層'
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