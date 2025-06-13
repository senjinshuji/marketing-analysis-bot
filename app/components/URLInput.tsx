'use client'

import { useState } from 'react'

interface URLInputProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
}

export default function URLInput({ onAnalyze, isLoading }: URLInputProps) {
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onAnalyze(url.trim())
    }
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-lg font-medium text-gray-700 mb-3">
            商品・サービスのURL
          </label>
          <div className="relative">
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
              disabled={isLoading}
              required
            />
          </div>
          {url && !isValidUrl(url) && (
            <p className="mt-2 text-sm text-red-600">
              有効なURLを入力してください
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !url || !isValidUrl(url)}
          className="w-full bg-primary-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>分析中...</span>
            </div>
          ) : (
            '分析開始'
          )}
        </button>
      </form>

      {isLoading && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mt-0.5"></div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">分析を実行中</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="space-y-1">
                  <li>• 商品情報を取得しています...</li>
                  <li>• 市場分析を実行しています...</li>
                  <li>• 最適な広告戦略を生成しています...</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}