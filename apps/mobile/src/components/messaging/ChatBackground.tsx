/**
 * V4.5 — WhatsApp tarzı sohbet arka planı
 *
 * Krem zemin + soluk doodle pattern (yapraklar, daireler, kalpler).
 * SVG tile ile tekrarlanır — performanslı ve ölçeklenebilir.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';

const BG_COLOR = '#ECE5DD'; // klasik WhatsApp krem
const PATTERN_COLOR = '#D9D2C8'; // zeminden 1 ton koyu, soluk desen

export function ChatBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      <Svg
        style={StyleSheet.absoluteFill}
        // @ts-ignore expo-svg width/height number/string ikisini de kabul eder
        width="100%"
        height="100%"
      >
        <Defs>
          <Pattern id="doodle" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* Yaprak */}
            <Path d="M20 30 Q30 10 40 30 Q30 50 20 30 Z" fill={PATTERN_COLOR} opacity="0.6" />
            {/* Küçük daire */}
            <Path
              d="M75 25 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0"
              fill={PATTERN_COLOR}
              opacity="0.5"
            />
            {/* Çizgi */}
            <Path
              d="M95 60 L105 70"
              stroke={PATTERN_COLOR}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* Kalp */}
            <Path
              d="M30 80 C25 75 18 78 22 86 L30 94 L38 86 C42 78 35 75 30 80 Z"
              fill={PATTERN_COLOR}
              opacity="0.45"
            />
            {/* Üçgen */}
            <Path
              d="M70 90 L80 105 L60 105 Z"
              fill="none"
              stroke={PATTERN_COLOR}
              strokeWidth="1.5"
              opacity="0.5"
            />
            {/* Küçük yıldız */}
            <Path
              d="M100 100 L102 106 L108 106 L103 110 L105 116 L100 112 L95 116 L97 110 L92 106 L98 106 Z"
              fill={PATTERN_COLOR}
              opacity="0.4"
            />
          </Pattern>
        </Defs>
        <G>
          <Rect x="0" y="0" width="100%" height="100%" fill={BG_COLOR} />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#doodle)" />
        </G>
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
});
