'use client'

import { SectionAnchor } from '@/components/layout/SectionAnchor'
import { AiSummarySection } from '@/components/sections/AiSummarySection'
import { MacroSection } from '@/components/sections/MacroSection'
import { UsMarketSection } from '@/components/sections/UsMarketSection'
import { KrStockSection } from '@/components/sections/KrStockSection'
import { PlaceholderSection } from '@/components/sections/PlaceholderSection'
import { RealEstateSection } from '@/components/sections/RealEstateSection'
import { useMacroData } from '@/hooks/useMacroData'
import { useUsMarket } from '@/hooks/useUsMarket'

export default function Home() {
  const { data: macroData } = useMacroData()
  const { data: usMarketData } = useUsMarket()

  return (
    <div>
      <SectionAnchor id="ai-summary" className="bg-gray-50 dark:bg-navy/30">
        <AiSummarySection getMacroData={() => macroData} getUsMarketData={() => usMarketData} />
      </SectionAnchor>

      <SectionAnchor id="macro" className="bg-white dark:bg-navy/50">
        <MacroSection />
      </SectionAnchor>

      <SectionAnchor id="us-market" className="bg-gray-50 dark:bg-navy/30">
        <UsMarketSection />
      </SectionAnchor>

      <SectionAnchor id="real-estate" className="bg-white dark:bg-navy/50">
        <RealEstateSection />
      </SectionAnchor>

      <SectionAnchor id="kr-stock" className="bg-gray-50 dark:bg-navy/30">
        <KrStockSection />
      </SectionAnchor>

      <SectionAnchor id="alternative" className="bg-white dark:bg-navy/50">
        <PlaceholderSection
          title="대안투자"
          emoji="💎"
          items={[
            { label: '금 가격' }, { label: '비트코인' },
            { label: '원자재' }, { label: '환율 DXY' },
          ]}
        />
      </SectionAnchor>

      <SectionAnchor id="news" className="bg-gray-50 dark:bg-navy/30">
        <PlaceholderSection
          title="뉴스 큐레이션"
          emoji="📰"
          items={[
            { label: '국내 경제' }, { label: '미국 시장' },
            { label: '글로벌 이슈' }, { label: 'AI 기술' },
          ]}
        />
      </SectionAnchor>

      <footer className="py-8 text-center text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-white/5">
        Sstarboard — 데이터는 참고용이며 투자 자문이 아닙니다. © 2026
      </footer>
    </div>
  )
}
