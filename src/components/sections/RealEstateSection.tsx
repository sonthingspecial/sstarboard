'use client'

import { useMemo, useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { SkeletonCard } from '@/components/ui/SkeletonCard'
import { SubscriptionCard, daysUntilDeadline } from '@/components/ui/SubscriptionCard'
import { BRAND_KEYWORDS } from '@/lib/constants/subscriptionBrands'
import type { SubscriptionListing } from '@/lib/types'

const REGIONS = [
  '전체', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]

const TYPE_OPTIONS: { key: SubscriptionListing['type']; label: string }[] = [
  { key: 'public', label: '공공분양' },
  { key: 'private', label: '민간분양' },
  { key: 'publicRental', label: '공공임대' },
  { key: 'privateRental', label: '민간임대' },
]

const BRAND_OPTIONS = [...Object.keys(BRAND_KEYWORDS), '기타']

const DEADLINE_OPTIONS: { key: string; label: string; days: number | null }[] = [
  { key: 'all', label: '전체', days: null },
  { key: '1w', label: '1주 이내', days: 7 },
  { key: '2w', label: '2주 이내', days: 14 },
  { key: '1m', label: '1개월 이내', days: 30 },
]

const DOWN_PAYMENT_RATES = [10, 15, 20]

const inputClass =
  'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold'

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function RealEstateSection() {
  const { data, isLoading } = useSubscription()

  const [region, setRegion] = useState('전체')
  const [capital, setCapital] = useState('')
  const [loan, setLoan] = useState('')
  const [downPaymentRate, setDownPaymentRate] = useState(10)
  const [selectedTypes, setSelectedTypes] = useState<Set<SubscriptionListing['type']>>(new Set())
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [deadline, setDeadline] = useState('all')

  const affordableMax = useMemo(() => {
    const c = parseFloat(capital)
    const l = parseFloat(loan)
    const validC = !isNaN(c) && c > 0
    const validL = !isNaN(l) && l > 0
    if (!validC && !validL) return null
    return (validC ? c : 0) + (validL ? l : 0)
  }, [capital, loan])

  const requiredDownPayment = useMemo(() => {
    if (affordableMax === null) return null
    return Math.round(affordableMax * (downPaymentRate / 100))
  }, [affordableMax, downPaymentRate])

  const filtered = useMemo(() => {
    const listings = data?.listings ?? []
    const deadlineDays = DEADLINE_OPTIONS.find((d) => d.key === deadline)?.days ?? null

    return listings.filter((l) => {
      if (region !== '전체' && l.region !== region) return false
      if (selectedTypes.size > 0 && !selectedTypes.has(l.type)) return false
      if (selectedBrands.size > 0) {
        const brandKey = l.brand ?? '기타'
        if (!selectedBrands.has(brandKey)) return false
      }
      if (affordableMax !== null && l.minPrice !== null && l.minPrice > affordableMax) return false
      if (deadlineDays !== null && daysUntilDeadline(l.applyEndDate) > deadlineDays) return false
      return true
    })
  }, [data, region, selectedTypes, selectedBrands, affordableMax, deadline])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🏠</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">부동산 — 청약 정보</h2>
      </div>

      <div className="rounded-card p-5 bg-white dark:bg-navy-light border border-gray-100 dark:border-white/10 mb-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
            지역
          </label>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 pt-4">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
            감당 가능 금액 계산
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">보유 자본금 (만원)</label>
              <input
                type="number"
                min="0"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="예: 20000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">예상 대출 가능액 (만원)</label>
              <input
                type="number"
                min="0"
                value={loan}
                onChange={(e) => setLoan(e.target.value)}
                placeholder="예: 30000"
                className={inputClass}
              />
            </div>
          </div>
          {affordableMax !== null && (
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>
                감당 가능 분양가 상한:{' '}
                <span className="font-bold text-gray-900 dark:text-white">{affordableMax.toLocaleString('ko-KR')}만원</span>
              </p>
              <div className="flex items-center gap-2">
                <span>계약금 비율</span>
                <select
                  value={downPaymentRate}
                  onChange={(e) => setDownPaymentRate(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-navy px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  {DOWN_PAYMENT_RATES.map((rate) => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
                <span>
                  → 필요 계약금:{' '}
                  <span className="font-bold text-gray-900 dark:text-white">{requiredDownPayment?.toLocaleString('ko-KR')}만원</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 pt-4">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">청약 유형</p>
          <div className="flex flex-wrap gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <label key={opt.key} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTypes.has(opt.key)}
                  onChange={() => setSelectedTypes((prev) => toggleInSet(prev, opt.key))}
                  className="accent-gold"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 pt-4">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">브랜드</p>
          <div className="flex flex-wrap gap-3">
            {BRAND_OPTIONS.map((brand) => (
              <label key={brand} className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.has(brand)}
                  onChange={() => setSelectedBrands((prev) => toggleInSet(prev, brand))}
                  className="accent-gold"
                />
                {brand}
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 pt-4">
          <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5">
            마감 임박
          </label>
          <select value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass}>
            {DEADLINE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : data?.source === 'error' ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">청약 정보를 불러올 수 없습니다</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">조건에 맞는 공고가 없습니다</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <SubscriptionCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
