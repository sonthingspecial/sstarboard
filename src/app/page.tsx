'use client'

import { SectionAnchor } from '@/components/layout/SectionAnchor'
import { AiSummarySection } from '@/components/sections/AiSummarySection'
import { MacroSection } from '@/components/sections/MacroSection'
import { UsMarketSection } from '@/components/sections/UsMarketSection'
import { useMacroData } from '@/hooks/useMacroData'
import { useUsMarket } from '@/hooks/useUsMarket'

export default function Home() {
  const { data: macroData } = useMacroData()
  const { data: usMarketData } = useUsMarket()

  return (
    <div>
      <SectionAnchor id="ai-summary" className="bg-gray-50 dark:bg-navy/30">
        <AiSummarySection
          getMacroData={() => macroData}
          getUsMarketData={() => usMarketData}
        />
      </SectionAnchor>
      <SectionAnchor id="macro" className="bg-white dark:bg-navy/50">
        <MacroSection />
      </SectionAnchor>
      <SectionAnchor id="us-market" className="bg-gray-50 dark:bg-navy/30">
        <UsMarketSection />
      </SectionAnchor>
      <SectionAnchor id="real-estate">
        <p className="text-gray-400">부동산 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="kr-stock">
        <p className="text-gray-400">한국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="alternative">
        <p className="text-gray-400">대안투자 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="news">
        <p className="text-gray-400">뉴스 섹션 — 구현 예정</p>
      </SectionAnchor>
    </div>
  )
}
