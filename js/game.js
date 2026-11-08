/* Hit or Miss – Spielablauf und Anzeige
   Ein Song läuft, dazu eine Behauptung (js/claims.js). Wisch nach rechts = stimmt (Hit), nach links = stimmt nicht (Miss).
   Modi: 60 Sekunden (Fehler kosten 3 s), Sudden Death (5 s pro Karte, ein Fehler beendet die Runde), Entspannt (ohne Zeit, 20 Karten),
   Tägliche Challenge (60 Sekunden, gleiche Karten für alle am selben Tag – Tag nach deutscher Zeit). Konzept: KONZEPT.md */
const APP_VERSION = '1.0.7', APP_DATE = '07.11.2026'; // bei jedem Update erhöhen + CHANGELOG.md ergänzen
// Eigene Version für data/tracks.json – nur erhöhen, wenn sich die Songdaten geändert haben (scripts/build-data.js)
const DATA_V = 'd5';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const ROUND_MS = 60000, PENALTY_MS = 3000, SD_MS = 5000, LOCK_MS = 300;
const MODE_NAMES = { '60s': '60 Sekunden', sd: 'Sudden Death', zen: 'Entspannt' };
const MODE_INFO = {
  '60s': 'Eine Minute, so viele Treffer wie möglich. Jeder Fehler kostet 3 Sekunden, Serien bringen doppelte bis vierfache Punkte.',
  sd: 'Keine Gesamtzeit, aber nur 5 Sekunden pro Karte. Der erste Fehler beendet die Runde.',
  zen: 'Ohne Zeitlimit: 20 Karten in deinem Tempo. Nach jeder Antwort siehst du die Auflösung – zum Hören, Raten und Dazulernen.',
};
/* Schwierigkeit: h0/h1 = Schwierigkeit der Behauptungen bei der ersten bzw. ab etwa der 30. Karte (0 … 1, siehe js/claims.js:
   steuert, wie bekannt die Songs sind und wie knapp falsche Behauptungen danebenliegen – z. B. Nachbar-Jahrzehnt statt 40 Jahre daneben) */
const DIFF = { easy: { h0: 0, h1: .4 }, normal: { h0: 0, h1: 1 }, hard: { h0: .55, h1: 1 } };
const DIFF_NAMES = { easy: 'Leicht', normal: 'Normal', hard: 'Schwer' };
const DIFF_INFO = {
  easy: 'Nur große Hits, die falschen Behauptungen liegen weit daneben – zum Reinkommen.',
  normal: 'Wird im Lauf der Runde kniffliger: unbekanntere Songs, knappere Behauptungen.',
  hard: 'Von Anfang an knifflig: auch unbekanntere Songs, Nachbar-Jahrzehnte und Interpreten aus derselben Zeit.',
};
// Serien-Stufe: ab 5 richtigen in Folge ×2, ab 10 ×3, ab 20 ×4
const multOf = streak => streak >= 20 ? 4 : streak >= 10 ? 3 : streak >= 5 ? 2 : 1;
const THEMES = [['graphit', 'Graphit', '#3a4252', '#1f3a32'], ['ozean', 'Ozean', '#0b4f75', '#0d6e66'], ['wald', 'Wald', '#1d5a3a', '#4c5b1a'],
  ['abend', 'Abend', '#7a2e1c', '#7d1f4a'], ['lila', 'Lila', '#4a22a0', '#8a1458'], ['oled', 'OLED', '#000', '#000']];
