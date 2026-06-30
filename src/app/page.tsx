import { SectionAnchor } from '@/components/layout/SectionAnchor'

export default function Home() {
  return (
    <div>
      <SectionAnchor id="ai-summary">
        <p className="text-gray-400">AI 요약 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="macro" className="bg-gray-50 dark:bg-white/5">
        <p className="text-gray-400">거시경제 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="us-market">
        <p className="text-gray-400">미국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="real-estate" className="bg-gray-50 dark:bg-white/5">
        <p className="text-gray-400">부동산 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="kr-stock">
        <p className="text-gray-400">한국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="alternative" className="bg-gray-50 dark:bg-white/5">
        <p className="text-gray-400">대안투자 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="news">
        <p className="text-gray-400">뉴스 섹션 — 구현 예정</p>
      </SectionAnchor>
    </div>
  )
}
