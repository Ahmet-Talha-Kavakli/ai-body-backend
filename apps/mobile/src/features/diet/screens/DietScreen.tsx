import React, { useState } from 'react';
import { View, StyleSheet, DeviceEventEmitter, ActivityIndicator } from 'react-native';
import { useActiveDiet } from '../hooks/useActiveDiet';
import { DietOnboardingScreen } from './DietOnboardingScreen';
import { ActiveDietScreen } from './ActiveDietScreen';
import { PresetDetailScreen } from './PresetDetailScreen';
import { AiPlanWizardScreen } from './AiPlanWizardScreen';
import type { DietPreset } from '../api/types';

export function DietScreen() {
  const { plan, loading, refresh, stop, apply } = useActiveDiet();
  const [selectedPreset, setSelectedPreset] = useState<DietPreset | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);

  const handleStarted = () => {
    refresh();
    DeviceEventEmitter.emit('nutrition:dirty');
  };

  const handleStop = () => {
    refresh();
    DeviceEventEmitter.emit('nutrition:dirty');
  };

  if (loading) {
    return (
      <View style={styles.flex}>
        <ActivityIndicator style={{ flex: 1 }} color="#007AFF" />
      </View>
    );
  }

  if (plan && plan.status === 'active') {
    return (
      <ActiveDietScreen plan={plan} onApply={apply} onStopConfirm={stop} onStop={handleStop} />
    );
  }

  return (
    <>
      <DietOnboardingScreen
        onSelectPreset={(preset) => {
          setSelectedPreset(preset);
          setDetailVisible(true);
        }}
        onAiGenerate={() => setWizardVisible(true)}
      />
      <PresetDetailScreen
        preset={selectedPreset}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onStarted={handleStarted}
      />
      <AiPlanWizardScreen
        visible={wizardVisible}
        onClose={() => setWizardVisible(false)}
        onStarted={handleStarted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
