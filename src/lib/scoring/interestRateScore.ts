import type { InterestRateResponse, RateSensitivity } from '../types'

function baseScore(fedRate: number): number {
  if (fedRate <= 2.0) return 18
  if (fedRate <= 3.5) return 15
  if (fedRate <= 4.5) return 12
  if (fedRate <= 5.5) return 8
  return 5
}

function trendBonus(trend: 'rising' | 'stable' | 'falling'): number {
  if (trend === 'falling') return 3
  if (trend === 'rising') return -3
  return 0
}

function sensitivityAdjustment(fedRate: number, sensitivity: RateSensitivity): number {
  const highRate = fedRate > 4.5
  const lowRate = fedRate <= 3.5
  switch (sensitivity) {
    case 'positive-high': return highRate ? 5 : lowRate ? -3 : 1
    case 'negative-high': return highRate ? -4 : lowRate ? 3 : -1
    case 'negative-medium': return highRate ? -2 : lowRate ? 2 : 0
    case 'negative-low': return highRate ? -1 : lowRate ? 1 : 0
  }
}

export function interestRateScore(rateData: InterestRateResponse, sensitivity: RateSensitivity): number {
  return Math.max(0, Math.min(20, baseScore(rateData.fedRate) + trendBonus(rateData.trend) + sensitivityAdjustment(rateData.fedRate, sensitivity)))
}
