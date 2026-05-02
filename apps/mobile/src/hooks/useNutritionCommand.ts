import { useAuth } from '@clerk/expo';
import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { sendNutritionCommand } from '../api/body-client';

function useToken() {
  const { getToken } = useAuth();
  return {
    getToken: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return token;
    },
  };
}

export function useNutritionCommand() {
  const { getToken } = useToken();
  const activeControllerRef = useRef<AbortController | null>(null);

  return useMutation({
    mutationFn: async (args: {
      message: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => {
      // Önceki çağrı varsa iptal et
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      const ac = new AbortController();
      activeControllerRef.current = ac;
      try {
        const token = await getToken();
        return await sendNutritionCommand(token, args.message, args.conversationHistory, ac.signal);
      } finally {
        if (activeControllerRef.current === ac) {
          activeControllerRef.current = null;
        }
      }
    },
    retry: (failureCount, error: any) => {
      if (failureCount >= 1) return false;
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return false;
      return true;
    },
    retryDelay: 1000,
  });
}
