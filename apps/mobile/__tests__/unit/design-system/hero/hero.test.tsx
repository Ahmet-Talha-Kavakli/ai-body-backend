import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../src/providers/ThemeProvider';
import { PetWidget } from '../../../../src/design-system/hero/PetWidget';
import { AIMessage } from '../../../../src/design-system/hero/AIMessage';
import { StreakIndicator } from '../../../../src/design-system/hero/StreakIndicator';
import { XPBar } from '../../../../src/design-system/hero/XPBar';

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('PetWidget', () => {
  it('renders mood emoji', () => {
    const { getByText } = render(<PetWidget mood="happy" />, { wrapper: W });
    expect(getByText('😺')).toBeTruthy();
  });
});

describe('AIMessage', () => {
  it('renders message text', () => {
    const { getByText } = render(<AIMessage message="Bugün harika görünüyorsun!" />, {
      wrapper: W,
    });
    expect(getByText('Bugün harika görünüyorsun!')).toBeTruthy();
  });
});

describe('StreakIndicator', () => {
  it('renders streak count', () => {
    const { getByText } = render(<StreakIndicator days={7} />, { wrapper: W });
    expect(getByText('7')).toBeTruthy();
  });
});

describe('XPBar', () => {
  it('renders level', () => {
    const { getByText } = render(<XPBar currentXP={450} level={3} />, { wrapper: W });
    expect(getByText('3')).toBeTruthy();
  });
});
