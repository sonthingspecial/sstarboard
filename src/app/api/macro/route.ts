import { NextResponse } from 'next/server'
import type { MacroData, MacroIndicator } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function fetchTickerChange(ticker: string): Promise<{ value: number; change: number; changePercent: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const meta = data.chart.result[0].meta
    const value = Math.round(meta.regularMarketPrice * 100) / 100
    const prev = meta.chartPreviousClose ?? meta.previousClose
    const change = prev ? Math.round((value - prev) * 100) / 100 : 0
    const changePercent = prev && prev > 0 ? Math.round(((value - prev) / prev) * 10000) / 100 : 0
    return { value, change, changePercent }
  } catch {
    return null
  }
}

function toIndicator(raw: { value: number; change: number; changePercent: number } | null): MacroIndicator {
  if (!raw) return { value: null, change: null, changePercent: null }
  return { value: raw.value, change: raw.change, changePercent: raw.changePercent }
}

export async function GET() {
  const [vixRaw, usFedRaw, usdKrwRaw, krRateRaw] = await Promise.allSettled([
    fetchTickerChange('^VIX'),
    fetchTickerChange('^IRX'),
    fetchTickerChange('KRW=X'),
    fetchTickerChange('KR3YT=RR'),
  ])

  const vix = toIndicator(vixRaw.status === 'fulfilled' ? vixRaw.value : null)
  const usFedRate = toIndicator(usFedRaw.status === 'fulfilled' ? usFedRaw.value : null)
  const usdKrw = toIndicator(usdKrwRaw.status === 'fulfilled' ? usdKrwRaw.value : null)
  const krRate = toIndicator(krRateRaw.status === 'fulfilled' ? krRateRaw.value : null)

  const anyLive = [vix, usFedRate, usdKrw, krRate].some((i) => i.value !== null)
  const allLive = [vix, usFedRate, usdKrw, krRate].every((i) => i.value !== null)

  const body: MacroData = {
    vix, usFedRate, usdKrw, krRate,
    timestamp: new Date().toISOString(),
    source: allLive ? 'live' : anyLive ? 'partial' : 'error',
  }

  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
