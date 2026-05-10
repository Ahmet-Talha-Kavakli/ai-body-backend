import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  LinearGradient as SkiaGradient,
  vec,
  Circle,
  Line as SkLine,
} from '@shopify/react-native-skia';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { SymbolView } from 'expo-symbols';
import { C, font } from '../../lib/theme';

export type DemandPoint = { date: string; rentals: number; views: number };

type Props = {
  series: DemandPoint[];
  last7: { rentals: number; views: number };
  delta: { rentals: number; views: number };
  height?: number;
};

const PADDING_X = 16;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 28;

export function DemandChart({ series, last7, delta, height = 200 }: Props) {
  const [tab, setTab] = useState(0); // 0 = rentals, 1 = views
  const [w, setW] = useState(0);
  const metric = tab === 0 ? 'rentals' : 'views';
  const values = useMemo(() => series.map((s) => s[metric]), [series, metric]);
  const max = Math.max(1, ...values);
  const last7Val = tab === 0 ? last7.rentals : last7.views;
  const deltaVal = tab === 0 ? delta.rentals : delta.views;

  const innerW = Math.max(0, w - PADDING_X * 2);
  const innerH = height - PADDING_TOP - PADDING_BOTTOM;

  const points = useMemo(() => {
    if (values.length < 2 || innerW <= 0) return [] as Array<{ x: number; y: number }>;
    return values.map((v, i) => ({
      x: PADDING_X + (i / (values.length - 1)) * innerW,
      y: PADDING_TOP + innerH - (v / max) * innerH,
    }));
  }, [values, innerW, innerH, max]);

  const linePath = useMemo(() => {
    if (points.length < 2) return null;
    const first = points[0];
    if (!first) return null;
    const p = Skia.Path.Make();
    p.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const cur = points[i]!;
      const cx = (prev.x + cur.x) / 2;
      p.cubicTo(cx, prev.y, cx, cur.y, cur.x, cur.y);
    }
    return p;
  }, [points]);

  const fillPath = useMemo(() => {
    if (!linePath || points.length < 2) return null;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const p = linePath.copy();
    p.lineTo(last.x, PADDING_TOP + innerH);
    p.lineTo(first.x, PADDING_TOP + innerH);
    p.close();
    return p;
  }, [linePath, points, innerH]);

  // Reveal animasyonu
  const reveal = useRef(new Animated.Value(0)).current;
  const [revealVal, setRevealVal] = useState(0);
  useEffect(() => {
    const id = reveal.addListener(({ value }) => setRevealVal(value));
    return () => reveal.removeListener(id);
  }, [reveal]);
  useEffect(() => {
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: 1100,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start();
  }, [tab, reveal]);

  const lastPt = points[points.length - 1];
  const visibleX = lastPt ? PADDING_X + (lastPt.x - PADDING_X) * revealVal : 0;

  const deltaUp = deltaVal > 0;
  const deltaFlat = deltaVal === 0;
  const deltaColor = deltaFlat ? C.textMuted : deltaUp ? C.success : C.danger;
  const deltaIcon = deltaFlat ? 'minus' : deltaUp ? 'arrow.up.right' : 'arrow.down.right';

  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          marginBottom: 12,
        }}
      >
        <View>
          <Text style={{ fontFamily: font.medium, fontSize: 13, color: C.textMuted }}>
            Son 7 gün
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <Text
              style={{
                fontFamily: font.extrabold,
                fontSize: 28,
                color: C.text,
                letterSpacing: -0.5,
              }}
            >
              {last7Val}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <SymbolView name={deltaIcon as any} tintColor={deltaColor} size={12} />
              <Text style={{ fontFamily: font.semibold, fontSize: 13, color: deltaColor }}>
                {deltaFlat ? '0%' : `${deltaUp ? '+' : ''}${deltaVal}%`}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ width: 156 }}>
          <SegmentedControl
            values={['Kira', 'Görüntülenme']}
            selectedIndex={tab}
            onChange={(e) => setTab(e.nativeEvent.selectedSegmentIndex)}
            style={{ height: 30 }}
          />
        </View>
      </View>

      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height, paddingHorizontal: 12 }}
      >
        {w > 0 && linePath && fillPath && lastPt && (
          <Canvas style={{ width: w - 24, height }}>
            {/* Y ekseni hairline */}
            <SkLine
              p1={vec(PADDING_X, PADDING_TOP + innerH)}
              p2={vec(PADDING_X + innerW, PADDING_TOP + innerH)}
              color={C.hairline}
              strokeWidth={1}
            />
            {/* Fill */}
            <Path path={fillPath}>
              <SkiaGradient
                start={vec(0, PADDING_TOP)}
                end={vec(0, PADDING_TOP + innerH)}
                colors={[C.accent + '55', C.accent + '00']}
              />
            </Path>
            {/* Line */}
            <Path
              path={linePath}
              style="stroke"
              strokeWidth={2.5}
              color={C.accent}
              strokeJoin="round"
              strokeCap="round"
            />
            {/* Last point pulse */}
            <Circle cx={lastPt.x} cy={lastPt.y} r={6} color={C.accent + '33'} />
            <Circle cx={lastPt.x} cy={lastPt.y} r={3.5} color={C.accent} />
            {/* Reveal mask — sağdan boşluk */}
            {revealVal < 1 && (
              <Path
                path={(() => {
                  const m = Skia.Path.Make();
                  m.addRect({
                    x: visibleX,
                    y: 0,
                    width: w - 24 - visibleX + 1,
                    height,
                  });
                  return m;
                })()}
                color={C.card}
              />
            )}
          </Canvas>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginTop: -2,
        }}
      >
        <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textDim }}>
          30 gün önce
        </Text>
        <Text style={{ fontFamily: font.regular, fontSize: 11, color: C.textDim }}>Bugün</Text>
      </View>
    </View>
  );
}
