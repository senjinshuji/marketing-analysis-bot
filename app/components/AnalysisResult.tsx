'use client'

interface AnalysisResultProps {
  data: any
}

export default function AnalysisResult({ data }: AnalysisResultProps) {
  if (!data) return null

  return (
    <div className="space-y-8">
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
        </div>
      </div>

      {/* 市場分類結果 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">市場分析・分類結果</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">基本プロフィール</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">年齢:</span> {data.persona.age}</p>
                <p><span className="font-medium">性別:</span> {data.persona.gender}</p>
                <p><span className="font-medium">職業:</span> {data.persona.occupation}</p>
                <p><span className="font-medium">年収:</span> {data.persona.income}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">ライフスタイル</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">家族構成:</span> {data.persona.familyStructure}</p>
                <p><span className="font-medium">趣味・関心:</span> {data.persona.interests}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 推奨広告戦略 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">推奨広告戦略</h2>
        {data.recommendations?.media && data.recommendations.media.length > 0 ? (
          <div className="space-y-4">
            {data.recommendations.media.map((media: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {media.mediaName}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {media.target} - {media.method}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {media.reason}
                    </p>
                  </div>
                  <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                    ID: {media.mediaId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">推奨戦略を生成中...</p>
        )}
      </div>

      {/* クリエイティブ提案 */}
      {data.recommendations?.creative && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">クリエイティブ提案</h2>
          <div className="space-y-4">
            {data.recommendations.creative.map((creative: any, index: number) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {creative.mediaName} 向けクリエイティブ
                </h3>
                <p className="text-gray-700 mb-2">{creative.idea}</p>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">訴求ポイント:</span> {creative.keyMessage}</p>
                  <p><span className="font-medium">ビジュアルスタイル:</span> {creative.visualStyle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}