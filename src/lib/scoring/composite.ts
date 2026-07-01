import type { FearGreedResponse, MarketDataResponse, ExchangeRateResponse, InterestRateResponse, SectorNewsResponse, SectorAnalysis, SectorScoreBreakdown, Recommendation, SectorId } from '../types'
import { SECTORS, SECTOR_IDS } from '../constants/sectors'
import { fearGreedScore } from './fearGreedScore'
import { vixScore } from './vixScore'
import { exchangeRateScore } from './exchangeRateScore'
import { interestRateScore } from './interestRateScore'
import { newsScore } from './newsScore'
import { generateRationale, type RationaleRawData } from './rationale'

function getRecommendation(total: number): Recommendation {
  if (total >= 75) return { key: 'strong-buy', labelKo: '강력 매수', color: 'green', emoji: '🟢' }
  if (total >= 55) return { key: 'consider', labelKo: '매수 고려', color: 'yellow', emoji: '🟡' }
  if (total >= 35) return { key: 'neutral', labelKo: '중립/관망', color: 'orange', emoji: '🟠' }
  return { key: 'avoid', labelKo: '진입 비추천', color: 'red', emoji: '🔴' }
}

export function computeAllSectors(
  fearGreedData: FearGreedResponse,
  marketData: MarketDataResponse,
  fxData: ExchangeRateResponse,
  rateData: InterestRateResponse,
  newsMap: Partial<Record<SectorId, SectorNewsResponse>>
): SectorAnalysis[] {
  return SECTOR_IDS.map((id) => {
    const def = SECTORS[id]
    const newsData: SectorNewsResponse = newsMap[id] ?? { sector: id, items: [], sentimentScore: 10, source: 'fallback' }
    const fgScore = fearGreedScore(fearGreedData.score)
    const vScore = vixScore(marketData.vix)
    const exRate = exchangeRateScore(fxData.usdKrw, def.fxSensitivity)
    const irScore = interestRateScore(rateData, def.rateSensitivity)
    const nScore = newsData.sentimentScore ?? newsScore(newsData.items)
    const total = fgScore + vScore + exRate + irScore + nScore
    const score: SectorScoreBreakdown = { fearGreed: fgScore, vix: vScore, exchangeRate: exRate, interestRate: irScore, news: nScore, total }
    const rawData: RationaleRawData = { fearGreedScore: fearGreedData.score, vix: marketData.vix, usdKrw: fxData.usdKrw, fedRate: rateData.fedRate }
    return {
      id, nameKo: def.nameKo, nameEn: def.nameEn, etf: def.etf, icon: def.icon, topStocks: def.topStocks,
      score, recommendation: getRecommendation(total), rationale: generateRationale(score, rawData),
      news: newsData.items.slice(0, 3), updatedAt: new Date().toISOString(),
    }
  }).sort((a, b) => b.score.total - a.score.total)
}
