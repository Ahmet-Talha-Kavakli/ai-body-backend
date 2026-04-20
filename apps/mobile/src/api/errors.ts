export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'No internet connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class CircuitOpenError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super(`Circuit open — retry after ${retryAfterMs}ms`);
    this.name = 'CircuitOpenError';
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function isNetworkError(e: unknown): e is NetworkError {
  return e instanceof NetworkError;
}

export function isCircuitOpenError(e: unknown): e is CircuitOpenError {
  return e instanceof CircuitOpenError;
}
