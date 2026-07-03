import useSWR from 'swr'
import type { SubscriptionData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useSubscription() {
  const { data, error, isLoading } = useSWR<SubscriptionData>('/api/subscription', fetcher, {
    refreshInterval: 300_000,
    revalidateOnFocus: false,
  })
  return { data, error, isLoading }
}
