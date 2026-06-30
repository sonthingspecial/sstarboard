import { describe, it, expect } from 'vitest'
import { newsScore, getSentiment } from '@/lib/scoring/newsScore'
import type { NewsItem } from '@/lib/types'

const makeItem = (title: string): NewsItem => ({
  title, pubDate: '2026-01-01', link: '', sentiment: getSentiment(title),
})

describe('newsScore', () => {
  it('returns 10 for empty items (neutral)', () => {
    expect(newsScore([])).toBe(10)
  })
  it('positive news increases score above 10', () => {
    const items = [makeItem('Tech stocks surge on AI rally'), makeItem('Record growth for chip sector')]
    expect(newsScore(items)).toBeGreaterThan(10)
  })
  it('negative news decreases score below 10', () => {
    const items = [makeItem('Market crash on recession fears'), makeItem('Layoffs warning as banks decline')]
    expect(newsScore(items)).toBeLessThan(10)
  })
  it('score is always clamped 0–20', () => {
    const positive = Array(10).fill(null).map(() => makeItem('surge rally beat record growth bullish'))
    const negative = Array(10).fill(null).map(() => makeItem('crash plunge recession layoff bearish'))
    expect(newsScore(positive)).toBeLessThanOrEqual(20)
    expect(newsScore(negative)).toBeGreaterThanOrEqual(0)
  })
})

describe('getSentiment', () => {
  it('identifies positive sentiment', () => {
    expect(getSentiment('Tech stocks surge on AI rally')).toBe('positive')
  })
  it('identifies negative sentiment', () => {
    expect(getSentiment('Market crash on recession fears')).toBe('negative')
  })
  it('identifies neutral sentiment', () => {
    expect(getSentiment('Fed meeting scheduled for next week')).toBe('neutral')
  })
})
