/**
 * Birkaç farklı arama sorgusunu dene, ilk 5 sonucu göster (manuel seçim için).
 * Indir + upload yapmaz, sadece listeler.
 */

const FREESOUND_TOKEN = process.env.FREESOUND_TOKEN;
if (!FREESOUND_TOKEN) { console.error('TOKEN gerekli'); process.exit(1); }

const QUERIES = [
  // INHALE adayları
  { label: 'INHALE', q: 'yoga inhale calm', dur: '1 TO 6' },
  { label: 'INHALE', q: 'breath in slow', dur: '1 TO 6' },
  { label: 'INHALE', q: 'inhale meditation', dur: '1 TO 6' },
  { label: 'INHALE', q: 'breathing in soft', dur: '1 TO 6' },

  // EXHALE adayları
  { label: 'EXHALE', q: 'yoga exhale calm', dur: '1 TO 6' },
  { label: 'EXHALE', q: 'breath out slow', dur: '1 TO 6' },
  { label: 'EXHALE', q: 'exhale meditation', dur: '1 TO 6' },
  { label: 'EXHALE', q: 'sigh relaxed', dur: '1 TO 6' },

  // BELL adayları
  { label: 'BELL', q: 'tibetan bowl gentle', dur: '2 TO 8' },
  { label: 'BELL', q: 'meditation chime soft', dur: '1 TO 6' },
  { label: 'BELL', q: 'singing bowl peaceful', dur: '2 TO 8' },
  { label: 'BELL', q: 'gong soft tone', dur: '2 TO 8' },
];

async function search(q, dur) {
  const url = new URL('https://freesound.org/apiv2/search/text/');
  url.searchParams.set('query', q);
  url.searchParams.set('filter', `duration:[${dur}]`);
  url.searchParams.set('sort', 'rating_desc');
  url.searchParams.set('fields', 'id,name,duration,previews,avg_rating,num_ratings,tags');
  url.searchParams.set('page_size', '5');
  url.searchParams.set('token', FREESOUND_TOKEN);
  const res = await fetch(url.toString());
  const j = await res.json();
  return j.results ?? [];
}

(async () => {
  for (const item of QUERIES) {
    console.log(`\n========== ${item.label}: "${item.q}" ==========`);
    const r = await search(item.q, item.dur);
    if (!r.length) { console.log('  (no result)'); continue; }
    r.forEach((s, i) => {
      console.log(`  ${i+1}. [${s.id}] ${s.name.slice(0, 60)} (${s.duration.toFixed(1)}s, ★${s.avg_rating?.toFixed(1) ?? '?'}, ${s.num_ratings ?? 0} oy)`);
      console.log(`     tags: ${(s.tags ?? []).slice(0, 6).join(', ')}`);
      console.log(`     preview: ${s.previews?.['preview-hq-mp3']}`);
    });
    await new Promise(r => setTimeout(r, 1100));
  }
})();
