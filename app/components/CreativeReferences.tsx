'use client'

import { CreativeReference } from '../../lib/creative-references'

interface CreativeReferencesProps {
  creatives: CreativeReference[]
  marketType?: string
  actionReason?: string
}

export default function CreativeReferences({ 
  creatives, 
  marketType, 
  actionReason 
}: CreativeReferencesProps) {
  if (!creatives || creatives.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📎 参考クリエイティブ
      </h2>
      
      {marketType && actionReason && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">分析結果：</span>
            {marketType} × {actionReason}に基づく推奨
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creatives.map((creative) => (
          <div 
            key={creative.id} 
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900">
                {creative.mediaName}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {creative.target} - {creative.method}
              </p>
            </div>

            {creative.description && (
              <p className="text-sm text-gray-700 mb-3">
                {creative.description}
              </p>
            )}

            {creative.performance && (
              <div className="mb-3 p-2 bg-green-50 rounded">
                <p className="text-xs text-green-800">
                  <span className="font-medium">実績:</span> {creative.performance}
                </p>
              </div>
            )}

            {creative.creativeUrl && (
              <a
                href={creative.creativeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <span>クリエイティブを見る</span>
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {creative.tags && creative.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {creative.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <span className="font-medium">ヒント:</span> 
          これらのクリエイティブは過去の成功事例です。商品特性に合わせてカスタマイズしてご活用ください。
        </p>
      </div>
    </div>
  )
}