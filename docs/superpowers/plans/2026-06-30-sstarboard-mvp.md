# Sstarboard MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build sstarboard — a financial dashboard for Korean investors with macro indicators, US stock sector scores, and Gemini AI market summary, deployed to Vercel.

**Architecture:** Hybrid Next.js App Router — API Routes (server-side, secrets hidden) + SWR (client-side polling) for real-time macro/stock data. Gemini AI summary triggered on-demand via button click. Sector scoring logic ported directly from `C:\Users\user\my-first-vibe`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, next-themes, SWR, @google/generative-ai, rss-parser, lucide-react, vitest

## Global Constraints

- All GEMINI_API_KEY access must be server-side only — never `NEXT_PUBLIC_` prefix
- Fetch failures → return `null` for that field → UI shows "데이터를 불러올 수 없습니다" — no static hardcoded fallback values for displayed data
- Korean color convention: up = `#FF4444` (빨강), down = `#4477FF` (파랑)
- `export const dynamic = 'force-dynamic'` required on all API routes
- `suppressHydrationWarning` on `<html>` tag (required for next-themes)
- tabular-nums on all numeric displays
- Mobile-first: 375px base, then 768px, 1024px breakpoints
- After each task: stop and report completion before proceeding

---

## File Map

```
sstarboard/
├── vitest.config.ts
├── .env.local.example
├── README.md
├── tailwind.config.ts                          (modified)
├── src/
│   ├── app/
│   │   ├── globals.css                         (modified)
│   │   ├── layout.tsx                          (modified)
│   │   ├── page.tsx                            (modified)
│   │   └── api/
│   │       ├── macro/route.ts                  (created)
│   │       ├── us-market/route.ts              (created)
│   │       └── ai-summary/route.ts             (created)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                      (created)
│   │   │   └── SectionAnchor.tsx               (created)
│   │   ├── sections/
│   │   │   ├── AiSummarySection.tsx            (created)
│   │   │   ├── MacroSection.tsx                (created)
│   │   │   ├── UsMarketSection.tsx             (created)
│   │   │   └── PlaceholderSection.tsx          (created)
│   │   └── ui/
│   │       ├── MacroCard.tsx                   (created)
│   │       ├── SectorCard.tsx                  (created)
│   │       ├── SkeletonCard.tsx                (created)
│   │       └── InfoModal.tsx                   (created)
│   ├── hooks/
│   │   ├── useMacroData.ts                     (created)
│   │   └── useUsMarket.ts                      (created)
│   └── lib/
│       ├── types/index.ts                      (created)
│       ├── constants/
│       │   ├── sectors.ts                      (ported from my-first-vibe)
│       │   ├── newsKeywords.ts                 (ported from my-first-vibe)
│       │   └── tooltips.ts                     (created)
│       └── scoring/
│           ├── composite.ts                    (ported from my-first-vibe)
│           ├── fearGreedScore.ts               (ported from my-first-vibe)
│           ├── vixScore.ts                     (ported from my-first-vibe)
│           ├── exchangeRateScore.ts            (ported from my-first-vibe)
│           ├── interestRateScore.ts            (ported from my-first-vibe)
│           ├── newsScore.ts                    (ported from my-first-vibe)
│           └── rationale.ts                    (ported from my-first-vibe)
└── src/__tests__/lib/scoring/
    ├── fearGreedScore.test.ts
    ├── vixScore.test.ts
    ├── exchangeRateScore.test.ts
    ├── interestRateScore.test.ts
    └── newsScore.test.ts
```

---

## Task 1: Project Bootstrap

**Files:**
- Run: `npx create-next-app@latest` scaffold
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `.env.local.example`

**Interfaces:**
- Produces: working `npm run dev` server, custom Tailwind colors available, vitest runnable

- [ ] **Step 1: Scaffold the project**

Run in `C:\Users\user\sstarboard`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```
Select all defaults when prompted. This overwrites the empty directory (only the git repo and docs exist).

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install next-themes swr @google/generative-ai rss-parser lucide-react
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
})
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Configure Tailwind custom colors**

Replace the `theme.extend` section in `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1F44',
          light: '#1A2D54',
          dark: '#061329',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E8C84A',
          dark: '#B8952B',
        },
        up: '#FF4444',
        down: '#4477FF',
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 7: Update globals.css**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --card-bg: #ffffff;
    --border-color: #e5e7eb;
  }
  .dark {
    --card-bg: #1A2D54;
    --border-color: #2a3f6f;
  }
  body {
    font-variant-numeric: tabular-nums;
    @apply bg-gray-50 dark:bg-navy text-gray-900 dark:text-gray-100;
  }
}
```

- [ ] **Step 8: Create .env.local.example**

```
# .env.local.example
GEMINI_API_KEY=
```

- [ ] **Step 9: Verify vitest runs**

```bash
npx vitest run
```
Expected: "No test files found" (zero failures — no tests yet)

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```
Open http://localhost:3000. Expected: Next.js default page renders without errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: bootstrap sstarboard project with Next.js, Tailwind, vitest"
```

---

## Task 2: Shared Types, Constants, and Scoring Library

**Files:**
- Create: `src/lib/types/index.ts`
- Create: `src/lib/constants/sectors.ts`
- Create: `src/lib/constants/newsKeywords.ts`
- Create: `src/lib/constants/tooltips.ts`
- Create: `src/lib/scoring/fearGreedScore.ts`
- Create: `src/lib/scoring/vixScore.ts`
- Create: `src/lib/scoring/exchangeRateScore.ts`
- Create: `src/lib/scoring/interestRateScore.ts`
- Create: `src/lib/scoring/newsScore.ts`
- Create: `src/lib/scoring/rationale.ts`
- Create: `src/lib/scoring/composite.ts`
- Create: `src/__tests__/lib/scoring/fearGreedScore.test.ts`
- Create: `src/__tests__/lib/scoring/vixScore.test.ts`
- Create: `src/__tests__/lib/scoring/exchangeRateScore.test.ts`
- Create: `src/__tests__/lib/scoring/interestRateScore.test.ts`
- Create: `src/__tests__/lib/scoring/newsScore.test.ts`

**Interfaces:**
- Produces: all shared types + scoring functions importable by API routes and components

- [ ] **Step 1: Write failing test for fearGreedScore**

Create `src/__tests__/lib/scoring/fearGreedScore.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { fearGreedScore } from '@/lib/scoring/fearGreedScore'

describe('fearGreedScore', () => {
  it('returns 0 for score 0 (extreme fear)', () => {
    expect(fearGreedScore(0)).toBe(0)
  })
  it('returns 25 for score 100 (extreme greed)', () => {
    expect(fearGreedScore(100)).toBe(25)
  })
  it('returns 13 for score 50 (neutral)', () => {
    expect(fearGreedScore(50)).toBe(13)
  })
  it('returns 6-7 for score 26 (fear zone)', () => {
    expect(fearGreedScore(26)).toBeGreaterThanOrEqual(6)
    expect(fearGreedScore(26)).toBeLessThanOrEqual(7)
  })
})
```

- [ ] **Step 2: Write failing test for vixScore**

Create `src/__tests__/lib/scoring/vixScore.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { vixScore } from '@/lib/scoring/vixScore'

