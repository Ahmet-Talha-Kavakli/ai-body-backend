import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SheetShell, SHEET_TOKENS } from './SheetShell';
import { SheetBody, Section, PickerRow, DateRow, MultilineTextField } from './SheetPrimitives';
import {
  REGION_MARK_TYPES,
  SEVERITY_LABELS,
  type RegionMarkPayload,
  type RegionMarkType,
  type Severity,
} from './types';

const { ACCENT, TEXT, SUBTEXT, BG, CARD, SEPARATOR } = SHEET_TOKENS;
const SEV_COLORS = ['#FFD60A', '#FF9F0A', '#FF3B30', '#FF1744'] as const;

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Animated severity tile ───────────────────────────────────────────────────
function SevTile({
  level,
  active,
  onPress,
}: {
  level: Severity;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const color = SEV_COLORS[level - 1];

  const inn = () =>
    Animated.timing(scale, {
      toValue: 0.92,
      duration: 90,
      useNativeDriver: true,
      easing: EASE_MICRO,
    }).start();
  const outt = () =>
    Animated.timing(scale, {
      toValue: 1,
      duration: 130,
      useNativeDriver: true,
      easing: EASE_SPRING,
    }).start();

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={inn}
      onPressOut={outt}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.sevTile,
          active && { backgroundColor: color, borderColor: color },
          { transform: [{ scale }] },
        ]}
      >
        <View style={[styles.sevDot, { backgroundColor: active ? '#FFFFFF' : color }]} />
        <Text
          allowFontScaling={false}
          style={[styles.sevText, active && { color: '#FFFFFF', fontWeight: '700' }]}
        >
          {SEVERITY_LABELS[level]}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  regionLabel: string;
  side?: 'left' | 'right';
  onClose: () => void;
  onSave: (payload: RegionMarkPayload) => void;
};

export function RegionMarkSheet({ visible, regionLabel, side, onClose, onSave }: Props) {
  const [type, setType] = useState<RegionMarkType>('pain');
  const [severity, setSeverity] = useState<Severity>(1);
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayKey());

  const sidePrefix = side === 'left' ? 'Sol ' : side === 'right' ? 'Sağ ' : '';
  const headerTitle = `${sidePrefix}${regionLabel}`.trim();

  const reset = () => {
    setType('pain');
    setSeverity(1);
    setNote('');
    setExpanded(null);
    setStartDate(todayKey());
  };

  const handleClose = () => {
    reset();
    onClose();
  };
  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave({ type, severity, startDate, note: note.trim() || undefined });
    reset();
  };

  const typeOptions = REGION_MARK_TYPES.map((t) => ({ value: t.id, label: t.label }));

  return (
    <SheetShell visible={visible} title={headerTitle} onClose={handleClose} onSave={handleSave}>
      <SheetBody>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Section caption="TÜR" first>
            <PickerRow
              label="Tür"
              value={type}
              options={typeOptions}
              onChange={setType}
              expanded={expanded === 'type'}
              onToggle={() => setExpanded((p) => (p === 'type' ? null : 'type'))}
            />
          </Section>

          {/* ŞİDDET — bespoke 4-tile row inside grouped container */}
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.caption}>
              ŞİDDET
            </Text>
            <View style={styles.sevGroup}>
              <View style={styles.sevRow}>
                {([1, 2, 3, 4] as Severity[]).map((lvl) => (
                  <SevTile
                    key={lvl}
                    level={lvl}
                    active={severity === lvl}
                    onPress={() => setSeverity(lvl)}
                  />
                ))}
              </View>
            </View>
          </View>

          <Section caption="TARİH">
            <DateRow label="Başlangıç" value={startDate} onChange={setStartDate} />
          </Section>

          <Section caption="NOT">
            <MultilineTextField
              value={note}
              onChangeText={setNote}
              placeholder="İsteğe bağlı not ekle"
            />
          </Section>
        </ScrollView>
      </SheetBody>
    </SheetShell>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },

  section: {
    marginTop: 28,
  },
  caption: {
    fontSize: 11,
    fontWeight: '700',
    color: SUBTEXT,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: 32,
    marginRight: 32,
    marginBottom: 6,
  },

  // Severity group container
  sevGroup: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
  },
  sevRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sevTile: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  sevDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sevText: {
    fontSize: 12,
    fontWeight: '500',
    color: TEXT,
    letterSpacing: -0.08,
  },
});
