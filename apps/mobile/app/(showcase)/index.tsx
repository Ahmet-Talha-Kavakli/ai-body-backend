// Dev-only screen — hidden in production via feature flag (M5)
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaWrapper } from '../../src/design-system/primitives/SafeAreaWrapper';
import { DSText } from '../../src/design-system/primitives/Text';
import { Stack } from '../../src/design-system/primitives/Stack';
import { spacing } from '../../src/design-system/tokens/spacing';
import { Button } from '../../src/design-system/components/Button';
import { Card } from '../../src/design-system/components/Card';
import { Badge } from '../../src/design-system/components/Badge';
import { Skeleton } from '../../src/design-system/components/Skeleton';
import { EmptyState } from '../../src/design-system/components/EmptyState';
import { LoadingSpinner } from '../../src/design-system/components/LoadingSpinner';
import { DSTextInput } from '../../src/design-system/components/TextInput';
import { DSSwitch } from '../../src/design-system/components/Switch';
import { ReadinessRing } from '../../src/design-system/hero/ReadinessRing';
import { PetWidget } from '../../src/design-system/hero/PetWidget';
import { AIMessage } from '../../src/design-system/hero/AIMessage';
import { StreakIndicator } from '../../src/design-system/hero/StreakIndicator';
import { XPBar } from '../../src/design-system/hero/XPBar';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing[3] }}>
      <DSText variant="title3">{title}</DSText>
      {children}
    </View>
  );
}

export default function ShowcaseScreen() {
  const [switchVal, setSwitchVal] = React.useState(false);
  const [inputVal, setInputVal] = React.useState('');

  return (
    <SafeAreaWrapper>
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[8] }}>
        <Section title="Buttons">
          <Stack gap={3}>
            <Button label="Primary" onPress={() => {}} variant="primary" />
            <Button label="Secondary" onPress={() => {}} variant="secondary" />
            <Button label="Ghost" onPress={() => {}} variant="ghost" />
            <Button label="Danger" onPress={() => {}} variant="danger" />
            <Button label="AI" onPress={() => {}} variant="ai" />
            <Button label="Loading..." onPress={() => {}} loading />
            <Button label="Disabled" onPress={() => {}} disabled />
          </Stack>
        </Section>

        <Section title="Cards & Badges">
          <Card>
            <DSText>Default card content</DSText>
          </Card>
          <Card elevated>
            <DSText>Elevated card</DSText>
          </Card>
          <Stack direction="row" gap={2} wrap>
            {(['default', 'success', 'warning', 'danger', 'accent'] as const).map((v) => (
              <Badge key={v} label={v} variant={v} />
            ))}
          </Stack>
        </Section>

        <Section title="Skeleton & Loading">
          <Skeleton width="100%" height={60} />
          <Skeleton width={200} height={20} />
          <LoadingSpinner />
        </Section>

        <Section title="Input">
          <DSTextInput
            label="İsim"
            placeholder="Adını gir"
            value={inputVal}
            onChangeText={setInputVal}
          />
          <DSTextInput
            label="Hatalı alan"
            placeholder="x"
            value=""
            onChangeText={() => {}}
            error="Bu alan zorunlu"
          />
          <DSSwitch value={switchVal} onValueChange={setSwitchVal} />
        </Section>

        <Section title="Empty State">
          <EmptyState title="Henüz veri yok" subtitle="İlk antrenmanını ekle" />
        </Section>

        <Section title="Hero — ReadinessRing">
          <Stack direction="row" gap={5} justify="center">
            <ReadinessRing score={92} />
            <ReadinessRing score={65} />
            <ReadinessRing score={35} />
          </Stack>
        </Section>

        <Section title="Hero — Pet">
          <Stack direction="row" gap={4} justify="center">
            {(['happy', 'sad', 'energetic', 'tired'] as const).map((m) => (
              <PetWidget key={m} mood={m} size={48} />
            ))}
          </Stack>
        </Section>

        <Section title="Hero — AI Message">
          <AIMessage message="Bugün uyku skoru düşük. Antrenman yoğunluğunu %20 azaltıyorum." />
        </Section>

        <Section title="Hero — Streak + XP">
          <StreakIndicator days={21} />
          <XPBar currentXP={450} level={3} />
        </Section>
      </ScrollView>
    </SafeAreaWrapper>
  );
}
