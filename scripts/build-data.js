#!/usr/bin/env node
/* Datenpaket für Hit or Miss bauen: node scripts/build-data.js
   Liest die Songdaten von Gold Record und Older or Newer (Nachbarordner) und schreibt data/tracks.json.
   Danach: Prüfbericht scripts/.cache/report.txt mit Zählungen und Beispiel-Behauptungen je Art – vor dem Hochladen überfliegen.

   Neue Songs oder neue Stream-Zahlen in Gold Record → dieses Skript erneut laufen lassen und DATA_V in js/game.js erhöhen.
   Achtung Tages-Challenge: Die Karten hängen an den Daten – neue Daten am besten abends hochladen (gilt ab dem nächsten Tag).

   tracks.json:
     artists: Interpreten (Schreibweisen zusammengeführt, ohne „feat.“-Teil)
     tracks:  { i: Deezer-ID, t: Titel, a: Nr. in artists, a0?: Original-Interpretenfeld (falls anders),
                y: Jahr, y2?: abweichendes Jahr der zweiten Quelle, q: Jahr geprüft (0 nein, 1 eine Quelle, 2 zwei Quellen einig),
                c: Cover (Deezer-md5 oder mb:…), f: Bekanntheit 0 (größter Hit) … 999, s?: Spotify-Streams in Mio., g?: Deezer-Genre } */
'use strict';
const fs = require('fs'), path = require('path');
const HM = require('../js/claims.js');
const ROOT = path.join(__dirname, '..'), DOCS = path.join(ROOT, '..');
const GR = p => JSON.parse(fs.readFileSync(path.join(DOCS, 'Gold-Record', 'data', p), 'utf8'));
const OON = JSON.parse(fs.readFileSync(path.join(DOCS, 'Older-or-Newer', 'data', 'songs.json'), 'utf8')).songs;

const songs = GR('songs.json'), extra = GR('extra.json').songs, more = GR('more.json').songs;
const years = GR('years.json'), covers = GR('covers.json').covers || {}, genres = GR('genres.json'), bill = GR('billions.json');
for (const s of more) s.pl = 1;
const all = [...songs.songs, ...extra, ...more];
for (const s of all) { if (years[s.id]) { s.y = years[s.id]; delete s.ya; } if (covers[s.id]) { s.c0 = s.c; s.c = covers[s.id]; } if (!s.g && genres[s.id]) s.g = genres[s.id]; }

// Dubletten raus (Schlüssel wie Gold Record: Hauptinterpret + Titel ohne Zusätze) – der erste (geprüfte) Eintrag bleibt
const songKey = (t, a) => HM.key(String(a).split(/\s*(?:feat\.?|ft\.?|featuring|with|&|,| x )\s*/i)[0]) + '|' + HM.titleKey(t);
const seen = new Set();
// Cover-Bands, Karaoke, Tribute: das ist nicht der Original-Interpret
const FAKE = /cover band|hello i'?m |clearwater revival experience|a\.k\.a\.|karaoke|tribute|made famous|in the style of/i;
const out = [], dropped = { dup: 0, fake: 0, de: 0 };
for (const s of all) {
  if (FAKE.test(s.a) || FAKE.test(s.t)) { dropped.fake++; continue; }
  // wie Gold Record „Alle“: die vielen Songs nur aus deutschen Playlists nicht (gibt es evtl. später als Thema)
  if (s.de && s.pl) { dropped.de++; continue; }
  const k = songKey(s.t, s.a);
  if (seen.has(k)) { dropped.dup++; continue; }
  seen.add(k); out.push(s);
}

// Jahre: Gold Record geprüft (songs.json / years.json) und Older or Newer (geprüft) – einig oder nicht?
const oon = new Map(OON.map(o => [o.id, o.y])), oonKey = new Map(OON.map(o => [songKey(o.t, o.a), o.y]));
let agree = 0, disagree = 0;
for (const s of out) {
  const y2 = oon.get(s.id) ?? oonKey.get(songKey(s.t, s.a));
  if (!s.ya) {
    if (y2 == null) s.q = 1;
    else if (y2 === s.y) { s.q = 2; agree++; }
    else { s.q = 1; s.y2 = y2; disagree++; }
  } else if (y2 != null) { s.y = y2; s.q = 1; }     // in Gold Record ungeprüft, in Older or Newer geprüft
  else s.q = 0;
}

// Streams: über Deezer-ID oder Titel + Interpret (100 Einträge haben in der Stream-Liste eine andere Deezer-ID)
const byId = new Map(out.map(s => [s.id, s])), byKey = new Map(out.map(s => [songKey(s.t, s.a), s]));
let matched = 0;
for (const t of bill.tracks) {
  const s = byId.get(t.id) || byKey.get(songKey(t.title, t.artist));
  if (s && !s.s) { s.s = Math.floor(t.streams / 1e6); matched++; }
}

