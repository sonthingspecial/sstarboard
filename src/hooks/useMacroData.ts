import useSWR from 'swr'
import type { MacroData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useMacroData() {
  const { data, error, isLoading } = useSWR<MacroData>('/api/macro', fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })
  return { data, error, isLoading }
}
