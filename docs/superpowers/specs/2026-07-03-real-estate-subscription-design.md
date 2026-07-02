# 부동산 섹션 — 청약 정보 조회 기능 설계

> 상태: 승인됨 (2026-07-03)

## 배경

Sstarboard의 "부동산" 섹션(`#real-estate`)은 현재 `PlaceholderSection`이다. 이번 작업 범위는
청약홈(공공데이터포털) API를 이용한 APT 청약 공고 조회 + 클라이언트 필터(지역/자금조건/유형/브랜드/마감임박)
기능 구현이다. 기존 `macro`/`kr-stock` 패턴(파일 구조, 네이밍, 에러 처리, 다크모드 스타일)을 따른다.

## 사전 조사에서 확정된 사항

`PUBLIC_DATA_API_KEY`로 실제 API를 호출해 확인한 결과, 원래 스펙에서 가정했던 것과 다른 점이 있어
아래와 같이 확정했다:

1. **분양가 필드는 `getAPTLttotPblancDetail`에 없다.** 별도 엔드포인트
   `getAPTLttotPblancMdl`(주택형별 상세, `HOUSE_MANAGE_NO`로 조회)의 `LTTOT_TOP_AMOUNT` 필드에 있고,
   공고 1건당 여러 주택형(행)이 있다. 목록 조회 후 **공고별로 추가 조회(N+1)**가 필요하다 — 사용자 승인됨.
   과부하 방지를 위해 **20개씩 배치**로 `Promise.allSettled` 병렬 조회한다 (배치 간 순차 대기).
2. **`detailUrl`은 직접 조립할 필요 없이 API가 제공하는 `PBLANC_URL`을 그대로 사용한다.**
3. **지역(시/도) 목록은 `SUBSCRPT_AREA_CODE_NM`의 실제 값 17개**(서울/부산/대구/인천/광주/대전/울산/세종/경기/강원/충북/충남/전북/전남/경북/경남/제주)를
   그대로 필터 드롭다운 옵션으로 사용한다 (별도 매핑표 불필요, 값이 API와 항상 일치).

## 필드 매핑 (`getAPTLttotPblancDetail` → `SubscriptionListing`)

| SubscriptionListing 필드 | 원본 API 필드 | 변환 규칙 |
|---|---|---|
| `id` | `HOUSE_MANAGE_NO` | 그대로 (Mdl 상세 조회 시 조인 키로도 사용) |
| `name` | `HOUSE_NM` | 그대로 |
| `region` | `SUBSCRPT_AREA_CODE_NM` | 그대로 |
| `district` | `HSSPLY_ADRES` | 공백 split 후 두 번째 토큰 (예: "경기도 화성시 ..." → "화성시") |
| `type` | `RENT_SECD_NM` + `HOUSE_DTL_SECD_NM` | `RENT_SECD_NM`에 "임대" 포함 시 rental 계열: `HOUSE_DTL_SECD_NM === '국민'` → `publicRental`, 아니면 `privateRental`. 그 외(분양주택)는: `HOUSE_DTL_SECD_NM === '국민'` → `public`, 아니면 `private` |
| `brand` | `HOUSE_NM` | `BRAND_KEYWORDS`의 키워드가 단지명에 포함되면 해당 브랜드명, 없으면 `null` (UI의 "기타" 체크박스는 `brand === null`을 가리킴) |
| `minPrice`/`maxPrice` | `getAPTLttotPblancMdl`의 `LTTOT_TOP_AMOUNT` (문자열, 만원) | 공고별 상세 조회 결과 배열의 최소/최대값. 조회 실패 시 둘 다 `null` |
| `applyStartDate` | `RCEPT_BGNDE` | 그대로 (`YYYY-MM-DD`, 유효한 ISO 8601 date) |
| `applyEndDate` | `RCEPT_ENDDE` | 그대로 |
| `detailUrl` | `PBLANC_URL` | 그대로 (API가 완성된 링크 제공) |

**마감 필터링**: `RCEPT_ENDDE >= 오늘`인 공고만 포함 (지난 공고 제외).

## 변경 사항

### 1. 타입 추가 — `src/lib/types/index.ts`

사용자가 제시한 `SubscriptionListing`, `SubscriptionData` 인터페이스를 그대로 추가.

### 2. `src/lib/constants/subscriptionBrands.ts` (신규)

