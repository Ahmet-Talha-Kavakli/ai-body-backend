/**
 * Nefes ses dosyalarını Freesound'dan indir, Supabase'a yükle.
 * - inhale.mp3 (kısa, 1-2sn nefes alma sesi)
 * - exhale.mp3 (kısa, 1-2sn nefes verme sesi)
 * - hold.mp3   (opsiyonel, sessiz tone tutma sesi)
 * - bell.mp3   (oturum bittiğinde çalan zil)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '.tmp-breath');
fs.mkdirSync(TMP, { recursive: true });

const FREESOUND_TOKEN = process.env.FREESOUND_TOKEN;
if (!FREESOUND_TOKEN) {
  console.error('FREESOUND_TOKEN gerekli');
  process.exit(1);
}

const SUPABASE_URL = 'https://bollxgwrevnwjhnzdwcb.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbGx4Z3dyZXZud2pobnpkd2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTgwOTUsImV4cCI6MjA5MTA3NDA5NX0.E7LAox2rfeDDHBgb2qGXh-mUGQ2Se3Up5XDR0uyjE-o';
const BUCKET = 'sleep-sounds';

const TARGETS = [
  { id: 'breath_inhale', query: 'breath inhale', minDur: 0.5, maxDur: 10 },
  { id: 'breath_exhale', query: 'breath exhale', minDur: 0.5, maxDur: 10 },
  { id: 'breath_bell',   query: 'meditation bell', minDur: 0.5, maxDur: 10 },
];

async function search(target) {
  const url = new URL('https://freesound.org/apiv2/search/text/');
  url.searchParams.set('query', target.query);
  url.searchParams.set('filter', `duration:[${target.minDur} TO ${target.maxDur}] license:"Creative Commons 0"`);
  url.searchParams.set('sort', 'rating_desc');
  url.searchParams.set('fields', 'id,name,duration,previews');
  url.searchParams.set('page_size', '5');
  url.searchParams.set('token', FREESOUND_TOKEN);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const j = await res.json();
  return j.results ?? [];
}

async function downloadAndUpload(target) {
  process.stdout.write(`[${target.id}] `);
  const results = await search(target);
  if (!results.length) {
    console.log('NO RESULT');
    return null;
  }
  const pick = results[0];
  const url = pick.previews?.['preview-hq-mp3'] ?? pick.previews?.['preview-lq-mp3'];
  if (!url) { console.log('NO PREVIEW'); return null; }

  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());

  const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${target.id}.mp3`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'audio/mpeg', 'x-upsert': 'true' },
    body: buf,
  });
  if (!upRes.ok) {
    console.log(`UPLOAD FAIL ${upRes.status}: ${await upRes.text()}`);
    return null;
  }
  console.log(`OK (${pick.duration.toFixed(1)}s, "${pick.name.slice(0, 40)}")`);
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${target.id}.mp3`;
}

(async () => {
  for (const t of TARGETS) {
    try { await downloadAndUpload(t); } catch (e) { console.log('FAIL', e.message); }
    await new Promise(r => setTimeout(r, 1100));
  }
})();
