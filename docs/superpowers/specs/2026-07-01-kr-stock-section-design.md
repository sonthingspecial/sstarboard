# 한국주식 섹션 (KOSPI/KOSDAQ) 구현 설계

> 상태: 승인됨 (2026-07-01)

## 배경

Sstarboard의 "한국주식" 섹션(`#kr-stock`)은 현재 `PlaceholderSection`으로 되어 있다.
이번 작업 범위는 KOSPI, KOSDAQ 지수 실데이터 연동이다. 섹터별 순위·외국인 수급은
KRX Data Marketplace 별도 가입이 필요해 이번 범위에서 제외하고, 섹션 내에
"곧 추가됩니다" 안내만 남긴다.

기존 `macro`, `us-market` API 라우트/컴포넌트 패턴(파일 구조, 네이밍, 에러 처리,
다크모드 스타일)을 그대로 따른다.

## 범위

- **포함**: KOSPI(`^KS11`), KOSDAQ(`^KQ11`) 지수 실시간 조회 및 표시
- **제외**: 섹터별 순위, 외국인 수급 (KRX Data Marketplace 가입 필요 — 별도 작업)

## 변경 사항

### 1. 타입 추가 — `src/lib/types/index.ts`

```ts
export interface KrStockData {
  kospi: { value: number; changePercent: number } | null
  kosdaq: { value: number; changePercent: number } | null
  timestamp: string
  source: 'live' | 'partial' | 'error'
}
```

`macro`의 `MacroData.source: 'live' | 'partial' | 'error'` 패턴을 재사용한다
(지표가 2개뿐이라 `us-market`의 개별 `null` 필드 방식보다 macro 방식이 적합).

### 2. API 라우트 — `src/app/api/kr-stock/route.ts` (신규)

- `us-market/route.ts`의 `fetchYahooValue` 함수를 그대로 복사해 사용
  (`https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=2d`,
  `Promise.allSettled`로 병렬 조회, 실패 시 `null` 반환)
- 티커: KOSPI `^KS11`, KOSDAQ `^KQ11`
- `source` 판정: 둘 다 성공 → `live`, 하나만 성공 → `partial`, 둘 다 실패 → `error`
  (macro route의 `allLive`/`anyLive` 판정 로직 재사용)
- `export const dynamic = 'force-dynamic'`
- 응답 헤더 `Cache-Control: no-store`

### 3. 훅 — `src/hooks/useKrStockData.ts` (신규)

- `useSWR<KrStockData>('/api/kr-stock', fetcher, { refreshInterval: 120_000, revalidateOnFocus: false })`
- 갱신 주기는 `useUsMarket`과 동일한 120초 (지수 데이터 특성상 SPY/QQQ와 동일 취급)

### 4. UI — `src/components/sections/KrStockSection.tsx` (신규)

한 섹션 안에 "실데이터 카드"와 "플레이스홀더 안내"를 함께 표시한다.

- **상단**: KOSPI/KOSDAQ 카드 2개
  - `UsMarketSection`의 SPY/QQQ 인라인 카드 스타일 그대로 재사용
    (`rounded-card p-5 bg-white dark:bg-navy-light border ...`, ▲▼ + `changePercent`)
  - 로딩 중: `SkeletonCard` 2개
  - 실패 시(`value === null`): "데이터를 불러올 수 없습니다" 표시 (고정값 표시 금지)
- **하단**: 섹터별 순위, 외국인 수급
  - `PlaceholderSection`과 동일한 점선 박스 + "곧 추가됩니다" 배지 스타일을
    이 두 항목만 담아 섹션 내부에 인라인으로 표시 (별도 `PlaceholderSection` 컴포넌트
    호출이 아니라 동일 스타일을 `KrStockSection` 내부에 직접 구성)

`page.tsx`에서 `#kr-stock` 섹션의 `<PlaceholderSection title="한국주식" .../>` 호출을
`<KrStockSection />`으로 교체한다.

### 5. 에러 처리

fetch 실패 시 고정값(fallback 상수)을 표시하지 않는다. "데이터를 불러올 수 없습니다"를
표시한다 (`docs/sstarboard-handoff.md`의 데이터 표시 규칙 그대로 준수).

### 6. 테스트

`macro`/`us-market` route 자체에도 별도 단위 테스트가 없다 (스코어링 로직만 테스트됨).
`kr-stock`도 스코어링 로직이 없으므로 신규 테스트는 추가하지 않는다. 기존 패턴과 일치.

## 영향받지 않는 것

- 섹터별 순위, 외국인 수급 데이터 (범위 제외)
- 기존 `macro`, `us-market` 라우트/컴포넌트 (변경 없음)