describe('vixScore', () => {
  it('returns 20 for VIX < 15 (very calm)', () => {
    expect(vixScore(12)).toBe(20)
  })
  it('returns 16 for VIX 15–19 (calm)', () => {
    expect(vixScore(18)).toBe(16)
  })
  it('returns 10 for VIX 20–24 (elevated)', () => {
    expect(vixScore(22)).toBe(10)
  })
  it('returns 5 for VIX 25–29 (high)', () => {
    expect(vixScore(27)).toBe(5)
  })
  it('returns 0 for VIX >= 30 (panic)', () => {
    expect(vixScore(35)).toBe(0)
  })
})
```

- [ ] **Step 3: Write failing test for exchangeRateScore**

Create `src/__tests__/lib/scoring/exchangeRateScore.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { exchangeRateScore } from '@/lib/scoring/exchangeRateScore'

describe('exchangeRateScore', () => {
  it('neutral sensitivity: returns 15 for USD/KRW < 1300', () => {
    expect(exchangeRateScore(1280, 'neutral')).toBe(15)
  })
  it('neutral sensitivity: returns 4 for USD/KRW >= 1450', () => {
    expect(exchangeRateScore(1543, 'neutral')).toBe(4)
  })
  it('positive sensitivity (energy): gets +2 bonus when dollar strong', () => {
    const score = exchangeRateScore(1543, 'positive')
    expect(score).toBe(6)
  })
  it('negative sensitivity (industrials): gets -2 penalty when dollar strong', () => {
    const score = exchangeRateScore(1543, 'negative')
    expect(score).toBe(2)
  })
  it('score is always clamped 0–15', () => {
    expect(exchangeRateScore(800, 'negative')).toBeGreaterThanOrEqual(0)
    expect(exchangeRateScore(2000, 'positive')).toBeLessThanOrEqual(15)
  })
})
```

- [ ] **Step 4: Write failing test for interestRateScore**

Create `src/__tests__/lib/scoring/interestRateScore.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { interestRateScore } from '@/lib/scoring/interestRateScore'
import type { InterestRateResponse } from '@/lib/types'

const makeRate = (fedRate: number, trend: 'rising' | 'stable' | 'falling'): InterestRateResponse => ({
  fedRate, trend, lastChanged: '2026-01-01', source: 'fred',
})

describe('interestRateScore', () => {
  it('financials (positive-high): score high when rate > 4.5', () => {
    const score = interestRateScore(makeRate(5.0, 'stable'), 'positive-high')
    expect(score).toBeGreaterThan(12)
  })
  it('tech (negative-high): score low when rate > 4.5', () => {
    const score = interestRateScore(makeRate(5.0, 'stable'), 'negative-high')
    expect(score).toBeLessThan(10)
  })
  it('falling trend adds bonus', () => {
    const stable = interestRateScore(makeRate(4.5, 'stable'), 'negative-low')
    const falling = interestRateScore(makeRate(4.5, 'falling'), 'negative-low')
    expect(falling).toBeGreaterThan(stable)
  })
  it('score is always clamped 0–20', () => {
    expect(interestRateScore(makeRate(0, 'falling'), 'positive-high')).toBeLessThanOrEqual(20)
    expect(interestRateScore(makeRate(10, 'rising'), 'negative-high')).toBeGreaterThanOrEqual(0)
  })
})
```

- [ ] **Step 5: Write failing test for newsScore**

Create `src/__tests__/lib/scoring/newsScore.test.ts`:
```typescript
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
    const positive = Array(10).fill(makeItem('surge rally beat record growth bullish'))
    const negative = Array(10).fill(makeItem('crash plunge recession layoff bearish'))
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
```

- [ ] **Step 6: Run tests — verify they fail**

```bash
npx vitest run
```
Expected: FAIL — "Cannot find module '@/lib/scoring/fearGreedScore'" (and similar)

- [ ] **Step 7: Create src/lib/types/index.ts**

```typescript
// src/lib/types/index.ts

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
  sentimentScore: number
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
```

- [ ] **Step 8: Create src/lib/constants/sectors.ts**

```typescript
// src/lib/constants/sectors.ts
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
```

- [ ] **Step 9: Create src/lib/constants/newsKeywords.ts**

```typescript
// src/lib/constants/newsKeywords.ts
import type { SectorId } from '../types'

export const NEWS_KEYWORDS: Record<SectorId, string> = {
  technology: 'semiconductor OR "AI chip" OR "artificial intelligence" OR "cloud computing" OR NVIDIA OR Apple OR Microsoft OR "tech stocks"',
  healthcare: 'pharmaceutical OR biotech OR FDA OR "drug approval" OR "healthcare earnings" OR Pfizer OR "medical device" OR "health sector"',
  financials: '"Federal Reserve" OR "bank earnings" OR "interest rate" OR JPMorgan OR "credit market" OR fintech OR "bank stocks"',
  energy: '"oil price" OR "crude oil" OR "natural gas" OR OPEC OR "energy sector" OR Chevron OR Exxon OR "energy stocks"',
  'consumer-discretionary': '"consumer spending" OR retail OR Amazon OR Tesla OR "luxury goods" OR "e-commerce" OR "consumer discretionary"',
  'consumer-staples': '"consumer staples" OR Walmart OR grocery OR "food prices" OR Procter OR "household goods" OR "defensive stocks"',
  industrials: '"industrial sector" OR Boeing OR Caterpillar OR "supply chain" OR manufacturing OR "defense spending" OR "infrastructure"',
  'real-estate': 'REIT OR "real estate" OR "mortgage rate" OR "housing market" OR "commercial real estate" OR "property stocks"',
  utilities: 'utilities OR "electricity demand" OR "power grid" OR "clean energy" OR "utility stocks" OR "renewable energy"',
  materials: '"raw materials" OR copper OR gold OR steel OR "mining sector" OR lithium OR "commodity prices" OR "materials sector"',
  'communication-services': '"social media" OR streaming OR Meta OR Alphabet OR Netflix OR telecom OR "advertising revenue" OR "media stocks"',
}
```

- [ ] **Step 10: Create src/lib/constants/tooltips.ts**

```typescript
// src/lib/constants/tooltips.ts
export const MACRO_TOOLTIPS: Record<string, { title: string; description: string }> = {
  vix: {
    title: 'VIX 공포지수란?',
    description: '시장의 변동성과 불안 심리를 나타내는 지수입니다. 20 이하는 안정, 30 이상은 불안 구간으로 봅니다. CBOE에서 S&P 500 옵션 가격을 기반으로 산출합니다.',
  },
  usFedRate: {
    title: '미국 기준금리란?',
    description: '미 연준(Federal Reserve)이 결정하는 기준금리입니다. 13주 T-Bill 수익률(^IRX)을 참고 지표로 사용합니다. 금리가 높을수록 성장주에 부담, 가치주·배당주에 유리한 경향이 있습니다.',
  },
  usdKrw: {
    title: '원달러 환율이란?',
    description: '1달러를 사기 위해 필요한 원화 금액입니다. 원화 약세(환율 상승)는 수출 기업에 유리하지만, 미국 주식 투자 시 환전 비용이 증가합니다.',
  },
  krRate: {
    title: '한국 기준금리란?',
    description: '한국은행이 결정하는 기준금리입니다. 한국 국채 3년물 수익률(KR3YT=RR)을 참고 지표로 사용합니다. 금리 인하는 부동산·성장주에 유리한 경향이 있습니다.',
  },
}
```

- [ ] **Step 11: Create scoring files (ported from my-first-vibe)**

`src/lib/scoring/fearGreedScore.ts`:
```typescript
export function fearGreedScore(score: number): number {
  return Math.round((score / 100) * 25)
}
```

`src/lib/scoring/vixScore.ts`:
```typescript
export function vixScore(vix: number): number {
  if (vix < 15) return 20
  if (vix < 20) return 16
  if (vix < 25) return 10
  if (vix < 30) return 5
  return 0
}
```

`src/lib/scoring/exchangeRateScore.ts`:
```typescript
import type { FxSensitivity } from '../types'

