// Dev-only screen — hidden in production via feature flag (M5)
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { StatCard } from '../../src/design-system/hero/StatCard';
import { CTAButton } from '../../src/design-system/hero/CTAButton';
import { SecondaryAction } from '../../src/design-system/hero/SecondaryAction';
import { MetricRow } from '../../src/design-system/hero/MetricRow';

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
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Back bar */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(84,84,88,0.4)',
        }}
      >
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as never))}
          hitSlop={16}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 70 }}
        >
          <Ionicons name="chevron-back" size={22} color="#30D158" />
          <Text style={{ color: '#30D158', fontSize: 16, fontWeight: '600' }}>Geri</Text>
        </Pressable>
        <Text
          style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 15, fontWeight: '700' }}
        >
          Design System
        </Text>
        <View style={{ minWidth: 70 }} />
      </View>
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

          <Section title="Hero — Stat Cards">
            <Stack direction="row" gap={3}>
              <StatCard
                icon="water-outline"
                label="Su"
                value="1.8"
                unit="L"
                progress={0.72}
                color="#0A84FF"
              />
              <StatCard
                icon="flame-outline"
                label="Kalori"
                value="1240"
                unit="kcal"
                progress={0.56}
                color="#FF9F0A"
              />
            </Stack>
            <Stack direction="row" gap={3}>
              <StatCard
                icon="moon-outline"
                label="Uyku"
                value="7.5"
                unit="sa"
                progress={0.94}
                color="#BF5AF2"
              />
              <StatCard
                icon="barbell-outline"
                label="Antrenman"
                value="1"
                unit="seans"
                progress={1}
                color="#30D158"
              />
            </Stack>
          </Section>

          <Section title="Hero — CTA Buttons">
            <CTAButton
              label="Seans Başlat"
              subtitle="AI koçunla antrenman yap"
              icon="flash"
              color="#30D158"
            />
            <CTAButton
              label="Beslenme Ekle"
              subtitle="Öğün fotoğrafı veya manuel"
              icon="camera-outline"
              color="#0A84FF"
            />
            <CTAButton
              label="Su İçtim"
              subtitle="250ml eklendi"
              icon="water-outline"
              color="#BF5AF2"
            />
          </Section>

          <Section title="Hero — Secondary Actions">
            <SecondaryAction
              label="Yol Haritam"
              subtitle="Bu haftanın görevlerine bak"
              icon="map-outline"
              accentColor="#30D158"
            />
            <SecondaryAction
              label="Profil"
              subtitle="Hesap & sağlık bilgileri"
              icon="person-outline"
              accentColor="#0A84FF"
            />
          </Section>

          <Section title="Hero — Metric Row">
            <MetricRow
              items={[
                { icon: 'water-outline', label: 'Su', value: '1.8L', color: '#0A84FF' },
                { icon: 'flame-outline', label: 'Kalori', value: '1240', color: '#FF9F0A' },
                { icon: 'moon-outline', label: 'Uyku', value: '7.5s', color: '#BF5AF2' },
              ]}
            />
            <MetricRow
              items={[
                { icon: 'trending-up-outline', label: 'Haftalık', value: '4', color: '#30D158' },
                { icon: 'trophy-outline', label: 'Seri', value: '12g', color: '#FF9F0A' },
              ]}
            />
          </Section>
        </ScrollView>
      </SafeAreaWrapper>
    </View>
  );
}
