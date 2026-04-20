import React from 'react';
import { SafeAreaWrapper } from '../../src/design-system/primitives/SafeAreaWrapper';
import { EmptyState } from '../../src/design-system/components/EmptyState';

export default function TrainTab() {
  return (
    <SafeAreaWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
      <EmptyState title="Train" subtitle="Coming soon" />
    </SafeAreaWrapper>
  );
}
