'use client'

import { useMacroData } from '@/hooks/useMacroData'
import { MacroCard } from '@/components/ui/MacroCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { MACRO_TOOLTIPS } from '@/lib/constants/tooltips'

export function MacroSection() {
  const { data, isLoading } = useMacroData()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">거시경제 지표</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MacroCard
            title="한국 기준금리"
            indicator={data?.krRate ?? { value: null, change: null, changePercent: null }}
            unit="%"
            tooltip={MACRO_TOOLTIPS.krRate}
          />
          <MacroCard
            title="미국 기준금리"
            indicator={data?.usFedRate ?? { value: null, change: null, changePercent: null }}
            unit="%"
            tooltip={MACRO_TOOLTIPS.usFedRate}
          />
          <MacroCard
            title="원달러 환율"
            indicator={data?.usdKrw ?? { value: null, change: null, changePercent: null }}
            unit="원"
            tooltip={MACRO_TOOLTIPS.usdKrw}
            formatValue={(v) => v.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
          />
          <MacroCard
            title="VIX 공포지수"
            indicator={data?.vix ?? { value: null, change: null, changePercent: null }}
            tooltip={MACRO_TOOLTIPS.vix}
            formatValue={(v) => v.toFixed(2)}
          />
        </div>
      )}
    </div>
  )
}
