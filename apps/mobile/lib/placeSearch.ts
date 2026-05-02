// Place / POI search — Photon (free, primary) + Google Places (fallback if key set)

import { GOOGLE_PLACES_KEY, HAS_GOOGLE } from './mapsConfig';

export interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
  source: 'photon' | 'google' | 'nominatim';
}

interface ProximityHint {
  latitude: number;
  longitude: number;
}

const PHOTON_URL = 'https://photon.komoot.io/api';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GOOGLE_AUTOCOMPLETE = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const GOOGLE_DETAILS = 'https://maps.googleapis.com/maps/api/place/details/json';

// ─── Photon (Komoot — free, no key, global) ──────────────────────────────────
async function searchPhoton(
  q: string,
  near?: ProximityHint,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  try {
    const params = new URLSearchParams({ q, limit: '8', lang: 'tr' });
    if (near) {
      params.set('lat', String(near.latitude));
      params.set('lon', String(near.longitude));
    }
    const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f: any): PlaceResult => {
      const p = f.properties || {};
      const parts = [p.name, p.street, p.city, p.country].filter(Boolean);
      return {
        display_name: parts.join(', ') || (p.name ?? 'Bilinmeyen yer'),
        lon: String(f.geometry.coordinates[0]),
        lat: String(f.geometry.coordinates[1]),
        source: 'photon',
      };
    });
  } catch {
    return [];
  }
}

// ─── Nominatim fallback (OSM, free) ──────────────────────────────────────────
async function searchNominatim(q: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  try {
    const params = new URLSearchParams({ q, format: 'json', limit: '6', 'accept-language': 'tr' });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      signal,
      headers: { 'User-Agent': 'FitAI/1.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map(
      (r: any): PlaceResult => ({
        display_name: r.display_name,
        lat: r.lat,
        lon: r.lon,
        source: 'nominatim',
      }),
    );
  } catch {
    return [];
  }
}

// ─── Google Places (fallback when key set) ───────────────────────────────────
async function searchGoogle(
  q: string,
  near?: ProximityHint,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  if (!HAS_GOOGLE) return [];
  try {
    // Step 1: autocomplete
    const params = new URLSearchParams({
      input: q,
      key: GOOGLE_PLACES_KEY!,
      language: 'tr',
    });
    if (near) {
      params.set('location', `${near.latitude},${near.longitude}`);
      params.set('radius', '50000');
    }
    const acRes = await fetch(`${GOOGLE_AUTOCOMPLETE}?${params}`, { signal });
    if (!acRes.ok) return [];
    const acData = await acRes.json();
    const predictions: any[] = acData.predictions || [];
    if (predictions.length === 0) return [];

    // Step 2: get coords for top 5 (Place Details)
    const top = predictions.slice(0, 5);
    const detailsAll = await Promise.all(
      top.map(async (p) => {
        const dRes = await fetch(
          `${GOOGLE_DETAILS}?${new URLSearchParams({
            place_id: p.place_id,
            key: GOOGLE_PLACES_KEY!,
            fields: 'geometry,name,formatted_address',
            language: 'tr',
          })}`,
          { signal },
        ).catch(() => null);
        if (!dRes || !dRes.ok) return null;
        const d = await dRes.json();
        const r = d.result;
        if (!r?.geometry?.location) return null;
        return {
          display_name: p.description,
          lat: String(r.geometry.location.lat),
          lon: String(r.geometry.location.lng),
          source: 'google' as const,
        };
      }),
    );
    return detailsAll.filter(Boolean) as PlaceResult[];
  } catch {
    return [];
  }
}

// ─── Hybrid: Photon primary, Google fallback if results poor ─────────────────
export async function searchPlacesHybrid(
  q: string,
  near?: ProximityHint,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  if (q.trim().length < 2) return [];

  // Run both in parallel for speed; Google only if key configured
  const [photon, google] = await Promise.all([
    searchPhoton(q, near, signal),
    HAS_GOOGLE ? searchGoogle(q, near, signal) : Promise.resolve([] as PlaceResult[]),
  ]);

  // If Google has results, prefer them (better POI accuracy worldwide)
  // Photon results appended as supplementary
  if (google.length > 0) {
    const seen = new Set<string>();
    const out: PlaceResult[] = [];
    for (const r of [...google, ...photon]) {
      const key = `${r.lat.slice(0, 7)},${r.lon.slice(0, 7)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
      if (out.length >= 8) break;
    }
    return out;
  }

  // No Google results — use Photon
  if (photon.length > 0) return photon;

  // Last resort: Nominatim
  return searchNominatim(q, signal);
}

// ─── Reverse geocoding ───────────────────────────────────────────────────────
export interface ReverseResult {
  name: string;
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<ReverseResult | null> {
  // Try Google first if key is set (best accuracy)
  if (HAS_GOOGLE) {
    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lon}`,
        key: GOOGLE_PLACES_KEY!,
        language: 'tr',
        result_type: 'sublocality|neighborhood|locality',
      });
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, {
        signal,
      });
      if (res.ok) {
        const d = await res.json();
        const r = d.results?.[0];
        if (r) {
          const comp = r.address_components || [];
          const sub = comp.find(
            (c: any) => c.types.includes('sublocality') || c.types.includes('neighborhood'),
          )?.long_name;
          const city = comp.find(
            (c: any) =>
              c.types.includes('locality') || c.types.includes('administrative_area_level_2'),
          )?.long_name;
          return { name: sub || city || r.formatted_address.split(',')[0] };
        }
      }
    } catch {}
  }

  // Fallback: Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr&zoom=14`;
    const res = await fetch(url, { signal, headers: { 'User-Agent': 'FitAI/1.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    const place =
      a.suburb ||
      a.neighbourhood ||
      a.quarter ||
      a.city_district ||
      a.town ||
      a.village ||
      a.city ||
      null;
    return place ? { name: place } : null;
  } catch {
    return null;
  }
}
