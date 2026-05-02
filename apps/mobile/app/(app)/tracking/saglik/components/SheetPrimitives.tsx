import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SHEET_TOKENS } from './SheetShell';
import { DatePickerSheet } from '../../../../../components/shared/DateTimePickerSheets';

const { ACCENT, TEXT, SUBTEXT, BG, CARD, SEPARATOR } = SHEET_TOKENS;

const EASE_SPRING = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_MICRO = Easing.bezier(0.4, 0, 0.2, 1);

const LAYOUT_EXPAND = {
  duration: 240,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
} as const;

// ─── Outer page background ───────────────────────────────────────────────────
export function SheetBody({ children }: { children: React.ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

// ─── Section (caption + grouped card container) ──────────────────────────────
export function Section({
  caption,
  children,
  first,
}: {
  caption?: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  // Filter falsy children so separators only render between real rows.
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.section, first && { marginTop: 12 }]}>
      {caption ? (
        <Text allowFontScaling={false} style={styles.caption}>
          {caption}
        </Text>
      ) : null}
      <View style={styles.group}>
        {items.map((child, i) => (
          <React.Fragment key={i}>
            {child}
            {i < items.length - 1 ? <View style={styles.separator} /> : null}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ─── Row press highlight wrapper ─────────────────────────────────────────────
function PressableRow({
  onPress,
  disabled,
  children,
  style,
}: {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: any;
}) {
  const bg = useRef(new Animated.Value(0)).current;
  const inn = () =>
    Animated.timing(bg, {
      toValue: 1,
      duration: 80,
      useNativeDriver: false,
      easing: EASE_MICRO,
    }).start();
  const outt = () =>
    Animated.timing(bg, {
      toValue: 0,
      duration: 140,
      useNativeDriver: false,
      easing: EASE_SPRING,
    }).start();

  const bgColor = bg.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.06)'],
  });

  if (!onPress) {
    return <View style={[styles.row, style]}>{children}</View>;
  }

  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={inn} onPressOut={outt}>
      <Animated.View style={[styles.row, { backgroundColor: bgColor }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── TextField row ───────────────────────────────────────────────────────────
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
}) {
  return (
    <View style={styles.row}>
      <Text allowFontScaling={false} style={styles.rowLabel}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        allowFontScaling={false}
        style={styles.rowInput}
      />
    </View>
  );
}

// ─── MultilineTextField row ──────────────────────────────────────────────────
export function MultilineTextField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.multilineRow}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        multiline
        allowFontScaling={false}
        style={styles.multilineInput}
        textAlignVertical="top"
      />
    </View>
  );
}

// ─── PickerRow (inline expand) ───────────────────────────────────────────────
type PickerOption<T extends string> = {
  value: T;
  label: string;
  icon?: string;
};