function baseScore(usdKrw: number): number {
  if (usdKrw < 1300) return 15
  if (usdKrw < 1350) return 13
  if (usdKrw < 1400) return 10
  if (usdKrw < 1450) return 7
  return 4
}

function fxAdjustment(usdKrw: number, sensitivity: FxSensitivity): number {
  const strongDollar = usdKrw >= 1400
  if (sensitivity === 'positive') return strongDollar ? 2 : -1
  if (sensitivity === 'negative') return strongDollar ? -2 : 1
  return 0
}

export function exchangeRateScore(usdKrw: number, sensitivity: FxSensitivity): number {
  return Math.max(0, Math.min(15, baseScore(usdKrw) + fxAdjustment(usdKrw, sensitivity)))
}
```

`src/lib/scoring/interestRateScore.ts`:
```typescript
import type { InterestRateResponse, RateSensitivity } from '../types'

function baseScore(fedRate: number): number {
  if (fedRate <= 2.0) return 18
  if (fedRate <= 3.5) return 15
  if (fedRate <= 4.5) return 12
  if (fedRate <= 5.5) return 8
  return 5
}

function trendBonus(trend: 'rising' | 'stable' | 'falling'): number {
  if (trend === 'falling') return 3
  if (trend === 'rising') return -3
  return 0
}

function sensitivityAdjustment(fedRate: number, sensitivity: RateSensitivity): number {
  const highRate = fedRate > 4.5
  const lowRate = fedRate <= 3.5
  switch (sensitivity) {
    case 'positive-high': return highRate ? 4 : lowRate ? -3 : 1
    case 'negative-high': return highRate ? -4 : lowRate ? 3 : -1
    case 'negative-medium': return highRate ? -2 : lowRate ? 2 : 0
    case 'negative-low': return highRate ? -1 : lowRate ? 1 : 0
  }
}

export function interestRateScore(rateData: InterestRateResponse, sensitivity: RateSensitivity): number {
  return Math.max(0, Math.min(20, baseScore(rateData.fedRate) + trendBonus(rateData.trend) + sensitivityAdjustment(rateData.fedRate, sensitivity)))
}
```

`src/lib/scoring/newsScore.ts`:
```typescript
import type { NewsItem } from '../types'

const POSITIVE = ['surge','rally','beat','record','growth','upgrade','bullish','strong','innovation','expansion','deal','partnership','rise','gains','profit','outperform','breakout','recovery','rebound','boost','soar','jump','climb']
const NEGATIVE = ['crash','plunge','miss','recession','layoff','downgrade','bearish','weak','loss','bankruptcy','tariff','sanction','regulation','decline','fall','slump','warning','risk','concern','fears','volatile','tumble','drop','sell-off','selloff']

function scoreItem(title: string): number {
  const text = title.toLowerCase()
  return POSITIVE.filter(k => text.includes(k)).length - NEGATIVE.filter(k => text.includes(k)).length
}

export function getSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const s = scoreItem(title)
  return s > 0 ? 'positive' : s < 0 ? 'negative' : 'neutral'
}

export function newsScore(items: NewsItem[]): number {
  if (items.length === 0) return 10
  const raw = items.slice(0, 10).reduce((sum, item) => sum + scoreItem(item.title), 0)
  return Math.max(0, Math.min(20, 10 + Math.round(raw * 1.5)))
}
```

`src/lib/scoring/rationale.ts`:
```typescript
import type { SectorScoreBreakdown, RationaleItem } from '../types'

