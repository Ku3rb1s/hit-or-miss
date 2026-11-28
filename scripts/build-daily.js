/* Hit or Miss – Tages-Challenge vorab als Datei: data/daily/JJJJ-MM-TT.json
   Website und iPhone-App spielen aus derselben Datei → überall exakt dieselben Karten, ohne die Auswahl-Logik nachzubauen.

   node scripts/build-daily.js            Dateien für heute − 30 … heute + 14 Tage anlegen (vorhandene bleiben unverändert)
   node scripts/build-daily.js --force    vorhandene Dateien im Bereich neu schreiben (nur wenn wirklich nötig!)
   node scripts/build-daily.js --check    jede Datei im Bereich mit der bisherigen Logik im Spiel vergleichen
   Optionen: --from=JJJJ-MM-TT --to=JJJJ-MM-TT (statt des Bereichs)

   Keine Deezer-Anfragen: liest nur data/tracks.json → darf als GitHub-Workflow laufen (.github/workflows/daily.yml).

   Nicht neu programmiert: Karten kommen aus js/claims.js (HM.seeded, HM.makeCard – genau wie im Spiel), die Spiel-Einstellungen
   (Schwierigkeitskurve hOf, DIFF, Zeiten, EPOCH) werden direkt aus js/game.js gelesen.

   Wie viele Karten? Eine 60-Sekunden-Runde kann nicht schneller gespielt werden als LOCK_MS (Sperre nach jeder neuen Karte)
   + kürzeste Pause bis zur nächsten Karte (60 ms bei „weniger Bewegung“): 60000 / 360 ≈ 167 beantwortete Karten. Dazu liegen
   bis zu 5 Karten vorbereitet in der Warteschlange (aktuelle + 4) → höchstens 172 gezogene Karten. Die Datei hat 200
   (Reserve; Fehler kosten außerdem 3 Sekunden, verlängern die Runde also nie). Das Skript rechnet die Grenze aus game.js
   nach und bricht ab, falls sie je über 200 steigt. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const HM = require(path.join(ROOT, 'js/claims.js'));
const OUT = path.join(ROOT, 'data/daily');
const FILE_V = 1, CARDS = 200;

/* ---------- Spiel-Einstellungen aus js/game.js ---------- */
const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
const line = re => { const m = GAME.match(re); if (!m) throw new Error('Nicht in js/game.js gefunden: ' + re); return m; };
const ctx = vm.createContext({ Math, G: { mode: '60s', diff: 'normal' } });   // Tägliche Challenge: immer 60 Sekunden · Normal
for (const re of [/^const DIFF = .*$/m, /^const hOf = .*$/m, /^const ROUND_MS = .*$/m, /^const EPOCH = .*$/m])
  vm.runInContext(line(re)[0].replace(/^const /, 'var '), ctx);
const hOf = ctx.hOf, EPOCH = ctx.EPOCH;
line(/R: daily \? HM\.seeded\('hit-or-miss-' \+ day\)/);   // Startwert im Spiel unverändert?
{
  const fastest = ctx.LOCK_MS + Math.min(...line(/setTimeout\(advance, reduced\(\) \? (\d+) : (\d+)\)/).slice(1).map(Number));
  const ahead = +line(/for \(let i = 0; i < (\d+); i\+\+\) \{ const c = nextCard\(\)/)[1] + 1;
  const need = Math.ceil(ctx.ROUND_MS / fastest) + ahead;
  if (need > CARDS) throw new Error(`${CARDS} Karten reichen nicht mehr (bis zu ${need} möglich) – CARDS erhöhen`);
}

/* ---------- Tage (deutsche Zeit, wie today() im Spiel) ---------- */
const berlinToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const addDays = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);
const dayNo = d => Math.round((Date.parse(d) - Date.parse(EPOCH)) / 864e5) + 1;

/* ---------- Daten wie loadData() im Spiel ---------- */
const RAW = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tracks.json'), 'utf8'));
const C0 = new Map(RAW.tracks.filter(t => t.c0).map(t => [t.i, t.c0]));
function prepareFor(day) {
  // „now“ bestimmt nur, ob die Stream-Zahlen zu alt für „falsch“-Behauptungen sind – für die Datei zählt der Tag selbst (Mittag)
  HM.prepare(RAW, new Date(day + 'T12:00:00+01:00'));
  for (const s of HM.D.tracks) if (C0.has(s.i)) s.c0 = C0.get(s.i);
}

