import { describe, it, expect } from 'vitest'
import { fearGreedScore } from '@/lib/scoring/fearGreedScore'

describe('fearGreedScore', () => {
  it('returns 0 for score 0 (extreme fear)', () => {
    expect(fearGreedScore(0)).toBe(0)
  })
  it('returns 25 for score 100 (extreme greed)', () => {
    expect(fearGreedScore(100)).toBe(25)
  })
  it('returns 13 for score 50 (neutral)', () => {
    expect(fearGreedScore(50)).toBe(13)
  })
  it('returns 6-7 for score 26 (fear zone)', () => {
    expect(fearGreedScore(26)).toBeGreaterThanOrEqual(6)
    expect(fearGreedScore(26)).toBeLessThanOrEqual(7)
  })
})
