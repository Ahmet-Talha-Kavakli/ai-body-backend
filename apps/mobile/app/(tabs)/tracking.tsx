import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  {
    key: 'antrenman',
    label: 'Antrenman',
    subtitle: 'Egzersiz & seans',
    icon: require('../../assets/icons/antrenman.png'),
    color: '#30D158',
    bg: '#E8FAF0',
    route: '/(app)/tracking/antrenman',
  },
  {
    key: 'su',
    label: 'Su / İçecek',
    subtitle: 'Günlük hidrasyon',
    icon: require('../../assets/icons/su.png'),
    color: '#0A84FF',
    bg: '#E5F2FF',
    route: '/(app)/tracking/su',
  },
  {
    key: 'beslenme',
    label: 'Beslenme',
    subtitle: 'Kalori & makro',
    icon: require('../../assets/icons/kalori.png'),
    color: '#FF9F0A',
    bg: '#FFF4E0',
    route: '/(app)/tracking/beslenme',
  },
  {
    key: 'uyku',
    label: 'Uyku',
    subtitle: 'Uyku kalitesi & süre',
    icon: require('../../assets/icons/uyku.png'),
    color: '#BF5AF2',
    bg: '#F5E8FF',
    route: '/(app)/tracking/uyku',
  },
  {
    key: 'vucut',
    label: 'Vücut',
    subtitle: 'Kilo & ölçüler',
    icon: require('../../assets/icons/vucut-erkek.png'),
    color: '#00C7BE',
    bg: '#E0FAF9',
    route: '/(app)/tracking/vucut',
  },
  {
    key: 'saglik',
    label: 'Sağlık',
    subtitle: 'İlaç & sağlık metrikleri',
    icon: require('../../assets/icons/saglik.png'),
    color: '#FF453A',
    bg: '#FFE8E7',
    route: '/(app)/tracking/saglik',
  },
  {
    key: 'aktivite',
    label: 'Aktiviteler',
    subtitle: 'Kardiyo, sauna & daha fazlası',
    icon: require('../../assets/icons/aktivite.png'),
    color: '#34C759',
    bg: '#E8FAF0',
    route: '/(app)/tracking/aktivite',
  },
  {
    key: 'supplement',
    label: 'Supplement / Vitamin',
    subtitle: 'Takviye & vitamin takibi',
    icon: require('../../assets/icons/supplements/capsule-holographic.png'),
    color: '#AF52DE',
    bg: '#F5E8FF',
    route: '/(app)/tracking/supplement',
  },
  {
    key: 'diyet',
    label: 'Diyet Planı',
    subtitle: 'Beslenme planı & günlük menü',
    icon: require('../../assets/icons/kalori.png'),
    color: '#FF6347',
    bg: '#FFF0ED',
    route: '/(app)/tracking/diyet',
  },
] as const;

function SectionCard({ item }: { item: (typeof SECTIONS)[number] }) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(item.route as never)}>
      {({ pressed }) => (
        <View
          style={[
            st.card,
            { backgroundColor: item.bg, borderLeftColor: item.color, borderLeftWidth: 4 },
            pressed && { opacity: 0.75 },
          ]}
        >
          <View style={[st.iconWrap, { backgroundColor: '#fff' }]}>
            <Image source={item.icon} style={st.icon} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.cardLabel, { color: '#1C1C1E' }]}>{item.label}</Text>
            <Text style={st.cardSub}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
        </View>
      )}
    </Pressable>
  );
}

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={st.root}>
      <ScrollView
        contentContainerStyle={[st.scroll, { paddingTop: insets.top + 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={st.header}>
          <Text style={st.title}>Takip</Text>
          <Text style={st.subtitle}>Sağlık verilerini takip et</Text>
        </View>

        <View style={st.list}>
          {SECTIONS.map((item) => (
            <SectionCard key={item.key} item={item} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  title: { color: '#1C1C1E', fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { color: '#8E8E93', fontSize: 15, marginTop: 4 },

  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  icon: { width: 38, height: 38 },
  cardLabel: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  cardSub: { color: '#636366', fontSize: 13, marginTop: 2 },
});
