import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type MedIconName =
  | 'tablet'
  | 'kapsul'
  | 'surup'
  | 'damla'
  | 'sprey'
  | 'igne'
  | 'krem'
  | 'toz';

interface MedIconProps {
  name: MedIconName;
  size?: number;
  color?: string;
}

export function MedIcon({ name, size = 32, color = '#5E5CE6' }: MedIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {render(name, color)}
    </Svg>
  );
}

function render(name: MedIconName, color: string): React.ReactElement {
  switch (name) {
    /**
     * TABLET — yuvarlak hap, üstten görünüm
     * Dış halka + iç ayırıcı çizgi (bölünme hattı). İki daire ile kenar derinliği hissi.
     */
    case 'tablet':
      return (
        <>
          {/* Dış kenar */}
          <Circle cx="32" cy="32" r="20" fill={color} />
          {/* İç boşluk (negatif gibi görünen daha açık değil — silüet için orta çizgi) */}
          <Rect x="13" y="30.5" width="38" height="3" fill="#FFFFFF" opacity={0.85} />
        </>
      );

    /**
     * KAPSUL — yatay kapsül, iki yarım daire uçlu
     */
    case 'kapsul':
      return (
        <>
          {/* Gövde */}
          <Path
            d="M14 32 Q14 22 24 22 H40 Q50 22 50 32 Q50 42 40 42 H24 Q14 42 14 32 Z"
            fill={color}
          />
          {/* Orta ayrım çizgisi (yarım kapsül hissi) */}
          <Rect x="31" y="22" width="2" height="20" fill="#FFFFFF" opacity={0.7} />
        </>
      );

    /**
     * SURUP — şurup şişesi: kapak + boyun + dikdörtgen gövde + etiket çizgisi
     */
    case 'surup':
      return (
        <>
          {/* Kapak */}
          <Rect x="24" y="6" width="16" height="6" rx="1.5" fill={color} />
          {/* Boyun */}
          <Rect x="26" y="12" width="12" height="5" fill={color} />
          {/* Gövde */}
          <Path
            d="M19 19 Q19 17 21 17 H43 Q45 17 45 19 V53 Q45 56 42 56 H22 Q19 56 19 53 Z"
            fill={color}
          />
          {/* Etiket çizgisi */}
          <Rect x="22" y="32" width="20" height="10" fill="#FFFFFF" opacity={0.55} />
        </>
      );

    /**
     * DAMLA — klasik damla şekli (göz/kulak damlası)
     */
    case 'damla':
      return (
        <Path
          d="M32 6 Q32 6 33 8 Q42 22 46 34 Q50 46 42 53 Q36 58 32 58 Q28 58 22 53 Q14 46 18 34 Q22 22 31 8 Q32 6 32 6 Z"
          fill={color}
        />
      );

    /**
     * SPREY — sprey şişesi: tetik kapak (üstte yana çıkıntı) + alt silindir gövde
     */
    case 'sprey':
      return (
        <>
          {/* Tetik / nozzle */}
          <Path
            d="M22 8 H38 Q40 8 40 10 V14 H44 Q46 14 46 16 V20 Q46 22 44 22 H40 V24 Q40 26 38 26 H22 Q20 26 20 24 V10 Q20 8 22 8 Z"
            fill={color}
          />
          {/* Boyun */}
          <Rect x="25" y="26" width="14" height="4" fill={color} />
          {/* Gövde */}
          <Path
            d="M19 30 Q19 28 21 28 H43 Q45 28 45 30 V53 Q45 56 42 56 H22 Q19 56 19 53 Z"
            fill={color}
          />
        </>
      );

    /**
     * IGNE — şırınga: piston + gövde (uzun ince) + iğne ucu
     */
    case 'igne':
      return (
        <>
          {/* Piston tepe */}
          <Rect x="10" y="14" width="6" height="4" rx="1" fill={color} />
          {/* Piston kolu */}
          <Rect x="12" y="18" width="2" height="10" fill={color} />
          {/* Piston tabla */}
          <Rect x="9" y="28" width="8" height="3" fill={color} />
          {/* Şırınga gövdesi (yatay) */}
          <Path
            d="M17 26 H42 Q44 26 44 28 V36 Q44 38 42 38 H17 Q15 38 15 36 V28 Q15 26 17 26 Z"
            fill={color}
          />
          {/* Boyun */}
          <Rect x="44" y="30" width="4" height="4" fill={color} />
          {/* İğne ucu */}
          <Path d="M48 30 L58 31.2 L58 32.8 L48 34 Z" fill={color} />
        </>
      );

    /**
     * KREM — tüp (krem/merhem): vidalı kapak + omuzlu gövde + kapalı kıvrımlı taban
     */
    case 'krem':
      return (
        <>
          {/* Vidalı kapak */}
          <Rect x="26" y="6" width="12" height="9" rx="1.5" fill={color} />
          {/* Omuz */}
          <Path
            d="M22 15 H42 Q44 15 44 17 V19 Q44 21 42 21 H22 Q20 21 20 19 V17 Q20 15 22 15 Z"
            fill={color}
          />
          {/* Gövde */}
          <Path d="M21 21 H43 L41 52 Q40.8 55 38 55 H26 Q23.2 55 23 52 Z" fill={color} />
          {/* Kıvrımlı taban (preslenmiş) */}
          <Rect x="22" y="55" width="20" height="3" rx="1" fill={color} />
        </>
      );

    /**
     * TOZ — sachet/poşet: üstte yırtma çentikleri + dikdörtgen gövde
     */
    case 'toz':
      return (
        <>
          {/* Üst yırtma çentikleri (zigzag) */}
          <Path
            d="M16 12 L20 9 L24 12 L28 9 L32 12 L36 9 L40 12 L44 9 L48 12 V14 H16 Z"
            fill={color}
          />
          {/* Gövde */}
          <Path d="M16 14 H48 V54 Q48 56 46 56 H18 Q16 56 16 54 Z" fill={color} />
          {/* Etiket boşluğu */}
          <Rect x="22" y="28" width="20" height="14" fill="#FFFFFF" opacity={0.55} />
        </>
      );
  }
}

export const MED_ICON_NAMES: MedIconName[] = [
  'tablet',
  'kapsul',
  'surup',
  'damla',
  'sprey',
  'igne',
  'krem',
  'toz',
];

export const MED_ICON_LABELS_TR: Record<MedIconName, string> = {
  tablet: 'Tablet',
  kapsul: 'Kapsül',
  surup: 'Şurup',
  damla: 'Damla',
  sprey: 'Sprey',
  igne: 'İğne',
  krem: 'Krem',
  toz: 'Toz',
};
