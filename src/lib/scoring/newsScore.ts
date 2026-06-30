import type { NewsItem } from '../types'

const POSITIVE = ['surge','rally','beat','record','growth','upgrade','bullish','strong','innovation','expansion','deal','partnership','rise','gains','profit','outperform','breakout','recovery','rebound','boost','soar','jump','climb']
const NEGATIVE = ['crash','plunge','miss','recession','layoff','downgrade','bearish','weak','loss','bankruptcy','tariff','sanction','regulation','decline','fall','slump','warning','risk','concern','fears','volatile','tumble','drop','sell-off','selloff']

function scoreItem(title: string): number {
  const text = title.toLowerCase()
  return POSITIVE.filter(k => text.includes(k)).length - NEGATIVE.filter(k => text.includes(k)).length
}

export function getSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const s = scoreItem(title)
  return s > 0 ? 'positive' : s < 0 ? 'negative' : 'neutral'
}

export function newsScore(items: NewsItem[]): number {
  if (items.length === 0) return 10
  const raw = items.slice(0, 10).reduce((sum, item) => sum + scoreItem(item.title), 0)
  return Math.max(0, Math.min(20, 10 + Math.round(raw * 1.5)))
}
