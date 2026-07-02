# Sstarboard — 작업 현황 핸드오프 문서

> 이 문서는 2026-07-01 기준 MVP 완료 상태를 기록합니다.
> GitHub: https://github.com/sonthingspecial/sstarboard

---

## 프로젝트 개요

한국 개인 투자자를 위한 금융 종합 대시보드. 거시경제 지표, 미국 주식 섹터 분석, Gemini AI 시황 분석을 제공한다.

- **위치**: `C:\Users\user\sstarboard`
- **브랜치**: `master`
- **최신 커밋**: `87b792c` — feat: show 추정값 badge on sector cards when scoring inputs are non-live

---

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 스타일 | Tailwind CSS v4 (config 파일 없음, `globals.css`의 `@theme {}` 블록으로 커스텀 색상 정의) |
| 다크 모드 | `next-themes` — `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}` |
| 데이터 페칭 | SWR (`revalidateOnFocus: false`) |
| AI | Gemini 1.5 Flash (`@google/generative-ai`) — 서버사이드 전용 |
| 테스트 | Vitest (25/25 통과) |
| 런타임 | Node.js (Vercel 배포 가능) |

---

## 커스텀 색상 토큰 (`src/app/globals.css`)

```css
@theme {
  --color-navy: #0A1F44;
  --color-navy-light: #1A2D54;
  --color-navy-dark: #061329;
  --color-gold: #D4AF37;
  --color-gold-light: #E8C84A;
  --color-gold-dark: #B8952B;
  --color-up: #FF4444;   /* 상승 (한국 관례: 빨강) */
  --color-down: #4477FF; /* 하락 (한국 관례: 파랑) */
  --radius-card: 12px;
}
@variant dark (&:where(.dark, .dark *));
```

Tailwind 유틸리티: `bg-navy`, `bg-navy-light`, `bg-navy-dark`, `text-gold`, `text-up`, `text-down`, `rounded-card`

---

## 환경 변수

```bash
# .env.local (절대 커밋하지 않을 것)
GEMINI_API_KEY=...   # Google AI Studio에서 발급
```

**보안 규칙**: `GEMINI_API_KEY`는 `NEXT_PUBLIC_` 접두사 절대 사용 금지. 서버사이드 API 라우트에서만 접근.

---

## 파일 구조

```
src/
├── app/
│   ├── globals.css               # Tailwind v4 테마, 다크모드 variant
│   ├── layout.tsx                # ThemeProvider, Navbar, main wrapper
│   ├── page.tsx                  # 메인 페이지 (client component)
│   └── api/
│       ├── macro/route.ts        # GET — VIX, 미금리, 원달러, 한국금리
│       ├── us-market/route.ts    # GET — SPY/QQQ, Fear&Greed, 11개 섹터 점수
│       ├── kr-stock/route.ts     # GET — KOSPI/KOSDAQ
│       └── ai-summary/route.ts   # POST — Gemini AI 시황 분석
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            # 고정 상단 nav, 다크모드 토글, 햄버거
│   │   └── SectionAnchor.tsx     # 섹션 래퍼 (id + padding)
│   ├── sections/
│   │   ├── AiSummarySection.tsx  # 온디맨드 AI 분석 버튼 + 결과 표시
│   │   ├── MacroSection.tsx      # 거시경제 4개 카드
│   │   ├── UsMarketSection.tsx   # SPY/QQQ/FG + 11개 섹터 그리드
│   │   ├── KrStockSection.tsx    # KOSPI/KOSDAQ 카드 + 섹터순위·외국인수급 안내
│   │   └── PlaceholderSection.tsx# "곧 추가됩니다" 섹션 템플릿
│   └── ui/
│       ├── MacroCard.tsx         # 지표 카드 (값/변화율, 에러 처리, InfoModal)
│       ├── SectorCard.tsx        # 섹터 카드 (점수바, 추천 배지, 추정값 배지, 근거 펼치기)
│       ├── InfoModal.tsx         # ⓘ 클릭 시 툴팁 모달
│       └── SkeletonCard.tsx      # 로딩 스켈레톤
├── hooks/
│   ├── useMacroData.ts           # SWR — /api/macro, 60초 갱신
│   ├── useUsMarket.ts            # SWR — /api/us-market, 120초 갱신
│   └── useKrStockData.ts         # SWR — /api/kr-stock, 120초 갱신
└── lib/
    ├── types/index.ts            # 모든 공유 타입
    ├── constants/
    │   ├── sectors.ts            # 11개 GICS 섹터 정의
    │   ├── newsKeywords.ts       # 섹터별 구글 뉴스 검색 키워드
    │   └── tooltips.ts           # MacroCard ⓘ 설명 텍스트
    └── scoring/
        ├── fearGreedScore.ts     # Fear&Greed → 0–25점
        ├── vixScore.ts           # VIX → 0–20점
        ├── exchangeRateScore.ts  # USD/KRW → 0–15점
        ├── interestRateScore.ts  # 금리 → 0–20점
        ├── newsScore.ts          # 뉴스 감성 → 0–20점
        ├── composite.ts          # 5개 점수 합산 → SectorAnalysis[]
        └── rationale.ts          # 점수 근거 텍스트 생성
```

