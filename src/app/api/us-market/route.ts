import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import type {
  UsMarketData, FearGreedResponse, MarketDataResponse,
  ExchangeRateResponse, InterestRateResponse, SectorNewsResponse, SectorId,
} from '@/lib/types'
import { SECTOR_IDS } from '@/lib/constants/sectors'
import { NEWS_KEYWORDS } from '@/lib/constants/newsKeywords'
import { getSentiment, newsScore } from '@/lib/scoring/newsScore'
import { computeAllSectors } from '@/lib/scoring/composite'

export const dynamic = 'force-dynamic'

const rssParser = new Parser({ timeout: 8000 })

async function fetchYahooTicker(ticker: string): Promise<{ price: number; changePercent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`
    const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const meta = data.chart.result[0].meta
    const price = Math.round(meta.regularMarketPrice * 100) / 100
    const prev = meta.chartPreviousClose ?? meta.previousClose
    const changePercent = prev && prev > 0 ? Math.round(((price - prev) / prev) * 10000) / 100 : 0
    return { price, changePercent }
  } catch { return null }
}

async function fetchYahooValue(ticker: string): Promise<{ value: number; changePercent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`
    const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const meta = data.chart.result[0].meta
    const value = Math.round(meta.regularMarketPrice * 100) / 100
    const prev = meta.chartPreviousClose ?? meta.previousClose
    const changePercent = prev && prev > 0 ? Math.round(((value - prev) / prev) * 10000) / 100 : 0
    return { value, changePercent }
  } catch { return null }
}

async function fetchFearGreed(): Promise<FearGreedResponse | null> {
  try {
    const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://edition.cnn.com/markets/fear-and-greed',
        Origin: 'https://edition.cnn.com',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.json()
    const fg = raw.fear_and_greed
    return { score: Math.round(fg.score), rating: fg.rating, timestamp: new Date().toISOString(), source: 'live' }
  } catch { return null }
}

async function fetchSectorNews(id: SectorId): Promise<SectorNewsResponse> {
  try {
    const q = encodeURIComponent(NEWS_KEYWORDS[id])
    const feed = await rssParser.parseURL(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`)
    const items = (feed.items ?? []).slice(0, 10).map((item) => ({
      title: item.title ?? '',
      pubDate: item.pubDate ?? new Date().toISOString(),
      link: item.link ?? '',
      sentiment: getSentiment(item.title ?? ''),
    }))
    return { sector: id, items, sentimentScore: newsScore(items), source: 'live' }
  } catch {
    return { sector: id, items: [], sentimentScore: 10, source: 'fallback' }
  }
}

export async function GET() {
  const [spyResult, qqqResult, vixResult, irxResult, krwResult, fgResult, ...newsResults] = await Promise.allSettled([
    fetchYahooTicker('SPY'),
    fetchYahooTicker('QQQ'),
    fetchYahooValue('^VIX'),
    fetchYahooValue('^IRX'),
    fetchYahooValue('KRW=X'),
    fetchFearGreed(),
    ...SECTOR_IDS.map(fetchSectorNews),
  ])

  const spy = spyResult.status === 'fulfilled' ? spyResult.value : null
  const qqq = qqqResult.status === 'fulfilled' ? qqqResult.value : null
  const vixRaw = vixResult.status === 'fulfilled' ? vixResult.value : null
  const irxRaw = irxResult.status === 'fulfilled' ? irxResult.value : null
  const krwRaw = krwResult.status === 'fulfilled' ? krwResult.value : null
  const fgRaw = fgResult.status === 'fulfilled' ? fgResult.value : null

  const newsMap: Partial<Record<SectorId, SectorNewsResponse>> = {}
  SECTOR_IDS.forEach((id, i) => {
    const r = newsResults[i]
    if (r.status === 'fulfilled') newsMap[id] = r.value as SectorNewsResponse
  })

  // Internal scoring inputs — neutral assumptions when live data unavailable (NOT displayed to users)
  const fearGreedData: FearGreedResponse = fgRaw ?? { score: 50, rating: 'Neutral', timestamp: new Date().toISOString(), source: 'fallback' }
  const marketData: MarketDataResponse = {
    vix: vixRaw?.value ?? 20,
    spy: spy ?? { price: 0, changePercent: 0 },
    qqq: qqq ?? { price: 0, changePercent: 0 },
    timestamp: new Date().toISOString(),
    source: vixRaw ? 'live' : 'fallback',
  }
  const fxData: ExchangeRateResponse = {
    usdKrw: krwRaw?.value ?? 1400,
    timestamp: new Date().toISOString(),
    source: krwRaw ? 'live' : 'fallback',
  }
  const trend = irxRaw
    ? (irxRaw.changePercent > 0.1 ? 'rising' : irxRaw.changePercent < -0.1 ? 'falling' : 'stable')
    : 'stable'
  const rateData: InterestRateResponse = {
    fedRate: irxRaw?.value ?? 4.5,
    lastChanged: new Date().toISOString(),
    trend,
    source: irxRaw ? 'fred' : 'fallback',
  }

  const sectors = computeAllSectors(fearGreedData, marketData, fxData, rateData, newsMap)

  const body: UsMarketData = {
    spy,
    qqq,
    fearGreed: fgRaw ? { score: fgRaw.score, rating: fgRaw.rating } : null,
    sectors,
    sectorScoresEstimated: !fgRaw || !vixRaw || !krwRaw || !irxRaw,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