// Interpreten: Schreibweisen zusammenführen (häufigste Schreibweise gewinnt). Strenger als HM.key: ø bleibt ø (sonst wäre „The Dø“ = „D.O.“)
const mergeKey = a => String(a).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/^the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, '');
const groups = new Map();
for (const s of out) {
  const disp = HM.mainArtist(s.a), k = mergeKey(disp) || disp;
  s._ak = k; s._disp = disp;
  const g = groups.get(k) || groups.set(k, new Map()).get(k);
  g.set(disp, (g.get(disp) || 0) + 1);
}
const artists = [], aIndex = new Map(), merged = [];
for (const [k, g] of groups) {
  const forms = [...g.entries()].sort((a, b) => b[1] - a[1]);
  if (forms.length > 1) merged.push(forms.map(f => f[0]).join(' / '));
  aIndex.set(k, artists.length); artists.push(forms[0][0]);
}

// Bekanntheit nach Deezer-Rang: 0 = größter Hit … 999
const ranked = [...out].sort((a, b) => (b.r || 0) - (a.r || 0));
ranked.forEach((s, i) => { s._f = Math.floor(i / ranked.length * 1000); });

const tracks = out.map(s => {
  const r = { i: s.id, t: s.t, a: aIndex.get(s._ak), y: s.y, q: s.q, c: s.c, f: s._f };
  if (s.a !== artists[r.a]) r.a0 = s.a;
  if (s.y2) r.y2 = s.y2;
  if (s.c0) r.c0 = s.c0;                      // Deezer-Cover als Ersatz, falls das Original-Cover nicht lädt
  if (s.s) r.s = s.s;
  if (s.g) r.g = s.g;
  return r;
});
const built = new Date().toISOString().slice(0, 10);
const data = { _hinweis: 'Erstellt mit scripts/build-data.js aus den Daten von Gold Record und Older or Newer – nicht von Hand ändern', built, streamsAt: bill.built, artists, tracks };
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data', 'tracks.json'), JSON.stringify(data));
const size = fs.statSync(path.join(ROOT, 'data', 'tracks.json')).size;

/* ---------- Prüfbericht ---------- */
const D = HM.prepare(data);
const L = [];
L.push(`Hit or Miss – Datenpaket ${built} (Streams Stand ${bill.built})`);
L.push(`Songs: ${tracks.length} (raus: ${dropped.dup} Dubletten, ${dropped.fake} Cover-Bands/Karaoke, ${dropped.de} nur deutsche Playlists)`);
L.push(`Jahr geprüft: ${tracks.filter(t => t.q).length} · zwei Quellen einig: ${agree} · uneinig: ${disagree} · Streams: ${matched}`);
L.push(`Interpreten: ${artists.length} · zusammengeführte Schreibweisen: ${merged.length}`);
L.push(`Datei: ${(size / 1024).toFixed(0)} KB`, '');
L.push('Uneinige Jahre:', ...out.filter(s => s.y2).map(s => `  ${s.t} – ${s.a}: ${s.y} / ${s.y2}`), '');
L.push('Zusammengeführt:', ...merged.map(m => '  ' + m), '');
const fmt = c => {
  const s = c.s, who = `${c.hide === 't' ? '???' : s.T} – ${c.hide === 'a' ? '???' : s.A}`;
  const claim = { dec: `erschien in den ${c.d}ern`, when: `erschien ${c.dir === 'before' ? 'vor' : 'nach'} ${c.y}`, artist: `ist von ${c.A}`,
    title: `heißt »${c.T}«`, streams: `hat über ${(c.n / 1000).toLocaleString('de')} Mrd. Streams`,
    older: `ist ${c.cmp === 'older' ? 'älter' : 'neuer'} als »${c.o?.T}« (${c.o?.A}, ${c.o?.y})` }[c.k];
  const fact = { dec: s.y + (s.y2 ? '/' + s.y2 : ''), when: s.y, artist: s.A, title: s.T, streams: (s.n / 1000).toFixed(2) + ' Mrd.', older: s.y }[c.k];
  return `  ${c.ok ? 'STIMMT      ' : 'STIMMT NICHT'}  ${who}: „${claim}“   [${fact}]`;
};
const R = HM.seeded('report-' + built);
const st = { used: new Set(), recent: [], truths: [] };
const cnt = {}, bad = [];
const byType = {};
for (let i = 0; i < 3000; i++) {
  if (st.used.size > 2500) st.used.clear();
  const c = HM.makeCard(st, (i % 40) / 39, R);
  if (!c) { cnt.leer = (cnt.leer || 0) + 1; continue; }
  cnt[c.k] = (cnt[c.k] || 0) + 1; cnt[c.ok] = (cnt[c.ok] || 0) + 1;
  if (!HM.verify(c)) bad.push(fmt(c));
  (byType[c.k] ||= []).push(c);
}
L.push('Probelauf 3.000 Karten: ' + JSON.stringify(cnt), `Gegenprüfung fehlgeschlagen: ${bad.length}`, ...bad, '');
for (const [k, list] of Object.entries(byType)) L.push(`--- ${k} ---`, ...list.slice(0, 25).map(fmt), '');
fs.mkdirSync(path.join(__dirname, '.cache'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '.cache', 'report.txt'), L.join('\n'));
console.log(L.slice(0, 5).join('\n'));
console.log('Probelauf:', JSON.stringify(cnt), '· Gegenprüfung fehlgeschlagen:', bad.length);
console.log('Bericht: scripts/.cache/report.txt');
