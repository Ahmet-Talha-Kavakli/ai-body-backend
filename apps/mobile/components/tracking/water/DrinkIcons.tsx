import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export type DrinkIconName =
  | 'glass'
  | 'bottle'
  | 'mug'
  | 'cup'
  | 'wineGlass'
  | 'martini'
  | 'canister'
  | 'takeaway'
  | 'thermos'
  | 'smoothie';

interface DrinkIconProps {
  name: DrinkIconName;
  size?: number;
  color?: string;
}

export function DrinkIcon({ name, size = 32, color = '#32ADE6' }: DrinkIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {render(name, color)}
    </Svg>
  );
}

function render(name: DrinkIconName, color: string): React.ReactElement {
  switch (name) {
    /**
     * GLASS — düz su bardağı
     * Hafif geniş üst (22 -> 42), daralan taban (24 -> 40), tabanda 4px yumuşak köşe.
     * Üstte ince ağız kalınlığı için path tek-shape silüet.
     */
    case 'glass':
      return (
        <Path
          d="M21 11 H43 Q44.5 11 44.3 12.5 L41.6 51 Q41.4 54 38.4 54 H25.6 Q22.6 54 22.4 51 L19.7 12.5 Q19.5 11 21 11 Z"
          fill={color}
        />
      );

    /**
     * BOTTLE — kapaklı PET su şişesi
     * Üstte kapak (rect rx), boyun, omuz kavisi ile gövdeye bağlanır, gövde tabanda yumuşak köşeli.
     */
    case 'bottle':
      return (
        <>
          {/* Kapak */}
          <Rect x="26" y="6" width="12" height="7" rx="2" fill={color} />
          {/* Boyun */}
          <Rect x="27.5" y="13" width="9" height="5" fill={color} />
          {/* Omuz + gövde tek path: boyundan omuza Q kavisi, gövde aşağıda yumuşak taban */}
          <Path
            d="M27.5 18 Q27.5 21 24 24 Q19 27.5 19 33 V51 Q19 55 23 55 H41 Q45 55 45 51 V33 Q45 27.5 40 24 Q36.5 21 36.5 18 Z"
            fill={color}
          />
        </>
      );

    /**
     * MUG — kulplu kahve mug'ı
     * Silindirik gövde + sağda yumuşak köşeli kulp (donut benzeri)
     */
    case 'mug':
      return (
        <>
          {/* Gövde */}
          <Path
            d="M16 16 Q16 14 18 14 H40 Q42 14 42 16 V50 Q42 54 38 54 H20 Q16 54 16 50 Z"
            fill={color}
          />
          {/* Kulp — dış path, iç path ile delikli görünüm */}
          <Path
            d="M42 22 H46 Q52 22 52 30 V40 Q52 48 46 48 H42 V44 H45 Q48 44 48 39 V31 Q48 26 45 26 H42 Z"
            fill={color}
          />
        </>
      );

    /**
     * CUP — Türk çay bardağı, ince belli
     * Üst geniş, ortada bel, alt küçük geniş; tek path simetrik silüet.
     */
    case 'cup':
      return (
        <Path
          d="M22 10 H42 Q43.5 10 43.3 11.5 L40 28 Q39 32 41 35 L43 50 Q43.2 53 40 53 H24 Q20.8 53 21 50 L23 35 Q25 32 24 28 L20.7 11.5 Q20.5 10 22 10 Z"
          fill={color}
        />
      );

    /**
     * WINE GLASS — şarap kadehi, balon gövde + ince sap + taban
     */
    case 'wineGlass':
      return (
        <>
          {/* Balon gövde */}
          <Path
            d="M20 10 H44 Q45.5 10 45.3 11.5 Q44.5 22 40 28 Q36 33 36 37 H28 Q28 33 24 28 Q19.5 22 18.7 11.5 Q18.5 10 20 10 Z"
            fill={color}
          />
          {/* Sap */}
          <Rect x="30.5" y="37" width="3" height="13" rx="1.2" fill={color} />
          {/* Taban */}
          <Path
            d="M21 54 Q21 50 25 50 H39 Q43 50 43 54 Q43 55 42 55 H22 Q21 55 21 54 Z"
            fill={color}
          />
        </>
      );

    /**
     * MARTINI — V-konik kase + sap + taban
     */
    case 'martini':
      return (
        <>
          {/* V kase */}
          <Path
            d="M14 10 H50 Q51.5 10 51 11.5 L34 33 Q32 35.2 30 33 L13 11.5 Q12.5 10 14 10 Z"
            fill={color}
          />
          {/* Sap */}
          <Rect x="30.5" y="33" width="3" height="17" rx="1.2" fill={color} />
          {/* Taban */}
          <Path
            d="M19 54 Q19 50 24 50 H40 Q45 50 45 54 Q45 55 44 55 H20 Q19 55 19 54 Z"
            fill={color}
          />
        </>
      );

    /**
     * CANISTER — alüminyum içecek kutusu
     * Üstte kapak çıkıntısı, gövde dik silindir, alt-üst yumuşak köşeli.
     */
    case 'canister':
      return (
        <>
          {/* Üst rim */}
          <Rect x="22" y="7" width="20" height="3" rx="1" fill={color} />
          {/* Gövde */}
          <Path
            d="M21 10 H43 Q44 10 44 11 V53 Q44 56 41 56 H23 Q20 56 20 53 V11 Q20 10 21 10 Z"
            fill={color}
          />
        </>
      );

    /**
     * TAKEAWAY — pipetli kapaklı bardak (Starbucks tarzı)
     * Konik gövde (üst geniş, alt dar) + üstte kapak şeridi + pipet
     */
    case 'takeaway':
      return (
        <>
          {/* Pipet */}
          <Rect x="35" y="3" width="3" height="12" rx="1.2" fill={color} />
          {/* Kapak */}
          <Path
            d="M17 12 H47 Q48.5 12 48.3 13.5 L47.7 18 Q47.5 19.5 46 19.5 H18 Q16.5 19.5 16.3 18 L15.7 13.5 Q15.5 12 17 12 Z"
            fill={color}
          />
          {/* Gövde — konik, taban yumuşak */}
          <Path
            d="M18.5 19.5 H45.5 L42.5 51 Q42.2 54.5 38.7 54.5 H25.3 Q21.8 54.5 21.5 51 Z"
            fill={color}
          />
        </>
      );

    /**
     * THERMOS — silindirik termos, üstte vidalı kapak çıkıntısı
     */
    case 'thermos':
      return (
        <>
          {/* Kapak üst — küçük tepe */}
          <Rect x="27" y="5" width="10" height="4" rx="1.2" fill={color} />
          {/* Kapak gövde */}
          <Rect x="24" y="9" width="16" height="9" rx="2" fill={color} />
          {/* Boyun */}
          <Rect x="25" y="18" width="14" height="3" fill={color} />
          {/* Gövde */}
          <Path
            d="M22 21 H42 Q44 21 44 23 V52 Q44 56 40 56 H24 Q20 56 20 52 V23 Q20 21 22 21 Z"
            fill={color}
          />
        </>
      );

    /**
     * SMOOTHIE — geniş üst, hafif daralan taban; tek-shape sade silüet
     */
    case 'smoothie':
      return (
        <Path
          d="M16 12 H48 Q49.5 12 49.3 13.5 L45.5 51 Q45.2 54.5 41.7 54.5 H22.3 Q18.8 54.5 18.5 51 L14.7 13.5 Q14.5 12 16 12 Z"
          fill={color}
        />
      );
  }
}

export const DRINK_ICON_NAMES: DrinkIconName[] = [
  'glass',
  'bottle',
  'mug',
  'cup',
  'wineGlass',
  'martini',
  'canister',
  'takeaway',
  'thermos',
  'smoothie',
];

export const DRINK_ICON_LABELS_TR: Record<DrinkIconName, string> = {
  glass: 'Bardak',
  bottle: 'Şişe',
  mug: 'Kupa',
  cup: 'Çay Bardağı',
  wineGlass: 'Kadeh',
  martini: 'Martini',
  canister: 'Kutu',
  takeaway: 'Kapaklı Bardak',
  thermos: 'Termos',
  smoothie: 'Smoothie',
};
