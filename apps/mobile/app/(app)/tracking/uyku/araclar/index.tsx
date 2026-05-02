import { useRef } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { font, SLEEP } from '../_components/theme';
import { useSleepFonts } from '../_components/useSleepFonts';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  fallback: string;
  gradientFrom: string;
  gradientTo: string;
  route: string;
}

// Featured (büyük üst kart)
const FEATURED: Tool = {
  id: 'ruya',
  name: 'Rüya Yorumcusu',
  description: 'Profesyonel AI ile sembolleri çöz',
  icon: 'moon.stars.fill',
  fallback: '🌙',
  gradientFrom: '#7D5FFF',
  gradientTo: '#5E5CE6',
  route: '/(app)/tracking/uyku/araclar/ruya',
};

// Diğer 4 araç (2x2 grid)
const TOOLS: Tool[] = [
  {
    id: 'sesler',
    name: 'Sesler',
    description: '30+ ambians',
    icon: 'speaker.wave.2.fill',
    fallback: '🌊',
    gradientFrom: '#0A84FF',
    gradientTo: '#0066CC',
    route: '/(app)/tracking/uyku/araclar/sesler',
  },
  {
    id: 'nefes',
    name: 'Nefes',
    description: '5 farklı pattern',
    icon: 'lungs.fill',
    fallback: '🫁',
    gradientFrom: '#5AC8FA',
    gradientTo: '#0A84FF',
    route: '/(app)/tracking/uyku/araclar/nefes',
  },
  {
    id: 'nabiz',
    name: 'Nabız',
    description: 'BPM + HRV ölçümü',
    icon: 'heart.fill',
    fallback: '❤️',
    gradientFrom: '#FF6482',
    gradientTo: '#FF3B30',
    route: '/(app)/tracking/uyku/araclar/nabiz',
  },
  {
    id: 'meditasyon',
    name: 'Meditasyon',
    description: '10 oturum, 5 kategori',
    icon: 'leaf.fill',
    fallback: '🧘',
    gradientFrom: '#5BD581',
    gradientTo: '#30D158',
    route: '/(app)/tracking/uyku/araclar/meditasyon',
  },
];

export default function AraclarScreen() {
  const fontsLoaded = useSleepFonts();
  const insets = useSafeAreaInsets();

  if (!fontsLoaded) return <View style={st.root} />;

  return (
    <ScrollView
      style={st.root}
      contentContainerStyle={[st.scroll, { paddingTop: insets.top + 8, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={st.title}>Araçlar</Text>
      <Text style={st.sub}>Daha iyi bir uyku için</Text>

      {/* Featured */}
      <View style={{ marginTop: 22 }}>
        <FeaturedCard tool={FEATURED} />
      </View>

      {/* 2x2 Grid */}
      <Text style={st.sectionLabel}>YARDIMCILAR</Text>
      <View style={st.grid}>
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured Card (büyük gradient hero)
// ─────────────────────────────────────────────────────────────────────────────

function FeaturedCard({ tool }: { tool: Tool }) {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.97,
          useNativeDriver: true,
          tension: 400,
          friction: 14,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(tool.route as never);
      }}
    >
      <Animated.View style={[featuredSt.outer, { transform: [{ scale }] }]}>
        {/* Skia gradient bg */}
        <View style={featuredSt.canvasWrap}>
          <Canvas style={StyleSheet.absoluteFill}>
            <RoundedRect x={0} y={0} width={W_GUESS} height={140} r={24}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(W_GUESS, 140)}
                colors={[tool.gradientFrom, tool.gradientTo]}
              />
            </RoundedRect>
          </Canvas>
        </View>

        {/* Decorative big icon (sağ üstte, blur'lu) */}
        <View style={featuredSt.bigIcon} pointerEvents="none">
          <SymbolView
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={tool.icon as any}
            size={120}
            tintColor="rgba(255,255,255,0.18)"
            fallback={<Text style={{ fontSize: 100, opacity: 0.18 }}>{tool.fallback}</Text>}
          />
        </View>

        {/* Content */}
        <View style={featuredSt.content}>
          <Text style={featuredSt.label}>YENİ • AI</Text>
          <Text style={featuredSt.title}>{tool.name}</Text>
          <Text style={featuredSt.desc}>{tool.description}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Card (2x2 grid)
// ─────────────────────────────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: Tool }) {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      style={cardSt.pressable}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.96,
          useNativeDriver: true,
          tension: 400,
          friction: 14,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 12,
        }).start()
      }
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(tool.route as never);
      }}
    >
      <Animated.View style={[cardSt.card, { transform: [{ scale }] }]}>
        {/* Gradient icon container — bigger, more visual */}
        <View style={cardSt.iconWrap}>
          <Canvas style={StyleSheet.absoluteFill}>
            <RoundedRect x={0} y={0} width={56} height={56} r={16}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(56, 56)}
                colors={[tool.gradientFrom, tool.gradientTo]}
              />
            </RoundedRect>
          </Canvas>
          <SymbolView
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name={tool.icon as any}
            size={26}
            tintColor="#fff"
            fallback={<Text style={{ fontSize: 22, color: '#fff' }}>{tool.fallback}</Text>}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={cardSt.name}>{tool.name}</Text>
          <Text style={cardSt.desc} numberOfLines={1}>
            {tool.description}
          </Text>
        </View>

        <SymbolView
          name="chevron.right"
          size={14}
          tintColor="#C7C7CC"
          fallback={<Text style={{ color: '#C7C7CC', fontSize: 18, fontWeight: '600' }}>›</Text>}
        />
      </Animated.View>
    </Pressable>
  );
}

// Featured kart genişliği (paddingHorizontal 18 × 2 düşülmüş)
const W_GUESS = Dimensions.get('window').width - 36;

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: SLEEP.page },
  scroll: { paddingHorizontal: 18 },
  title: { fontFamily: font.extrabold, fontSize: 32, color: SLEEP.text, letterSpacing: -0.7 },
  sub: { fontFamily: font.regular, fontSize: 14, color: SLEEP.textMuted, marginTop: 4 },
  sectionLabel: {
    fontFamily: font.bold,
    fontSize: 12,
    color: SLEEP.textDim,
    letterSpacing: 1.2,
    marginTop: 28,
    marginBottom: 12,
    paddingLeft: 4,
  },
  grid: { gap: 10 },
});

const featuredSt = StyleSheet.create({
  outer: {
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#5E5CE6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
  },
  canvasWrap: { ...StyleSheet.absoluteFillObject },
  bigIcon: { position: 'absolute', right: -10, top: -10 },
  content: { padding: 22, height: '100%', justifyContent: 'flex-end' },
  iconBubble: {
    position: 'absolute',
    top: 22,
    left: 22,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: font.bold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: font.extrabold,
    fontSize: 24,
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  desc: { fontFamily: font.medium, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
});

const cardSt = StyleSheet.create({
  pressable: {},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 18,
    backgroundColor: SLEEP.card,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  name: { fontFamily: font.bold, fontSize: 16, color: SLEEP.text, letterSpacing: -0.3 },
  desc: { fontFamily: font.regular, fontSize: 12, color: SLEEP.textMuted, marginTop: 3 },
});
