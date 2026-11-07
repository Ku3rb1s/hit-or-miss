#!/usr/bin/env node
/* Andere Fassungen eines Songs bei Deezer suchen (Remixe, Cover, Neuaufnahmen): node scripts/build-versions.js
   Warum: „Good Luck, Babe! – ist von Disco Lines“ wäre als falsche Behauptung unfair – Disco Lines hat einen bekannten
   Remix genau dieses Songs. Wer eine eigene Fassung des Titels hat (als Interpret oder als Remixer im Titel), darf bei
   diesem Song nicht als „falscher“ Interpret kommen.
   Ergebnis: scripts/.cache/versions.json  { "<Deezer-ID>": ["Disco Lines", …] }  – liest scripts/build-data.js.
   Zwischenstand bleibt erhalten (Abbrechen und neu starten geht). Danach: node scripts/build-data.js */
'use strict';
const fs = require('fs'), path = require('path');
const HM = require('../js/claims.js');
const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tracks.json'), 'utf8'));
const outF = path.join(__dirname, '.cache', 'versions.json');
fs.mkdirSync(path.dirname(outF), { recursive: true });
const cache = fs.existsSync(outF) ? JSON.parse(fs.readFileSync(outF, 'utf8')) : {};
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url) {
  for (let t = 0; t < 6; t++) {
    try {
      const d = await (await fetch(url, { headers: { 'User-Agent': 'HitOrMiss/1.0' } })).json();
      if (d.error?.code === 4) { await sleep(5000); continue; }   // zu viele Anfragen
      return d;
    } catch { await sleep(2000); }
  }
  return null;
}
// Remixer/Bearbeiter aus Zusätzen: „(Disco Lines Remix)“, „- Purple Disco Machine Remix“, „[Kygo Edit]“
const REMIXER = /(?:[([]|\s-\s)\s*([^()[\]]+?)\s+(?:remix|edit|mix|rework|version|bootleg|flip|vip)\b/gi;
const save = () => fs.writeFileSync(outF, JSON.stringify(cache));
(async () => {
  const todo = data.tracks.filter(t => !(t.i in cache));
  console.log(`${todo.length} von ${data.tracks.length} Songs noch offen`);
  let n = 0;
  for (const t of todo) {
    const title = HM.cleanTitle(t.t), tk = HM.titleKey(t.t), own = HM.key(data.artists[t.a]);
    const d = await get('https://api.deezer.com/search?' + new URLSearchParams({ q: `track:"${title}"`, limit: 100 }));
    if (!d) continue;   // beim nächsten Lauf nochmal
    const names = new Set();
    for (const r of d.data || []) {
      if (HM.titleKey(r.title) !== tk) continue;   // nur derselbe Titel (Zusätze wie „(Remix)“ zählen nicht)
      if (r.artist?.name && HM.key(r.artist.name) !== own) names.add(r.artist.name);
      for (const m of String(r.title).matchAll(REMIXER)) names.add(m[1].trim());
    }
    cache[t.i] = [...names];
    if (++n % 50 === 0) { save(); process.stdout.write(`${n} `); }
    await sleep(110);   // Deezer erlaubt 50 Anfragen pro 5 Sekunden
  }
  save();
  console.log(`\nfertig: ${Object.values(cache).filter(v => v.length).length} Songs mit anderen Fassungen`);
})();
