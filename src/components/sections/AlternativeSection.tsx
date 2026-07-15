'use client'

import { useAlternative } from '@/hooks/useAlternative'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import type { AlternativeAsset } from '@/lib/types'

function ChangeDisplay({ changePercent }: { changePercent: number }) {
  const isUp = changePercent >= 0
  return (
    <span className={`text-sm font-medium ${isUp ? 'text-up' : 'text-down'}`}>
      {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
    </span>
  )
}

function formatPrice(symbol: string, price: number): string {
  if (symbol === 'BTC-USD') return Math.round(price).toLocaleString('en-US')
  return price.toFixed(2)
}

function AssetCard({ asset }: { asset: AlternativeAsset }) {
  return (
    <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{asset.name}</p>
      {asset.price !== null && asset.changePercent !== null ? (
        <>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(asset.symbol, asset.price)}
            <span className="text-sm font-normal text-gray-400 ml-1">{asset.unit}</span>
          </p>
          <ChangeDisplay changePercent={asset.changePercent} />
        </>
      ) : (
        <p className="text-sm text-gray-400">일시적으로 데이터를 불러올 수 없습니다</p>
      )}
    </div>
  )
}

export function AlternativeSection() {
  const { data, isLoading } = useAlternative()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">💎</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">대안투자</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading || !data ? (
          [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : (
          data.assets.map((asset) => <AssetCard key={asset.symbol} asset={asset} />)
        )}
      </div>
    </div>
  )
}
