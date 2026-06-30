'use client'

import { useState } from 'react'
import { Loader2, TrendingUp, BarChart2, AlertTriangle } from 'lucide-react'
import type { MacroData, UsMarketData, AiSummaryResult } from '@/lib/types'

interface AiSummarySectionProps {
  getMacroData: () => MacroData | undefined
  getUsMarketData: () => UsMarketData | undefined
}

const DISCLAIMER = '이 분석은 참고용 정보이며 투자 자문이 아닙니다. 투자 결정과 책임은 본인에게 있습니다.'

export function AiSummarySection({ getMacroData, getUsMarketData }: AiSummarySectionProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiSummaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    const macroData = getMacroData()
    const usMarketData = getUsMarketData()
    if (!macroData || !usMarketData) {
      setError('시장 데이터를 먼저 불러와야 합니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ macroData, usMarketData }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch {
      setError('분석을 생성할 수 없습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-card p-6 md:p-8 bg-gradient-to-br from-navy to-navy-light text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">오늘의 시황 AI 분석</h2>
          <p className="text-sm text-gray-400">Gemini AI가 현재 시장 데이터를 종합 분석합니다</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-navy font-semibold rounded-lg transition-colors text-sm"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> 분석 중...</>
          ) : (
            '오늘의 시황 분석 보기'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 rounded-lg p-3">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-xl p-5">
            <p className="font-bold text-lg leading-snug">{result.conclusion}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: BarChart2, text: result.rationale1 },
              { icon: TrendingUp, text: result.rationale2 },
              { icon: BarChart2, text: result.rationale3 },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex gap-3 bg-white/5 rounded-xl p-4">
                <Icon size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed text-gray-200">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">{DISCLAIMER}</p>
        </div>
      )}
    </div>
  )
}
