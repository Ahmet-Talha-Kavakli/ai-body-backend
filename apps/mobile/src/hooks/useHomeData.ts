import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardStats,
  fetchHomeGreeting,
  fetchPet,
  fetchReadiness,
  fetchSleepDashboard,
  fetchWaterDashboard,
} from '../api/home-client';

function useToken() {
  const { getToken, isSignedIn } = useAuth();
  return {
    isSignedIn: !!isSignedIn,
    getToken: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return token;
    },
  };
}

export function useHomeGreeting() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: ['home', 'greeting'],
    queryFn: () => getToken().then(fetchHomeGreeting),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function usePet() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: ['pet'],
    queryFn: () => getToken().then(fetchPet),
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useReadiness() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: ['readiness'],
    queryFn: () => getToken().then(fetchReadiness),
    enabled: isSignedIn,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useWaterDashboard() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: ['water', 'dashboard'],
    queryFn: () => getToken().then(fetchWaterDashboard),
    enabled: isSignedIn,
    staleTime: 60 * 1000,
    retry: 2,
  });
}

export function useDashboardStats() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => getToken().then(fetchDashboardStats),
    enabled: isSignedIn,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useSleepDashboard() {
  const { getToken, isSignedIn } = useToken();
  return useQuery({
    queryKey: ['sleep', 'dashboard'],
    queryFn: () => getToken().then(fetchSleepDashboard),
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
