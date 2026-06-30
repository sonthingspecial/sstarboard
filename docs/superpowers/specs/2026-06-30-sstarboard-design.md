# Sstarboard 1단계 MVP — 디자인 스펙

**작성일:** 2026-06-30  
**프로젝트 위치:** `C:\Users\user\sstarboard`  
**참고 레포:** `C:\Users\user\my-first-vibe` (섹터 점수 로직 이식 출처)

---

## 1. 개요

한국 개인 투자자를 위한 금융 종합 대시보드. 거시경제 지표, 미국 주식 섹터 분석, AI 시황 요약을 한 페이지에서 제공한다. 1단계 MVP에서는 거시경제·미국주식 섹션만 실데이터 연결, 나머지는 플레이스홀더.

---

## 2. 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 스타일 | Tailwind CSS |
| 다크모드 | `next-themes` |
| 데이터 fetching | SWR (클라이언트) + API Routes (서버) |
| AI | Google Gemini API (`gemini-1.5-flash`) |
| 배포 | Vercel |

---

## 3. 아키텍처: 하이브리드 접근법

```
페이지 로드
  ├─ useMacroData() ─→ GET /api/macro  → Yahoo Finance (VIX, USD/KRW, US금리, KR국채수익률)
  ├─ useUsMarket()  ─→ GET /api/us-market → Yahoo Finance (SPY, QQQ) + CNN Fear&Greed + RSS 뉴스
  └─ [스켈레톤 UI 표시 → 데이터 수신 시 렌더링]

AI 분석 버튼 클릭
  └─ POST /api/ai-summary → Gemini 1.5 Flash → 결과 카드 렌더링
```

---

## 4. 디렉토리 구조

```
sstarboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # ThemeProvider 래핑
│   │   ├── page.tsx                    # 단일 페이지 (one-page scroll)
│   │   └── api/
│   │       ├── macro/route.ts          # 거시경제 4개 지표 통합
│   │       ├── us-market/route.ts      # SPY, QQQ, Fear&Greed, 11개 섹터
│   │       └── ai-summary/route.ts     # Gemini API (서버사이드 전용)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx              # Sticky nav + 다크모드 토글
│   │   │   └── SectionAnchor.tsx       # 섹션 scroll target 래퍼
│   │   ├── sections/
│   │   │   ├── AiSummarySection.tsx    # 버튼 + 결과 카드
│   │   │   ├── MacroSection.tsx        # 거시경제 4카드
│   │   │   ├── UsMarketSection.tsx     # SPY/QQQ + 섹터 그리드
│   │   │   └── PlaceholderSection.tsx  # 부동산/한국주식/대안투자/뉴스
│   │   └── ui/
│   │       ├── MacroCard.tsx           # 지표명/값/변화 + ⓘ 툴팁
│   │       ├── SectorCard.tsx          # 점수 바 + collapsible 근거
│   │       ├── SkeletonCard.tsx        # 로딩 스켈레톤
│   │       └── InfoModal.tsx           # ⓘ 클릭 시 설명 모달
│   ├── hooks/
│   │   ├── useMacroData.ts             # SWR → /api/macro
│   │   └── useUsMarket.ts              # SWR → /api/us-market
│   └── lib/
│       ├── scoring/                    # my-first-vibe에서 이식 (TS 그대로)
│       │   ├── composite.ts
│       │   ├── fearGreedScore.ts
│       │   ├── vixScore.ts
│       │   ├── exchangeRateScore.ts
│       │   ├── interestRateScore.ts
│       │   └── newsScore.ts
│       ├── constants/
│       │   ├── sectors.ts              # 11개 GICS 섹터 정의
│       │   ├── newsKeywords.ts         # 섹터별 뉴스 키워드
│       │   └── tooltips.ts             # ⓘ 설명 텍스트 (한국어)
│       └── types/index.ts              # 공유 타입 정의
├── .env.local.example
└── README.md
```

---

## 5. 색상 시스템 & 디자인 토큰

```css
/* 메인/포인트 */
--navy:       #0A1F44   /* 라이트 모드 배경/헤더 */
--gold:       #D4AF37   /* CTA 버튼, 포인트 액센트 */

/* 카드 */
--card-light: #FFFFFF
--card-dark:  #1A2D54

/* 한국식 등락 색상 */
--up:         #FF4444   /* 상승 = 빨강 */
--down:       #4477FF   /* 하락 = 파랑 */
--neutral:    #888888

/* 레이아웃 */
border-radius: 12px
box-shadow: 0 2px 12px rgba(0,0,0,0.08)
font-variant-numeric: tabular-nums  /* 숫자 정렬 */
```

