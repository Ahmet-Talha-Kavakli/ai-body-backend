import { useQuery } from '@tanstack/react-query'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      return res.json()
    },
    staleTime: 2 * 60 * 1000, // 2 dakika
    refetchOnWindowFocus: true,
  })
}

export function useWorkoutSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await fetch('/api/sessions')
      if (!res.ok) throw new Error('Failed to fetch sessions')
      return res.json()
    },
    staleTime: 60 * 1000, // 1 dakika
  })
}
