'use client'

import LPScoreCard from './LPScoreCard'
import { calculateLPScore } from '../../lib/lp-scorer'

interface AnalysisResultProps {
  data: any
}

export default function AnalysisResult({ data }: AnalysisResultProps) {
  if (!data) return null
  
  // LPスコアを計算
  const lpScore = calculateLPScore(data)

  return (
    <div className="space-y-8">
      {/* LP診断スコア */}
      <LPScoreCard scoreData={lpScore} />
      {/* 基本情報 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">商品・製品情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">商品名</h3>
            <p className="text-gray-900">{data.productInfo?.productName || '取得中...'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">カテゴリー</h3>
            <p className="text-gray-900">{data.productInfo?.category || '分析中...'}</p>
          </div>
          {data.productInfo?.sizeCapacity && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">サイズ・容量</h3>
              <p className="text-gray-900">{data.productInfo.sizeCapacity}</p>
            </div>
          )}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-700 mb-2">主な機能・特徴</h3>
            <div className="text-gray-900">
              {data.productInfo?.features ? (
                <ul className="list-disc list-inside space-y-1">
                  {data.productInfo.features.map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              ) : (
                <p>分析中...</p>
              )}
            </div>
          </div>
          {data.productInfo?.effects && data.productInfo.effects.length > 0 && (
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-2">効果・ベネフィット</h3>
              <ul className="list-disc list-inside space-y-1">
                {data.productInfo.effects.map((effect: string, index: number) => (
                  <li key={index}>{effect}</li>
                ))}
              </ul>
            </div>
          )}
          {data.productInfo?.rtb && (
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-2">RTB (Reason to Believe)</h3>
              <p className="text-gray-900">{data.productInfo.rtb}</p>
            </div>
          )}
          {data.productInfo?.authority && (
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-2">権威性</h3>
              <p className="text-gray-900">{data.productInfo.authority}</p>
            </div>
          )}
        </div>
      </div>

      {/* 価格情報 */}
      {data.pricing && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">価格・販売情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.pricing.regularPrice && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">通常価格</h3>
                <p className="text-gray-900">{data.pricing.regularPrice}</p>
              </div>
            )}
            {data.pricing.specialPrice && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">特別価格</h3>
                <p className="text-gray-900 font-bold text-red-600">{data.pricing.specialPrice}</p>
              </div>
            )}
            {data.pricing.campaign && (
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-700 mb-2">キャンペーン情報</h3>
                <p className="text-gray-900">{data.pricing.campaign}</p>
              </div>
            )}
            {data.pricing.releaseDate && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">発売日</h3>
                <p className="text-gray-900">{data.pricing.releaseDate}</p>
              </div>
            )}
            {data.pricing.salesChannel && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">販売チャネル</h3>
                <p className="text-gray-900">{data.pricing.salesChannel}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 市場分析 */}
      {data.marketAnalysis && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">市場分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">市場定義</h3>
              <p className="text-gray-900">{data.marketAnalysis.marketDefinition}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">市場カテゴリー</h3>
              <p className="text-gray-900">{data.marketAnalysis.marketCategory}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">市場規模</h3>
              <p className="text-gray-900 font-bold">{data.marketAnalysis.marketSize}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">戦略ターゲット</h3>
              <p className="text-gray-900">{data.marketAnalysis.strategyTarget}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-700 mb-2">コアターゲット</h3>
              <p className="text-gray-900 font-bold">{data.marketAnalysis.coreTarget}</p>
            </div>
          </div>
        </div>
      )}

      {/* 提供価値 */}
      {data.valueProposition && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">提供価値</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">機能価値</h3>
              {data.valueProposition.functionalValue && (
                <ul className="list-disc list-inside space-y-2">
                  {data.valueProposition.functionalValue.map((value: string, index: number) => (
                    <li key={index} className="text-gray-900">{value}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">情緒価値</h3>
              <p className="text-gray-900">{data.valueProposition.emotionalValue}</p>
            </div>
          </div>
        </div>
      )}

      {/* デモグラフィック */}
      {data.demographics && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">デモグラフィック分析</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">年齢層</h3>
              <p className="text-gray-900">{data.demographics.ageRange}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">性別</h3>
              <p className="text-gray-900">{data.demographics.gender}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">その他の特性</h3>
              <p className="text-gray-900">{data.demographics.otherCharacteristics}</p>
            </div>
          </div>
        </div>
      )}

      {/* 市場分類結果 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">市場分類結果</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">市場タイプ</h3>
            <p className="text-2xl font-bold text-blue-900">
              {data.classification?.marketType || '分析中...'}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">行動理由分類</h3>
            <p className="text-lg font-semibold text-green-900">
              {data.classification?.actionReason || '分析中...'}
            </p>
          </div>
        </div>
        {data.classification?.reasoning && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">分類理由</h3>
            <p className="text-gray-900">{data.classification.reasoning}</p>
          </div>
        )}
      </div>

      {/* ペルソナ分析 */}
      {data.persona && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">N1ペルソナ分析</h2>
          
          {/* プロフィール */}
          {data.persona.profile && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">基本プロフィール</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-600">年齢:</span> <span className="text-gray-900">{data.persona.profile.age}</span></p>
                  <p><span className="font-medium text-gray-600">性別:</span> <span className="text-gray-900">{data.persona.profile.gender}</span></p>
                  <p><span className="font-medium text-gray-600">居住地:</span> <span className="text-gray-900">{data.persona.profile.location}</span></p>
                  <p><span className="font-medium text-gray-600">職業:</span> <span className="text-gray-900">{data.persona.profile.occupation}</span></p>
                  <p><span className="font-medium text-gray-600">役職:</span> <span className="text-gray-900">{data.persona.profile.position}</span></p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium text-gray-600">業界:</span> <span className="text-gray-900">{data.persona.profile.industry}</span></p>
                  <p><span className="font-medium text-gray-600">年収:</span> <span className="text-gray-900">{data.persona.profile.income}</span></p>
                  <p><span className="font-medium text-gray-600">最終学歴:</span> <span className="text-gray-900">{data.persona.profile.education}</span></p>
                  <p><span className="font-medium text-gray-600">家族構成:</span> <span className="text-gray-900">{data.persona.profile.familyStructure}</span></p>
                </div>
              </div>
              <div className="mt-3">
                <p><span className="font-medium text-gray-600">ライフスタイル:</span></p>
                <p className="text-gray-900 mt-1">{data.persona.profile.lifestyle}</p>
              </div>
              <div className="mt-3">
                <p><span className="font-medium text-gray-600">趣味・関心:</span></p>
                <p className="text-gray-900 mt-1">{data.persona.profile.interests}</p>
              </div>
              <div className="mt-3">
                <p><span className="font-medium text-gray-600">メディア利用:</span></p>
                <p className="text-gray-900 mt-1">{data.persona.profile.mediaUsage}</p>
              </div>
            </div>
          )}
          
          {/* カスタマージャーニー */}
          {data.persona.journey && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">カスタマージャーニー</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">状況</p>
                  <p className="text-gray-900">{data.persona.journey.situation}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">体感</p>
                  <p className="text-gray-900">{data.persona.journey.sensory}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">本能</p>
                  <p className="text-gray-900">{data.persona.journey.instinct}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">知覚</p>
                  <p className="text-gray-900">{data.persona.journey.perception}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">感情</p>
                  <p className="text-gray-900">{data.persona.journey.emotion}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">欲求</p>
                  <p className="text-gray-900">{data.persona.journey.desire}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium text-gray-700 mb-1">需要</p>
                  <p className="text-gray-900">{data.persona.journey.demand}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}