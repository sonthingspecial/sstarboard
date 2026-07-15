import { NextResponse } from 'next/server'
import type { AlternativeAsset, AlternativeData } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function fetchYahooValue(ticker: string): Promise<{ price: number; changePercent: number } | null> {
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

const ASSET_META = [
  { symbol: 'GC=F', name: '금', unit: 'USD/oz' },
  { symbol: 'BTC-USD', name: '비트코인', unit: 'USD' },
  { symbol: 'CL=F', name: '원자재 (WTI 원유)', unit: 'USD/bbl' },
  { symbol: 'DX-Y.NYB', name: '달러인덱스 (DXY)', unit: 'Index' },
] as const

export async function GET() {
  const results = await Promise.allSettled(ASSET_META.map((asset) => fetchYahooValue(asset.symbol)))

  const assets: AlternativeAsset[] = await Promise.all(
    ASSET_META.map(async (meta, i) => {
      const settled = results[i]
      let value = settled.status === 'fulfilled' ? settled.value : null

      if (meta.symbol === 'DX-Y.NYB' && value === null) {
        value = await fetchYahooValue('DX=F')
      }

      return {
        symbol: meta.symbol,
        name: meta.name,
        unit: meta.unit,
        price: value?.price ?? null,
        changePercent: value?.changePercent ?? null,
        source: value ? 'live' : 'error',
      }
    })
  )

  const body: AlternativeData = {
    assets,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
