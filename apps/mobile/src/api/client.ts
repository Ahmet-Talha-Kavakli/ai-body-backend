import axios, { AxiosInstance, AxiosResponse, isAxiosError } from 'axios';
import { ApiError, NetworkError } from './errors';
import { CircuitBreaker } from './circuit-breaker';

const breaker = new CircuitBreaker({ failureThreshold: 3, openDurationMs: 30_000 });

function buildClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000',
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    breaker.guard();
    config.headers['X-Idempotency-Key'] = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return config;
  });

  instance.interceptors.response.use(
    (res: AxiosResponse) => {
      breaker.recordSuccess();
      return res;
    },
    (error: unknown) => {
      if (isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        if (status >= 500) {
          breaker.recordFailure();
        }
        if (!error.response) {
          return Promise.reject(new NetworkError());
        }
        const code = (error.response.data as { code?: string })?.code ?? 'UNKNOWN';
        const message = (error.response.data as { message?: string })?.message ?? error.message;
        return Promise.reject(new ApiError(status, code, message));
      }
      return Promise.reject(error);
    },
  );

  return instance;
}

export const apiClient = buildClient();

// Exposed for testing
export { breaker as _circuitBreaker };