export function generateRationale(score: SectorScoreBreakdown): RationaleItem[] {
  const items: RationaleItem[] = []
  if (score.fearGreed >= 19) items.push({ factor: '공포탐욕 지수', text: '탐욕 심리가 강해 매수 모멘텀이 형성되어 있습니다', sentiment: 'positive' })
  else if (score.fearGreed >= 13) items.push({ factor: '공포탐욕 지수', text: '중립적 심리로 방향성이 불확실합니다', sentiment: 'neutral' })
  else if (score.fearGreed >= 6) items.push({ factor: '공포탐욕 지수', text: '공포 심리로 단기 하방 압력이 있습니다', sentiment: 'negative' })
  else items.push({ factor: '공포탐욕 지수', text: '극심한 공포 — 과매도 구간에서 역발상 매수 기회일 수 있습니다', sentiment: 'negative' })

  if (score.vix >= 16) items.push({ factor: '변동성 (VIX)', text: '변동성이 낮아 안정적인 투자 환경입니다', sentiment: 'positive' })
  else if (score.vix >= 10) items.push({ factor: '변동성 (VIX)', text: '보통 수준의 변동성으로 리스크 관리가 필요합니다', sentiment: 'neutral' })
  else if (score.vix >= 5) items.push({ factor: '변동성 (VIX)', text: '변동성이 높아 단기 가격 급변 가능성이 있습니다', sentiment: 'negative' })
  else items.push({ factor: '변동성 (VIX)', text: 'VIX 30+ — 패닉 수준의 변동성으로 고위험 구간입니다', sentiment: 'negative' })

  if (score.exchangeRate >= 12) items.push({ factor: 'USD/KRW 환율', text: '환율 여건이 해당 섹터 투자에 유리합니다', sentiment: 'positive' })
  else if (score.exchangeRate >= 8) items.push({ factor: 'USD/KRW 환율', text: '환율이 중립 구간으로 영향이 제한적입니다', sentiment: 'neutral' })
  else items.push({ factor: 'USD/KRW 환율', text: '강달러·원화 약세로 환전 비용 부담이 있습니다', sentiment: 'negative' })

  if (score.interestRate >= 15) items.push({ factor: '미국 기준금리', text: '금리 환경이 해당 섹터 밸류에이션에 우호적입니다', sentiment: 'positive' })
  else if (score.interestRate >= 8) items.push({ factor: '미국 기준금리', text: '금리 영향이 중립적이거나 제한적입니다', sentiment: 'neutral' })
  else items.push({ factor: '미국 기준금리', text: '고금리 환경에서 해당 섹터 할인율 부담이 있습니다', sentiment: 'negative' })

  if (score.news >= 14) items.push({ factor: '뉴스 센티먼트', text: '긍정적 뉴스 흐름이 섹터 심리를 지지하고 있습니다', sentiment: 'positive' })
  else if (score.news >= 8) items.push({ factor: '뉴스 센티먼트', text: '뉴스 흐름이 중립적입니다', sentiment: 'neutral' })
  else items.push({ factor: '뉴스 센티먼트', text: '부정적 뉴스가 우세하여 단기 하방 압력이 있습니다', sentiment: 'negative' })

  return items
}
```

`src/lib/scoring/composite.ts`:
```typescript
import type { FearGreedResponse, MarketDataResponse, ExchangeRateResponse, InterestRateResponse, SectorNewsResponse, SectorAnalysis, SectorScoreBreakdown, Recommendation, SectorId } from '../types'
import { SECTORS, SECTOR_IDS } from '../constants/sectors'
import { fearGreedScore } from './fearGreedScore'
import { vixScore } from './vixScore'
import { exchangeRateScore } from './exchangeRateScore'
import { interestRateScore } from './interestRateScore'
import { newsScore } from './newsScore'
import { generateRationale } from './rationale'

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
    return {
      id, nameKo: def.nameKo, nameEn: def.nameEn, etf: def.etf, icon: def.icon, topStocks: def.topStocks,
      score, recommendation: getRecommendation(total), rationale: generateRationale(score),
      news: newsData.items.slice(0, 3), updatedAt: new Date().toISOString(),
    }
  }).sort((a, b) => b.score.total - a.score.total)
}
```

- [ ] **Step 12: Run tests — verify they pass**

```bash
npx vitest run
```
Expected: 17 tests pass, 0 fail.

- [ ] **Step 13: Commit**

```bash
git add src/lib src/__tests__
git commit -m "feat: add shared types, constants, and scoring library with tests"
```

---

## Task 3: Layout + NavBar + Dark Mode

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/SectionAnchor.tsx`
- Modify: `src/app/page.tsx` (scaffold with section structure)

**Interfaces:**
- Produces: sticky NavBar with dark mode toggle visible at http://localhost:3000; smooth scroll to section anchors

- [ ] **Step 1: Update src/app/layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Navbar } from '@/components/layout/Navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sstarboard — 한국 투자자를 위한 금융 대시보드',
  description: '거시경제, 미국 주식 섹터 분석, AI 시황 요약을 한 페이지에서',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Navbar />
          <main className="min-h-screen pt-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create src/components/layout/Navbar.tsx**

```tsx
// src/components/layout/Navbar.tsx
'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X } from 'lucide-react'

const NAV_ITEMS = [
  { label: '오늘의 시황', href: '#ai-summary' },
  { label: '거시경제', href: '#macro' },
  { label: '미국주식', href: '#us-market' },
  { label: '부동산', href: '#real-estate' },
  { label: '한국주식', href: '#kr-stock' },
  { label: '대안투자', href: '#alternative' },
  { label: '뉴스', href: '#news' },
]

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    setMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-navy dark:bg-navy-dark backdrop-blur-md transition-shadow ${scrolled ? 'shadow-lg' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <span className="text-gold font-bold text-xl tracking-tight">★ Sstarboard</span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-gold transition-colors rounded-md hover:bg-white/5"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Dark mode toggle + mobile menu */}
        <div className="flex items-center gap-2">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-300 hover:text-gold transition-colors"
              aria-label="다크모드 토글"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-gold transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-navy dark:bg-navy-dark border-t border-white/10 px-4 pb-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="block py-3 text-sm text-gray-300 hover:text-gold border-b border-white/5 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 3: Create src/components/layout/SectionAnchor.tsx**

```tsx
// src/components/layout/SectionAnchor.tsx
interface SectionAnchorProps {
  id: string
  className?: string
  children: React.ReactNode
}

export function SectionAnchor({ id, className = '', children }: SectionAnchorProps) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-10 max-w-7xl mx-auto ${className}`}>
      {children}
    </section>
  )
}
```

- [ ] **Step 4: Scaffold src/app/page.tsx**

```tsx
// src/app/page.tsx
import { SectionAnchor } from '@/components/layout/SectionAnchor'

export default function Home() {
  return (
    <div>
      <SectionAnchor id="ai-summary">
        <p className="text-gray-400">AI 요약 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="macro">
        <p className="text-gray-400">거시경제 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="us-market">
        <p className="text-gray-400">미국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="real-estate">
        <p className="text-gray-400">부동산 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="kr-stock">
        <p className="text-gray-400">한국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="alternative">
        <p className="text-gray-400">대안투자 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="news">
        <p className="text-gray-400">뉴스 섹션 — 구현 예정</p>
      </SectionAnchor>
    </div>
  )
}
```

- [ ] **Step 5: Manual test**

```bash
npm run dev
```
Open http://localhost:3000.
- [ ] NavBar appears at top with navy background
- [ ] "★ Sstarboard" gold logo visible
- [ ] Nav items visible (desktop) / hamburger (< 768px)
- [ ] Dark mode toggle button present; clicking switches to dark
- [ ] Clicking a nav item smooth-scrolls to the corresponding section

- [ ] **Step 6: Commit**

```bash
git add src/app src/components
git commit -m "feat: add layout, Navbar with dark mode toggle and smooth scroll"
```

---

## Task 4: `/api/macro` Route

**Files:**
- Create: `src/app/api/macro/route.ts`

**Interfaces:**
- Consumes: Yahoo Finance `/v8/finance/chart/` for `^VIX`, `^IRX`, `KRW=X`, `KR3YT=RR`
- Produces: `GET /api/macro` → `MacroData` JSON

- [ ] **Step 1: Create src/app/api/macro/route.ts**

```typescript
// src/app/api/macro/route.ts
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
```

- [ ] **Step 2: Manual test**

With `npm run dev` running, open:
```
http://localhost:3000/api/macro
```
Expected: JSON with `{ vix: { value: ..., change: ..., changePercent: ... }, ... }`. Fields that Yahoo Finance can't provide will be `{ value: null, change: null, changePercent: null }`. Verify `KR3YT=RR` result — if null, that field shows null (not a static value).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/macro
git commit -m "feat: add /api/macro route (VIX, US rate, USD/KRW, KR rate via Yahoo Finance)"
```

---

## Task 5: MacroSection UI (useMacroData + MacroCard + InfoModal + SkeletonCard)

**Files:**
- Create: `src/hooks/useMacroData.ts`
- Create: `src/components/ui/SkeletonCard.tsx`
- Create: `src/components/ui/InfoModal.tsx`
- Create: `src/components/ui/MacroCard.tsx`
- Create: `src/components/sections/MacroSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `GET /api/macro` → `MacroData`
- Produces: 4-card macro section rendered at `#macro`

