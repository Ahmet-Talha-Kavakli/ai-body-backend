import { useQuery } from '@tanstack/react-query'

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscription/usage')
      if (!res.ok) throw new Error('Failed to fetch subscription')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
  })
}
