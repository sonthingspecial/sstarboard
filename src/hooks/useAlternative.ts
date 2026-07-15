import useSWR from 'swr'
import type { AlternativeData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useAlternative() {
  const { data, error, isLoading } = useSWR<AlternativeData>('/api/alternative', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })
  return { data, error, isLoading }
}
