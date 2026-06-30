import type { SectorId, SectorDefinition } from '../types'

export const SECTORS: Record<SectorId, SectorDefinition> = {
  technology: { nameKo: '기술', nameEn: 'Technology', etf: 'XLK', icon: 'Cpu', topStocks: ['AAPL', 'MSFT', 'NVDA'], fxSensitivity: 'neutral', rateSensitivity: 'negative-high' },
  healthcare: { nameKo: '헬스케어', nameEn: 'Healthcare', etf: 'XLV', icon: 'HeartPulse', topStocks: ['LLY', 'UNH', 'JNJ'], fxSensitivity: 'neutral', rateSensitivity: 'negative-low' },
  financials: { nameKo: '금융', nameEn: 'Financials', etf: 'XLF', icon: 'Landmark', topStocks: ['JPM', 'BAC', 'WFC'], fxSensitivity: 'neutral', rateSensitivity: 'positive-high' },
  energy: { nameKo: '에너지', nameEn: 'Energy', etf: 'XLE', icon: 'Zap', topStocks: ['XOM', 'CVX', 'COP'], fxSensitivity: 'positive', rateSensitivity: 'negative-low' },
  'consumer-discretionary': { nameKo: '임의소비재', nameEn: 'Consumer Discretionary', etf: 'XLY', icon: 'ShoppingBag', topStocks: ['AMZN', 'TSLA', 'MCD'], fxSensitivity: 'neutral', rateSensitivity: 'negative-high' },
  'consumer-staples': { nameKo: '필수소비재', nameEn: 'Consumer Staples', etf: 'XLP', icon: 'ShoppingCart', topStocks: ['WMT', 'PG', 'KO'], fxSensitivity: 'neutral', rateSensitivity: 'negative-low' },
  industrials: { nameKo: '산업재', nameEn: 'Industrials', etf: 'XLI', icon: 'Factory', topStocks: ['CAT', 'HON', 'DE'], fxSensitivity: 'negative', rateSensitivity: 'negative-medium' },
  'real-estate': { nameKo: '부동산(REIT)', nameEn: 'Real Estate', etf: 'XLRE', icon: 'Building2', topStocks: ['AMT', 'PLD', 'EQIX'], fxSensitivity: 'neutral', rateSensitivity: 'negative-high' },
  utilities: { nameKo: '유틸리티', nameEn: 'Utilities', etf: 'XLU', icon: 'Plug', topStocks: ['NEE', 'DUK', 'SO'], fxSensitivity: 'neutral', rateSensitivity: 'negative-high' },
  materials: { nameKo: '소재', nameEn: 'Materials', etf: 'XLB', icon: 'Gem', topStocks: ['LIN', 'FCX', 'APD'], fxSensitivity: 'negative', rateSensitivity: 'negative-medium' },
  'communication-services': { nameKo: '커뮤니케이션', nameEn: 'Communication Services', etf: 'XLC', icon: 'Radio', topStocks: ['META', 'GOOGL', 'NFLX'], fxSensitivity: 'neutral', rateSensitivity: 'negative-medium' },
}

export const SECTOR_IDS = Object.keys(SECTORS) as SectorId[]
