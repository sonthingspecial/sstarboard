import { describe, it, expect } from 'vitest'
import { interestRateScore } from '@/lib/scoring/interestRateScore'
import type { InterestRateResponse } from '@/lib/types'

const makeRate = (fedRate: number, trend: 'rising' | 'stable' | 'falling'): InterestRateResponse => ({
  fedRate, trend, lastChanged: '2026-01-01', source: 'fred',
})

describe('interestRateScore', () => {
  it('financials (positive-high): score high when rate > 4.5', () => {
    expect(interestRateScore(makeRate(5.0, 'stable'), 'positive-high')).toBeGreaterThan(12)
  })
  it('tech (negative-high): score low when rate > 4.5', () => {
    expect(interestRateScore(makeRate(5.0, 'stable'), 'negative-high')).toBeLessThan(10)
  })
  it('falling trend adds bonus', () => {
    const stable = interestRateScore(makeRate(4.5, 'stable'), 'negative-low')
    const falling = interestRateScore(makeRate(4.5, 'falling'), 'negative-low')
    expect(falling).toBeGreaterThan(stable)
  })
  it('score is always clamped 0–20', () => {
    expect(interestRateScore(makeRate(0, 'falling'), 'positive-high')).toBeLessThanOrEqual(20)
    expect(interestRateScore(makeRate(10, 'rising'), 'negative-high')).toBeGreaterThanOrEqual(0)
  })
})
