import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { font, SLEEP } from '../_components/theme';
import { useSleepFonts } from '../_components/useSleepFonts';

export default function ToolPlaceholder({
  title,
  emoji,
  icon,
  tint,
  bg,
  comingSoon = 'Yakında',
}: {
  title: string;
  emoji: string;
  icon: string;
  tint: string;
  bg: string;
  comingSoon?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fontsLoaded = useSleepFonts();

  if (!fontsLoaded) return <View style={st.root} />;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={st.header}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={st.backBtn}>
          <SymbolView
            name="chevron.left"
            size={20}
            tintColor={SLEEP.text}
            fallback={<Text>‹</Text>}
          />
        </Pressable>
        <Text style={st.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <View style={st.center}>
        <View style={[st.iconHero, { backgroundColor: bg }]}>
          <SymbolView
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={icon as any}
            size={48}
            tintColor={tint}
            fallback={<Text style={{ fontSize: 44 }}>{emoji}</Text>}
          />
        </View>
        <Text style={st.title}>{title}</Text>
        <Text style={st.sub}>{comingSoon}</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 17,
    color: SLEEP.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 80,
    gap: 18,
  },
  iconHero: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 32,
    color: SLEEP.text,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  sub: {
    fontFamily: font.regular,
    fontSize: 15,
    color: SLEEP.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
