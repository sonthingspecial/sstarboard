import type { FxSensitivity } from '../types'

function baseScore(usdKrw: number): number {
  if (usdKrw < 1300) return 15
  if (usdKrw < 1350) return 13
  if (usdKrw < 1400) return 10
  if (usdKrw < 1450) return 7
  return 4
}

function fxAdjustment(usdKrw: number, sensitivity: FxSensitivity): number {
  const strongDollar = usdKrw >= 1400
  if (sensitivity === 'positive') return strongDollar ? 2 : -1
  if (sensitivity === 'negative') return strongDollar ? -2 : 1
  return 0
}

export function exchangeRateScore(usdKrw: number, sensitivity: FxSensitivity): number {
  return Math.max(0, Math.min(15, baseScore(usdKrw) + fxAdjustment(usdKrw, sensitivity)))
}
