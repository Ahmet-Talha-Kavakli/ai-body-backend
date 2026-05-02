/**
 * AnimatedDrinkBottle — DrinkBottle wrapper'ı (splashTrigger pass-through).
 *
 * Sıvı dalgalanması ve splash efekti DrinkBottles.tsx içindeki WavyLiquid
 * (RAF tabanlı SVG path animasyonu) tarafından yönetilir. Bu bileşen sadece
 * splashTrigger prop'unu geçirir ve kap kompozisyonunun ortak sarmalayıcısı
 * olarak kullanılır.
 */

import React from 'react';
import { View } from 'react-native';
import { DrinkBottle, type BottleProps } from './DrinkBottles';

export interface AnimatedBottleProps extends BottleProps {
  splashTrigger?: number;
}

export function AnimatedDrinkBottle({
  kind,
  fillLevel,
  liquidColor,
  ghost,
  width = 60,
  height = 130,
  splashTrigger = 0,
}: AnimatedBottleProps) {
  return (
    <View style={{ width, height }}>
      <DrinkBottle
        kind={kind}
        fillLevel={ghost ? 0 : fillLevel}
        liquidColor={liquidColor}
        ghost={ghost}
        width={width}
        height={height}
        splashTrigger={splashTrigger}
      />
    </View>
  );
}
