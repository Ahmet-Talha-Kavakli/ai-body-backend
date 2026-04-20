import React from 'react';
import { render } from '@testing-library/react-native';
import { SecurityProvider, useSecurityStatus } from '../../../src/providers/SecurityProvider';
import { ThemeProvider } from '../../../src/providers/ThemeProvider';
import { DSText } from '../../../src/design-system/primitives/Text';

jest.mock('jail-monkey', () => ({
  isJailBroken: jest.fn(() => false),
  canMockLocation: jest.fn(() => false),
}));

import JailMonkey from 'jail-monkey';
const mockIsJailBroken = JailMonkey.isJailBroken as jest.Mock;
const mockCanMockLocation = JailMonkey.canMockLocation as jest.Mock;

function W({ children }: { children: React.ReactNode }) {
  return <ThemeProvider defaultMode="dark">{children}</ThemeProvider>;
}

function StatusDisplay() {
  const status = useSecurityStatus();
  return <DSText variant="body">{status}</DSText>;
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
