import { View, Text } from 'react-native';

const LABELS: Record<string, string> = {
  index: 'Ev',
  roadmap: 'Yol Haritası',
  sessions: 'Seans',
  tracking: 'Takip',
};

export default function Screen() {
  const name = 'roadmap';
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F5F5F7',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#1A1A2E', fontSize: 22, fontWeight: '700' }}>
        {LABELS[name] ?? name}
      </Text>
      <Text style={{ color: '#94A3B8', marginTop: 8, fontSize: 14 }}>Coming soon</Text>
    </View>
  );
}
