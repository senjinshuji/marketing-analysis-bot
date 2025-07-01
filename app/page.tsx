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
      
      // Phase1（カスタマージャーニーまで）で完了
      setAnalysisData(phase1Data.phase1)
      
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
            LP分析・ペルソナ生成Bot
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            商品URLを入力するだけで、詳細な市場分析とカスタマージャーニーを自動生成します
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