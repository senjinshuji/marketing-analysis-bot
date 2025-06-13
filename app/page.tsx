'use client'

import { useState } from 'react'
import URLInput from './components/URLInput'
import AnalysisResult from './components/AnalysisResult'
import AnalysisDebug from './components/AnalysisDebug'

export default function Home() {
  const [analysisData, setAnalysisData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'phase1' | 'phase2' | 'complete'>('idle')
  const [debugData, setDebugData] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  const handleAnalyze = async (url: string) => {
    setIsLoading(true)
    setPhase('phase1')
    try {
      // フェーズ1: 基本分析
      const phase1Response = await fetch('/api/analyze-phase1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      
      if (!phase1Response.ok) {
        throw new Error('フェーズ1の分析に失敗しました')
      }
      
      const phase1Data = await phase1Response.json()
      console.log('フェーズ1完了:', phase1Data)
      
      // デバッグデータを保存
      if (phase1Data.debug) {
        setDebugData(phase1Data.debug)
      }
      
      // フェーズ2: 媒体戦略
      setPhase('phase2')
      const phase2Response = await fetch('/api/analyze-phase2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase1Result: phase1Data.phase1,
          scrapedData: phase1Data.scrapedData,
          debugData: phase1Data.debug
        }),
      })
      
      if (!phase2Response.ok) {
        // フェーズ2が失敗してもフェーズ1の結果を表示
        console.error('フェーズ2失敗、フェーズ1の結果のみ表示')
        setAnalysisData(phase1Data.phase1)
      } else {
        const finalData = await phase2Response.json()
        setAnalysisData(finalData)
        
        // デバッグデータを更新
        if (finalData.debug) {
          setDebugData(finalData.debug)
        }
      }
      
      setPhase('complete')
    } catch (error) {
      console.error('分析エラー:', error)
      alert('分析に失敗しました。URLを確認してください。')
      setPhase('idle')
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
          <URLInput onAnalyze={handleAnalyze} isLoading={isLoading} phase={phase} />
          
          {analysisData && (
            <>
              <AnalysisResult data={analysisData} />
              
              {/* デバッグモードトグル */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  {showDebug ? 'GPT分析プロセスを非表示' : 'GPT分析プロセスを表示'}
                </button>
              </div>
              
              {/* デバッグ情報 */}
              {showDebug && debugData && (
                <AnalysisDebug debugData={debugData} />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}