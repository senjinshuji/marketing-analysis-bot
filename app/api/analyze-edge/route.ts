import { NextRequest } from 'next/server'

// Edge Runtime を使用（タイムアウトなし）
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URLが必要です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // OpenAI APIを直接呼び出し
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'APIキーが設定されていません' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // フェーズ1: 基本分析
    const phase1Response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: `あなたは日本のデジタルマーケティング戦略の専門家です。商品URLから詳細な市場分析を行います。`
          },
          {
            role: 'user',
            content: `URL: ${url}\n\n商品の基本情報、市場分析、ペルソナを分析してJSON形式で出力してください。`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    })
    
    const phase1Data = await phase1Response.json()
    const phase1Result = JSON.parse(phase1Data.choices[0].message.content)
    
    // フェーズ2: 媒体戦略
    const phase2Response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-0125-preview',
        messages: [
          {
            role: 'system',
            content: `あなたは広告媒体戦略の専門家です。商品分析結果から最適な広告戦略を提案します。`
          },
          {
            role: 'user',
            content: `分析結果: ${JSON.stringify(phase1Result)}\n\n市場タイプ（ニッチ/マス）、行動動機、推奨媒体を分析してJSON形式で出力してください。`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    })
    
    const phase2Data = await phase2Response.json()
    const phase2Result = JSON.parse(phase2Data.choices[0].message.content)
    
    // 結果を統合
    const finalResult = {
      ...phase1Result,
      ...phase2Result
    }
    
    return new Response(
      JSON.stringify(finalResult),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: '分析中にエラーが発生しました' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}