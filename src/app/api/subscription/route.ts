import { NextResponse } from 'next/server'
import type { SubscriptionData, SubscriptionListing } from '@/lib/types'
import { BRAND_KEYWORDS } from '@/lib/constants/subscriptionBrands'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const LIST_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail'
const DETAIL_URL = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancMdl'
const BATCH_SIZE = 20
// Cap the number of listings that get a live price-detail lookup, to bound worst-case
// latency against the upstream 청약홈 API. Listings beyond the cap still appear in the
// response, just without price info (UI already renders "가격 정보 없음" for that case).
const PRICE_LOOKUP_CAP = 60

interface RawListing {
  HOUSE_MANAGE_NO: string
  HOUSE_NM: string
  SUBSCRPT_AREA_CODE_NM: string
  HSSPLY_ADRES: string
  RENT_SECD_NM: string
  HOUSE_DTL_SECD_NM: string
  RCEPT_BGNDE: string
  RCEPT_ENDDE: string
  PBLANC_URL: string
}

interface RawUnitType {
  LTTOT_TOP_AMOUNT: string
}

function matchBrand(name: string): string | null {
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some((k) => name.includes(k))) return brand
  }
  return null
}

function parseDistrict(address: string): string {
  const tokens = address.trim().split(/\s+/)
  return tokens[1] ?? ''
}

function resolveType(rentSecdNm: string, houseDtlSecdNm: string): SubscriptionListing['type'] {
  const isRental = rentSecdNm.includes('임대')
  const isPublic = houseDtlSecdNm === '국민'
  if (isRental) return isPublic ? 'publicRental' : 'privateRental'
  return isPublic ? 'public' : 'private'
}

async function fetchPriceRange(houseManageNo: string, apiKey: string): Promise<{ minPrice: number | null; maxPrice: number | null }> {
  try {
    const cond = encodeURIComponent('cond[HOUSE_MANAGE_NO::EQ]')
    const url = `${DETAIL_URL}?page=1&perPage=100&${cond}=${encodeURIComponent(houseManageNo)}&serviceKey=${apiKey}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const rows: RawUnitType[] = json.data ?? []
    const amounts = rows.map((r) => parseInt(r.LTTOT_TOP_AMOUNT, 10)).filter((n) => !isNaN(n))
    if (amounts.length === 0) return { minPrice: null, maxPrice: null }
    return { minPrice: Math.min(...amounts), maxPrice: Math.max(...amounts) }
  } catch {
    return { minPrice: null, maxPrice: null }
  }
}

async function fetchPricesInBatches(
  listings: RawListing[],
  apiKey: string,
): Promise<Map<string, { minPrice: number | null; maxPrice: number | null }>> {
  const result = new Map<string, { minPrice: number | null; maxPrice: number | null }>()
  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE)
    const settled = await Promise.allSettled(batch.map((l) => fetchPriceRange(l.HOUSE_MANAGE_NO, apiKey)))
    batch.forEach((l, idx) => {
      const r = settled[idx]
      result.set(l.HOUSE_MANAGE_NO, r.status === 'fulfilled' ? r.value : { minPrice: null, maxPrice: null })
    })
  }
  return result
}

export async function GET() {
  const apiKey = process.env.PUBLIC_DATA_API_KEY
  if (!apiKey) {
    const body: SubscriptionData = { listings: [], timestamp: new Date().toISOString(), source: 'error' }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const listUrl = `${LIST_URL}?page=1&perPage=200&serviceKey=${apiKey}`
    const res = await fetch(listUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const raw: RawListing[] = json.data ?? []

    const today = new Date().toISOString().slice(0, 10)
    const future = raw
      .filter((l) => l.RCEPT_ENDDE >= today)
      .sort((a, b) => (a.RCEPT_ENDDE < b.RCEPT_ENDDE ? -1 : a.RCEPT_ENDDE > b.RCEPT_ENDDE ? 1 : 0))

    const priceMap = await fetchPricesInBatches(future.slice(0, PRICE_LOOKUP_CAP), apiKey)

    const listings: SubscriptionListing[] = future.map((l) => {
      const price = priceMap.get(l.HOUSE_MANAGE_NO) ?? { minPrice: null, maxPrice: null }
      return {
        id: l.HOUSE_MANAGE_NO,
        name: l.HOUSE_NM,
        region: l.SUBSCRPT_AREA_CODE_NM,
        district: parseDistrict(l.HSSPLY_ADRES),
        type: resolveType(l.RENT_SECD_NM, l.HOUSE_DTL_SECD_NM),
        brand: matchBrand(l.HOUSE_NM),
        minPrice: price.minPrice,
        maxPrice: price.maxPrice,
        applyStartDate: l.RCEPT_BGNDE,
        applyEndDate: l.RCEPT_ENDDE,
        detailUrl: l.PBLANC_URL,
      }
    })

    const body: SubscriptionData = { listings, timestamp: new Date().toISOString(), source: 'live' }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    const body: SubscriptionData = { listings: [], timestamp: new Date().toISOString(), source: 'error' }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  }
}
