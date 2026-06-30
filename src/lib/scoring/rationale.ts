import type { SectorScoreBreakdown, RationaleItem } from '../types'

export function generateRationale(score: SectorScoreBreakdown): RationaleItem[] {
  const items: RationaleItem[] = []
  if (score.fearGreed >= 19) items.push({ factor: '공포탐욕 지수', text: '탐욕 심리가 강해 매수 모멘텀이 형성되어 있습니다', sentiment: 'positive' })
  else if (score.fearGreed >= 13) items.push({ factor: '공포탐욕 지수', text: '중립적 심리로 방향성이 불확실합니다', sentiment: 'neutral' })
  else if (score.fearGreed >= 6) items.push({ factor: '공포탐욕 지수', text: '공포 심리로 단기 하방 압력이 있습니다', sentiment: 'negative' })
  else items.push({ factor: '공포탐욕 지수', text: '극심한 공포 — 과매도 구간에서 역발상 매수 기회일 수 있습니다', sentiment: 'negative' })

  if (score.vix >= 16) items.push({ factor: '변동성 (VIX)', text: '변동성이 낮아 안정적인 투자 환경입니다', sentiment: 'positive' })
  else if (score.vix >= 10) items.push({ factor: '변동성 (VIX)', text: '보통 수준의 변동성으로 리스크 관리가 필요합니다', sentiment: 'neutral' })
  else if (score.vix >= 5) items.push({ factor: '변동성 (VIX)', text: '변동성이 높아 단기 가격 급변 가능성이 있습니다', sentiment: 'negative' })
  else items.push({ factor: '변동성 (VIX)', text: 'VIX 30+ — 패닉 수준의 변동성으로 고위험 구간입니다', sentiment: 'negative' })

  if (score.exchangeRate >= 12) items.push({ factor: 'USD/KRW 환율', text: '환율 여건이 해당 섹터 투자에 유리합니다', sentiment: 'positive' })
  else if (score.exchangeRate >= 8) items.push({ factor: 'USD/KRW 환율', text: '환율이 중립 구간으로 영향이 제한적입니다', sentiment: 'neutral' })
  else items.push({ factor: 'USD/KRW 환율', text: '강달러·원화 약세로 환전 비용 부담이 있습니다', sentiment: 'negative' })

  if (score.interestRate >= 15) items.push({ factor: '미국 기준금리', text: '금리 환경이 해당 섹터 밸류에이션에 우호적입니다', sentiment: 'positive' })
  else if (score.interestRate >= 8) items.push({ factor: '미국 기준금리', text: '금리 영향이 중립적이거나 제한적입니다', sentiment: 'neutral' })
  else items.push({ factor: '미국 기준금리', text: '고금리 환경에서 해당 섹터 할인율 부담이 있습니다', sentiment: 'negative' })

  if (score.news >= 14) items.push({ factor: '뉴스 센티먼트', text: '긍정적 뉴스 흐름이 섹터 심리를 지지하고 있습니다', sentiment: 'positive' })
  else if (score.news >= 8) items.push({ factor: '뉴스 센티먼트', text: '뉴스 흐름이 중립적입니다', sentiment: 'neutral' })
  else items.push({ factor: '뉴스 센티먼트', text: '부정적 뉴스가 우세하여 단기 하방 압력이 있습니다', sentiment: 'negative' })

  return items
}
