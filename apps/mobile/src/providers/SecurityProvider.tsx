import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import JailMonkey from 'jail-monkey';
import { DSText } from '../design-system/primitives/Text';

type SecurityStatus = 'checking' | 'safe' | 'compromised';

const SecurityContext = createContext<SecurityStatus>('checking');

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

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SecurityStatus>('checking');

  useEffect(() => {
    const isCompromised = JailMonkey.isJailBroken() || JailMonkey.canMockLocation();
    setStatus(isCompromised ? 'compromised' : 'safe');
  }, []);

  if (status === 'checking') return null;
  if (status === 'compromised') return <BlockedScreen />;

  return <SecurityContext.Provider value={status}>{children}</SecurityContext.Provider>;
}
