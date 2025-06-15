import { NextRequest, NextResponse } from 'next/server'
import { GPTAnalyzer } from '../../../lib/gpt-analyzer'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    // テスト用のスクレイピングデータ（実際のLPを想定）
    const testScrapedData = {
      url: url,
      title: '健康サプリメント - 公式サイト',
      description: '健康維持をサポートする高品質サプリメント。初回限定特別価格でお試しいただけます。',
      price: '通常価格: 5,980円',
      category: '健康食品・サプリメント',
      features: [
        '初回限定980円（83%OFF）の特別価格',
        '送料無料',
        '30日間返金保証',
        '定期縛りなし',
        '管理栄養士監修'
      ]
    }
    
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey || apiKey === 'your-api-key-here') {
      return NextResponse.json({
        error: 'OpenAI APIキーが設定されていません',
        testData: testScrapedData
      }, { status: 400 })
    }
    
    const gptAnalyzer = new GPTAnalyzer(apiKey)
    
    // Phase 1のみ実行してテスト
    const phase1Result = await gptAnalyzer.executePhase1Analysis(testScrapedData)
    
    return NextResponse.json({
      success: true,
      testData: testScrapedData,
      phase1Result: phase1Result,
      priceDetection: {
        regularPrice: phase1Result.pricing?.regularPrice,
        specialPrice: phase1Result.pricing?.specialPrice,
        campaign: phase1Result.pricing?.campaign
      }
    })
    
  } catch (error: any) {
    console.error('テストエラー:', error)
    return NextResponse.json({
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
}