---

## API 라우트 상세

### `GET /api/macro`
Yahoo Finance (`query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=2d`)에서 4개 지표를 `Promise.allSettled`로 병렬 조회.

| 지표 | 티커 | 응답 필드 |
|------|------|-----------|
| VIX 공포지수 | `^VIX` | `vix` |
| 미국 기준금리 | `^IRX` | `usFedRate` |
| 원달러 환율 | `KRW=X` | `usdKrw` |
| 한국 국채 3년 | `KR3YT=RR` | `krRate` |

응답 타입 `MacroData.source`: `'live'` | `'partial'` | `'error'`

### `GET /api/us-market`
| 데이터 | 출처 | 응답 필드 |
|--------|------|-----------|
| SPY, QQQ | Yahoo Finance | `spy`, `qqq` (null when unavailable) |
| Fear & Greed | CNN `production.dataviz.cnn.io` | `fearGreed` (null when unavailable) |
| 11개 섹터 점수 | 복합 산정 | `sectors[]` |
| 추정값 여부 | - | `sectorScoresEstimated: boolean` |

**섹터 점수 산정** (합계 100점):
- `fearGreed`: 0–25점
- `vix`: 0–20점
- `exchangeRate`: 0–15점
- `interestRate`: 0–20점
- `news` (Google News RSS): 0–20점

**fallback 처리**: 실시간 데이터 조회 실패 시 채점용 중립값(VIX=20, FG=50, KRW=1400, 금리=4.5%) 사용. 이 경우 `sectorScoresEstimated: true` 반환 → 섹터 카드에 "추정값" 배지 표시. `spy`/`qqq`/`fearGreed`는 표시용 null 처리(고정값 절대 표시 금지).

### `GET /api/kr-stock`
Yahoo Finance에서 KOSPI/KOSDAQ을 `Promise.allSettled`로 병렬 조회.

| 지표 | 티커 | 응답 필드 |
|------|------|-----------|
| KOSPI | `^KS11` | `kospi` |
| KOSDAQ | `^KQ11` | `kosdaq` |

응답 타입 `KrStockData.source`: `'live'` | `'partial'` | `'error'`. 섹터별 순위·외국인 수급은
KRX Data Marketplace 가입 필요로 이번 범위 제외 (섹션 내 "곧 추가됩니다" 안내).

### `POST /api/ai-summary`
요청 body: `{ macroData: MacroData, usMarketData: UsMarketData }`

Gemini 1.5 Flash 호출 → 결론 + 근거 3개 파싱.
응답: `AiSummaryResult` | `{ error: string }` (status 400/500)

---

## 데이터 표시 규칙 (중요)

> **fetch 실패 시 고정값을 표시하지 않는다.** "데이터를 불러올 수 없습니다"를 표시한다.

