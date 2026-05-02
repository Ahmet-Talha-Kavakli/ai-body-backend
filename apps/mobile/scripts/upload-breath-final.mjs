/**
 * Manuel seçilen kaliteli sesler — direkt preview URL ile indir + Supabase'a yükle.
 */

const FREESOUND_TOKEN = process.env.FREESOUND_TOKEN;

const SUPABASE_URL = 'https://bollxgwrevnwjhnzdwcb.supabase.co';
const SUPABASE_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbGx4Z3dyZXZud2pobnpkd2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTgwOTUsImV4cCI6MjA5MTA3NDA5NX0.E7LAox2rfeDDHBgb2qGXh-mUGQ2Se3Up5XDR0uyjE-o';
const BUCKET = 'sleep-sounds';

const PICKS = [
  { id: 'breath_inhale', soundId: 810328 }, // whoosh
  { id: 'breath_exhale', soundId: 627365 }, // wave gentle
  { id: 'breath_bell',   soundId: 835396 }, // singing bowl CC0
];

async function getInfo(id) {
  const url = `https://freesound.org/apiv2/sounds/${id}/?token=${FREESOUND_TOKEN}&fields=id,name,duration,previews,license`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`get ${id}: ${res.status}`);
  return res.json();
}

(async () => {
  for (const p of PICKS) {
    process.stdout.write(`[${p.id} ← ${p.soundId}] `);
    try {
      const info = await getInfo(p.soundId);
      const previewUrl = info.previews?.['preview-hq-mp3'] ?? info.previews?.['preview-lq-mp3'];
      if (!previewUrl) { console.log('NO PREVIEW'); continue; }

      const res = await fetch(previewUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      process.stdout.write(`${(buf.length / 1024).toFixed(0)}kb → upload… `);

      const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${p.id}.mp3`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'audio/mpeg', 'x-upsert': 'true' },
        body: buf,
      });
      if (!upRes.ok) {
        console.log(`FAIL ${upRes.status}: ${await upRes.text()}`);
        continue;
      }
      console.log(`OK "${info.name.slice(0, 40)}"`);
    } catch (e) {
      console.log('ERR', e.message);
    }
    await new Promise(r => setTimeout(r, 1100));
  }
})();