export function PickerRow<T extends string>({
  label,
  value,
  options,
  onChange,
  expanded,
  onToggle,
  renderValue,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<PickerOption<T>>;
  onChange: (v: T) => void;
  expanded: boolean;
  onToggle: () => void;
  renderValue?: (opt: PickerOption<T> | undefined) => React.ReactNode;
}) {
  const selected = options.find((o) => o.value === value);
  const chevronAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
      easing: EASE_SPRING,
    }).start();
  }, [expanded, chevronAnim]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const handleToggle = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LAYOUT_EXPAND);
    onToggle();
  };

  return (
    <View>
      <PressableRow onPress={handleToggle}>
        <Text allowFontScaling={false} style={styles.rowLabel}>
          {label}
        </Text>
        <View style={styles.rowRight}>
          {renderValue ? (
            renderValue(selected)
          ) : (
            <Text allowFontScaling={false} style={styles.rowValue} numberOfLines={1}>
              {selected?.icon ? `${selected.icon} ` : ''}
              {selected?.label ?? ''}
            </Text>
          )}
          <Animated.Text
            allowFontScaling={false}
            style={[styles.chevron, { transform: [{ rotate: chevronRotate }] }]}
          >
            ›
          </Animated.Text>
        </View>
      </PressableRow>

      {expanded ? (
        <View style={styles.expandArea}>
          <View style={styles.pillWrap}>
            {options.map((o) => (
              <PickerPill
                key={o.value}
                label={o.label}
                icon={o.icon}
                active={o.value === value}
                onPress={() => {
                  Haptics.selectionAsync();
                  LayoutAnimation.configureNext(LAYOUT_EXPAND);
                  onChange(o.value);
                  onToggle();
                }}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PickerPill({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const inn = () =>
    Animated.timing(scale, {
      toValue: 0.94,
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
    <Pressable onPress={onPress} onPressIn={inn} onPressOut={outt}>
      <Animated.View
        style={[
          styles.pill,
          active && { backgroundColor: ACCENT + '14', borderColor: ACCENT },
          { transform: [{ scale }] },
        ]}
      >
        {icon ? (
          <Text allowFontScaling={false} style={styles.pillIcon}>
            {icon}
          </Text>
        ) : null}
        <Text
          allowFontScaling={false}
          style={[styles.pillText, active && { color: ACCENT, fontWeight: '600' }]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── ToggleRow ───────────────────────────────────────────────────────────────
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text allowFontScaling={false} style={styles.toggleLabel}>
          {label}
        </Text>
        {description ? (
          <Text allowFontScaling={false} style={styles.toggleDesc}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onValueChange(v);
        }}
        trackColor={{ true: '#34C759', false: '#E5E5EA' }}
        ios_backgroundColor="#E5E5EA"
      />
    </View>
  );
}

// ─── Helpers: tarih formatı ──────────────────────────────────────────────────
const MONTHS_TR_SHORT = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

function parseISODate(s?: string): Date {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function formatNice(d: Date): string {
  return `${d.getDate()} ${MONTHS_TR_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
function isToday(d: Date): boolean {
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

// ─── DateRow (display + native wheel picker) ─────────────────────────────────
export function DateRow({
  label,
  value,
  onChange,
  badge,
}: {
  label: string;
  value: string; // YYYY-MM-DD
  onChange?: (iso: string) => void;
  badge?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = parseISODate(value);
  const computedBadge = badge ?? (isToday(date) ? 'Bugün' : undefined);

  return (
    <>
      <PressableRow onPress={onChange ? () => setOpen(true) : undefined}>
        <Text allowFontScaling={false} style={styles.rowLabel}>
          {label}
        </Text>
        <View style={styles.rowRight}>
          <Text allowFontScaling={false} style={styles.rowValue} numberOfLines={1}>
            {formatNice(date)}
          </Text>
          {computedBadge ? (
            <View style={styles.dateBadge}>
              <Text allowFontScaling={false} style={styles.dateBadgeText}>
                {computedBadge}
              </Text>
            </View>
          ) : null}
        </View>
      </PressableRow>
      {onChange && (
        <DatePickerSheet
          visible={open}
          date={date}
          title={label}
          onClose={() => setOpen(false)}
          onChange={(d: Date) => onChange(toISODate(d))}
        />
      )}
    </>
  );
}

// ─── DateField (Apple-style sağ-tarafta tarih, picker açar) ──────────────────
export function DateField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string; // YYYY-MM-DD
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const date = parseISODate(value);
  const today = isToday(date);

  return (
    <>
      <PressableRow onPress={() => setOpen(true)}>
        <Text allowFontScaling={false} style={styles.rowLabel}>
          {label}
        </Text>
        <View style={styles.rowRight}>
          <Text allowFontScaling={false} style={styles.rowValue} numberOfLines={1}>
            {formatNice(date)}
          </Text>
          {today ? (
            <View style={styles.dateBadge}>
              <Text allowFontScaling={false} style={styles.dateBadgeText}>
                Bugün
              </Text>
            </View>
          ) : null}
        </View>
      </PressableRow>
      <DatePickerSheet
        visible={open}
        date={date}
        title={label}
        onClose={() => setOpen(false)}
        onChange={(d) => onChangeText(toISODate(d))}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: BG,
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
  group: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEPARATOR,
    marginLeft: 16,
  },

  // Row base
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 17,
    color: TEXT,
    letterSpacing: -0.4,
    fontWeight: '400',
    flexShrink: 0,
  },
  rowInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 17,
    color: TEXT,
    letterSpacing: -0.4,
    textAlign: 'right',
    paddingVertical: 0,
  },
  rowRight: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  rowValue: {
    fontSize: 17,
    color: SUBTEXT,
    letterSpacing: -0.4,
    maxWidth: 200,
  },
  chevron: {
    fontSize: 22,
    color: '#C7C7CC',
    fontWeight: '400',
    marginLeft: 2,
    marginTop: -2,
  },

  // Toggle
  toggleLabel: {
    fontSize: 17,
    color: TEXT,
    letterSpacing: -0.4,
  },
  toggleDesc: {
    fontSize: 13,
    color: SUBTEXT,
    letterSpacing: -0.08,
    marginTop: 2,
  },

  // Multiline
  multilineRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 96,
  },
  multilineInput: {
    fontSize: 17,
    color: TEXT,
    letterSpacing: -0.4,
    minHeight: 72,
    padding: 0,
  },

  // Expand area (inline picker)
  expandArea: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SEPARATOR,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT,
    letterSpacing: -0.1,
  },

  // Date badge
  dateBadge: {
    backgroundColor: ACCENT + '14',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  dateBadgeText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
  },
});
