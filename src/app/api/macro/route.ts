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

// 한국은행 ECOS API — 국고채 3년 수익률 (STAT_CODE: 817Y002, ITEM_CODE1: 010200000)
// 최근 10일 데이터를 요청해 주말·공휴일로 비는 날을 건너뜀
async function fetchKrRate(): Promise<{ value: number; change: number; changePercent: number } | null> {
  const apiKey = process.env.ECOS_API_KEY
  if (!apiKey) return null
  try {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - 10)
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/10/817Y002/D/${fmt(start)}/${fmt(today)}/010200000`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rows: Array<{ DATA_VALUE: string }> = data.StatisticSearch?.row
    if (!rows || rows.length === 0) return null
    const latest = parseFloat(rows[rows.length - 1].DATA_VALUE)
    const prev = rows.length >= 2 ? parseFloat(rows[rows.length - 2].DATA_VALUE) : null
    const value = Math.round(latest * 100) / 100
    const change = prev !== null ? Math.round((value - prev) * 100) / 100 : 0
    const changePercent = prev !== null && prev > 0 ? Math.round(((value - prev) / prev) * 10000) / 100 : 0
    return { value, change, changePercent }
  } catch {
    return null
  }
}

export async function GET() {
  const [vixRaw, usFedRaw, usdKrwRaw, krRateRaw] = await Promise.allSettled([
    fetchTickerChange('^VIX'),
    fetchTickerChange('^IRX'),
    fetchTickerChange('KRW=X'),
    fetchKrRate(),
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