- 섹터 점수: fallback 중립값으로 계산 가능하지만 "추정값" 배지 필수
- `spy`, `qqq`, `fearGreed`: null이면 에러 메시지 표시

---

## 구현된 섹션

| 섹션 | 상태 | 내용 |
|------|------|------|
| AI 시황 분석 | ✅ 완료 | 온디맨드 버튼 클릭 → Gemini 분석 |
| 거시경제 | ✅ 완료 | VIX, 금리, 환율 4개 카드 |
| 미국 주식 | ✅ 완료 | SPY/QQQ, Fear&Greed, 11개 섹터 |
| 부동산 | ⏳ 플레이스홀더 | 청약/전세가율/미분양/경매 |
| 한국 주식 | ✅ 완료 (KOSPI/KOSDAQ) | 섹터순위/외국인수급은 KRX 가입 필요로 제외, 안내만 표시 |
| 대안투자 | ⏳ 플레이스홀더 | 금/비트코인/원자재/DXY |
| 뉴스 큐레이션 | ⏳ 플레이스홀더 | 국내경제/미국시장/글로벌/AI |

---

## Git 커밋 이력

```
87b792c feat: show 추정값 badge on sector cards when scoring inputs are non-live
14a8068 docs: write README with setup instructions and deployment guide
93eb23c feat: add placeholder sections for 부동산, 한국주식, 대안투자, 뉴스 and complete page assembly
005f4c5 fix: return status 500 when AI response parsing fails
3bbf267 feat: add Gemini AI summary route and AiSummarySection with on-demand analysis
531d3ad feat: add UsMarketSection with SPY/QQQ cards, Fear&Greed badge, and 11 sector cards
39cb66a feat: add MacroSection with SWR data, MacroCard, InfoModal, SkeletonCard
5d2c5e7 feat: add /api/us-market route (Yahoo Finance + CNN Fear&Greed + Google News RSS + sector scoring)
259a3ee feat: add /api/macro route (VIX, US rate, USD/KRW, KR rate via Yahoo Finance)
860a95c feat: add layout with ThemeProvider, Navbar with dark mode + smooth scroll, SectionAnchor
3b3cff0 fix: sentimentScore typed as number | undefined to enable ?? fallback in composite
5d268d7 feat: add shared types, constants, and scoring library with tests
```

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local에 GEMINI_API_KEY 입력

# 3. 개발 서버
npm run dev     # http://localhost:3000

# 4. 테스트
npm test        # vitest (25/25)

# 5. 빌드 확인
npm run build
```

---

## 다음 작업 후보

플레이스홀더 섹션 중 우선순위가 높은 것부터 구현:

### 1단계 — 대안투자 (`#alternative`)
- 금: `GC=F` (Yahoo)
- 비트코인: `BTC-USD` (Yahoo)
- DXY: `DX-Y.NYB` (Yahoo)

### 2단계 — 뉴스 큐레이션 (`#news`)
- 현재 섹터별 뉴스를 섹터 카드 내에만 표시 중
- 별도 뉴스 피드 UI로 통합 표시

### 3단계 — 청약 정보 (`#real-estate`)
- 청약홈 API 또는 공공 데이터 포털 연동

### 기타 개선 사항
- Vercel 배포 (GitHub 연결 후 자동 CI/CD)
- 캐싱 전략 개선 (현재 모든 API `no-store` → ISR 검토)
- 모바일 최적화 추가 테스트

---

## 주의사항 & 결정된 설계

- Tailwind v4: `tailwind.config.ts` 없음. 색상은 `globals.css`의 `@theme {}` 블록에서만 정의.
- 다크모드: `next-themes`가 `<html class="dark">` 제어. `dark:` 유틸리티로 스타일.
- 섹터 점수 fallback: 표시용 null과 채점용 중립값은 분리된 개념. 채점 실패 시 `sectorScoresEstimated: true`.
- SWR 중복 제거: `page.tsx`에서 `useMacroData`/`useUsMarket` 호출이 MacroSection/UsMarketSection의 훅과 중복되지만 SWR이 URL 기반으로 자동 dedup 처리.
