import { CircuitOpenError } from './errors';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number; // consecutive 5xx failures before opening
  openDurationMs?: number; // how long to stay open
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt = 0;

  private readonly failureThreshold: number;
  private readonly openDurationMs: number;

  constructor({ failureThreshold = 3, openDurationMs = 30_000 }: CircuitBreakerOptions = {}) {
    this.failureThreshold = failureThreshold;
    this.openDurationMs = openDurationMs;
  }

  get isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.openDurationMs) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  remainingMs(): number {
    if (this.state !== 'open') return 0;
    return Math.max(0, this.openDurationMs - (Date.now() - this.openedAt));
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  guard(): void {
    if (this.isOpen) {
      throw new CircuitOpenError(this.remainingMs());
    }
  }
}
