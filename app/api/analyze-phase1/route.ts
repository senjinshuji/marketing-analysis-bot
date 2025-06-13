import { NextRequest, NextResponse } from 'next/server'
import { WebScraper } from '../../../lib/scraper-simple'
import { GPTAnalyzer } from '../../../lib/gpt-analyzer'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URLが必要です' }, { status: 400 })
    }
    
    const scraper = new WebScraper()
    
    try {
      // スクレイピング実行
      let scrapedData
      if (url.includes('tsukurioki.jp')) {
        scrapedData = await scraper.scrapeTsukurioki(url)
      } else {
        scrapedData = await scraper.scrapeUrl(url)
      }
      
      scrapedData.url = url
      
      // フェーズ1のみ実行
      const apiKey = process.env.OPENAI_API_KEY
      if (apiKey && apiKey !== 'your-api-key-here') {
        const gptAnalyzer = new GPTAnalyzer(apiKey)
        const startTime = Date.now()
        const phase1Result = await gptAnalyzer.executePhase1Analysis(scrapedData)
        const timing = Date.now() - startTime
        
        // デバッグ情報を含める
        return NextResponse.json({
          phase1: phase1Result,
          scrapedData: scrapedData,
          status: 'phase1_complete',
          debug: {
            phase1: {
              prompt: gptAnalyzer.getLastPhase1Prompt(),
              response: phase1Result,
              timing: timing
            },
            scrapedData: scrapedData
          }
        })
      }
      
      // APIキーがない場合
      return NextResponse.json({
        error: 'APIキーが設定されていません',
        scrapedData: scrapedData
      }, { status: 500 })
      
    } finally {
      await scraper.close()
    }
    
  } catch (error) {
    console.error('フェーズ1エラー:', error)
    return NextResponse.json(
      { error: 'フェーズ1の分析中にエラーが発生しました' },
      { status: 500 }
    )
  }
}