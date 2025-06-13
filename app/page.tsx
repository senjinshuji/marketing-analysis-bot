'use client'

import { useState } from 'react'
import URLInput from './components/URLInput'
import AnalysisResult from './components/AnalysisResult'

export default function Home() {
  const [analysisData, setAnalysisData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async (url: string) => {
    setIsLoading(true)
    try {
      // Edge functionを使用（タイムアウトなし）
      const response = await fetch('/api/analyze-edge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      
      if (!response.ok) {
        // フォールバックとして通常のAPIを試す
        console.log('Edge functionが失敗、通常APIを試します')
        const fallbackResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        })
        
        if (!fallbackResponse.ok) {
          throw new Error('分析に失敗しました')
        }
        
        const data = await fallbackResponse.json()
        setAnalysisData(data)
      } else {
        const data = await response.json()
        setAnalysisData(data)
      }
    } catch (error) {
      console.error('分析エラー:', error)
      alert('分析に失敗しました。URLを確認してください。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            マーケティング戦略分析Bot
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            商品URLを入力するだけで、詳細な市場分析と最適な広告戦略を自動生成します
          </p>
        </header>

        <div className="space-y-8">
          <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} />
          
          {analysisData && (
            <AnalysisResult data={analysisData} />
          )}
        </div>
      </div>
    </main>
  )
}