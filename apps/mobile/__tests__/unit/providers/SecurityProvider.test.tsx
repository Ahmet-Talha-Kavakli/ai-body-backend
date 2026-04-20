import React from 'react';
import { render } from '@testing-library/react-native';
import { SecurityProvider } from '../../../src/providers/SecurityProvider';
import { ThemeProvider } from '../../../src/providers/ThemeProvider';
import { DSText } from '../../../src/design-system/primitives/Text';

const mockIsJailBroken = jest.fn(() => false);
const mockCanMockLocation = jest.fn(() => false);

jest.mock('jail-monkey', () => ({
  isJailBroken: () => mockIsJailBroken(),
  canMockLocation: () => mockCanMockLocation(),
}));

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

describe('SecurityProvider', () => {
  beforeEach(() => {
    mockIsJailBroken.mockReturnValue(false);
    mockCanMockLocation.mockReturnValue(false);
  });

  it('renders children when device is safe', () => {
    const { getByText } = render(
      <W>
        <SecurityProvider>
          <DSText variant="body">Protected content</DSText>
        </SecurityProvider>
      </W>,
    );
    expect(getByText('Protected content')).toBeTruthy();
  });

  it('blocks rendering when device is jailbroken', () => {
    mockIsJailBroken.mockReturnValue(true);
    const { queryByText, getByText } = render(
      <W>
        <SecurityProvider>
          <DSText variant="body">Protected content</DSText>
        </SecurityProvider>
      </W>,
    );
    expect(queryByText('Protected content')).toBeNull();
    expect(getByText('Güvenlik Uyarısı')).toBeTruthy();
  });
});
