'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { InfoModal } from './InfoModal'
import type { MacroIndicator } from '@/lib/types'

interface MacroCardProps {
  title: string
  indicator: MacroIndicator
  unit?: string
  tooltip: { title: string; description: string }
  formatValue?: (v: number) => string
}

export function MacroCard({ title, indicator, unit = '', tooltip, formatValue }: MacroCardProps) {
  const [showModal, setShowModal] = useState(false)

  const displayValue = indicator.value !== null
    ? (formatValue ? formatValue(indicator.value) : indicator.value.toLocaleString('ko-KR'))
    : null

  const changeSign = indicator.change !== null && indicator.change > 0 ? '▲' : indicator.change !== null && indicator.change < 0 ? '▼' : '—'
  const changeColor =
    indicator.change !== null && indicator.change > 0
      ? 'text-up'
      : indicator.change !== null && indicator.change < 0
      ? 'text-down'
      : 'text-gray-400'

  return (
    <>
      <div className="relative rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
        <button
          className="absolute top-3 right-3 text-gray-300 hover:text-gold transition-colors"
          onClick={() => setShowModal(true)}
          aria-label={`${title} 설명`}
        >
          <Info size={16} />
        </button>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        {displayValue !== null ? (
          <>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {displayValue}
              {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
            </p>
            {indicator.change !== null && (
              <p className={`text-sm font-medium ${changeColor}`}>
                {changeSign} {Math.abs(indicator.change).toLocaleString('ko-KR')}
                {indicator.changePercent !== null && (
                  <span className="text-xs ml-1">({indicator.changePercent > 0 ? '+' : ''}{indicator.changePercent.toFixed(2)}%)</span>
                )}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">데이터를 불러올 수 없습니다</p>
        )}
      </div>
      {showModal && <InfoModal title={tooltip.title} description={tooltip.description} onClose={() => setShowModal(false)} />}
    </>
  )
}
