import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<
  string,
  string | undefined
>;

export const MAPBOX_PUBLIC_TOKEN =
  extra.MAPBOX_PUBLIC_TOKEN && !extra.MAPBOX_PUBLIC_TOKEN.startsWith('YOUR_')
    ? extra.MAPBOX_PUBLIC_TOKEN
    : null;

export const GOOGLE_PLACES_KEY =
  extra.GOOGLE_PLACES_KEY && !extra.GOOGLE_PLACES_KEY.startsWith('YOUR_')
    ? extra.GOOGLE_PLACES_KEY
    : null;

export const HAS_MAPBOX = !!MAPBOX_PUBLIC_TOKEN;
export const HAS_GOOGLE = !!GOOGLE_PLACES_KEY;