/** Karten des Tages genau so, wie das Spiel sie zieht (nextCard: makeCard mit hOf(G.made++), null wird übersprungen) */
function cardsFor(day) {
  prepareFor(day);
  const R = HM.seeded('hit-or-miss-' + day), st = { used: new Set(), recent: [], truths: [] }, out = [];
  for (let made = 0; out.length < CARDS && made < CARDS * 3; ) { const c = HM.makeCard(st, hOf(made++), R); if (c) out.push(c); }
  if (out.length < CARDS) throw new Error(`${day}: nur ${out.length} Karten`);
  return out;
}
function fileFor(day) {
  return { v: FILE_V, game: 'hit-or-miss', day, no: dayNo(day), mode: '60s', diff: 'normal', data: RAW.built, streamsAt: RAW.streamsAt,
    items: cardsFor(day).map(HM.toDaily) };
}
const write = (f, j) => {
  const { items, ...head } = j;
  fs.writeFileSync(f, JSON.stringify(head).slice(0, -1) + ',"items":[\n' + items.map(x => JSON.stringify(x)).join(',\n') + '\n]}\n');
};

/* ---------- Aufruf ---------- */
const args = process.argv.slice(2), opt = n => (args.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1];
const T = berlinToday(), from = opt('from') || addDays(T, -30), to = opt('to') || addDays(T, 14);
const days = []; for (let d = from; d <= to; d = addDays(d, 1)) if (dayNo(d) >= 1) days.push(d);
fs.mkdirSync(OUT, { recursive: true });

if (args.includes('--check')) {
  let ok = 0, bad = 0, miss = 0, other = 0;
  for (const d of days) {
    const f = path.join(OUT, d + '.json');
    if (!fs.existsSync(f)) { miss++; console.log(`✗ ${d}: Datei fehlt`); continue; }
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    const errs = [];
    if (j.v !== FILE_V || j.day !== d || j.no !== dayNo(d) || j.game !== 'hit-or-miss') errs.push('Kopf passt nicht');
    if ((j.items || []).length < CARDS) errs.push(`nur ${(j.items || []).length} Karten`);
    if (j.data !== RAW.built) {
      // mit einem älteren Datenpaket gebaut – bleibt fest; die heutige Logik kann sie nicht mehr nachrechnen
      other++; console.log(`· ${d}: gebaut mit Daten vom ${j.data} (jetzt ${RAW.built}) – bleibt wie veröffentlicht${errs.length ? ' ✗ ' + errs.join(', ') : ''}`);
      if (errs.length) bad++;
      continue;
    }
    const want = JSON.stringify(fileFor(d).items), have = JSON.stringify(j.items);
    if (want !== have) {
      const a = JSON.parse(want), b = j.items, k = a.findIndex((x, i) => JSON.stringify(x) !== JSON.stringify(b[i]));
      errs.push(`weicht ab ab Karte ${k + 1}`);
    }
    // Rückweg: Datei → Karte wie im Spiel, Gegenprüfung aus claims.js muss bestehen
    for (const [i, it] of (j.items || []).entries()) {
      const c = HM.fromDaily(it); if (!c) { errs.push(`Karte ${i + 1}: unbekannte Art`); break; }
      c.s = HM.D.byId.get(c.s.i) || c.s; if (c.o) c.o = HM.D.byId.get(c.o.i) || c.o;
      if (!HM.verify(c)) { errs.push(`Karte ${i + 1}: Gegenprüfung fällt durch`); break; }
    }
    if (errs.length) { bad++; console.log(`✗ ${d}: ${errs.join(', ')}`); } else ok++;
  }
  console.log(`\nPrüfung ${from} … ${to}: ${ok} gleich wie im Spiel, ${other} mit älterem Datenstand, ${miss} fehlen, ${bad} fehlerhaft`);
  process.exit(bad || miss ? 1 : 0);
}

let made = 0, kept = 0;
for (const d of days) {
  const f = path.join(OUT, d + '.json');
  if (fs.existsSync(f) && !args.includes('--force')) { kept++; continue; }
  write(f, fileFor(d)); made++;
}
console.log(`Tages-Challenge ${from} … ${to}: ${made} neu, ${kept} schon vorhanden (unverändert)`);
