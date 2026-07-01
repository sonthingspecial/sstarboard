import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MacroData, UsMarketData, AiSummaryResult } from '@/lib/types'

export const dynamic = 'force-dynamic'

// In-memory rate limiter: 1분에 IP당 최대 3회
// Vercel 서버리스 환경에서는 인스턴스 재시작 시 초기화되므로 1차 방어선 역할만 함.
// 완전한 방지가 필요하면 Redis/KV 기반 외부 저장소가 필요함.
const RATE_LIMIT = 3
const WINDOW_MS = 60_000
const ipMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipMap.get(ip)
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

function buildPrompt(macro: MacroData, market: UsMarketData): string {
  const lines: string[] = ['다음은 오늘 기준 투자 시장 데이터입니다.', '', '[거시경제 데이터]']

  if (macro.vix.value !== null) lines.push(`- VIX 공포지수: ${macro.vix.value} (전일 대비 ${macro.vix.change ?? 'N/A'})`)
  if (macro.usFedRate.value !== null) lines.push(`- 미국 기준금리(^IRX): ${macro.usFedRate.value}%`)
  if (macro.usdKrw.value !== null) lines.push(`- 원달러 환율: ${macro.usdKrw.value.toLocaleString()}원`)
  if (macro.krRate.value !== null) lines.push(`- 한국 국채 3년물 수익률(KR3YT): ${macro.krRate.value}%`)

  lines.push('', '[미국 주식 데이터]')
  if (market.spy) lines.push(`- SPY(S&P500): $${market.spy.price} (${market.spy.changePercent > 0 ? '+' : ''}${market.spy.changePercent}%)`)
  if (market.qqq) lines.push(`- QQQ(나스닥100): $${market.qqq.price} (${market.qqq.changePercent > 0 ? '+' : ''}${market.qqq.changePercent}%)`)
  if (market.fearGreed) lines.push(`- CNN 공포탐욕지수: ${market.fearGreed.score} (${market.fearGreed.rating})`)

  const top3 = market.sectors.slice(0, 3)
  if (top3.length > 0) {
    lines.push('- 상위 3개 섹터: ' + top3.map((s) => `${s.nameKo}(${s.score.total}점)`).join(', '))
  }

  lines.push(
    '',
    '위 데이터를 종합해서 한국 개인 투자자 입장에서 다음 형식으로 답하세요:',
    '결론: [한 줄]',
    '근거 1: [데이터 수치] → [해석]',
    '근거 2: [데이터 수치] → [해석]',
    '근거 3: [데이터 수치] → [해석]',
    '',
    '규칙:',
    '- 특정 종목이나 부동산 매물을 추천하지 말 것',
    '- 투자 방향성과 공부 영역만 제안할 것',
    '- 데이터에 없는 내용은 추측하지 말 것',
    '- 반드시 위 형식을 지킬 것',
  )

  return lines.join('\n')
}

function parseResponse(text: string): AiSummaryResult | null {
  const conclusion = text.match(/결론:\s*(.+)/)?.[1]?.trim()
  const r1 = text.match(/근거\s*1:\s*(.+)/)?.[1]?.trim()
  const r2 = text.match(/근거\s*2:\s*(.+)/)?.[1]?.trim()
  const r3 = text.match(/근거\s*3:\s*(.+)/)?.[1]?.trim()
  if (!conclusion || !r1 || !r2 || !r3) return null
  return { conclusion, rationale1: r1, rationale2: r2, rationale3: r3 }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })

  let macro: MacroData, market: UsMarketData
  try {
    const body = await req.json()
    macro = body.macroData
    market = body.usMarketData
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })
    const result = await model.generateContent(buildPrompt(macro, market))
    const text = result.response.text()
    const parsed = parseResponse(text)
    if (!parsed) return NextResponse.json({ error: '분석을 생성할 수 없습니다. 다시 시도해주세요.' }, { status: 500 })
    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const status = (err as Record<string, unknown>)?.status ?? 'unknown'
    console.error(`[api/ai-summary] status=${status} message=${message}`)
    return NextResponse.json({ error: '분석을 생성할 수 없습니다. 다시 시도해주세요.' }, { status: 500 })
  }
}
