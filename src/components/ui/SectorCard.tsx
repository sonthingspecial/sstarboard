'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Cpu, HeartPulse, Landmark, Zap, ShoppingBag, ShoppingCart, Factory, Building2, Plug, Gem, Radio } from 'lucide-react'
import type { SectorAnalysis } from '@/lib/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Cpu, HeartPulse, Landmark, Zap, ShoppingBag, ShoppingCart, Factory, Building2, Plug, Gem, Radio,
}

const BADGE_STYLES: Record<string, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const BAR_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-up',
  negative: 'text-down',
  neutral: 'text-gray-500 dark:text-gray-400',
}

interface SectorCardProps {
  sector: SectorAnalysis
  isEstimated?: boolean
}

export function SectorCard({ sector, isEstimated }: SectorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ICON_MAP[sector.icon] ?? Cpu
  const badgeStyle = BADGE_STYLES[sector.recommendation.color] ?? BADGE_STYLES.orange
  const barColor = BAR_COLORS[sector.recommendation.color] ?? BAR_COLORS.orange

  return (
    <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="text-gold" size={18} />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{sector.nameKo}</p>
            <p className="text-xs text-gray-400">{sector.etf}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeStyle}`}>
            {sector.recommendation.emoji} {sector.recommendation.labelKo}
          </span>
          {isEstimated && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
              추정값
            </span>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400">점수</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{sector.score.total}/100</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${sector.score.total}%` }}
        />
      </div>

      {/* Collapsible rationale */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        점수 산정 근거
      </button>
      {expanded && (
        <ul className="mt-3 space-y-2">
          {sector.rationale.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className={`text-xs font-medium w-28 shrink-0 ${SENTIMENT_COLORS[item.sentiment]}`}>{item.factor}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
