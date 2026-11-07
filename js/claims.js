/* Hit or Miss – Behauptungen bauen und gegenprüfen
   Läuft im Browser (Spiel) und in Node (scripts/build-data.js schreibt damit einen Prüfbericht).
   Alle Regeln gegen unfaire oder falsche „Fakten“ stehen hier an EINER Stelle – Begründungen in KONZEPT.md, Abschnitt 4.

   Eine Behauptung (claim):
     { k: Art, s: Song, ok: stimmt sie?, hide: 'a' (Interpret verdecken) | 't' (Titel verdecken) | null, …Angaben je Art }
   Arten:
     dec     – erschien in den {d}ern                   d: 1980
     when    – erschien vor/nach {y}                    dir: 'before'|'after', y: 1990
     artist  – ist von {A}                              A: 'Bon Jovi'
     title   – heißt »{T}«                              T: 'Livin’ on a Prayer'
     streams – hat über {n} Streams bei Spotify          n: Millionen (2000 = 2 Mrd.)
     older   – ist älter/neuer als »{o.T}« ({o.A})       cmp: 'older'|'newer', o: anderer Song
*/
'use strict';
const HM = (() => {
  /* ---------- Schreibweisen vergleichbar machen ---------- */
  const fold = s => String(s || '').toLowerCase().replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/œ/g, 'oe')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '');
  // kompakter Schlüssel: „The Black Eyed Peas“ = „Black Eyed Peas“, „JAY Z“ = „Jay-Z“, „Céline“ = „Celine“
  const key = s => { const f = fold(s).replace(/^the\s+/, ''), k = f.replace(/[^\p{L}\p{N}]+/gu, ''); return k; };
  // ganze Wörter mit Leerzeichen am Rand – für „steckt als Wort drin“ (Cher in „Sonny & Cher“, aber nicht in „Fischer“)
  const words = s => ' ' + fold(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
  // Titel ohne Zusätze: „Style (Taylor's Version)“ → „Style“, „Numb - Unshatter Film Soundtrack“ → „Numb“
  const cleanTitle = t => String(t).replace(/\s*[([].*?[)\]]/g, '').replace(/\s+[-–—]\s+.*$/, '').trim() || String(t).trim();
  // Titel-Schlüssel wie scripts/songkey.js in Gold Record (wanna = want to, & = and …)
  const titleKey = t => key(fold(cleanTitle(t)).replace(/\bwanna\b/g, 'want to').replace(/\bgonna\b/g, 'going to')
    .replace(/\s+'?n'?\s+/g, ' and ').replace(/&/g, 'and'));
  // Hauptinterpret ohne „feat.“-Teil (das „&“ bleibt: Simon & Garfunkel)
  const mainArtist = a => String(a).replace(/\s*[([]?\s*\b(?:feat\.?|ft\.?|featuring)\s.*$/i, '').trim() || String(a).trim();
  const SPLIT = /\s*(?:,|&|\+|\/|\bfeat\.?|\bft\.?|\bfeaturing\b|\bwith\b|\bx\b|\band\b|\bund\b|\bvs\.?)\s*/i;
  // Alle Beteiligten eines Songs: Interpreten-Feld (auch in Teilen) und Gäste aus dem Titel („(feat. Ellie Goulding)“)
  function participants(s) {
    const out = [s.a0 || s.A];
    for (const p of String(s.a0 || s.A).split(SPLIT)) if (p) out.push(p);
    for (const m of String(s.t).matchAll(/[([]\s*(?:feat\.?|ft\.?|featuring|with)\s+([^)\]]+)[)\]]/gi)) {
      out.push(m[1]); for (const p of m[1].split(SPLIT)) if (p) out.push(p);
    }
    return out;
  }
  // Ist Interpret X mit einem der Beteiligten verwandt? (gleicher Name, oder einer steckt als ganze Wörter im anderen)
  function related(x, parts) {
    const xs = [x, ...String(x).split(SPLIT)].filter(Boolean);
    for (const a of xs) for (const b of parts) {
      const ka = key(a), kb = key(b);
      if (!ka || !kb) continue;
      if (ka === kb) return true;
      if (ka.length >= 3 && kb.length >= 3) { const wa = words(a), wb = words(b); if (wa.includes(wb) || wb.includes(wa)) return true; }
    }
    return false;
  }
  // Neuaufnahme, Remaster, Remix, Live, Soundtrack-Neuausgabe: Jahr ist nicht eindeutig das der Aufnahme
  const REISSUE = /taylor'?’?s version|remaster|re-?record|\bremix\b|\blive\b|\bedit\b|\bversion\b|\bmix\)|soundtrack|from the vault|sped up|slowed|acoustic/i;
  const isReissue = t => REISSUE.test(String(t).replace(/^[^([\-–—]*/, ''));   // nur in Zusätzen suchen („Live and Let Die“ ist ok)

  /* ---------- Daten vorbereiten ---------- */
  const DECS = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
  const THRESH = [1960, 1970, 1980, 1990, 2000, 2010, 2020];
  const STREAMS = [1000, 1500, 2000, 2500, 3000, 4000];   // Millionen
  let D = null;
  /** data = Inhalt von data/tracks.json → bereitet alles für makeCard vor (einmal beim Laden) */
  function prepare(data, now = new Date()) {
    const artists = data.artists;
    const tracks = data.tracks.map(r => {
      const s = { i: r.i, t: r.t, A: artists[r.a], ai: r.a, a0: r.a0, y: r.y, y2: r.y2 || 0, q: r.q || 0, c: r.c, f: r.f, n: r.s || 0, g: r.g || '' };
      s.T = cleanTitle(s.t); s.tk = titleKey(s.t); s.ak = key(s.A);
      s.ylo = Math.min(s.y, s.y2 || s.y); s.yhi = Math.max(s.y, s.y2 || s.y);
      s.parts = participants(s);
      return s;
    });
    // Titel → Interpreten (Cover-Versionen: „Fast Car“ von Tracy Chapman, Jonas Blue, Luke Combs)
    const titleArt = new Map();
    for (const s of tracks) (titleArt.get(s.tk) || titleArt.set(s.tk, new Set()).get(s.tk)).add(s.ak);
    for (const s of tracks) { s.multi = titleArt.get(s.tk).size > 1; s.reissue = isReissue(s.t); }
    // Interpreten: Songs, bekanntester Song, Jahre
    const byArtist = new Map();
    for (const s of tracks) {
      const e = byArtist.get(s.ai) || byArtist.set(s.ai, { ai: s.ai, A: s.A, ak: s.ak, songs: [], best: 1000, g: new Set() }).get(s.ai);
      e.songs.push(s); e.best = Math.min(e.best, s.f); if (s.g) e.g.add(s.g);
    }
    const famous = [...byArtist.values()].filter(e => e.songs.length >= 3 || e.best <= 250);
    // Jahrzehnt-Körbe für die Songauswahl (50er zu den 60ern), je Korb nach Bekanntheit sortiert
    const buckets = new Map();
    for (const s of tracks) { const d = Math.max(1960, Math.floor(s.y / 10) * 10); (buckets.get(d) || buckets.set(d, []).get(d)).push(s); }
    for (const b of buckets.values()) b.sort((x, y) => x.f - y.f || x.i - y.i);
    const builtYear = +String(data.built).slice(0, 4);
    const staleStreams = (now - Date.parse(data.streamsAt || data.built)) / 864e5 > 182;   // Zahlen älter als ½ Jahr → keine „falsch“-Behauptungen
    const withStreams = tracks.filter(s => s.n).sort((x, y) => x.f - y.f || x.i - y.i);
    D = { tracks, titleArt, byArtist, famous, withStreams, buckets: [...buckets.entries()].sort((a, b) => a[0] - b[0]), builtYear, staleStreams,
      streamsAt: data.streamsAt || data.built, byId: new Map(tracks.map(s => [s.i, s])) };
    return D;
  }

  /* ---------- Hilfen ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  const pick = (a, R) => a[Math.floor(R() * a.length)];
  const decOf = y => Math.floor(y / 10) * 10;
  const edge = y => y % 10 === 9 || y % 10 === 0;
  // Jahr sicher genug für Jahres-Behauptungen: geprüft, keine Cover-Version, keine Neuaufnahme
  const yearOk = s => s.q >= 1 && !s.multi && !s.reissue;

  /* ---------- die Arten ---------- */
  const GEN = {
    dec(s, want, h, R) {
      if (!yearOk(s) || edge(s.y) || (s.y2 && (edge(s.y2) || decOf(s.y2) !== decOf(s.y)))) return null;
      const d = decOf(s.y);
      if (want) return { k: 'dec', d, ok: true };
      const near = DECS.filter(x => Math.abs(x - d) === 10), far = DECS.filter(x => Math.abs(x - d) >= 20);
      const pool = R() < lerp(.2, .85, h) && near.length ? near : far.length ? far : near;
      return { k: 'dec', d: pick(pool, R), ok: false };
    },
    when(s, want, h, R) {
      if (!yearOk(s)) return null;
      // Grenze mit mindestens 3 Jahren Abstand zu beiden Quellen-Jahren
      const ts = THRESH.filter(T => Math.min(Math.abs(s.ylo - T), Math.abs(s.yhi - T)) >= 3 && (s.yhi < T || s.ylo > T));
      if (!ts.length) return null;
      ts.sort((a, b) => Math.abs(a - s.y) - Math.abs(b - s.y));
      const T = ts[Math.min(ts.length - 1, Math.floor((1 - h) * R() * ts.length))];   // schwer = nahe Grenze
      const before = s.yhi < T;
      return { k: 'when', y: T, dir: (before === want) ? 'before' : 'after', ok: want };
    },
    artist(s, want, h, R) {
      if (want) return { k: 'artist', A: s.A, ok: true, hide: 'a' };
      const win = lerp(14, 4, h), fame = lerp(120, 500, h), others = D.titleArt.get(s.tk);
      let c = D.famous.filter(e => e.ak !== s.ak && e.best <= fame && e.songs.some(o => Math.abs(o.y - s.y) <= win));
      if (h > .5 && s.g) { const sg = c.filter(e => e.g.has(s.g)); if (sg.length >= 5) c = sg; }
      for (let n = 0; n < 12 && c.length; n++) {
        const e = pick(c, R);
        if (others.has(e.ak) || related(e.A, s.parts)) { c = c.filter(x => x !== e); continue; }
        return { k: 'artist', A: e.A, ok: false, hide: 'a' };
      }
      return null;
    },
    title(s, want, h, R) {
      if (!s.T || s.T.length > 40) return null;
      if (want) return { k: 'title', T: s.T, ok: true, hide: 't' };
      const mine = D.byArtist.get(s.ai).songs.filter(o => o !== s);
      let c = h > .45 && mine.length ? mine : D.buckets.find(([d]) => d === Math.max(1960, decOf(s.y)))[1].filter(o => o.ak !== s.ak && Math.abs(o.f - s.f) < lerp(400, 150, h));
      const ws = words(s.T);
      c = c.filter(o => o.tk !== s.tk && o.T && o.T.length <= 40 && !words(o.T).includes(ws) && !ws.includes(words(o.T)) && !D.titleArt.get(o.tk).has(s.ak));
      if (!c.length) return null;
      return { k: 'title', T: pick(c, R).T, ok: false, hide: 't' };
    },
    streams(s, want, h, R) {
      if (!s.n) return null;
      if (want) {
        const ts = STREAMS.filter(T => T <= s.n && (T > 1000 || h < .3));
        if (!ts.length) return null;
        // schwer = Grenze knapp unter der echten Zahl
        return { k: 'streams', n: ts[Math.min(ts.length - 1, Math.floor(lerp(R() * ts.length, ts.length - 1, h)))], ok: true };
      }
      if (D.staleStreams) return null;
      const recent = s.y >= D.builtYear - 3, margin = recent ? .7 : .85;
      const ts = STREAMS.filter(T => T > 1000 && s.n <= T * margin);
      if (!ts.length) return null;
      return { k: 'streams', n: ts[Math.floor(lerp(R() * ts.length, 0, h))], ok: false };
    },
    older(s, want, h, R) {
      if (!yearOk(s)) return null;
      const gapMin = Math.round(lerp(12, 3, h)), gapMax = Math.round(lerp(60, 8, h)), fame = lerp(150, 600, h);
      const c = D.tracks.filter(o => o !== s && yearOk(o) && o.ak !== s.ak && o.f <= fame && !o.T.includes('(')
        && ((o.ylo - s.yhi >= gapMin && o.ylo - s.yhi <= gapMax) || (s.ylo - o.yhi >= gapMin && s.ylo - o.yhi <= gapMax)));
      if (!c.length) return null;
      const o = pick(c, R), sOlder = s.yhi < o.ylo;
      return { k: 'older', o, cmp: sOlder === want ? 'older' : 'newer', ok: want };
    },
  };
  const WEIGHTS = { dec: 24, when: 10, artist: 30, title: 8, streams: 15, older: 13 };

  /* ---------- Gegenprüfung: rechnet die Antwort unabhängig noch einmal aus ---------- */
  function verify(c) {
    const s = c.s, ys = [s.y, ...(s.y2 ? [s.y2] : [])];
    switch (c.k) {
      case 'dec': return ys.every(y => !edge(y) && (decOf(y) === c.d) === c.ok) && yearOk(s);
      case 'when': return ys.every(y => Math.abs(y - c.y) >= 3 && ((c.dir === 'before' ? y < c.y : y > c.y) === c.ok)) && yearOk(s);
      case 'artist': return c.ok ? key(c.A) === s.ak : key(c.A) !== s.ak && !related(c.A, s.parts) && !D.titleArt.get(s.tk).has(key(c.A));
      case 'title': return c.ok ? titleKey(c.T) === s.tk : titleKey(c.T) !== s.tk;
      case 'streams': return c.ok ? s.n >= c.n : s.n <= c.n * .85 && !D.staleStreams;
      case 'older': {
        const os = [c.o.y, ...(c.o.y2 ? [c.o.y2] : [])];
        return yearOk(s) && yearOk(c.o) && ys.every(a => os.every(b => Math.abs(a - b) >= 3 && ((c.cmp === 'older' ? a < b : a > b) === c.ok)));
      }
    }
    return false;
  }

  /* ---------- eine Karte ziehen ----------
     st = Zustand der Runde: { used: Set(ids), recent: [Interpreten-Schlüssel], truths: [bool] }
     h  = Schwierigkeit 0 (Anfang) … 1 */
  function makeCard(st, h, R) {
    // wahr oder falsch: zufällig, aber höchstens 4 gleiche hintereinander
    const last = st.truths.slice(-4);
    let want = R() < .5;
    if (last.length === 4 && last.every(x => x === last[0])) want = !last[0];
    for (let tries = 0; tries < 40; tries++) {
      // Art nach Gewicht
      let r = R() * Object.values(WEIGHTS).reduce((a, b) => a + b, 0), k = 'dec';
      for (const [kk, w] of Object.entries(WEIGHTS)) { if ((r -= w) < 0) { k = kk; break; } }
      // Song: bei Streams aus den Songs mit Zahl, sonst erst ein Jahrzehnt, dann ein Song daraus –
      // sonst wäre es ein „2020er-Spiel“ (die neuen Songs sind die größte Gruppe)
      const bucket = k === 'streams' ? D.withStreams : pick(D.buckets, R)[1];
      const top = bucket.slice(0, Math.max(25, Math.round(bucket.length * lerp(.18, 1, h))));
      const s = pick(top, R);
      if (st.used.has(s.i) || st.recent.includes(s.ak)) continue;
      const c = GEN[k](s, want, h, R);
      if (!c) continue;
      c.s = s; c.hide ??= null;
      if (!verify(c)) continue;
      st.used.add(s.i); st.recent.push(s.ak); if (st.recent.length > 5) st.recent.shift(); st.truths.push(c.ok);
      return c;
    }
    return null;
  }

  // Zufall mit Startwert (mulberry32, wie Gold Record) – Tages-Challenge: gleicher Startwert = gleiche Karten für alle
  function seeded(str) {
    let a = 0; for (const c of str) a = Math.imul(a ^ c.charCodeAt(0), 2654435761) >>> 0;
    return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  return { prepare, makeCard, verify, seeded, key, words, cleanTitle, titleKey, mainArtist, participants, related, isReissue, GEN, get D() { return D; } };
})();
if (typeof module !== 'undefined') module.exports = HM;
