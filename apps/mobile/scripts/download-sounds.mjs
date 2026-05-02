/**
 * Freesound'tan 30 ses ara, HQ preview mp3'lerini indir, Supabase'a yükle.
 *
 * Kullanım:
 *   FREESOUND_TOKEN=xxx node scripts/download-sounds.mjs
 *
 * Çıktı: console'a `id → public_url` haritası, sonra soundLibrary.ts'e elle yapıştır.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '.tmp-sounds');
fs.mkdirSync(TMP_DIR, { recursive: true });

const FREESOUND_TOKEN = process.env.FREESOUND_TOKEN;
if (!FREESOUND_TOKEN) {
  console.error('FREESOUND_TOKEN env var gerekli');
  process.exit(1);
}

const SUPABASE_URL = 'https://bollxgwrevnwjhnzdwcb.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbGx4Z3dyZXZud2pobnpkd2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTgwOTUsImV4cCI6MjA5MTA3NDA5NX0.E7LAox2rfeDDHBgb2qGXh-mUGQ2Se3Up5XDR0uyjE-o';
const BUCKET = 'sleep-sounds';

// id → freesound search query (CC0 license filter)
const TARGETS = [
  // YAĞMUR (4)
  { id: 'rain_light',  query: 'rain light gentle ambient', minDur: 60 },
  { id: 'rain_storm',  query: 'thunder rain storm distant', minDur: 60 },
  { id: 'rain_roof',   query: 'rain roof tent', minDur: 30 },
  { id: 'rain_forest', query: 'rain forest leaves', minDur: 60 },

  // DOĞA (6)
  { id: 'forest',      query: 'forest birds ambient', minDur: 60 },
  { id: 'ocean',       query: 'ocean waves beach', minDur: 60 },
  { id: 'stream',      query: 'stream water flowing', minDur: 60 },
  { id: 'wind',        query: 'wind soft breeze', minDur: 60 },
  { id: 'birds',       query: 'birds singing morning', minDur: 60 },
  { id: 'fireplace',   query: 'fireplace crackling fire', minDur: 60 },

  // GÜRÜLTÜ (4)
  { id: 'white',       query: 'white noise loop', minDur: 30 },
  { id: 'pink',        query: 'pink noise loop', minDur: 30 },
  { id: 'brown',       query: 'brown noise loop', minDur: 30 },
  { id: 'fan',         query: 'fan noise loop hum', minDur: 30 },

  // MÜZİK (5)
  { id: 'piano',       query: 'piano calm', minDur: 60 },
  { id: 'lofi',        query: 'lofi beat ambient', minDur: 60 },
  { id: 'ambient',     query: 'ambient pad calm', minDur: 60 },
  { id: 'guitar',      query: 'classical guitar relaxing', minDur: 60 },
  { id: 'harp',        query: 'harp relaxing', minDur: 30 },

  // EV (3)
  { id: 'clock',       query: 'clock ticking wall', minDur: 30 },
  { id: 'washer',      query: 'washing machine loop', minDur: 30 },
  { id: 'ac',          query: 'air conditioner hum', minDur: 30 },

  // ASMR (3)
  { id: 'whisper',     query: 'whisper asmr calm', minDur: 30 },
  { id: 'paper',       query: 'paper rustle', minDur: 10 },
  { id: 'purring',     query: 'cat purring asmr', minDur: 30 },

  // ŞEHİR (2)
  { id: 'train',       query: 'train interior travel', minDur: 60 },
  { id: 'cafe',        query: 'cafe ambient chatter', minDur: 60 },

  // ÇOCUK (3)
  { id: 'heartbeat',   query: 'heartbeat', minDur: 10 },
  { id: 'lullaby',     query: 'lullaby melody', minDur: 30 },
  { id: 'cradle',      query: 'baby rocking', minDur: 10 },
];

async function searchFreesound(query, minDur) {
  const url = new URL('https://freesound.org/apiv2/search/text/');
  url.searchParams.set('query', query);
  url.searchParams.set('filter', `duration:[${minDur} TO 600] license:"Creative Commons 0"`);
  url.searchParams.set('sort', 'rating_desc');
  url.searchParams.set('fields', 'id,name,duration,previews,license');
  url.searchParams.set('page_size', '5');
  url.searchParams.set('token', FREESOUND_TOKEN);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Freesound search failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.results ?? [];
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${url} (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf;
}

async function uploadToSupabase(buffer, path, mime = 'audio/mpeg') {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON}`,
      'Content-Type': mime,
      'x-upsert': 'true',
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function processOne(target) {
  process.stdout.write(`[${target.id}] search "${target.query}"… `);
  const results = await searchFreesound(target.query, target.minDur);
  if (!results.length) {
    console.log('NO RESULT');
    return null;
  }

  // İlk uygun sonuç: 600s'den kısa olan
  const pick = results.find((r) => r.duration <= 600) ?? results[0];
  // Eğer >300s ise lq tercih et (boyut için)
  const useHq = pick.duration <= 300;
  const previewUrl = useHq
    ? pick.previews?.['preview-hq-mp3'] ?? pick.previews?.['preview-lq-mp3']
    : pick.previews?.['preview-lq-mp3'] ?? pick.previews?.['preview-hq-mp3'];
  if (!previewUrl) {
    console.log('NO PREVIEW URL');
    return null;
  }

  const tmpFile = path.join(TMP_DIR, `${target.id}.mp3`);
  process.stdout.write(`download (id=${pick.id}, ${Math.round(pick.duration)}s)… `);
  const buf = await downloadFile(previewUrl, tmpFile);

  process.stdout.write(`upload (${(buf.length / 1024).toFixed(0)}kb)… `);
  const publicUrl = await uploadToSupabase(buf, `${target.id}.mp3`);
  console.log('OK');
  return { id: target.id, url: publicUrl, durationSec: Math.round(pick.duration), source: pick.name };
}

async function main() {
  const out = {};
  const failed = [];
  for (const target of TARGETS) {
    try {
      const r = await processOne(target);
      if (r) {
        out[r.id] = r;
      } else {
        failed.push(target.id);
      }
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
      failed.push(target.id);
    }
    // Rate limit'e dikkat (60 req/dk)
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log('\n\n=== RESULT ===');
  console.log(JSON.stringify(out, null, 2));
  console.log('\n=== FAILED ===');
  console.log(failed);

  // Çıktıyı dosyaya da yaz
  fs.writeFileSync(path.join(__dirname, 'sounds-result.json'), JSON.stringify(out, null, 2));
  console.log(`\nResult written to scripts/sounds-result.json`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
