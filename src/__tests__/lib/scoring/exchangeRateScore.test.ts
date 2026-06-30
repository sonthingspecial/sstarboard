import { describe, it, expect } from 'vitest'
import { exchangeRateScore } from '@/lib/scoring/exchangeRateScore'

describe('exchangeRateScore', () => {
  it('neutral sensitivity: returns 15 for USD/KRW < 1300', () => {
    expect(exchangeRateScore(1280, 'neutral')).toBe(15)
  })
  it('neutral sensitivity: returns 4 for USD/KRW >= 1450', () => {
    expect(exchangeRateScore(1543, 'neutral')).toBe(4)
  })
  it('positive sensitivity (energy): gets +2 bonus when dollar strong', () => {
    expect(exchangeRateScore(1543, 'positive')).toBe(6)
  })
  it('negative sensitivity (industrials): gets -2 penalty when dollar strong', () => {
    expect(exchangeRateScore(1543, 'negative')).toBe(2)
  })
  it('score is always clamped 0–15', () => {
    expect(exchangeRateScore(800, 'negative')).toBeGreaterThanOrEqual(0)
    expect(exchangeRateScore(2000, 'positive')).toBeLessThanOrEqual(15)
  })
})
