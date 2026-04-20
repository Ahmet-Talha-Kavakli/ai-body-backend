import { spacing, radius, spring, duration } from '../../../src/design-system/tokens';

describe('spacing tokens', () => {
  it('follows 4pt grid', () => {
    expect(spacing[5]).toBe(16);
    expect(spacing[8]).toBe(32);
  });
});

describe('radius tokens', () => {
  it('xl is iOS 17 sheet standard (20)', () => {
    expect(radius.xl).toBe(20);
  });
  it('full is 9999', () => {
    expect(radius.full).toBe(9999);
  });
});

describe('motion tokens', () => {
  it('smooth spring has correct damping', () => {
    expect(spring.smooth.damping).toBe(20);
  });
  it('normal duration is 300ms', () => {
    expect(duration.normal).toBe(300);
  });
});
