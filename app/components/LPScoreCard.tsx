'use client'

import { LPScoreResult } from '../../lib/lp-scorer'

interface LPScoreCardProps {
  scoreData: LPScoreResult
}

export default function LPScoreCard({ scoreData }: LPScoreCardProps) {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200'
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200'
    if (percentage >= 40) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const getCategoryScore = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return { color: 'text-green-600', bg: 'bg-green-100' }
    if (percentage >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (percentage >= 40) return { color: 'text-orange-600', bg: 'bg-orange-100' }
    return { color: 'text-red-600', bg: 'bg-red-100' }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <span className="mr-2">📊</span>
        LP診断スコア
      </h2>

      {/* 総合スコア */}
      <div className={`p-6 rounded-lg border-2 mb-6 ${getScoreBgColor(scoreData.percentage)}`}>
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(scoreData.percentage)}`}>
            {scoreData.totalScore}
            <span className="text-2xl font-normal text-gray-600">/{scoreData.maxScore}</span>
          </div>
          <div className="mt-2 text-lg font-medium text-gray-700">
            {scoreData.percentage}%
          </div>
          <div className="mt-4 text-gray-700 font-medium">
            {scoreData.recommendation}
          </div>
        </div>
      </div>

      {/* カテゴリー別スコア */}
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">カテゴリー別評価</h3>
        
        {Object.entries(scoreData.categories).map(([key, category]) => {
          const { color, bg } = getCategoryScore(category.score, category.maxScore)
          const categoryNames = {
            productInfo: '商品情報の充実度',
            valueProposition: '価値提案の明確さ',
            credibility: '信頼性・権威性',
            targetClarity: 'ターゲットの明確さ',
            offerStrength: 'オファーの魅力度',
            userExperience: 'ユーザー体験'
          }
          
          return (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700">
                  {categoryNames[key as keyof typeof categoryNames]}
                </h4>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${color}`}>
                  {category.score}/{category.maxScore}点
                </span>
              </div>
              
              {/* プログレスバー */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    getCategoryScore(category.score, category.maxScore).bg.replace('100', '500')
                  }`}
                  style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                />
              </div>
              
              {/* 詳細項目 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {category.items.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className={`mr-2 ${item.found ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.found ? '✓' : '✗'}
                    </span>
                    <span className={item.found ? 'text-gray-700' : 'text-gray-500'}>
                      {item.name}
                      {item.importance === 'high' && (
                        <span className="ml-1 text-xs text-red-500">*</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* 改善提案 */}
      {scoreData.improvements.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <span className="mr-2">💡</span>
            改善提案
          </h3>
          <ul className="space-y-2">
            {scoreData.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2 mt-0.5">•</span>
                <span className="text-blue-800">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 補足説明 */}
      <div className="mt-6 text-sm text-gray-600">
        <p className="flex items-start">
          <span className="text-red-500 mr-1">*</span>
          <span>重要度が高い項目です。優先的に改善することを推奨します。</span>
        </p>
      </div>
    </div>
  )
}