```ts
export const BRAND_KEYWORDS: Record<string, string[]> = {
  '래미안': ['래미안'],
  '힐스테이트': ['힐스테이트'],
  '푸르지오': ['푸르지오'],
  '자이': ['자이'],
  '더샵': ['더샵'],
  '아이파크': ['아이파크'],
  '롯데캐슬': ['롯데캐슬'],
}
```

순수 데이터만 포함 (매칭 로직은 라우트에 위치 — `newsKeywords.ts`/`newsScore.ts` 분리 패턴과 동일).

### 3. `src/app/api/subscription/route.ts` (신규)

- `getAPTLttotPblancDetail?page=1&perPage=200&serviceKey=...` 로 목록 조회
- `RCEPT_ENDDE >= 오늘`인 공고만 필터링
- 필터링된 공고를 20개씩 배치로 나눠 `getAPTLttotPblancMdl?cond[HOUSE_MANAGE_NO::EQ]={id}&perPage=100`을
  `Promise.allSettled`로 병렬 조회, 배치는 순차 처리 (동시 최대 20개)
- 각 공고에 대해 위 필드 매핑표대로 `SubscriptionListing` 조립
- 목록 조회 자체가 실패하면 정적 폴백 없이 `{ listings: [], source: 'error' }` 반환
- 상세(가격) 조회가 개별적으로 실패하면 해당 공고의 `minPrice`/`maxPrice`만 `null` (전체 실패 아님)
- `export const dynamic = 'force-dynamic'`, `Cache-Control: no-store`

### 4. `src/hooks/useSubscription.ts` (신규)

`useKrStockData.ts`와 동일한 SWR 패턴, `refreshInterval: 300_000`, `revalidateOnFocus: false`.

### 5. `src/components/sections/RealEstateSection.tsx` (신규)

**필터 패널** (컴포넌트 내부 `useState`로 관리, 모든 조건 AND 결합):
- 지역: select, 옵션 = `['전체', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']`
- 자금 조건: 보유 자본금 / 예상 대출 가능액 숫자 입력(만원). 둘 중 하나라도 값이 있으면(0보다 크면)
  `useMemo`로 감당 가능 분양가 상한 = 자본금(미입력 시 0) + 대출가능액(미입력 시 0) 계산해 굵은 글씨로 표시.
  계약금 비율 select(10%/15%/20%) → 필요 계약금 = 상한 × 비율, 자동 표시.
  필터 적용: `minPrice === null`이면 통과, 아니면 `minPrice <= 상한`일 때만 통과. 두 입력이 모두 비어있으면
  (상한 미계산 상태) 이 필터 자체를 적용하지 않음(모두 통과).
- 청약 유형 체크박스 4개(공공분양/민간분양/공공임대/민간임대): 하나도 선택 안 하면 필터 미적용(전체 통과),
  하나 이상 선택 시 선택된 유형만 통과.
- 브랜드 체크박스(7개 브랜드 + '기타'): 위와 동일한 "미선택 시 전체 통과" 규칙. '기타' 체크는 `brand === null`.
- 마감 임박 select(전체/1주 이내/2주 이내/1개월 이내): 오늘부터 `applyEndDate`까지 남은 일수 기준 필터.

**결과 카드 그리드**:
- `useSubscription()`으로 데이터 조회, 로딩 중 `SkeletonCard` 3개
- 그리드: `sm:grid-cols-2 lg:grid-cols-3`
- 카드: 단지명, 지역(+구), 유형 뱃지, 분양가 범위(`minPrice`/`maxPrice` 둘 다 `null`이면 "가격 정보 없음"),
  청약 시작~마감일
- 마감 7일 이내: 카드 테두리 `border-down` 강조 + "마감임박" 뱃지
- 카드 클릭 시 `detailUrl`을 새 탭으로 열기
- 필터 결과 0건: "조건에 맞는 공고가 없습니다"
- `data?.source === 'error'`: "청약 정보를 불러올 수 없습니다"

### 6. `src/app/page.tsx` 수정

`#real-estate`의 `PlaceholderSection`을 `RealEstateSection`으로 교체, import 정리.

## 영향받지 않는 것

- 기존 `macro`, `kr-stock`, `us-market` 라우트/컴포넌트 (변경 없음)
- 부동산 섹션의 전세가율/미분양/경매지수 (이번 범위 제외, 이미 별도 플레이스홀더 없음 — 이번 작업으로
  #real-estate 전체가 청약 정보로 대체됨)
