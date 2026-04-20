import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../src/providers/ThemeProvider';
import { ReadinessRing } from '../../../../src/design-system/hero/ReadinessRing';

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('ReadinessRing', () => {
  it('renders score', () => {
    const { getByText } = render(<ReadinessRing score={82} />, { wrapper: W });
    expect(getByText('82')).toBeTruthy();
  });

  it('renders with score 0', () => {
    expect(() => render(<ReadinessRing score={0} />, { wrapper: W })).not.toThrow();
  });

  it('renders with score 100', () => {
    expect(() => render(<ReadinessRing score={100} />, { wrapper: W })).not.toThrow();
  });
});
