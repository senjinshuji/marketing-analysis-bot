'use client'

import { useState } from 'react'

interface AnalysisDebugProps {
  debugData: {
    phase1?: {
      prompt: string
      response: any
      timing: number
    }
    phase2?: {
      prompt: string
      response: any
      timing: number
    }
    scrapedData?: any
  }
}

export default function AnalysisDebug({ debugData }: AnalysisDebugProps) {
  const [showPhase1, setShowPhase1] = useState(false)
  const [showPhase2, setShowPhase2] = useState(false)
  const [showScraped, setShowScraped] = useState(false)

  return (
    <div className="mt-8 bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        🔍 GPT分析プロセス詳細
      </h2>

      {/* スクレイピングデータ */}
      <div className="mb-4">
        <button
          onClick={() => setShowScraped(!showScraped)}
          className="flex items-center justify-between w-full text-left bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-900">
            📊 取得した商品データ
          </span>
          <span className="text-gray-500">{showScraped ? '▼' : '▶'}</span>
        </button>
        {showScraped && debugData.scrapedData && (
          <div className="mt-2 bg-white rounded-lg p-4 border border-gray-200">
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {JSON.stringify(debugData.scrapedData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* フェーズ1 */}
      {debugData.phase1 && (
        <div className="mb-4">
          <button
            onClick={() => setShowPhase1(!showPhase1)}
            className="flex items-center justify-between w-full text-left bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">
              📝 フェーズ1: マーケティングリサーチ分析
              <span className="text-sm text-gray-500 ml-2">
                ({debugData.phase1.timing}ms)
              </span>
            </span>
            <span className="text-gray-500">{showPhase1 ? '▼' : '▶'}</span>
          </button>
          {showPhase1 && (
            <div className="mt-2 space-y-2">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">送信プロンプト:</h4>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                  {debugData.phase1.prompt}
                </pre>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">GPT応答:</h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(debugData.phase1.response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* フェーズ2 */}
      {debugData.phase2 && (
        <div className="mb-4">
          <button
            onClick={() => setShowPhase2(!showPhase2)}
            className="flex items-center justify-between w-full text-left bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900">
              🎯 フェーズ2: 媒体分類・獲得戦略
              <span className="text-sm text-gray-500 ml-2">
                ({debugData.phase2.timing}ms)
              </span>
            </span>
            <span className="text-gray-500">{showPhase2 ? '▼' : '▶'}</span>
          </button>
          {showPhase2 && (
            <div className="mt-2 space-y-2">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">送信プロンプト:</h4>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                  {debugData.phase2.prompt}
                </pre>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">GPT応答:</h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(debugData.phase2.response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 分析ロジック説明 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">🤖 分析ロジック</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• フェーズ1: 商品情報を基に市場分析とペルソナを生成</li>
          <li>• フェーズ2: フェーズ1の結果を基に最適な広告媒体を選定</li>
          <li>• 媒体選定は市場タイプ（ニッチ/マス）と行動動機で決定</li>
          <li>• 35種類の広告媒体から最適な3つを自動選択</li>
        </ul>
      </div>
    </div>
  )
}