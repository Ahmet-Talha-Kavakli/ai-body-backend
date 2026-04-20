import React from 'react';
import { SafeAreaWrapper } from '../../src/design-system/primitives/SafeAreaWrapper';
import { EmptyState } from '../../src/design-system/components/EmptyState';

export default function HealthTab() {
  return (
    <SafeAreaWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
      <EmptyState title="Health" subtitle="Coming soon" />
    </SafeAreaWrapper>
  );
}
