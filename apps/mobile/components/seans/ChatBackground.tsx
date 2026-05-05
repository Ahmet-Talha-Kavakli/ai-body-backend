/**
 * ChatBackground — V3 Faz B
 *
 * Sohbet ekranı arka planı: soft mor gradient + WhatsApp tarzı doodle pattern.
 * Mesajları gölgelemeyecek kadar hafif (~3% opacity), tile edilmiş ikonlar.
 *
 * V4: kullanıcı temaları, karaktere/mood'a göre değişen arka plan.
 */

import { Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// Doodle path'leri (24x24 viewBox'ta normalize)
const DOODLES = [
  // Kalp
  'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  // Konuşma balonu
  'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  // Yıldız
  'M12 2l3 7 7 .7-5.3 4.7 1.6 7.1L12 17.7l-6.3 3.8 1.6-7.1L2 9.7 9 9z',
  // Kahve
  'M3 10h14v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-6zm14 1a3 3 0 1 1 0 6V11zM6 4l1-2m4 2l1-2m4 2l1-2',
  // Müzik notası
  'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  // Hilal/ay
  'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  // Kitap
  'M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4zm16 0h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7V4z',
  // Çiçek
  'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0-6v4m0 16v4M2 12h4m12 0h4M5 5l3 3m8 8l3 3M5 19l3-3m8-8l3-3',
  // Çay/sıcak
  'M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8zm12 1a3 3 0 0 1 0 6M8 4l1-2m3 2l1-2',
  // Saat
  'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-15v6l4 2',
];

// Tile boyutu — pattern repeat density
const TILE = 110;

interface DoodleSpot {
  x: number;
  y: number;
  d: string; // path
  size: number;
  rot: number;
}

// Deterministic spot üretimi (her render aynı pozisyon — performans + tutarlılık)
function buildSpots(): DoodleSpot[] {
  const spots: DoodleSpot[] = [];
  const cols = Math.ceil(W / TILE) + 1;
  const rows = Math.ceil(H / TILE) + 1;
  // Basit hash — col*row index'inden deterministic koordinat ve doodle
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = r * 100 + c * 7;
      const dIdx = seed % DOODLES.length;
      const jitterX = ((seed * 31) % 60) - 30;
      const jitterY = ((seed * 17) % 60) - 30;
      const rot = (seed * 11) % 360;
      const size = 14 + ((seed * 5) % 10); // 14-24px
      spots.push({
        x: c * TILE + TILE / 2 + jitterX,
        y: r * TILE + TILE / 2 + jitterY,
        d: DOODLES[dIdx]!,
        size,
        rot,
      });
    }
  }
  return spots;
}

const SPOTS = buildSpots();

export function ChatBackground() {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <LinearGradient
        colors={['#F2EFFE', '#EAE6FB', '#F2EFFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg width={W} height={H} style={{ position: 'absolute' }}>
        <G opacity={0.1}>
          {SPOTS.map((s, i) => {
            const scale = s.size / 24;
            return (
              <Path
                key={i}
                d={s.d}
                fill="#5E5CE6"
                transform={`translate(${s.x - s.size / 2} ${s.y - s.size / 2}) rotate(${s.rot} ${s.size / 2} ${s.size / 2}) scale(${scale})`}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
