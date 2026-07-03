import type { SubscriptionListing } from '@/lib/types'

const TYPE_LABELS: Record<SubscriptionListing['type'], string> = {
  public: '공공분양',
  private: '민간분양',
  publicRental: '공공임대',
  privateRental: '민간임대',
}

export function daysUntilDeadline(dateStr: string): number {
  const end = new Date(`${dateStr}T00:00:00`)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((end.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
}

interface SubscriptionCardProps {
  listing: SubscriptionListing
}

export function SubscriptionCard({ listing }: SubscriptionCardProps) {
  const urgent = daysUntilDeadline(listing.applyEndDate) <= 7
  const priceLabel =
    listing.minPrice !== null && listing.maxPrice !== null
      ? `${listing.minPrice.toLocaleString('ko-KR')}~${listing.maxPrice.toLocaleString('ko-KR')}만원`
      : '가격 정보 없음'

  return (
    <a
      href={listing.detailUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-card p-5 bg-white dark:bg-navy-light border shadow-sm hover:shadow-md transition-shadow ${
        urgent ? 'border-down' : 'border-gray-100 dark:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-gray-900 dark:text-white text-sm">{listing.name}</p>
        {urgent && (
          <span className="text-xs font-semibold text-down bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full shrink-0">
            마감임박
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-2">{listing.region} {listing.district}</p>
      <span className="inline-block text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full mb-2">
        {TYPE_LABELS[listing.type]}
      </span>
      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{priceLabel}</p>
      <p className="text-xs text-gray-400">{listing.applyStartDate} ~ {listing.applyEndDate}</p>
    </a>
  )
}
