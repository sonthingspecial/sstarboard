'use client'

import { useUsMarket } from '@/hooks/useUsMarket'
import { SectorCard } from '@/components/ui/SectorCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

function ChangeDisplay({ changePercent }: { changePercent: number }) {
  const isUp = changePercent >= 0
  return (
    <span className={`text-sm font-medium ${isUp ? 'text-up' : 'text-down'}`}>
      {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
    </span>
  )
}

export function UsMarketSection() {
  const { data, isLoading } = useUsMarket()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">미국 주식</h2>

      {/* SPY / QQQ + Fear & Greed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          [0, 1, 2].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">S&P 500 (SPY)</p>
              {data?.spy ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${data.spy.price.toLocaleString()}</p>
                  <ChangeDisplay changePercent={data.spy.changePercent} />
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">나스닥 100 (QQQ)</p>
              {data?.qqq ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${data.qqq.price.toLocaleString()}</p>
                  <ChangeDisplay changePercent={data.qqq.changePercent} />
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">CNN 공포탐욕지수</p>
              {data?.fearGreed ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.fearGreed.score}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{data.fearGreed.rating}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sector grid */}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">섹터별 투자 점수</h3>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(11).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.sectors ?? []).map((sector) => (
            <SectorCard key={sector.id} sector={sector} isEstimated={data?.sectorScoresEstimated} />
          ))}
        </div>
      )}
    </div>
  )
}
