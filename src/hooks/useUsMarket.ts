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
