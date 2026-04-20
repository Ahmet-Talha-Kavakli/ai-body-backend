import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../src/providers/ThemeProvider';
import { Button } from '../../../../src/design-system/components/Button';

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('Button', () => {
  it('renders label', () => {
    const { getByText } = render(<Button label="Start" onPress={() => {}} />, { wrapper: W });
    expect(getByText('Start')).toBeTruthy();
  });

  it('calls onPress', () => {
    const fn = jest.fn();
    const { getByText } = render(<Button label="Go" onPress={fn} />, { wrapper: W });
    fireEvent.press(getByText('Go'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const fn = jest.fn();
    const { getByText } = render(<Button label="Off" onPress={fn} disabled />, { wrapper: W });
    fireEvent.press(getByText('Off'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading=true', () => {
    const { getByTestId } = render(
      <Button label="Save" onPress={() => {}} loading testID="btn" />,
      { wrapper: W },
    );
    expect(getByTestId('btn-spinner')).toBeTruthy();
  });

  it('renders all 5 variants without crash', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'ai'] as const;
    for (const v of variants) {
      expect(() =>
        render(<Button label={v} onPress={() => {}} variant={v} />, { wrapper: W }),
      ).not.toThrow();
    }
  });
});