---

## 6. NavBar

- **위치:** `sticky top-0`, `z-50`, `backdrop-blur-md`
- **스크롤 감지:** 스크롤 시 `shadow-md` 추가
- **항목 (좌측):** 오늘의 시황 / 거시경제 / 미국주식 / 부동산 / 한국주식 / 대안투자 / 뉴스
  - 클릭 → smooth scroll to 섹션 anchor (`#section-id`)
  - 플레이스홀더 항목 클릭 시 동일 동작 (해당 섹션으로 이동, "준비 중" 카드 표시)
- **우측:** 다크모드 토글 (☀️ / 🌙)
- **모바일 (< 768px):** 햄버거 메뉴로 접힘, 오픈 시 세로 드롭다운

---

## 7. 섹션 상세

### 7.1 오늘의 시황 요약 (AI)

- **헤더 배너:** 가장 상단, 눈에 띄는 배경 (navy 그라데이션)
- **버튼:** "오늘의 시황 분석 보기" — 골드 컬러, 클릭 시 `POST /api/ai-summary`
- **로딩:** 버튼 비활성화 + 스피너 + "분석 중..." 텍스트
- **결과 카드:**
  - 결론 (굵게, 크게)
  - 근거 1/2/3 (아이콘 bullet: 📊, 📉, 🔍 등) — 각각 "데이터 수치 → 해석" 형태
  - 면책 문구: "이 분석은 참고용 정보이며 투자 자문이 아닙니다. 투자 결정과 책임은 본인에게 있습니다." (작은 회색 텍스트)
- **에러 상태:** "분석을 생성할 수 없습니다. 다시 시도해주세요"

### 7.2 거시경제 지표

4개 카드 그리드:

```
┌──────────────────────────┐ⓘ
│ VIX 공포지수              │
│ 18.63                    │
│ ▼ 0.42 (-2.2%)           │  ← 파랑 (하락)
└──────────────────────────┘
```

| 카드 | Yahoo Finance 티커 | ⓘ 설명 |
|------|-------------------|---------|
| 한국 기준금리 | `KR3YT=RR` (한국 국채 3년물 수익률) | "한국은행이 결정하는 기준금리 참고 지표입니다..." |
| 미국 기준금리 | `^IRX` (13주 T-Bill 수익률) | "미 연준(Fed)이 결정하는 기준금리 참고 지표입니다..." |
| 원달러 환율 | `KRW=X` | "1달러를 사기 위해 필요한 원화 금액입니다..." |
| VIX 공포지수 | `^VIX` | "시장의 변동성과 불안 심리를 나타내는 지수입니다. 20 이하는 안정, 30 이상은 불안 구간..." |

- **에러 처리:** 티커 fetch 실패 시 해당 카드에 "데이터를 불러올 수 없습니다" (정적 고정값 절대 금지)
- ⓘ 클릭 → `InfoModal` 오버레이 표시

### 7.3 미국 주식

**상단:** SPY, QQQ 가격/변동률 카드 (2열)

**하단:** 11개 GICS 섹터 그리드

```
┌─────────────────────────────────────┐
│ 🖥️ 기술 (XLK)          82/100   🟢 강력매수 │
│ ████████████████████░░░░            │
│ ▼ 점수 산정 근거                    │
│   └─ Fear&Greed: 26 → 공포구간 (점수 낮음) │
│   └─ VIX: 18.6 → 안정적 (점수 높음)       │
│   └─ 환율: 1,543 → 수출 부담 (중립)       │
│   └─ 금리: 4.33% 하락추세 (긍정적)        │
│   └─ 뉴스: AI 투자 확대 (긍정)           │
└─────────────────────────────────────┘
```

- `▼ 점수 산정 근거` 클릭 → collapsible 펼침/접힘 (CSS transition)
- 점수 바: 0-100, 75↑ 녹색 / 55-75 황색 / 35-55 주황 / 35↓ 빨강

### 7.4 Placeholder 섹션 (부동산 / 한국주식 / 대안투자 / 뉴스)

- 섹션 제목 + "이 섹션은 곧 추가됩니다" 배지
- 예상 데이터 항목 목록 (opacity-40으로 흐리게):
  - 부동산: 청약, 전세가율, 미분양, 경매
  - 한국주식: KOSPI, KOSDAQ, 섹터별 순위
  - 대안투자: 금, 비트코인, 원자재
  - 뉴스: 국내외 투자 뉴스 큐레이션

---

## 8. API 라우트 명세

### `GET /api/macro`

