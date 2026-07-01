import { NextResponse } from 'next/server'
import type { KrStockData } from '@/lib/types'

export const dynamic = 'force-dynamic'

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

export async function GET() {
  const [kospiResult, kosdaqResult] = await Promise.allSettled([
    fetchYahooValue('^KS11'),
    fetchYahooValue('^KQ11'),
  ])

  const kospi = kospiResult.status === 'fulfilled' ? kospiResult.value : null
  const kosdaq = kosdaqResult.status === 'fulfilled' ? kosdaqResult.value : null

  const anyLive = kospi !== null || kosdaq !== null
  const allLive = kospi !== null && kosdaq !== null

  const body: KrStockData = {
    kospi,
    kosdaq,
    timestamp: new Date().toISOString(),
    source: allLive ? 'live' : anyLive ? 'partial' : 'error',
  }

  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
