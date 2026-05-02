const FREESOUND_TOKEN = process.env.FREESOUND_TOKEN;
const QUERIES = [
  { label: 'WAVE_IN', q: 'wave gentle ocean' },
  { label: 'WAVE_IN', q: 'water swoosh wave' },
  { label: 'WHOOSH', q: 'whoosh soft calm' },
  { label: 'BELL', q: 'singing bowl' },
  { label: 'BELL', q: 'tibetan bowl' },
  { label: 'BELL', q: 'chime soft' },
  { label: 'BELL', q: 'mindfulness bell' },
];

async function search(q) {
  const url = new URL('https://freesound.org/apiv2/search/text/');
  url.searchParams.set('query', q);
  url.searchParams.set('filter', 'duration:[2.0 TO 8.0]');
  url.searchParams.set('sort', 'rating_desc');
  url.searchParams.set('fields', 'id,name,duration,previews,avg_rating,num_ratings,license,tags');
  url.searchParams.set('page_size', '5');
  url.searchParams.set('token', FREESOUND_TOKEN);
  const res = await fetch(url.toString());
  const j = await res.json();
  return j.results ?? [];
}

(async () => {
  for (const item of QUERIES) {
    console.log(`\n========== ${item.label}: "${item.q}" ==========`);
    const r = await search(item.q);
    if (!r.length) { console.log('  (no result)'); continue; }
    r.forEach((s, i) => {
      console.log(`  ${i+1}. [${s.id}] ${s.name.slice(0, 55)} (${s.duration.toFixed(1)}s, ★${s.avg_rating?.toFixed(1) ?? '?'}, ${s.num_ratings ?? 0} oy)`);
      console.log(`     license: ${s.license}, tags: ${(s.tags ?? []).slice(0, 5).join(', ')}`);
    });
    await new Promise(r => setTimeout(r, 1100));
  }
})();
