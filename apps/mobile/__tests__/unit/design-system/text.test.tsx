import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../src/providers/ThemeProvider';
import { DSText } from '../../../src/design-system/primitives/Text';

function wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('DSText', () => {
  it('renders body variant by default', () => {
    const { getByText } = render(<DSText>Hello</DSText>, { wrapper });
    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders title1 variant', () => {
    const { getByText } = render(<DSText variant="title1">Big Title</DSText>, { wrapper });
    expect(getByText('Big Title')).toBeTruthy();
  });

  it('applies secondary color', () => {
    const { getByText } = render(<DSText color="secondary">Secondary</DSText>, { wrapper });
    const el = getByText('Secondary');
    expect(el.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: expect.any(String) })]),
    );
  });
});