- [ ] **Step 1: Create src/hooks/useMacroData.ts**

```typescript
// src/hooks/useMacroData.ts
import useSWR from 'swr'
import type { MacroData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useMacroData() {
  const { data, error, isLoading } = useSWR<MacroData>('/api/macro', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })
  return { data, error, isLoading }
}
```

- [ ] **Step 2: Create src/components/ui/SkeletonCard.tsx**

```tsx
// src/components/ui/SkeletonCard.tsx
interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 animate-pulse ${className}`}>
      <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded mb-3" />
      <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded" />
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/ui/InfoModal.tsx**

```tsx
// src/components/ui/InfoModal.tsx
'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface InfoModalProps {
  title: string
  description: string
  onClose: () => void
}

export function InfoModal({ title, description, onClose }: InfoModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-light rounded-card shadow-2xl p-6 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
        <h3 className="font-bold text-gray-900 dark:text-white mb-3 pr-6">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/ui/MacroCard.tsx**

```tsx
// src/components/ui/MacroCard.tsx
'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import { InfoModal } from './InfoModal'
import type { MacroIndicator } from '@/lib/types'

interface MacroCardProps {
  title: string
  indicator: MacroIndicator
  unit?: string
  tooltip: { title: string; description: string }
  formatValue?: (v: number) => string
}

