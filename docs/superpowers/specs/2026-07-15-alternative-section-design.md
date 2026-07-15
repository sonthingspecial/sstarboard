# 대안투자 섹션 (금/비트코인/원자재/DXY) 구현 설계

> 상태: 승인됨 (2026-07-15)

## 배경

Sstarboard의 "대안투자" 섹션(`#alternative`)은 현재 `PlaceholderSection`으로 되어 있다
(항목: 금 가격, 비트코인, 원자재, 환율 DXY). 이번 작업 범위는 이 4개 자산의 실데이터
연동이다.

기존 `kr-stock`, `us-market` API 라우트/컴포넌트 패턴(파일 구조, 네이밍, 에러 처리,
캐싱, 다크모드 스타일)을 그대로 따른다.

## 사전 조사에서 확정된 사항

1. 훅은 `src/lib/hooks/`가 아니라 기존 컨벤션대로 `src/hooks/`에 위치하며, SWR
   (`useSWR`)을 사용한다 (`useKrStockData.ts`, `useSubscription.ts`와 동일 패턴).
   커스텀 로딩/에러 상태 관리 훅을 새로 만들지 않는다.
2. 캐싱은 Next.js `revalidate` 옵션이 아니라 기존 라우트 전부가 쓰는
   `export const dynamic = 'force-dynamic'` + 응답 헤더 `Cache-Control: no-store`
   방식을 그대로 따른다. 매 요청마다 새로 fetch하므로 "5분보다 짧게"라는 요구사항은
   자동으로 충족된다 (기존 라우트와 다른 캐싱 전략을 새로 도입하지 않는다).
3. Yahoo Finance 호출 방식은 `kr-stock`/`us-market`/`macro` 라우트에 이미 3중
   복사되어 있는 `fetchYahooValue` 패턴(공용 헬퍼 없음, 라우트 파일 내부에 직접
   복사)을 그대로 재사용한다. 새 공용 lib 함수를 만들지 않는다.

## 범위

- **포함**: 금(`GC=F`), 비트코인(`BTC-USD`), 원자재 대표 WTI 원유(`CL=F`),
  달러인덱스 DXY(`DX-Y.NYB`, 실패 시 `DX=F` 폴백) 4개 자산의 실시간 조회 및 표시
- **제외**: 금/원유 외 다른 원자재(구리, 은 등) — 대표 1종만 표시. 추후 확장은 별도 작업

## 변경 사항

### 1. 타입 추가 — `src/lib/types/index.ts`

```ts
export interface AlternativeAsset {
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
  unit: string
  source: 'live' | 'error'
}

export interface AlternativeData {
  assets: AlternativeAsset[]
  timestamp: string
}
```

자산이 4개이고 서로 독립적으로 실패할 수 있는 리스트이므로, `kr-stock`의 최상위
`source`(2개 필드 전용) 대신 `subscription`의 리스트 패턴을 응용해 **자산별로
`source`를 갖는다**. 최상위에는 전체 판정 필드를 두지 않는다 (개별 카드가 각자
에러를 표시하므로 불필요).

### 2. API 라우트 — `src/app/api/alternative/route.ts` (신규)

- `kr-stock/route.ts`의 `fetchYahooValue` 함수를 그대로 복사해 사용
  (`https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=2d`,
  `User-Agent`/`Accept` 헤더, `cache: 'no-store'`)
- 반환 형태를 `{ price, changePercent } | null`로 통일 (필드명 `price`는 스펙의
  `AlternativeAsset.price`에 맞춤; 내부 계산은 기존과 동일)
- 4개 티커를 `Promise.allSettled`로 병렬 조회: `GC=F`, `BTC-USD`, `CL=F`, `DX-Y.NYB`
- DXY(`DX-Y.NYB`)가 실패(`null`)하면 서버에서 `DX=F`로 한 번 더 `fetchYahooValue`를
  호출하는 폴백을 추가한다 (성공하면 그 값을 사용, 실패하면 그대로 `null`)
- 개별 자산 실패 시 해당 자산만 `{ price: null, changePercent: null, source: 'error' }`,
  성공 시 `source: 'live'` — 전체 응답은 항상 HTTP 200, 실패해도 나머지 3개 자산은
  정상 표시 (기존 라우트들의 "부분 실패 허용" 원칙 그대로)
- `export const dynamic = 'force-dynamic'`
- 응답 헤더 `Cache-Control: no-store`

자산 메타데이터(표시명/단위)는 라우트 내 상수로 고정:

| symbol | name | unit |
|---|---|---|
| GC=F | 금 | USD/oz |
| BTC-USD | 비트코인 | USD |
| CL=F | 원자재 (WTI 원유) | USD/bbl |
| DX-Y.NYB (폴백 DX=F) | 달러인덱스 (DXY) | Index |

### 3. 훅 — `src/hooks/useAlternative.ts` (신규)

- `useSWR<AlternativeData>('/api/alternative', fetcher, { refreshInterval: 60_000, revalidateOnFocus: false })`
- 갱신 주기 60초 — 환율/원자재/암호화폐는 기존 지수(120초)보다 빠르게 변하므로
  `macro`와 동일한 60초 채택

### 4. UI — `src/components/sections/AlternativeSection.tsx` (신규)

`KrStockSection`과 동일한 구조: `'use client'` + 훅 1개 호출 + 카드 그리드.

- 4개 카드를 `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`로 배치
  (기존 `rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100
  dark:border-white/10 shadow-sm` 스타일 그대로)
- 각 카드: 자산명(`name`) + 단위(`unit`), 현재가(`price`), 등락률(`changePercent`)
  - 가격 소수점 자리수: 금/원유는 2자리(`toFixed(2)`), 비트코인은 정수
    (`Math.round().toLocaleString()`), DXY는 2자리
  - 등락률 표시는 기존 `ChangeDisplay` 패턴 그대로 재사용 (▲ 빨강 `text-up` /
    ▼ 파랑 `text-down`, Korean 상승=빨강 컨벤션)
- 로딩 중: `SkeletonCard` 4개
- 개별 자산이 `source === 'error'`(또는 `price === null`)면 해당 카드에
  "일시적으로 데이터를 불러올 수 없습니다" 표시 — 카드 자체는 그대로 두고 내용만
  대체 (전체 섹션이 깨지지 않음, `kr-stock`의 개별 카드 에러 패턴과 동일)

`page.tsx`에서 `#alternative` 섹션의 `<PlaceholderSection title="대안투자"
emoji="💎" .../>` 호출을 `<AlternativeSection />`으로 교체한다 (기존 `SectionAnchor`의
`bg-white dark:bg-navy/50` 배경은 그대로 유지).

### 5. 에러 처리

fetch 실패 시 고정값(fallback 상수)을 표시하지 않는다. "일시적으로 데이터를 불러올
수 없습니다"를 표시한다 (`docs/sstarboard-handoff.md`의 데이터 표시 규칙 그대로 준수).
DXY 폴백(`DX=F`)은 서버 단에서만 일어나며, 두 티커 모두 실패했을 때만 화면에
에러 상태가 노출된다.

### 6. 테스트

`kr-stock`/`us-market`/`macro` 라우트 자체에도 별도 단위 테스트가 없다. 스코어링
로직이 없으므로 `alternative` 라우트에도 신규 테스트는 추가하지 않는다. 기존 패턴과
일치.

## 영향받지 않는 것

- 다른 원자재(구리, 은 등) 표시 (범위 제외)
- 기존 `kr-stock`, `us-market`, `macro`, `subscription` 라우트/컴포넌트 (변경 없음)
