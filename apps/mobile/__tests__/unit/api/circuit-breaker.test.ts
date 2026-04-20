import { CircuitBreaker } from '../../../src/api/circuit-breaker';
import { CircuitOpenError } from '../../../src/api/errors';

describe('CircuitBreaker', () => {
  it('starts closed and allows requests through', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openDurationMs: 30_000 });
    expect(() => cb.guard()).not.toThrow();
  });

  it('opens after reaching failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openDurationMs: 30_000 });
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(() => cb.guard()).toThrow(CircuitOpenError);
  });

  it('resets failures on success', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, openDurationMs: 30_000 });
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    cb.recordFailure();
    cb.recordFailure();
    // Only 2 failures after reset — should stay closed
    expect(() => cb.guard()).not.toThrow();
  });

  it('transitions to half-open after openDurationMs', () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker({ failureThreshold: 1, openDurationMs: 1_000 });
    cb.recordFailure();
    expect(() => cb.guard()).toThrow(CircuitOpenError);

    jest.advanceTimersByTime(1_001);
    expect(() => cb.guard()).not.toThrow();
    jest.useRealTimers();
  });

  it('re-opens from half-open on failure', () => {
    jest.useFakeTimers();
    const cb = new CircuitBreaker({ failureThreshold: 1, openDurationMs: 1_000 });
    cb.recordFailure();
    jest.advanceTimersByTime(1_001);
    cb.guard(); // half-open: passes
    cb.recordFailure(); // failure in half-open → open again
    expect(() => cb.guard()).toThrow(CircuitOpenError);
    jest.useRealTimers();
  });
});
