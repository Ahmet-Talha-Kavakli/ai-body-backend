import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider, useTheme } from '../../../src/providers/ThemeProvider';
import { colors } from '../../../src/design-system/tokens/colors';

function ThemeConsumer() {
  const { colors: c, isDark } = useTheme();
  return (
    <>
      <Text testID="bg">{c.bg.primary}</Text>
      <Text testID="dark">{String(isDark)}</Text>
    </>
  );
}

describe('ThemeProvider', () => {
  it('provides dark theme colors by default', () => {
    const { getByTestId } = render(
      <ThemeProvider defaultMode="dark">
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(getByTestId('bg').props.children).toBe(colors.bg.primary);
    expect(getByTestId('dark').props.children).toBe('true');
  });

  it('provides light theme colors when mode is light', () => {
    const { getByTestId } = render(
      <ThemeProvider defaultMode="light">
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(getByTestId('bg').props.children).toBe(colors.light.bg.primary);
    expect(getByTestId('dark').props.children).toBe('false');
  });

  it('throws when useTheme used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within ThemeProvider');
    spy.mockRestore();
  });
});
