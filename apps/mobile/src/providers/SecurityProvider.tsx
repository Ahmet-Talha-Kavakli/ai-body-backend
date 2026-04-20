import React, { createContext, useContext } from 'react';
import { View } from 'react-native';
import JailMonkey from 'jail-monkey';
import { DSText } from '../design-system/primitives/Text';

type SecurityStatus = 'safe' | 'compromised';

const SecurityContext = createContext<SecurityStatus>('safe');

export function useSecurityStatus(): SecurityStatus {
  return useContext(SecurityContext);
}

function BlockedScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <DSText variant="title2">Güvenlik Uyarısı</DSText>
      <DSText variant="body" color="secondary">
        Bu cihaz desteklenmiyor.
      </DSText>
    </View>
  );
}

function getSecurityStatus(): SecurityStatus {
  return JailMonkey.isJailBroken() || JailMonkey.canMockLocation() ? 'compromised' : 'safe';
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  // Synchronous check at render time — no async, no effect needed
  const status = getSecurityStatus();

  if (status === 'compromised') return <BlockedScreen />;

  return <SecurityContext.Provider value={status}>{children}</SecurityContext.Provider>;
}