const LOC = () => ({ de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES', nb: 'nb-NO' }[curLang] || 'de-DE');
const fmtN = n => Math.round(n).toLocaleString(LOC());
const SITE = 'https://ku3rb1s.github.io/hit-or-miss/';
const EPOCH = '2026-11-07';   // Tägliche Challenge #1

// Gespeichert wird mit „hom.“ vorne – alle Spiele teilen sich den Browser-Speicher von ku3rb1s.github.io
const LS = {
  get(k, d) { try { const v = localStorage.getItem('hom.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('hom.' + k, JSON.stringify(v)); } catch {} },
};
const sharedTheme = {
  get() { try { return JSON.parse(localStorage.getItem('mq.theme')) || 'graphit'; } catch { return 'graphit'; } },
  set(v) { try { localStorage.setItem('mq.theme', JSON.stringify(v)); } catch {} },
};
const opt = { mode: LS.get('mode', '60s'), diff: LS.get('diff', 'normal'), sfx: LS.get('sfx', true), vib: LS.get('vib', true), vol: LS.get('vol', 80), muted: false, theme: sharedTheme.get() };
if (!MODE_NAMES[opt.mode]) opt.mode = '60s';
if (!DIFF[opt.diff]) opt.diff = 'normal';
// Rekord je Modus und Stufe (Tägliche Challenge: immer 60 Sekunden · Normal)
const bestKey = (mode = opt.mode, diff = opt.diff) => `best.${mode}.${diff}`;
const modeLabel = g => g.daily ? tx('Tägliche Challenge #{n}', { n: dayNo(g.day) }) + (g.late ? ' · ' + tx('zählt nicht') : '') : tx(MODE_NAMES[g.mode]) + ' · ' + tx(DIFF_NAMES[g.diff]);

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Tag nach deutscher Zeit (wie Needle Drop und die Bestenliste)
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const prevDay = d => new Date(Date.parse(d) - 864e5).toISOString().slice(0, 10);
const dayNo = d => Math.round((Date.parse(d) - Date.parse(EPOCH)) / 864e5) + 1;
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' });

/* ---------- Cover ---------- */
const dzCover = (c, size) => `https://e-cdns-images.dzcdn.net/images/cover/${c}/${size}x${size}-000000-80-0-0.jpg`;
const COVER_FALLBACK = new Map();
const cover = (s, size = 500) => {
  if (!s.c) return '';
  if (!s.c.startsWith('mb:')) return dzCover(s.c, size);
  const url = `https://coverartarchive.org/release-group/${s.c.slice(3)}/front-${size <= 250 ? 250 : 500}`;
  if (s.c0) COVER_FALLBACK.set(url, dzCover(s.c0, size));
  return url;
};
addEventListener('error', e => { const i = e.target; if (i?.tagName === 'IMG' && COVER_FALLBACK.has(i.src)) i.src = COVER_FALLBACK.get(i.src); }, true);

/* ---------- Daten ---------- */
let DATA = null;
async function loadData() {
  if (DATA) return DATA;
  const r = await fetch('data/tracks.json?v=' + DATA_V);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const raw = await r.json();
  HM.prepare(raw);
  DATA = raw;
  // Fallback-Cover (Deezer), falls das Original-Cover nicht lädt
  const c0 = new Map(raw.tracks.filter(t => t.c0).map(t => [t.i, t.c0]));
  for (const s of HM.D.tracks) if (c0.has(s.i)) s.c0 = c0.get(s.i);
  return DATA;
}

/* ---------- Musik: zwei Player im Wechsel ----------
   Der Ausschnitt der nächsten Karte lädt schon im zweiten Player, damit beim Wischen keine Pause entsteht.
   Deezer-Links laufen nach ca. 15 Minuten ab – previewOf holt bei Bedarf einen frischen (wie Older or Newer). */
if (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) document.documentElement.classList.add('ios');
const players = [new Audio(), new Audio()];
players.forEach(p => { p.preload = 'auto'; p.addEventListener('playing', renderPlaying); p.addEventListener('pause', renderPlaying); });
let active = players[0];
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
const previews = new Map();
const linkUntil = url => { const m = String(url).match(/exp=(\d{9,})/); return m ? +m[1] * 1000 : Date.now() + 10 * 60e3; };
function previewOf(s, fresh = false) {
  const hit = previews.get(s.i);
  if (fresh || !hit || hit.until < Date.now() + 60e3) {
    const e = { until: Infinity };
    e.p = DZ.track(s.i).then(t => {
      if (!t.preview) throw new Error(tx('Keine Vorschau'));
      if (!s.c && t.album?.md5_image) s.c = t.album.md5_image;
      e.until = linkUntil(t.preview);
      return t.preview;
    });
    e.p.catch(() => { if (previews.get(s.i) === e) previews.delete(s.i); });
    previews.set(s.i, e);
  }
  return previews.get(s.i).p;
}
// iPhone: Ton geht erst nach einem Tipp – beim Start beide Player einmal „anstoßen“
function unlockAudio() {
  for (const p of players) { p._id = null; p._url = null; p.src = SILENT; p.play().then(() => p.pause()).catch(() => {}); }
}
function load(p, s) {
  p._id = s.i;
  return previewOf(s).then(url => { if (p._id === s.i && p._url !== url) { p._url = url; p.src = url; p.load(); } return url; });
}
// Ausschnitt der nächsten Karte vorladen (im Player, der gerade nicht spielt)
function preloadNext(s) { if (!s) return; const p = players.find(x => x !== active); if (p._id !== s.i) load(p, s).catch(() => {}); }
async function playSong(s, retry = true) {
  for (const p of players) if (p._id !== s.i) p.pause();
  const p = players.find(x => x._id === s.i) || players.find(x => x !== active);
  active = p;
  try {
    await load(p, s);
    if (active !== p || p._id !== s.i) return;
    applyVol();
    if (p.currentTime > 0.5 && !G?.over) p.currentTime = 0;
    await p.play();
  } catch (e) {
    if (e?.name === 'AbortError' || active !== p) return;
    if (retry && e?.name !== 'NotAllowedError') { previews.delete(s.i); p._url = null; return playSong(s, false); }
  }
}
function stopAudio() { for (const p of players) p.pause(); renderPlaying(); }
function renderPlaying() {
  const on = !active.paused && active._id;
  $$('[data-song]').forEach(el => el.classList.toggle('playing', !!on && +el.dataset.song === active._id));
}
function applyVol() {
  for (const p of players) { p.muted = opt.muted; p.volume = opt.vol / 100; }
  $('#volBox').classList.toggle('off', opt.muted);
  const r = $('#vol'); r.value = opt.vol; r.style.setProperty('--p', opt.vol + '%');
  $('#volVal').textContent = opt.muted ? '–' : opt.vol;
  $('#volMute use').setAttribute('href', opt.muted || !opt.vol ? '#i-mute' : '#i-vol');
}

/* ---------- Texte der Behauptungen ---------- */
const decLabel = d => d < 2000 ? String(d).slice(2) : String(d);
const bn = n => (n / 1000).toLocaleString(LOC(), { maximumFractionDigits: 2 });
const q = s => `<span class="nm">${esc(s)}</span>`;
function claimHtml(c) {
  switch (c.k) {
    case 'dec': return tx('erschien in den {d}ern', { d: decLabel(c.d) });
    case 'when': return c.dir === 'before' ? tx('erschien vor {y}', { y: c.y }) : tx('erschien nach {y}', { y: c.y });
    case 'artist': return tx('ist von {a}', { a: q(c.A) });
    case 'title': return tx('heißt »{t}«', { t: q(c.T) });
    case 'streams': return tx('hat über {n} Streams bei Spotify', { n: tx('{n} Mrd.', { n: bn(c.n) }) });
    case 'older': return (c.cmp === 'older' ? tx('ist älter als »{t}« von {a}', { t: q(c.o.T), a: q(c.o.A) }) : tx('ist neuer als »{t}« von {a}', { t: q(c.o.T), a: q(c.o.A) }));
  }
  return '';
}
// Die Wahrheit – für die Zeile nach einem Fehler und für die Auflösung
function factHtml(c) {
  const s = c.s;
  switch (c.k) {
    case 'dec': case 'when': return tx('erschien {y}', { y: `<b>${s.y}</b>` });
    case 'artist': return tx('ist von {a}', { a: `<b>${esc(s.A)}</b>` });
    case 'title': return tx('heißt »{t}«', { t: `<b>${esc(s.T)}</b>` });
    case 'streams': return tx('{n} Streams (Stand {d})', { n: `<b>${tx('{n} Mrd.', { n: bn(s.n) })}</b>`, d: fmtDate(HM.D.streamsAt) });
    case 'older': return tx('erschien {y}', { y: `<b>${s.y}</b>` }) + ' · ' + tx('»{t}«: {y}', { t: esc(c.o.T), y: `<b>${c.o.y}</b>` });
  }
  return '';
}

/* ---------- Spiel ---------- */
let G = null, raf = 0;
const hOf = i => { const k = G.mode === 'sd' ? Math.min(1, i / 35) : G.mode === 'zen' ? Math.min(1, i / 19) : Math.min(1, Math.pow(i / 28, 1.1)), D = DIFF[G.diff]; return D.h0 + (D.h1 - D.h0) * k; };
function nextCard() {
  const c = HM.makeCard(G.st, hOf(G.made++), G.R);
  if (c) previewOf(c.s).catch(() => {});
  return c;
}

async function startGame(daily = false) {
  if (G && !G.ended) return;
  unlockAudio();   // muss direkt im Tipp passieren (iPhone)
  $('#loading').classList.remove('hidden');
  try { await loadData(); } catch { $('#loading').classList.add('hidden'); return toast(tx('Die Songliste konnte nicht geladen werden.')); }
  $('#loading').classList.add('hidden');
  const day = today();
  const late = daily && !!LS.get('daily.' + day);
  const mode = daily ? '60s' : opt.mode, diff = daily ? 'normal' : opt.diff;
  G = {
    mode, diff, daily, day, late, R: daily ? HM.seeded('hit-or-miss-' + day) : Math.random,
    st: { used: new Set(), recent: [], truths: [] }, made: 0,
    score: 0, streak: 0, bestStreak: 0, right: 0, wrong: 0, log: [], queue: [], cur: null,
    best: LS.get(bestKey(mode, diff), 0), locked: true, over: false, ended: false,
  };
  // Tägliche Challenge: gilt ab dem Start als gespielt (Neuladen bringt keine zweite Chance)
  if (daily && !late) LS.set('daily.' + day, { score: 0, right: 0, wrong: 0, streak: 0, done: false });
  for (let i = 0; i < 4; i++) { const c = nextCard(); if (c) G.queue.push(c); }
  show('game');
  $('#deck').innerHTML = '';
  $('#fixLine').innerHTML = '';
  renderHud();
  if (mode === 'zen') drawProgress(); else drawTime(1, mode === 'sd' ? SD_MS : ROUND_MS);
  setButtons(false);
  // 3 – 2 – 1: Zeit zum Laden der ersten Ausschnitte
  const first = G.queue[0];
  if (first) load(active, first.s).catch(() => {});
  if (G.queue[1]) preloadNext(G.queue[1].s);
  const cd = $('#countdown');
  cd.classList.remove('hidden');
  $('#countTxt').textContent = modeLabel(G);
  for (const n of [3, 2, 1]) {
    if (!G || G.ended) return;
    $('#countNum').textContent = n; cd.classList.remove('tick'); void cd.offsetWidth; cd.classList.add('tick');
    await sleep(reduced() ? 500 : 700);
  }
  if (!G || G.ended) return;
  cd.classList.add('hidden');
  if (G.mode === '60s') G.tEnd = performance.now() + ROUND_MS;
  advance();
  loop();
}

// nächste Karte nach oben holen
function advance() {
  if (!G || G.over) return;
  const c = G.queue.shift();
  if (!c) return finish();
  const n = nextCard(); if (n) G.queue.push(n);
  G.cur = c; G.locked = true;
  renderCard(c);
  playSong(c.s);
  if (G.queue[0]) preloadNext(G.queue[0].s);
  G.cardStart = performance.now();
  setTimeout(() => { if (G && G.cur === c && !G.over) { G.locked = false; setButtons(true); } }, LOCK_MS);
}

/* Karten wie bei Tinder: oben die aktuelle Karte, darunter (unscharf) schon die nächste. Beim Ziehen färbt sich die
   Karte grün (Hit) bzw. rot (Miss), ein Stempel erscheint, die Karte darunter rückt nach. */
function cardHtml(c, kind = 'top', anim = '') {
  const s = c.s, img = cover(s, 250);
  const title = c.hide === 't' ? '<span class="qm">? ? ?</span>' : esc(s.T);
  const artist = c.hide === 'a' ? `<span class="qm">${tx('Wer ist das?')}</span>` : esc(s.A);
  return `<div class="card ${kind} ${anim}" ${kind === 'top' ? `data-song="${s.i}"` : 'aria-hidden="true"'}>
    ${kind === 'top' ? '<span class="tint hit"></span><span class="tint miss"></span><span class="stamp hit" data-no-tx>HIT</span><span class="stamp miss" data-no-tx>MISS</span>' : ''}
    <div class="card-song">
      <div class="cv">${img ? `<img src="${img}" alt="" draggable="false">` : ''}<span class="eq"><i></i><i></i><i></i><i></i></span></div>
      <div class="info"><div class="t">${title}</div><div class="a">${artist}</div></div>
    </div>
    <div class="claim"><span>${claimHtml(c)}</span></div>
  </div>`;
}
function renderCard(c) {
  const deck = $('#deck');
  const first = !deck.querySelector('.card.under');
  deck.querySelectorAll('.card.top:not(.fly), .card.under').forEach(el => el.remove());
  const next = G.queue[0];
  deck.insertAdjacentHTML('beforeend', (next ? cardHtml(next, 'under') : '') + cardHtml(c, 'top', first ? 'enter' : 'promote'));
  renderPlaying();
}
// Stempel und Farbe einer Karte setzen (k = 0 … 1, dir = 1 Hit, -1 Miss)
function tilt(el, dir, k) {
  el.querySelector('.stamp.hit').style.opacity = dir > 0 ? k : 0;
  el.querySelector('.stamp.miss').style.opacity = dir < 0 ? k : 0;
  el.querySelector('.tint.hit').style.opacity = dir > 0 ? k * .9 : 0;
  el.querySelector('.tint.miss').style.opacity = dir < 0 ? k * .9 : 0;
  const u = $('#deck .card.under');
  if (u) { u.style.transform = `translateY(${22 - 22 * k}px) scale(${.94 + .06 * k})`; u.style.opacity = .55 + .45 * k; u.style.filter = `blur(${3 - 3 * k}px)`; }
}
function renderHud() {
  if (!G) return;
  const m = multOf(G.streak);
  $('#streakPill').innerHTML = `<svg class="ic"><use href="#i-flame"/></svg>${G.streak}${m > 1 ? `<b class="mult">×${m}</b>` : ''}`;
  $('#streakPill').classList.toggle('hot', m > 1);
  $('#scoreTxt').textContent = G.mode === '60s' ? tx('{n} Punkte', { n: fmtN(G.score) }) : tx('{n} richtig', { n: G.right });
}
function drawTime(k, left) {
  const tb = $('#timebar');
  tb.querySelector('i').style.transform = `scaleX(${Math.max(0, Math.min(1, k))})`;
  $('#timeTxt').textContent = Math.max(0, Math.ceil(left / 1000)) + ' s';
  tb.classList.toggle('urgent', left < (G?.mode === 'sd' ? 2000 : 10000));
}
function loop() {
  cancelAnimationFrame(raf);
  const step = now => {
    if (!G || G.over) return;
    if (G.mode === '60s') {
      const left = G.tEnd - now;
      drawTime(left / ROUND_MS, left);
      if (left <= 0) return finish();
    } else if (G.mode === 'sd' && G.cur && G.cardStart) {
      const left = SD_MS - (now - G.cardStart);
      drawTime(left / SD_MS, left);
      if (left <= 0 && !G.locked) return answer(null);
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}
function setButtons(on) { for (const b of [$('#btnMiss'), $('#btnHit')]) b.disabled = !on; }

// saysTrue: true = Hit (stimmt), false = Miss (stimmt nicht), null = Zeit abgelaufen (Sudden Death)
function answer(saysTrue, fromSwipe = false) {
  if (!G || G.locked || G.over || !G.cur) return;
  const c = G.cur, ok = saysTrue === c.ok;
  G.locked = true; setButtons(false);
  const ms = Math.round(performance.now() - G.cardStart);
  let pts = 0;
  if (ok) { G.streak++; G.right++; G.bestStreak = Math.max(G.bestStreak, G.streak); pts = 10 * multOf(G.streak); G.score += pts; }
  else { G.streak = 0; G.wrong++; }
  G.log.push({ c, said: saysTrue, ok, ms });
  // Karte rausfliegen lassen (beim Wischen schon unterwegs; bei Knopf/Taste mit Stempel)
  const el = $('#deck .card.top:not(.fly)'), dir = saysTrue === null ? 0 : saysTrue ? 1 : -1;
  if (el) { if (dir) tilt(el, dir, 1); fly(el, dir, fromSwipe); }
  flash(ok, pts);
  sound(ok ? 'ok' : 'miss');
  renderHud();
  const fact = `<b>${esc(c.s.T)}</b> ${factHtml(c)}`;
  if (G.mode === 'zen') {
    // Entspannt: keine Zeit, keine Strafe – nach jeder Karte steht die Auflösung da, bis zur nächsten Antwort
    $('#fixLine').innerHTML = `<span class="fix-in ${ok ? 'good' : 'wrong'}">${ok ? '✓ ' + tx('Richtig!') : '✗ ' + tx('Daneben!')} ${fact}</span>`;
    if (!ok && opt.vib && navigator.vibrate) navigator.vibrate(90);
    drawProgress();
    if (G.log.length >= ZEN_CARDS) return finish();
  } else if (!ok) {
    if (opt.vib && navigator.vibrate) navigator.vibrate(90);
    $('#fixLine').innerHTML = `<span class="fix-in">${saysTrue === null ? '⏱ ' + tx('Zeit abgelaufen') + ' – ' : ''}${fact}</span>`;
    clearTimeout(G.fixT); G.fixT = setTimeout(() => { if ($('#fixLine .fix-in')) $('#fixLine').innerHTML = ''; }, 1800);
    if (G.mode === 'sd') { G.over = true; stopAudio(); setTimeout(endGame, 1400); return; }
    G.tEnd -= PENALTY_MS;
    bump('#timebar', 'penalty');
  } else if (pts > 10 && multOf(G.streak) !== multOf(G.streak - 1)) toast(`🔥 ×${multOf(G.streak)}`, 900);
  if (G.mode === '60s' && G.tEnd - performance.now() <= 0) return finish();
  setTimeout(advance, reduced() ? 60 : 140);
}
function fly(el, dir, fromSwipe) {
  el.classList.add('fly');
  if (reduced()) { el.remove(); return; }
  // vom aktuellen Punkt aus weiter in Wischrichtung (wie bei Tinder), sonst von der Mitte aus
  const m = fromSwipe && el.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\) rotate\(([-\d.]+)deg\)/);
  const [x, y, r] = m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
  el.style.transition = 'transform .34s cubic-bezier(.25,.6,.35,1), opacity .34s';
  requestAnimationFrame(() => {
    el.style.transform = dir ? `translate(${x + dir * innerWidth}px, ${y - 30}px) rotate(${r + dir * 22}deg)` : 'translateY(70px) scale(.9)';
    el.style.opacity = '0';
  });
  setTimeout(() => el.remove(), 380);
}
const ZEN_CARDS = 20;
function drawProgress() {
  const n = G.log.length;
  $('#timebar i').style.transform = `scaleX(${n / ZEN_CARDS})`;
  $('#timeTxt').textContent = tx('Karte {n} von {m}', { n: Math.min(ZEN_CARDS, n + 1), m: ZEN_CARDS });
  $('#timebar').classList.remove('urgent');
}
function flash(ok, pts) {
  const g = $('#game');
  g.classList.remove('ok', 'bad'); void g.offsetWidth; g.classList.add(ok ? 'ok' : 'bad');
  if (ok && pts) {
    const p = document.createElement('span'); p.className = 'plus'; p.textContent = '+' + pts;
    $('.hud-row').appendChild(p); setTimeout(() => p.remove(), 800);
  }
}
const bump = (sel, cls) => { const e = $(sel); e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); };

function finish() {
  if (!G || G.over) return;
  G.over = true;
  cancelAnimationFrame(raf);
  drawTime(0, 0);
  setButtons(false);
  stopAudio();
  sound('end');
  setTimeout(endGame, 700);
}

/* ---------- Wischen ---------- */
{
  let drag = null;
  const deck = $('#deck');
  deck.addEventListener('pointerdown', e => {
    const el = e.target.closest('.card.top:not(.fly)');
    if (!el || !G || G.over) return;
    const r = el.getBoundingClientRect();
    // wie bei Tinder: oben angefasst kippt die Karte mit der Wischrichtung, unten angefasst dagegen
    drag = { el, x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, dx: 0, vx: 0, lx: e.clientX, lt: performance.now(),
      sign: e.clientY - r.top < r.height * .6 ? 1 : -1, th: Math.max(70, r.width * .25), over: false };
    el.style.transformOrigin = `${e.clientX - r.left}px ${drag.sign > 0 ? r.height * 1.4 : -r.height * .4}px`;
    try { el.setPointerCapture(e.pointerId); } catch {}
    el.style.transition = 'none';
    el.classList.add('dragging');
  });
  deck.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now();
    drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
    drag.dx = e.clientX - drag.x;
    const dy = (e.clientY - drag.y) * .35;
    drag.el.style.transform = `translate(${drag.dx}px, ${dy}px) rotate(${drag.sign * drag.dx / 22}deg)`;
    const k = Math.min(1, Math.abs(drag.dx) / drag.th);
    tilt(drag.el, Math.sign(drag.dx), k);
    // kleines Antippen in der Hand, sobald die Karte „loslassbar“ ist
    if ((k >= 1) !== drag.over) { drag.over = k >= 1; if (drag.over && opt.vib && navigator.vibrate) navigator.vibrate(8); }
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { el, dx, vx, th } = drag; drag = null;
    el.classList.remove('dragging');
    // weit genug gezogen – oder kurz und schnell geschnippt (in dieselbe Richtung)
    const flick = Math.abs(vx) > .55 && Math.abs(dx) > 25 && Math.sign(vx) === Math.sign(dx);
    if ((Math.abs(dx) >= th || flick) && G && !G.locked && !G.over) return answer(dx > 0, true);
    // zurückschnellen (auch, wenn die Karte noch gesperrt ist)
    el.style.transition = 'transform .38s cubic-bezier(.3,1.5,.5,1)';
    el.style.transform = '';
    const u = $('#deck .card.under'); if (u) u.style.transition = 'transform .38s, opacity .38s, filter .38s';
    tilt(el, 0, 0);
    if (u) { u.style.transform = ''; u.style.opacity = ''; u.style.filter = ''; setTimeout(() => { u.style.transition = ''; }, 400); }
    if (Math.abs(dx) < 6 && G?.cur) playSong(G.cur.s);   // Tippen: Ausschnitt nochmal von vorn
  };
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', end);
}

/* ---------- Ende ---------- */
function endGame() {
  if (!G || G.ended) return;
  G.ended = true; G.over = true;
  cancelAnimationFrame(raf);
  stopAudio();
  const value = G.mode === '60s' ? G.score : G.right;
  const best = LS.get(bestKey(G.mode, G.diff), 0), isBest = !G.late && value > best;
  if (isBest) LS.set(bestKey(G.mode, G.diff), value);
  if (G.daily && !G.late) {
    const res = { score: G.score, right: G.right, wrong: G.wrong, streak: G.bestStreak, row: G.log.map(l => l.ok ? 1 : 0).join(''), done: true };
    LS.set('daily.' + G.day, res);
    const dl = LS.get('dailyLog', {}); dl[G.day] = G.score; LS.set('dailyLog', dl);
  }
  recordStats(G);
  const fresh = checkAch(G);
  $('#endMode').textContent = modeLabel(G);
  $('#endKicker').textContent = G.mode === 'sd' ? tx('Richtig in Folge') : G.mode === 'zen' ? tx('Richtig von {n}', { n: ZEN_CARDS }) : tx('Deine Punkte');
  $('#endScore').textContent = fmtN(value);
  $('#endSub').textContent = isBest && best ? '🏆 ' + tx('Neuer Rekord!') : isBest ? '🏆 ' + tx('Erster Rekord!') : best ? tx('Rekord: {n}', { n: fmtN(best) }) : '';
  $('#endBest').textContent = G.daily ? '🔥 ' + streakTxt(dailyStreak()) : tx('Rekord: {n}', { n: fmtN(Math.max(best, value)) });
  const avg = G.log.length ? G.log.reduce((a, l) => a + l.ms, 0) / G.log.length / 1000 : 0;
  $('#endStats').innerHTML = [
    `<span><b>${G.right}</b> ${tx('richtig')}</span>`, `<span><b>${G.wrong}</b> ${tx('falsch')}</span>`,
    `<span>🔥 <b>${G.bestStreak}</b> ${tx('beste Serie')}</span>`, `<span>⏱ <b>${avg.toLocaleString(LOC(), { maximumFractionDigits: 1 })} s</b> ${tx('pro Karte')}</span>`,
  ].join('');
  const note = G.daily ? (G.late ? tx('Nachgespielt – zählt nicht für die Bestenliste.') : tx('Die nächste Challenge gibt es morgen.')) : '';
  $('#endNote').textContent = note; $('#endNote').classList.toggle('hidden', !note);
  $('#againBtn').classList.toggle('hidden', G.daily);
  endFilter = G.wrong ? 'wrong' : 'all';
  renderEndList();
  show('end');
  if (isBest && value >= (G.mode === 'sd' ? 5 : G.mode === 'zen' ? 15 : 100)) confetti(140);
  fresh.forEach((a, k) => setTimeout(() => toast(`${a[1]} ${tx(a[2])}`, 2600), 600 + k * 2800));
}
let endFilter = 'all';
function renderEndList() {
  $$('#endFilter button').forEach(b => b.classList.toggle('on', b.dataset.v === endFilter));
  const rows = G.log.map((l, i) => ({ ...l, i })).filter(l => endFilter === 'all' || !l.ok);
  $('#endList').innerHTML = rows.length ? rows.map(l => {
    const c = l.c, s = c.s, said = l.said === null ? '⏱' : l.said ? 'Hit' : 'Miss';
    return `<div class="cell res ${l.ok ? 'ok' : 'bad'}" data-song="${s.i}" data-play="${s.i}">
      <span class="res-cv">${cover(s, 120) ? `<img src="${cover(s, 120)}" alt="" loading="lazy">` : ''}<span class="eq"><i></i><i></i><i></i></span></span>
      <span class="grow"><b>${esc(s.T)}</b> · ${esc(s.A)}
        <span class="sub claim-line">„${claimHtml(c)}“ → ${c.ok ? tx('stimmt') : tx('stimmt nicht')}</span>
        <span class="sub fact-line">${factHtml(c)}</span></span>
      <span class="res-mark" title="${esc(tx('Deine Antwort: {a}', { a: said }))}">${l.ok ? '✓' : '✗'}</span></div>`;
  }).join('') : `<div class="cell muted">${tx('Keine Fehler – stark!')}</div>`;
  renderPlaying();
}
function streakTxt(n) { return n === 1 ? tx('1 Tag in Folge') : tx('{n} Tage in Folge', { n }); }
function dailyStreak() {
  const dl = LS.get('dailyLog', {}); let d = today(), n = 0;
  if (!(d in dl)) d = prevDay(d);
  while (d in dl) { n++; d = prevDay(d); }
  return n;
}
function shareText() {
  const row = G.log.slice(0, 40).map(l => l.ok ? '🟩' : '🟥').join('') + (G.log.length > 40 ? '…' : '');
  const head = G.daily ? `Hit or Miss #${dayNo(G.day)} 🎯` : `Hit or Miss 🎯 ${modeLabel(G)}`;
  const main = G.mode === 'sd' ? tx('{n} richtig in Folge', { n: G.right }) : G.mode === 'zen' ? tx('{n} von {m} richtig', { n: G.right, m: ZEN_CARDS }) : `${tx('{n} Punkte', { n: fmtN(G.score) })} · ✅ ${G.right} ❌ ${G.wrong} · 🔥 ${G.bestStreak}`;
  return `${head}\n${main}\n${row}\n${SITE}`;
}
async function shareResult() {
  const text = shareText();
  try {
    if (navigator.share) return await navigator.share({ text });
    await navigator.clipboard?.writeText(text);
    toast(tx('Ergebnis kopiert'));
  } catch { /* abgebrochen */ }
}

/* ---------- Statistik & Erfolge ---------- */
function recordStats(g) {
  const st = LS.get('stats', { games: 0, right: 0, wrong: 0, best: 0, streak: 0, sd: 0, types: {} });
  st.games++; st.right += g.right; st.wrong += g.wrong; st.streak = Math.max(st.streak, g.bestStreak);
  if (g.mode === '60s') st.best = Math.max(st.best, g.score); else st.sd = Math.max(st.sd || 0, g.right);
  st.types ||= {};
  for (const l of g.log) { const t = (st.types[l.c.k] ||= [0, 0]); t[1]++; if (l.ok) t[0]++; }
  LS.set('stats', st);
}
const TYPE_NAMES = { dec: 'Jahrzehnt', when: 'Vor oder nach', artist: 'Interpret', title: 'Titel', streams: 'Streams', older: 'Älter oder neuer' };
const ACH = [
  ['first', '🎧', 'Erste Runde', 'Eine Runde gespielt'],
  ['streak10', '🔥', 'Heiße Spur', '10 richtig in Folge'],
  ['streak25', '🚀', 'Nicht zu bremsen', '25 richtig in Folge'],
  ['p500', '⭐', 'Fünfhundert', '500 Punkte in einer Runde'],
  ['p1000', '🏆', 'Tausender', '1.000 Punkte in einer Runde'],
  ['clean', '💯', 'Fehlerfrei', '20 Karten ohne Fehler in einer Runde'],
  ['sd20', '☠️', 'Überlebt', '20 richtig im Sudden Death'],
  ['daily3', '📅', 'Dranbleiben', '3 Tage in Folge die Tägliche Challenge gespielt'],
  ['daily7', '🗓️', 'Eine ganze Woche', '7 Tage in Folge die Tägliche Challenge gespielt'],
  ['decades', '📻', 'Zeitreisender', 'In einer Runde Songs aus 6 Jahrzehnten richtig'],
];
function checkAch(g) {
  const have = LS.get('ach', {}), fresh = [];
  const decs = new Set(g.log.filter(l => l.ok).map(l => Math.floor(l.c.s.y / 10)));
  const ok = {
    first: true, streak10: g.bestStreak >= 10, streak25: g.bestStreak >= 25, p500: g.score >= 500, p1000: g.score >= 1000,
    clean: g.wrong === 0 && g.right >= 20, sd20: g.mode === 'sd' && g.right >= 20,
    daily3: dailyStreak() >= 3, daily7: dailyStreak() >= 7, decades: decs.size >= 6,
  };
  for (const a of ACH) if (ok[a[0]] && !have[a[0]]) { have[a[0]] = today(); fresh.push(a); }
  if (fresh.length) LS.set('ach', have);
  return fresh;
}
function renderStats() {
  const st = Sync.view('hom.stats', LS.get('stats', null));
  if (!st?.games) { $('#statsBox').innerHTML = `<div class="group-f" style="margin-top:14px">${tx('Noch keine Spiele')}</div>`; return; }
  const pct = (r, n) => n ? Math.round(r / n * 100) + ' %' : '–';
  const rows = [
    [tx('Runden'), fmtN(st.games)],
    [tx('Richtige Antworten'), `${fmtN(st.right)} (${pct(st.right, st.right + st.wrong)})`],
    [tx('Längste Serie'), fmtN(st.streak)],
  ];
  // Rekorde je Modus und Stufe
  const bests = [];
  for (const m in MODE_NAMES) for (const d in DIFF) {
    const v = LS.get(bestKey(m, d), 0);
    if (v) bests.push([tx(MODE_NAMES[m]) + ' · ' + tx(DIFF_NAMES[d]), m === '60s' ? tx('{n} Punkte', { n: fmtN(v) }) : m === 'zen' ? v + '/' + ZEN_CARDS : tx('{n} richtig', { n: v })]);
  }
  const types = Object.entries(TYPE_NAMES).filter(([k]) => st.types?.[k]?.[1]).map(([k, n]) => [tx(n), pct(...st.types[k])]);
  const have = LS.get('ach', {});
  $('#statsBox').innerHTML = `<div class="group" style="margin-top:14px">${rows.map(([k, v]) => `<div class="cell"><span class="grow">${k}</span><b>${v}</b></div>`).join('')}</div>`
    + (bests.length ? `<div class="group-h">${tx('Rekorde')}</div><div class="group">${bests.map(([k, v]) => `<div class="cell"><span class="grow">${k}</span><b>${v}</b></div>`).join('')}</div>` : '')
    + (types.length ? `<div class="group-h">${tx('Treffer je Art')}</div><div class="group">${types.map(([k, v]) => `<div class="cell"><span class="grow">${k}</span><b>${v}</b></div>`).join('')}</div>` : '')
    + `<div class="group-h">${tx('Erfolge')} · ${Object.keys(have).length}/${ACH.length}</div><div class="group icons">${ACH.map(a => `<div class="cell ach ${have[a[0]] ? '' : 'locked'}"><span class="cell-ic ach-ic">${a[1]}</span><span class="grow">${tx(a[2])}<span class="sub">${tx(a[3])}</span></span>${have[a[0]] ? '<b>✓</b>' : ''}</div>`).join('')}</div>`;
}

/* ---------- Töne & Konfetti ---------- */
let actx = null;
function sound(type) {
  if (!opt.sfx || opt.muted) return;
  try {
    actx ??= new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === 'ok' ? [[740, 0], [1110, .06]] : type === 'end' ? [[520, 0], [660, .12], [880, .24]] : [[260, 0], [180, .1]];
    for (const [f, t] of notes) {
      const o = actx.createOscillator(), g = actx.createGain(), at = actx.currentTime + t;
      o.type = type === 'miss' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(type === 'miss' ? .07 : .14, at + .012); g.gain.exponentialRampToValueAtTime(0.0001, at + .16);
      o.connect(g).connect(actx.destination); o.start(at); o.stop(at + .2);
    }
  } catch {}
}
function confetti(n = 90) {
  if (!opt.sfx || reduced()) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const colors = ['#10b981', '#fb7185', '#d946ef', '#ffffff', '#f5d0fe'];
  box.innerHTML = Array.from({ length: n }, () => `<i style="left:${Math.random() * 100}%;background:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * .4}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}

/* ---------- Anzeige ---------- */
function show(id) {
  for (const s of ['home', 'game', 'end']) $('#' + s).classList.toggle('hidden', s !== id);
  $('#btnQuit').classList.toggle('hidden', id !== 'game');
  window.scrollTo(0, 0);
}
function renderHome() {
  $$('#setMode button').forEach(b => b.classList.toggle('on', b.dataset.v === opt.mode));
  $('#modeInfo').textContent = tx(MODE_INFO[opt.mode]);
  $$('#setDiff button').forEach(b => b.classList.toggle('on', b.dataset.v === opt.diff));
  $('#diffInfo').textContent = tx(DIFF_INFO[opt.diff]);
  const best = LS.get(bestKey(), 0);
  $('#bestPill').textContent = best ? '🏆 ' + tx('Rekord: {n}', { n: opt.mode === 'zen' ? best + '/' + ZEN_CARDS : fmtN(best) }) : tx('Noch kein Rekord');
  // Beispiel auf der Startseite: stimmt (Stand 07.11.2026: 5,67 Mrd. – Streams wachsen nur, es bleibt also wahr)
  $('#demoClaim').textContent = tx('hat über {n} Streams bei Spotify', { n: tx('{n} Mrd.', { n: 5 }) });
  const d = today(), res = LS.get('daily.' + d), st = dailyStreak();
  $('#dailyTitle').textContent = tx('Tägliche Challenge #{n}', { n: dayNo(d) });
  $('#dailySub').textContent = res ? (res.done ? tx('Heute: {n} Punkte', { n: fmtN(res.score) }) : tx('Heute abgebrochen')) + (st ? ' · 🔥 ' + streakTxt(st) : '') + ' · ' + tx('nochmal spielen (zählt nicht)')
    : tx('Heute für alle dieselben Behauptungen') + (st ? ' · 🔥 ' + streakTxt(st) : '');
  $('#dailyBtn').classList.toggle('done', !!res);
}
let toastT = 0;
function toast(msg, ms = 3500) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), ms); }
// Rückfrage im Stil des Spiels statt confirm()
function ask(text, okLabel, danger = false) {
  const d = $('#askDlg');
  $('#askText').textContent = text; $('#askOk').textContent = okLabel; $('#askOk').classList.toggle('danger', danger);
  return new Promise(res => {
    const done = v => { d.onclose = null; if (d.open) d.close(); res(v); };
    $('#askOk').onclick = () => done(true); $('#askNo').onclick = () => done(false);
    d.onclick = e => { if (e.target === d) done(false); };
    d.onclose = () => res(false);
    d.showModal(); $('#askOk').focus();
  });
}

/* ---------- Einstellungen ---------- */
function applyTheme() {
  const th = THEMES.find(x => x[0] === opt.theme) ? opt.theme : 'graphit';
  document.documentElement.dataset.theme = th;
  $('meta[name=theme-color]').content = { graphit: '#0c0c0f', lila: '#0d0a1a', ozean: '#05111a', abend: '#130a0b', wald: '#08110c', oled: '#000000' }[th];
  $('#themeRow').innerHTML = THEMES.map(([id, name, a, b]) => `<button class="theme-pick ${th === id ? 'on' : ''}" data-theme-pick="${id}"><i style="background:linear-gradient(135deg,${a},${b})"></i>${tx(name)}</button>`).join('');
}
function renderSettings() {
  $('#setSfx').checked = !!opt.sfx; $('#setVib').checked = !!opt.vib;
  $('#subHelp').textContent = [opt.sfx ? 'Töne an' : 'Töne aus', opt.vib ? 'Vibration an' : 'Vibration aus'].map(s => tx(s)).join(' · ');
  $('#subDesign').textContent = tx((THEMES.find(x => x[0] === opt.theme) || THEMES[0])[1]);
  $('#langSel').innerHTML = langOptions();
  const st = Sync.view('hom.stats', LS.get('stats', null));
  $('#subStats').textContent = st?.games ? tx(st.games === 1 ? '{n} Runde' : '{n} Runden', { n: st.games }) + ' · ' + tx('Längste Serie {n}', { n: st.streak }) : tx('Noch keine Spiele');
  if (HM.D) $('#streamsInfo').textContent = tx('Spotify-Streams von kworb.net, Stand {d}. Die Zahlen wachsen – darum gibt es nur „über …“-Behauptungen.', { d: fmtDate(HM.D.streamsAt) });
  $('#appVersion').innerHTML = `Hit or Miss · ${tx('Version')} ${APP_VERSION} · ${APP_DATE}<span>${tx('Neuerungen ansehen')} ›</span>`;
  applyTheme(); applyVol();
}
function renderProfile() {
  const p = Profile.get(), s = Sync.status();
  let saved = false; try { saved = JSON.parse(localStorage.getItem('hub.codeSaved')) === s.code; } catch {}
  const unsaved = s.connected && !saved;
  $('#syncTitle').textContent = s.connected ? tx('Dein Code') : tx('Auf anderen Geräten weiterspielen');
  $('#syncSub').textContent = unsaved ? '⚠️ ' + tx('Noch nicht gesichert – in der Jukebox sichern')
    : s.connected ? '✓ ' + tx('Abgeglichen · verwalten in der Jukebox')   /* Code selbst nur in der Jukebox */ : tx('Rekorde, Serien und Profil mit einem Code mitnehmen – ohne E-Mail und Passwort');
  $('#syncIc').style.background = unsaved ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : s.connected ? 'linear-gradient(135deg,#10b981,#0ea5e9)' : 'linear-gradient(135deg,#ff4f86,#fbbf24)';
  $('#profEmoji').textContent = p.emoji;
  if (document.activeElement !== $('#profName')) $('#profName').value = p.name;
}
function goPage(p, back = false) {
  const page = $(`#sheetSettings .page[data-page="${p}"]`) || $('#sheetSettings .page[data-page="main"]');
  $$('#sheetSettings .page').forEach(x => x.classList.toggle('active', x === page));
  page.classList.toggle('back', back);
  $('#navTitle').textContent = page.dataset.title;
  $('#navBack').classList.toggle('invisible', page.dataset.page === 'main');
  $('#sheetSettings .sheet-body').scrollTop = 0;
  if (page.dataset.page === 'changes') renderChanges();
  if (page.dataset.page === 'stats') renderStats();
}
let changesCache = null;
async function renderChanges() {
  const box = $('#changesList');
  if (!changesCache) {
    box.innerHTML = '<div class="cell muted"><span class="loader"></span></div>';
    try {
      const r = await fetch('CHANGELOG.md?v=' + APP_VERSION);
      if (!r.ok) throw new Error();
      changesCache = []; let cur = null;
      for (const line of (await r.text()).split(/\r?\n/)) {
        const hd = line.match(/^##\s+(\S+)(?:\s+[–-]\s+(.+))?$/);
        if (hd) { cur = { ver: hd[1], date: hd[2] || '', items: [] }; changesCache.push(cur); continue; }
        const li = line.match(/^\s*[-*]\s+(.*)$/);
        if (li && cur) cur.items.push(li[1]);
      }
    } catch { box.innerHTML = `<div class="cell muted">${tx('Die Neuerungen konnten nicht geladen werden.')}</div>`; return; }
  }
  const fmt = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  box.innerHTML = changesCache.map(v => `<div class="chg"><div class="chg-h"><b>${esc(v.ver)}</b>${v.ver === APP_VERSION ? `<span class="chg-now">${tx('aktuell')}</span>` : ''}<span class="chg-d">${esc(v.date)}</span></div>
    <ul>${v.items.map(i => `<li>${fmt(i)}</li>`).join('')}</ul></div>`).join('');
}

/* ---------- Ereignisse ---------- */
$('#setDiff').onclick = e => { const b = e.target.closest('button'); if (b) { opt.diff = b.dataset.v; LS.set('diff', opt.diff); renderHome(); } };
$('#setMode').onclick = e => { const b = e.target.closest('button'); if (b) { opt.mode = b.dataset.v; LS.set('mode', opt.mode); renderHome(); } };
$('#startBtn').onclick = () => startGame(false);
$('#dailyBtn').onclick = () => startGame(true);
$('#againBtn').onclick = () => { G = null; startGame(false); };
$('#btnHit').onclick = () => answer(true);
$('#btnMiss').onclick = () => answer(false);
$('#shareBtn').onclick = shareResult;
$('#endFilter').onclick = e => { const b = e.target.closest('button'); if (b) { endFilter = b.dataset.v; renderEndList(); } };
$('#endList').onclick = e => {
  const r = e.target.closest('[data-play]'); if (!r || !HM.D) return;
  const s = HM.D.byId.get(+r.dataset.play);
  if (active._id === s.i && !active.paused) stopAudio(); else playSong(s);
};
const goHome = () => { stopAudio(); cancelAnimationFrame(raf); if (G && !G.ended) G.ended = G.over = true; G = null; renderHome(); show('home'); };
async function leave() {
  if (G && !G.ended && !$('#game').classList.contains('hidden')) {
    const dailyRun = G.daily && !G.late;
    if (!(await ask(dailyRun ? tx('Tägliche Challenge beenden? Sie zählt dann mit dem jetzigen Stand.') : tx('Runde abbrechen? Sie wird nicht gewertet.'), tx('Beenden'), true))) return;
    if (dailyRun) { G.over = true; return endGame(); }
  }
  goHome();
}
$('#homeBtn').onclick = goHome;
$('#btnQuit').onclick = leave;
$('#logoBtn').onclick = leave;

const sheet = $('#sheetSettings');
$('#btnSettings').onclick = () => { renderSettings(); renderProfile(); goPage('main'); sheet.showModal(); };
sheet.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) goPage(g.dataset.go); });
sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });
sheet.addEventListener('close', () => { if (!$('#home').classList.contains('hidden')) renderHome(); });
$('#navBack').onclick = () => goPage('main', true);
$('#profEmoji').onclick = () => Profile.pick(e => { $('#profEmoji').textContent = e; });
$('#profName').oninput = () => Profile.set({ name: $('#profName').value });
$('#profName').onkeydown = e => { if (e.key === 'Enter') $('#profName').blur(); };
$('#setSfx').onchange = e => { opt.sfx = e.target.checked; LS.set('sfx', opt.sfx); renderSettings(); sound('ok'); };
$('#setVib').onchange = e => { opt.vib = e.target.checked; LS.set('vib', opt.vib); renderSettings(); if (opt.vib && navigator.vibrate) navigator.vibrate(60); };
$('#vol').oninput = e => { opt.vol = +e.target.value; opt.muted = false; LS.set('vol', opt.vol); applyVol(); };
$('#volMute').onclick = () => { opt.muted = !opt.muted; applyVol(); };
$('#themeRow').onclick = e => { const b = e.target.closest('[data-theme-pick]'); if (!b) return; opt.theme = b.dataset.themePick; sharedTheme.set(opt.theme); renderSettings(); };
$('#langSel').onchange = e => setLang(e.target.value);
$('#btnResetAll').onclick = async () => {
  if (!(await ask(tx('Alles löschen, was Hit or Miss auf diesem Gerät gespeichert hat?'), tx('Löschen'), true))) return;
  try { Object.keys(localStorage).filter(k => k.startsWith('hom.')).forEach(k => localStorage.removeItem(k)); } catch {}
  Sync.leave(); // vom persönlichen Code trennen, sonst käme beim nächsten Abgleich alles zurück
  location.reload();
};
self.liveLang = () => {
  renderHome();
  if (sheet.open) { renderSettings(); goPage($('#sheetSettings .page.active')?.dataset.page || 'main'); }
  if (G && !$('#game').classList.contains('hidden')) {
    renderHud();
    const el = $('#deck .card.top:not(.fly) .claim span'); if (el && G.cur) el.innerHTML = claimHtml(G.cur);
    const un = $('#deck .card.under .claim span'); if (un && G.queue[0]) un.innerHTML = claimHtml(G.queue[0]);   // auch die Karte darunter
    $$('#deck .card .qm').forEach(q => { if (q.textContent !== '? ? ?') q.textContent = tx('Wer ist das?'); });
  }
  if (G && !$('#end').classList.contains('hidden')) renderEndList();
};
document.addEventListener('keydown', e => {
  if ($('#game').classList.contains('hidden') || sheet.open || $('#askDlg').open || e.target.matches?.('input,select,textarea')) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); answer(false); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); answer(true); }
  else if (e.key === 'm' || e.key === 'M') { opt.muted = !opt.muted; applyVol(); }
});

/* ---------- Start ---------- */
applyTheme(); applyVol(); renderHome();
loadData().catch(() => {});
addEventListener('jukebox-sync', () => { if (!G) renderHome(); if (document.querySelector('dialog[open]')) renderSettings(); });