export function MacroCard({ title, indicator, unit = '', tooltip, formatValue }: MacroCardProps) {
  const [showModal, setShowModal] = useState(false)

  const displayValue = indicator.value !== null
    ? (formatValue ? formatValue(indicator.value) : indicator.value.toLocaleString('ko-KR'))
    : null

  const changeSign = indicator.change !== null && indicator.change > 0 ? '▲' : indicator.change !== null && indicator.change < 0 ? '▼' : '—'
  const changeColor =
    indicator.change !== null && indicator.change > 0
      ? 'text-up'
      : indicator.change !== null && indicator.change < 0
      ? 'text-down'
      : 'text-gray-400'

  return (
    <>
      <div className="relative rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
        <button
          className="absolute top-3 right-3 text-gray-300 hover:text-gold transition-colors"
          onClick={() => setShowModal(true)}
          aria-label={`${title} 설명`}
        >
          <Info size={16} />
        </button>
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{title}</p>
        {displayValue !== null ? (
          <>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {displayValue}
              {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
            </p>
            {indicator.change !== null && (
              <p className={`text-sm font-medium ${changeColor}`}>
                {changeSign} {Math.abs(indicator.change).toLocaleString('ko-KR')}
                {indicator.changePercent !== null && (
                  <span className="text-xs ml-1">({indicator.changePercent > 0 ? '+' : ''}{indicator.changePercent.toFixed(2)}%)</span>
                )}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">데이터를 불러올 수 없습니다</p>
        )}
      </div>
      {showModal && <InfoModal title={tooltip.title} description={tooltip.description} onClose={() => setShowModal(false)} />}
    </>
  )
}
```

- [ ] **Step 5: Create src/components/sections/MacroSection.tsx**

```tsx
// src/components/sections/MacroSection.tsx
'use client'

import { useMacroData } from '@/hooks/useMacroData'
import { MacroCard } from '@/components/ui/MacroCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { MACRO_TOOLTIPS } from '@/lib/constants/tooltips'

export function MacroSection() {
  const { data, isLoading } = useMacroData()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">거시경제 지표</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MacroCard
            title="한국 기준금리"
            indicator={data?.krRate ?? { value: null, change: null, changePercent: null }}
            unit="%"
            tooltip={MACRO_TOOLTIPS.krRate}
          />
          <MacroCard
            title="미국 기준금리"
            indicator={data?.usFedRate ?? { value: null, change: null, changePercent: null }}
            unit="%"
            tooltip={MACRO_TOOLTIPS.usFedRate}
          />
          <MacroCard
            title="원달러 환율"
            indicator={data?.usdKrw ?? { value: null, change: null, changePercent: null }}
            unit="원"
            tooltip={MACRO_TOOLTIPS.usdKrw}
            formatValue={(v) => v.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
          />
          <MacroCard
            title="VIX 공포지수"
            indicator={data?.vix ?? { value: null, change: null, changePercent: null }}
            tooltip={MACRO_TOOLTIPS.vix}
            formatValue={(v) => v.toFixed(2)}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Wire MacroSection into page.tsx**

```tsx
// src/app/page.tsx
import { SectionAnchor } from '@/components/layout/SectionAnchor'
import { MacroSection } from '@/components/sections/MacroSection'

export default function Home() {
  return (
    <div>
      <SectionAnchor id="ai-summary">
        <p className="text-gray-400">AI 요약 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="macro" className="bg-gray-50 dark:bg-navy/50">
        <MacroSection />
      </SectionAnchor>
      <SectionAnchor id="us-market">
        <p className="text-gray-400">미국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="real-estate">
        <p className="text-gray-400">부동산 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="kr-stock">
        <p className="text-gray-400">한국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="alternative">
        <p className="text-gray-400">대안투자 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="news">
        <p className="text-gray-400">뉴스 섹션 — 구현 예정</p>
      </SectionAnchor>
    </div>
  )
}
```

- [ ] **Step 7: Manual test**

Open http://localhost:3000.
- [ ] "거시경제 지표" heading visible
- [ ] 4 cards appear after skeleton loading
- [ ] Cards with data show value + change (▲ red / ▼ blue)
- [ ] Cards without data show "데이터를 불러올 수 없습니다" (not 0 or fake value)
- [ ] ⓘ button opens modal with Korean description; Escape / backdrop click closes it

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useMacroData.ts src/components src/app/page.tsx
git commit -m "feat: add MacroSection with SWR data, MacroCard, InfoModal, SkeletonCard"
```

---

## Task 6: `/api/us-market` Route

**Files:**
- Create: `src/app/api/us-market/route.ts`

**Interfaces:**
- Consumes: Yahoo Finance (SPY, QQQ, ^VIX, ^IRX, KRW=X), CNN Fear & Greed, Google News RSS (11 sectors)
- Produces: `GET /api/us-market` → `UsMarketData` JSON including computed `SectorAnalysis[]`

- [ ] **Step 1: Create src/app/api/us-market/route.ts**

```typescript
// src/app/api/us-market/route.ts
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
  // Fetch all data in parallel
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

  // Build internal scoring inputs (neutral assumptions when data unavailable — these are NOT displayed to users)
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
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}
```

- [ ] **Step 2: Manual test**

```
http://localhost:3000/api/us-market
```
Expected: JSON with `spy`, `qqq` (or null), `fearGreed` (or null), `sectors` array of 11 items sorted by score descending, each with `id`, `nameKo`, `score.total`, `recommendation.labelKo`, `rationale[]`. This route may take 5–10 seconds on first call (RSS fetches).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/us-market
git commit -m "feat: add /api/us-market route (Yahoo Finance + CNN Fear&Greed + Google News RSS + sector scoring)"
```

---

## Task 7: UsMarketSection UI

**Files:**
- Create: `src/hooks/useUsMarket.ts`
- Create: `src/components/ui/SectorCard.tsx`
- Create: `src/components/sections/UsMarketSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `GET /api/us-market` → `UsMarketData`
- Produces: SPY/QQQ cards + Fear&Greed badge + 11 sector cards with collapsible rationale at `#us-market`

- [ ] **Step 1: Create src/hooks/useUsMarket.ts**

```typescript
// src/hooks/useUsMarket.ts
import useSWR from 'swr'
import type { UsMarketData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useUsMarket() {
  const { data, error, isLoading } = useSWR<UsMarketData>('/api/us-market', fetcher, {
    refreshInterval: 120_000,
    revalidateOnFocus: false,
  })
  return { data, error, isLoading }
}
```

- [ ] **Step 2: Create src/components/ui/SectorCard.tsx**

```tsx
// src/components/ui/SectorCard.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Cpu, HeartPulse, Landmark, Zap, ShoppingBag, ShoppingCart, Factory, Building2, Plug, Gem, Radio } from 'lucide-react'
import type { SectorAnalysis } from '@/lib/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Cpu, HeartPulse, Landmark, Zap, ShoppingBag, ShoppingCart, Factory, Building2, Plug, Gem, Radio,
}

const BADGE_STYLES: Record<string, string> = {
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const BAR_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-up',
  negative: 'text-down',
  neutral: 'text-gray-500 dark:text-gray-400',
}

interface SectorCardProps {
  sector: SectorAnalysis
}

export function SectorCard({ sector }: SectorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ICON_MAP[sector.icon] ?? Cpu
  const badgeStyle = BADGE_STYLES[sector.recommendation.color] ?? BADGE_STYLES.orange
  const barColor = BAR_COLORS[sector.recommendation.color] ?? BAR_COLORS.orange

  return (
    <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="text-gold" size={18} />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{sector.nameKo}</p>
            <p className="text-xs text-gray-400">{sector.etf}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeStyle}`}>
          {sector.recommendation.emoji} {sector.recommendation.labelKo}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400">점수</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{sector.score.total}/100</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${sector.score.total}%` }}
        />
      </div>

      {/* Collapsible rationale */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        점수 산정 근거
      </button>
      {expanded && (
        <ul className="mt-3 space-y-2">
          {sector.rationale.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className={`text-xs font-medium w-28 shrink-0 ${SENTIMENT_COLORS[item.sentiment]}`}>{item.factor}</span>
              <span className="text-xs text-gray-600 dark:text-gray-300">{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/sections/UsMarketSection.tsx**

```tsx
// src/components/sections/UsMarketSection.tsx
'use client'

import { useUsMarket } from '@/hooks/useUsMarket'
import { SectorCard } from '@/components/ui/SectorCard'
import { SkeletonCard } from '@/components/ui/SkeletonCard'

function ChangeDisplay({ changePercent }: { changePercent: number }) {
  const isUp = changePercent >= 0
  return (
    <span className={`text-sm font-medium ${isUp ? 'text-up' : 'text-down'}`}>
      {isUp ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}%
    </span>
  )
}

export function UsMarketSection() {
  const { data, isLoading } = useUsMarket()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">미국 주식</h2>

      {/* SPY / QQQ + Fear & Greed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          [0, 1, 2].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">S&P 500 (SPY)</p>
              {data?.spy ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${data.spy.price.toLocaleString()}</p>
                  <ChangeDisplay changePercent={data.spy.changePercent} />
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">나스닥 100 (QQQ)</p>
              {data?.qqq ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${data.qqq.price.toLocaleString()}</p>
                  <ChangeDisplay changePercent={data.qqq.changePercent} />
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
            <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">CNN 공포탐욕지수</p>
              {data?.fearGreed ? (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.fearGreed.score}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{data.fearGreed.rating}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">데이터를 불러올 수 없습니다</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sector grid */}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">섹터별 투자 점수</h3>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(11).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data?.sectors ?? []).map((sector) => (
            <SectorCard key={sector.id} sector={sector} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire UsMarketSection into page.tsx**

Replace the `#us-market` SectionAnchor in `src/app/page.tsx`:
```tsx
import { UsMarketSection } from '@/components/sections/UsMarketSection'
// ...
<SectionAnchor id="us-market" className="bg-gray-50 dark:bg-navy/50">
  <UsMarketSection />
</SectionAnchor>
```

- [ ] **Step 5: Manual test**

Open http://localhost:3000 and scroll to 미국 주식 section.
- [ ] SPY, QQQ cards show price + change (or "데이터를 불러올 수 없습니다")
- [ ] CNN Fear & Greed card shows score + rating (or error state)
- [ ] 11 sector cards appear, sorted by score descending
- [ ] Each sector card shows: icon, Korean name, ETF ticker, score bar, recommendation badge
- [ ] "점수 산정 근거" click expands 5 rationale items; click again collapses

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useUsMarket.ts src/components/ui/SectorCard.tsx src/components/sections/UsMarketSection.tsx src/app/page.tsx
git commit -m "feat: add UsMarketSection with SPY/QQQ cards, Fear&Greed badge, and 11 sector cards"
```

---

## Task 8: `/api/ai-summary` Route + AiSummarySection

**Files:**
- Create: `src/app/api/ai-summary/route.ts`
- Create: `src/components/sections/AiSummarySection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: POST body `{ macroData: MacroData, usMarketData: UsMarketData }` → Gemini 1.5 Flash → parsed `AiSummaryResult`
- Produces: AI summary section with on-demand button at `#ai-summary`

**Security note:** `GEMINI_API_KEY` used only in the route file. Never `NEXT_PUBLIC_`. Never log the key.

- [ ] **Step 1: Create .env.local**

Copy `.env.local.example` to `.env.local` and fill in your Gemini API key:
```
GEMINI_API_KEY=<your-key-here>
```
Get a key from https://aistudio.google.com/app/apikey (free tier available).

- [ ] **Step 2: Create src/app/api/ai-summary/route.ts**

```typescript
// src/app/api/ai-summary/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MacroData, UsMarketData, AiSummaryResult } from '@/lib/types'

export const dynamic = 'force-dynamic'

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(buildPrompt(macro, market))
    const text = result.response.text()
    const parsed = parseResponse(text)
    if (!parsed) return NextResponse.json({ error: '분석을 생성할 수 없습니다. 다시 시도해주세요.' })
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[api/ai-summary]', err)
    return NextResponse.json({ error: '분석을 생성할 수 없습니다. 다시 시도해주세요.' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create src/components/sections/AiSummarySection.tsx**

```tsx
// src/components/sections/AiSummarySection.tsx
'use client'

import { useState } from 'react'
import { Loader2, TrendingUp, BarChart2, AlertTriangle } from 'lucide-react'
import type { MacroData, UsMarketData, AiSummaryResult } from '@/lib/types'

interface AiSummarySectionProps {
  getMacroData: () => MacroData | undefined
  getUsMarketData: () => UsMarketData | undefined
}

const DISCLAIMER = '이 분석은 참고용 정보이며 투자 자문이 아닙니다. 투자 결정과 책임은 본인에게 있습니다.'

export function AiSummarySection({ getMacroData, getUsMarketData }: AiSummarySectionProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AiSummaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    const macroData = getMacroData()
    const usMarketData = getUsMarketData()
    if (!macroData || !usMarketData) {
      setError('시장 데이터를 먼저 불러와야 합니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ macroData, usMarketData }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data)
    } catch {
      setError('분석을 생성할 수 없습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-card p-6 md:p-8 bg-gradient-to-br from-navy to-navy-light text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">오늘의 시황 AI 분석</h2>
          <p className="text-sm text-gray-400">Gemini AI가 현재 시장 데이터를 종합 분석합니다</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed text-navy font-semibold rounded-lg transition-colors text-sm"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> 분석 중...</>
          ) : (
            '오늘의 시황 분석 보기'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 rounded-lg p-3">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-xl p-5">
            <p className="font-bold text-lg leading-snug">{result.conclusion}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: BarChart2, text: result.rationale1 },
              { icon: TrendingUp, text: result.rationale2 },
              { icon: BarChart2, text: result.rationale3 },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex gap-3 bg-white/5 rounded-xl p-4">
                <Icon size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed text-gray-200">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">{DISCLAIMER}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire AiSummarySection into page.tsx**

The AI section needs access to macro and market data. Restructure `page.tsx` to be a client component that holds SWR hooks:

```tsx
// src/app/page.tsx
'use client'

import { SectionAnchor } from '@/components/layout/SectionAnchor'
import { AiSummarySection } from '@/components/sections/AiSummarySection'
import { MacroSection } from '@/components/sections/MacroSection'
import { UsMarketSection } from '@/components/sections/UsMarketSection'
import { useMacroData } from '@/hooks/useMacroData'
import { useUsMarket } from '@/hooks/useUsMarket'

export default function Home() {
  const { data: macroData } = useMacroData()
  const { data: usMarketData } = useUsMarket()

  return (
    <div>
      <SectionAnchor id="ai-summary" className="bg-gray-50 dark:bg-navy/30">
        <AiSummarySection
          getMacroData={() => macroData}
          getUsMarketData={() => usMarketData}
        />
      </SectionAnchor>
      <SectionAnchor id="macro" className="bg-white dark:bg-navy/50">
        <MacroSection />
      </SectionAnchor>
      <SectionAnchor id="us-market" className="bg-gray-50 dark:bg-navy/30">
        <UsMarketSection />
      </SectionAnchor>
      <SectionAnchor id="real-estate">
        <p className="text-gray-400">부동산 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="kr-stock">
        <p className="text-gray-400">한국 주식 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="alternative">
        <p className="text-gray-400">대안투자 섹션 — 구현 예정</p>
      </SectionAnchor>
      <SectionAnchor id="news">
        <p className="text-gray-400">뉴스 섹션 — 구현 예정</p>
      </SectionAnchor>
    </div>
  )
}
```

**Note:** `MacroSection` and `UsMarketSection` have their own internal SWR hooks — the page-level hooks are solely for passing data to `AiSummarySection`. This is an acceptable duplication for MVP; SWR deduplicates same-URL requests automatically.

- [ ] **Step 5: Manual test**

Open http://localhost:3000.
- [ ] "오늘의 시황 AI 분석" banner visible at top
- [ ] Button "오늘의 시황 분석 보기" (gold) present
- [ ] Click button → spinner + "분석 중..." appears for ~3–5 seconds
- [ ] Result shows: 결론 (bold), 근거 1/2/3 (3 cards), disclaimer text at bottom
- [ ] If GEMINI_API_KEY is empty → error message shown (not a crash)

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai-summary src/components/sections/AiSummarySection.tsx src/app/page.tsx
git commit -m "feat: add Gemini AI summary route and AiSummarySection with on-demand analysis"
```

---

## Task 9: Placeholder Sections + Final Page Assembly

**Files:**
- Create: `src/components/sections/PlaceholderSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: 4 placeholder sections for 부동산, 한국주식, 대안투자, 뉴스

- [ ] **Step 1: Create src/components/sections/PlaceholderSection.tsx**

```tsx
// src/components/sections/PlaceholderSection.tsx
import { Clock } from 'lucide-react'

interface PlaceholderItem {
  label: string
}

interface PlaceholderSectionProps {
  title: string
  emoji: string
  items: PlaceholderItem[]
}

export function PlaceholderSection({ title, emoji, items }: PlaceholderSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{emoji}</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
          <Clock size={11} />
          곧 추가됩니다
        </span>
      </div>
      <div className="rounded-card border-2 border-dashed border-gray-200 dark:border-white/10 p-6">
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">이 섹션은 준비 중입니다. 추가 예정 데이터:</p>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <li
              key={item.label}
              className="text-sm text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 text-center opacity-40 select-none"
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace placeholder sections in page.tsx**

Final `src/app/page.tsx`:
```tsx
// src/app/page.tsx
'use client'

import { SectionAnchor } from '@/components/layout/SectionAnchor'
import { AiSummarySection } from '@/components/sections/AiSummarySection'
import { MacroSection } from '@/components/sections/MacroSection'
import { UsMarketSection } from '@/components/sections/UsMarketSection'
import { PlaceholderSection } from '@/components/sections/PlaceholderSection'
import { useMacroData } from '@/hooks/useMacroData'
import { useUsMarket } from '@/hooks/useUsMarket'

export default function Home() {
  const { data: macroData } = useMacroData()
  const { data: usMarketData } = useUsMarket()

  return (
    <div>
      <SectionAnchor id="ai-summary" className="bg-gray-50 dark:bg-navy/30">
        <AiSummarySection getMacroData={() => macroData} getUsMarketData={() => usMarketData} />
      </SectionAnchor>

      <SectionAnchor id="macro" className="bg-white dark:bg-navy/50">
        <MacroSection />
      </SectionAnchor>

      <SectionAnchor id="us-market" className="bg-gray-50 dark:bg-navy/30">
        <UsMarketSection />
      </SectionAnchor>

      <SectionAnchor id="real-estate" className="bg-white dark:bg-navy/50">
        <PlaceholderSection
          title="부동산"
          emoji="🏠"
          items={[
            { label: '청약 정보' }, { label: '전세가율' },
            { label: '미분양 현황' }, { label: '경매 지수' },
          ]}
        />
      </SectionAnchor>

      <SectionAnchor id="kr-stock" className="bg-gray-50 dark:bg-navy/30">
        <PlaceholderSection
          title="한국주식"
          emoji="🇰🇷"
          items={[
            { label: 'KOSPI' }, { label: 'KOSDAQ' },
            { label: '섹터별 순위' }, { label: '외국인 수급' },
          ]}
        />
      </SectionAnchor>

      <SectionAnchor id="alternative" className="bg-white dark:bg-navy/50">
        <PlaceholderSection
          title="대안투자"
          emoji="💎"
          items={[
            { label: '금 가격' }, { label: '비트코인' },
            { label: '원자재' }, { label: '환율 DXY' },
          ]}
        />
      </SectionAnchor>

      <SectionAnchor id="news" className="bg-gray-50 dark:bg-navy/30">
        <PlaceholderSection
          title="뉴스 큐레이션"
          emoji="📰"
          items={[
            { label: '국내 경제' }, { label: '미국 시장' },
            { label: '글로벌 이슈' }, { label: 'AI 기술' },
          ]}
        />
      </SectionAnchor>

      <footer className="py-8 text-center text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-white/5">
        Sstarboard — 데이터는 참고용이며 투자 자문이 아닙니다. © 2026
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Manual test**

Open http://localhost:3000 and scroll through the full page.
- [ ] 7 sections visible: AI요약, 거시경제, 미국주식, 부동산, 한국주식, 대안투자, 뉴스
- [ ] Placeholder sections have dashed border, "곧 추가됩니다" badge, faded preview items
- [ ] Footer visible at bottom

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/PlaceholderSection.tsx src/app/page.tsx
git commit -m "feat: add placeholder sections for 부동산, 한국주식, 대안투자, 뉴스 and complete page assembly"
```

---

## Task 10: Responsive + Dark Mode Polish + README

**Files:**
- Modify: `README.md`
- Audit: all components for dark mode and responsive behavior

**Interfaces:**
- Produces: fully responsive page at 375px, 768px, 1024px; correct dark mode across all components

- [ ] **Step 1: Responsive audit at 375px**

Open http://localhost:3000. Set browser devtools to 375px width.
Check each section:
- [ ] NavBar: hamburger menu visible, logo readable
- [ ] AI summary: button full-width, result cards stack vertically
- [ ] Macro: 1-column card grid, ⓘ modal centered
- [ ] US market: SPY/QQQ/Fear&Greed stack vertically, sector cards 1-column
- [ ] Placeholder sections: preview items wrap to 2 columns

- [ ] **Step 2: Responsive audit at 768px**

Set browser devtools to 768px.
- [ ] NavBar: horizontal links visible, no hamburger
- [ ] Macro: 2-column grid
- [ ] US market: SPY/QQQ/Fear&Greed 3-column; sectors 2-column
- [ ] AI result: rationale cards 3-column

- [ ] **Step 3: Dark mode audit**

Toggle dark mode via NavBar button.
- [ ] Body background: navy
- [ ] All cards: dark:bg-navy-light with subtle border
- [ ] All text: readable (white / gray-300)
- [ ] NavBar: navy-dark bg
- [ ] Placeholder items: faded correctly in dark mode
- [ ] InfoModal: dark background, white text

Fix any contrast issues found by editing the relevant component's Tailwind classes.

- [ ] **Step 4: Write README.md**

```markdown
# Sstarboard

한국 개인 투자자를 위한 금융 종합 대시보드.

## 제공 데이터 (1단계 MVP)

| 섹션 | 데이터 | 출처 |
|------|--------|------|
| 거시경제 | VIX, 미국·한국 금리, 원달러 환율 | Yahoo Finance |
| 미국주식 | SPY, QQQ, CNN 공포탐욕지수, 11개 섹터 점수 | Yahoo Finance, CNN, Google News RSS |
| AI 시황 | Gemini 1.5 Flash 종합 분석 | Google AI |

## 로컬 실행 방법

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경변수 설정**

   `.env.local.example`을 복사해 `.env.local` 파일을 만들고 API 키를 입력합니다.
   ```bash
   cp .env.local.example .env.local
   ```

   | 변수 | 설명 | 발급 |
   |------|------|------|
   | `GEMINI_API_KEY` | Google Gemini AI API 키 (필수) | [Google AI Studio](https://aistudio.google.com/app/apikey) |

3. **개발 서버 시작**
   ```bash
   npm run dev
   ```
   http://localhost:3000 에서 확인

4. **테스트 실행**
   ```bash
   npm test
   ```

## Vercel 배포

1. Vercel에 GitHub 레포를 연결합니다.
2. Vercel 대시보드 → Settings → Environment Variables에 `GEMINI_API_KEY`를 추가합니다.
3. 배포 후 자동으로 서버사이드 API Routes가 활성화됩니다.

## 보안 주의사항

- `GEMINI_API_KEY`는 서버사이드에서만 사용됩니다 (`NEXT_PUBLIC_` 접두사 없음).
- 모든 외부 API 호출은 `/app/api/` 라우트를 통해 서버에서 이루어집니다.
```

- [ ] **Step 5: Final full test**

```bash
npm run build
```
Expected: Build succeeds with no TypeScript errors.

```bash
npx vitest run
```
Expected: All 17 tests pass.

```bash
npm run dev
```
Manual walkthrough:
- [ ] Full scroll on mobile (375px): all sections readable
- [ ] Full scroll on desktop (1280px): all sections readable
- [ ] Light mode → dark mode toggle: all sections correct
- [ ] NavBar smooth scroll to each section
- [ ] Macro cards load with real data (or graceful error)
- [ ] US market loads 11 sector cards (allow up to 10s for first load)
- [ ] AI summary button → spinner → result (requires GEMINI_API_KEY in .env.local)

- [ ] **Step 6: Final commit**

```bash
git add README.md
git commit -m "docs: write README with setup instructions and deployment guide"
git add -A
git commit -m "feat: complete sstarboard MVP — responsive + dark mode polish"
```

---

## Self-Review

**Spec coverage check:**
| Spec requirement | Task |
|-----------------|------|
| Next.js App Router + Tailwind + next-themes | Task 1 |
| Navy/gold color palette, tabular-nums | Task 1 |
| Sticky nav, smooth scroll, 7 sections | Task 3 |
| AI summary section, Gemini 1.5 Flash, formatted output | Task 8 |
| 거시경제 4 cards (VIX, US rate, KR rate, USD/KRW) | Task 4 + 5 |
| ⓘ tooltip/modal per macro card | Task 5 |
| fetch failure → "데이터를 불러올 수 없습니다" (no static fallback) | Task 4, 6 |
| SPY, QQQ cards | Task 7 |
| 11 sector scores with collapsible rationale | Task 7 |
| Placeholder sections (부동산, 한국주식, 대안투자, 뉴스) | Task 9 |
| Mobile-first responsive (375px base) | Task 10 |
| Skeleton UI during loading | Task 5, 7 |
| .env.local.example with GEMINI_API_KEY | Task 1 |
| README with run instructions + env setup | Task 10 |
| API key server-side only | Task 8 |
| KR rate: Yahoo Finance KR3YT=RR, null if unavailable | Task 4 |

**All requirements covered. No gaps found.**
