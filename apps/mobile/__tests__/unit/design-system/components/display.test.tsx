import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../../../src/providers/ThemeProvider';
import { Card } from '../../../../src/design-system/components/Card';
import { Badge } from '../../../../src/design-system/components/Badge';
import { Skeleton } from '../../../../src/design-system/components/Skeleton';
import { EmptyState } from '../../../../src/design-system/components/EmptyState';
import { LoadingSpinner } from '../../../../src/design-system/components/LoadingSpinner';

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card>
        <Text>Content</Text>
      </Card>,
      { wrapper: W },
    );
    expect(getByText('Content')).toBeTruthy();
  });
});

describe('Badge', () => {
  it('renders label', () => {
    const { getByText } = render(<Badge label="New" />, { wrapper: W });
    expect(getByText('New')).toBeTruthy();
  });
});

describe('Skeleton', () => {
  it('renders with given dimensions', () => {
    const { getByTestId } = render(<Skeleton width={100} height={20} testID="skel" />, {
      wrapper: W,
    });
    expect(getByTestId('skel')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders title and subtitle', () => {
    const { getByText } = render(<EmptyState title="No data" subtitle="Add something" />, {
      wrapper: W,
    });
    expect(getByText('No data')).toBeTruthy();
    expect(getByText('Add something')).toBeTruthy();
  });
});

describe('LoadingSpinner', () => {
  it('renders', () => {
    const { getByTestId } = render(<LoadingSpinner testID="spin" />, { wrapper: W });
    expect(getByTestId('spin')).toBeTruthy();
  });
});
