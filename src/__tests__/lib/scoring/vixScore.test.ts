import { describe, it, expect } from 'vitest'
import { vixScore } from '@/lib/scoring/vixScore'

describe('vixScore', () => {
  it('returns 20 for VIX < 15 (very calm)', () => {
    expect(vixScore(12)).toBe(20)
  })
  it('returns 16 for VIX 15–19 (calm)', () => {
    expect(vixScore(18)).toBe(16)
  })
  it('returns 10 for VIX 20–24 (elevated)', () => {
    expect(vixScore(22)).toBe(10)
  })
  it('returns 5 for VIX 25–29 (high)', () => {
    expect(vixScore(27)).toBe(5)
  })
  it('returns 0 for VIX >= 30 (panic)', () => {
    expect(vixScore(35)).toBe(0)
  })
})
