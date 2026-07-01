'use client'

import { Clock } from 'lucide-react'
import { useKrStockData } from '@/hooks/useKrStockData'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

function ChangeDisplay({ changePercent }: { changePercent: number }) {
  const isUp = changePercent >= 0
  return (
    <span className={`text-sm font-medium ${isUp ? 'text-up' : 'text-down'}`}>
      {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
    </span>
  )
}

export function KrStockSection() {
  const { data, isLoading } = useKrStockData()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🇰🇷</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">한국주식</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {isLoading ? (
          [0, 1].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">코스피 (KOSPI)</p>
              {data?.kospi ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.kospi.value.toLocaleString('ko-KR')}</p>
                  <ChangeDisplay changePercent={data.kospi.changePercent} />
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">코스닥 (KOSDAQ)</p>
              {data?.kosdaq ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.kosdaq.value.toLocaleString('ko-KR')}</p>
                  <ChangeDisplay changePercent={data.kosdaq.changePercent} />
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">섹터별 순위 · 외국인 수급</h3>
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
          <Clock size={11} />
          곧 추가됩니다
        </span>
      </div>
      <div className="rounded-card border-2 border-dashed border-gray-200 dark:border-white/10 p-6">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">이 항목은 준비 중입니다. 추가 예정 데이터:</p>
        <ul className="grid grid-cols-2 gap-3">
          {['섹터별 순위', '외국인 수급'].map((label) => (
            <li
              key={label}
              className="text-sm text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 text-center opacity-40 select-none"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