**외부 호출:** Yahoo Finance (`^VIX`, `^IRX`, `KRW=X`, `KR3YT=RR`) — `Promise.allSettled`로 병렬 fetch

**응답 구조:**
```typescript
{
  vix: number | null,          // ^VIX
  usFedRate: number | null,    // ^IRX
  usdKrw: number | null,       // KRW=X
  krRate: number | null,       // KR3YT=RR — 실패 시 null, 고정값 금지
  vixChange: number | null,
  usFedRateChange: number | null,
  usdKrwChange: number | null,
  krRateChange: number | null,
  timestamp: string,
  source: 'live' | 'partial' | 'error'
}
```

**에러 처리:** 개별 ticker fetch 실패 → 해당 필드 `null`. 전체 실패 → `source: 'error'`

### `GET /api/us-market`

**외부 호출:**
1. Yahoo Finance: `SPY`, `QQQ`
2. CNN Fear & Greed (Referer 헤더 필요, my-first-vibe 방식)
3. Google News RSS: 11개 섹터 뉴스 (my-first-vibe `all-sector-news` 로직 이식)

**섹터 점수 계산:** `lib/scoring/composite.ts::computeAllSectors()`

**응답 구조:**
```typescript
{
  spy: { price: number; changePercent: number } | null,
  qqq: { price: number; changePercent: number } | null,
  fearGreed: { score: number; rating: string } | null,
  sectors: SectorAnalysis[],   // 점수 내림차순 정렬
  timestamp: string
}
```

### `POST /api/ai-summary`

**요청 바디:** `{ macroData: MacroData, usMarketData: UsMarketData }`

**Gemini 프롬프트:**
```
다음은 오늘 기준 투자 시장 데이터입니다.
[거시경제 데이터]
[미국 주식 데이터]

위 데이터를 종합해서 한국 개인 투자자 입장에서 다음 형식으로 답하세요:
결론: [한 줄]
근거 1: [데이터 수치] → [해석]
근거 2: [데이터 수치] → [해석]
근거 3: [데이터 수치] → [해석]

규칙:
- 특정 종목이나 부동산 매물을 추천하지 말 것
- 투자 방향성과 공부 영역만 제안할 것
- 데이터에 없는 내용은 추측하지 말 것
- 반드시 위 형식을 지킬 것
```

**응답 파싱:** 정규식으로 "결론:", "근거 1:", "근거 2:", "근거 3:" 추출. 파싱 실패 → `{ error: "분석을 생성할 수 없습니다. 다시 시도해주세요" }`

**보안:** `GEMINI_API_KEY`는 서버사이드 전용. `process.env.NEXT_PUBLIC_` 접두사 금지.

---

## 9. 에러 처리 원칙

| 상황 | 처리 |
|------|------|
| 외부 API fetch 실패 | 해당 필드 `null` 반환 |
| 카드 데이터 `null` | "데이터를 불러올 수 없습니다" 표시 |
| 정적 고정값 사용 | **절대 금지** (예: 한국 기준금리 3.50% 하드코딩 금지) |
| AI 응답 파싱 실패 | 에러 메시지 카드 표시 |
| 전체 API 실패 | 스켈레톤 → 에러 배너로 전환 |

---

## 10. 반응형 레이아웃

| 뷰포트 | 거시경제 카드 | 섹터 카드 |
|--------|-------------|----------|
| < 768px (모바일 기준 375px) | 1열 | 1열 |
| 768px ~ 1024px | 2열 | 2열 |
| ≥ 1024px | 4열 | 3열 |

---

## 11. 환경변수 (`.env.local.example`)

```
GEMINI_API_KEY=
# FRED_API_KEY= (선택적, 향후 한국은행 연결 시)
```

---

## 12. README 항목

- 로컬 실행 방법 (`npm install`, `npm run dev`)
- `.env.local` 설정 방법 (Gemini API 키 발급 링크 포함)
- 각 섹션 데이터 소스 설명

---

## 13. 구현 단계 (순서)

1. 프로젝트 셋업 + 기본 레이아웃 (NavBar, 다크모드, 섹션 앵커)
2. AI 요약 섹션 (UI + `/api/ai-summary` + Gemini 연동)
3. 거시경제 섹션 (UI + `/api/macro` + ⓘ 툴팁/모달)
4. 미국 주식 섹션 (UI + `/api/us-market` + collapsible 섹터 카드)
5. Placeholder 섹션들 (정적 컴포넌트)
6. 전체 반응형 + 다크모드 점검

**각 단계 완료 시 멈추고 사용자 확인 후 다음 단계 진행.**
