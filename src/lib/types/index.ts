export type SectorId =
  | 'technology' | 'healthcare' | 'financials' | 'energy'
  | 'consumer-discretionary' | 'consumer-staples' | 'industrials'
  | 'real-estate' | 'utilities' | 'materials' | 'communication-services'

export type FxSensitivity = 'positive' | 'negative' | 'neutral'
export type RateSensitivity = 'positive-high' | 'negative-high' | 'negative-medium' | 'negative-low'
export type RecommendationKey = 'strong-buy' | 'consider' | 'neutral' | 'avoid'

export interface SectorDefinition {
  nameKo: string
  nameEn: string
  etf: string
  icon: string
  topStocks: string[]
  fxSensitivity: FxSensitivity
  rateSensitivity: RateSensitivity
}

export interface NewsItem {
  title: string
  pubDate: string
  link: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

export interface SectorNewsResponse {
  sector: SectorId
  items: NewsItem[]
  sentimentScore: number | undefined
  source: 'live' | 'fallback'
}

export interface FearGreedResponse {
  score: number
  rating: string
  timestamp: string
  source: 'live' | 'fallback'
}

export interface MarketDataResponse {
  vix: number
  spy: { price: number; changePercent: number }
  qqq: { price: number; changePercent: number }
  timestamp: string
  source: 'live' | 'fallback'
}

export interface ExchangeRateResponse {
  usdKrw: number
  timestamp: string
  source: 'live' | 'fallback'
}

export interface InterestRateResponse {
  fedRate: number
  lastChanged: string
  trend: 'rising' | 'stable' | 'falling'
  source: 'fred' | 'static' | 'fallback'
}

export interface SectorScoreBreakdown {
  fearGreed: number
  vix: number
  exchangeRate: number
  interestRate: number
  news: number
  total: number
}

export interface Recommendation {
  key: RecommendationKey
  labelKo: string
  color: 'green' | 'yellow' | 'orange' | 'red'
  emoji: string
}

export interface RationaleItem {
  factor: string
  text: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

export interface SectorAnalysis {
  id: SectorId
  nameKo: string
  nameEn: string
  etf: string
  icon: string
  topStocks: string[]
  score: SectorScoreBreakdown
  recommendation: Recommendation
  rationale: RationaleItem[]
  news: NewsItem[]
  updatedAt: string
}

// Macro display types
export interface MacroIndicator {
  value: number | null
  change: number | null
  changePercent: number | null
}

export interface MacroData {
  vix: MacroIndicator
  usFedRate: MacroIndicator
  usdKrw: MacroIndicator
  krRate: MacroIndicator
  timestamp: string
  source: 'live' | 'partial' | 'error'
}

// US market display types
export interface UsMarketData {
  spy: { price: number; changePercent: number } | null
  qqq: { price: number; changePercent: number } | null
  fearGreed: { score: number; rating: string } | null
  sectors: SectorAnalysis[]
  timestamp: string
}

// AI summary
export interface AiSummaryResult {
  conclusion: string
  rationale1: string
  rationale2: string
  rationale3: string
}
