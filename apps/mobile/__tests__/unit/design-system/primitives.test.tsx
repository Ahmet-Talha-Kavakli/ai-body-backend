import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/providers/ThemeProvider';
import { Box } from '../../../src/design-system/primitives/Box';
import { Stack } from '../../../src/design-system/primitives/Stack';
import { Divider } from '../../../src/design-system/primitives/Divider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('Box', () => {
  it('renders children', () => {
    const { getByTestId } = render(<Box testID="box" />, { wrapper });
    expect(getByTestId('box')).toBeTruthy();
  });
});

describe('Stack', () => {
  it('renders horizontal stack', () => {
    const { getByTestId } = render(<Stack direction="row" testID="stack" />, { wrapper });
    expect(getByTestId('stack')).toBeTruthy();
  });
});

describe('Divider', () => {
  it('renders', () => {
    const { getByTestId } = render(<Divider testID="div" />, { wrapper });
    expect(getByTestId('div')).toBeTruthy();
  });
});
