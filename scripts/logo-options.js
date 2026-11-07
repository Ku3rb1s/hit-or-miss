// Logo- und Farbkonzepte für Hit or Miss → logo-options/index.html (zum Auswählen, mit Vorschau des Spielbildschirms)
// Aufruf: node scripts/logo-options.js                 (Übersicht schreiben)
//         node scripts/logo-options.js <id> > logo.svg  (ein Konzept als Logo ausgeben)
const fs = require('fs'), path = require('path');

// hit / miss / acc = [hell, kräftig]; bg = Hintergrund des Logos
const V = {
  stapel: {
    name: 'Kartenstapel', sub: 'Drei Karten wie beim Wischen: links Miss, rechts Hit, vorne die Platte mit Haken. Mint & Koralle auf Pflaume – verspielt, sofort klar.',
    bg: ['#3a1450', '#14061f'], hit: ['#a7f3d0', '#10b981'], miss: ['#fecdd3', '#fb7185'], acc: ['#f5d0fe', '#d946ef'],
  },
  treffer: {
    name: 'Volltreffer', sub: 'Platte als Zielscheibe, der Pfeil steckt mitten im Label. Bernstein & Cyan auf Nachtblau – sportlich, nach Wettkampf.',
    bg: ['#0f2347', '#070d1c'], hit: ['#a5f3fc', '#06b6d4'], miss: ['#fecaca', '#ef4444'], acc: ['#fde68a', '#f59e0b'],
  },
  haken: {
    name: 'Haken & Kreuz', sub: 'Das Label der Platte ist geteilt: links ✗, rechts ✓. Limette & Rot auf Graphit – schlicht und gut lesbar, auch ganz klein.',
    bg: ['#22262e', '#0c0d10'], hit: ['#d9f99d', '#84cc16'], miss: ['#fecdd3', '#f43f5e'], acc: ['#d9f99d', '#84cc16'],
  },
  nadel: {
    name: 'Tonarm-Haken', sub: 'Der Tonarm bildet einen Haken über der Platte – „stimmt!“. Gold & Violett, edel wie Gold Record, aber eigenständig.',
    bg: ['#24124a', '#0d0820'], hit: ['#fde68a', '#f59e0b'], miss: ['#c4b5fd', '#8b5cf6'], acc: ['#fde68a', '#f59e0b'],
  },
};

const grooves = (cx, cy, rs, o = .08) => `<g fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="2.5">${rs.map(r => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('')}</g>`;
const sheen = (cx, cy, r) => `<path d="M${cx} ${cy}L${cx - r * .7} ${cy - r * .71}A${r} ${r} 0 0 1 ${cx - r * .38} ${cy - r * .92}Z" fill="#fff" fill-opacity=".09"/><path d="M${cx} ${cy}L${cx + r * .7} ${cy + r * .71}A${r} ${r} 0 0 1 ${cx + r * .38} ${cy + r * .92}Z" fill="#fff" fill-opacity=".09"/>`;
const grad = (id, [a, b], x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const shadow = p => `<filter id="${p}sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity=".55"/></filter>`;
const glow = (p, c) => `<radialGradient id="${p}gl" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const check = (x, y, s, col, w = 14) => `<path d="M${x - s * .5} ${y}l${s * .35} ${s * .35}l${s * .65} -${s * .7}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (x, y, s, col, w = 14) => `<path d="M${x - s / 2} ${y - s / 2}l${s} ${s}M${x + s / 2} ${y - s / 2}l-${s} ${s}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

function logo(id, p = '') {
  const v = V[id];
  let d = grad(p + 'bg', v.bg, 1, 1) + grad(p + 'h', v.hit) + grad(p + 'm', v.miss) + grad(p + 'a', v.acc) + shadow(p), b = '';
  if (id === 'stapel') {
    d += glow(p, v.acc[1]);
    b = `<rect width="512" height="512" fill="url(#${p}gl)"/>
      <g filter="url(#${p}sh)">
        <rect x="96" y="120" width="220" height="290" rx="34" fill="url(#${p}m)" transform="rotate(-16 206 265)"/>
        <rect x="196" y="120" width="220" height="290" rx="34" fill="url(#${p}h)" transform="rotate(16 306 265)"/>
      </g>
      ${cross(112, 196, 38, '#4c0519', 14)}${check(402, 196, 44, '#064e3b', 14)}
      <g filter="url(#${p}sh)"><rect x="141" y="96" width="230" height="310" rx="36" fill="#17111f"/></g>
      <rect x="141" y="96" width="230" height="310" rx="36" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3"/>
      <circle cx="256" cy="226" r="86" fill="#08060c"/>${grooves(256, 226, [76, 64, 52])}${sheen(256, 226, 86)}
      <circle cx="256" cy="226" r="34" fill="url(#${p}a)"/><circle cx="256" cy="226" r="6" fill="#08060c"/>
      <rect x="178" y="338" width="156" height="16" rx="8" fill="#fff" fill-opacity=".22"/>
      <rect x="204" y="366" width="104" height="12" rx="6" fill="#fff" fill-opacity=".12"/>`;
  } else if (id === 'treffer') {
    d += glow(p, v.hit[1]);
    b = `<rect width="512" height="512" fill="url(#${p}gl)"/>
      <g filter="url(#${p}sh)"><circle cx="246" cy="270" r="196" fill="#090b12"/></g>${grooves(246, 270, [180, 160, 140, 120])}${sheen(246, 270, 196)}
      <circle cx="246" cy="270" r="150" fill="none" stroke="url(#${p}h)" stroke-width="12" stroke-opacity=".9"/>
      <circle cx="246" cy="270" r="104" fill="none" stroke="url(#${p}h)" stroke-width="12"/>
      <circle cx="246" cy="270" r="58" fill="url(#${p}a)"/><circle cx="246" cy="270" r="9" fill="#090b12"/>
      <g transform="rotate(-40 246 270)">
        <rect x="270" y="263" width="196" height="14" rx="7" fill="#f8fafc"/>
        <path d="M428 270l26-34h40l-26 34z" fill="url(#${p}m)" stroke="#090b12" stroke-width="4" stroke-linejoin="round"/>
        <path d="M428 270l26 34h40l-26-34z" fill="${v.miss[1]}" stroke="#090b12" stroke-width="4" stroke-linejoin="round"/>
        <path d="M240 270l50-27v54z" fill="#f8fafc" stroke="#090b12" stroke-width="5" stroke-linejoin="round"/>
      </g>`;
  } else if (id === 'haken') {
    d += `<clipPath id="${p}lab"><circle cx="256" cy="256" r="118"/></clipPath>`;
    b = `<g filter="url(#${p}sh)"><circle cx="256" cy="256" r="206" fill="#0b0c0f"/></g>${grooves(256, 256, [192, 176, 160, 144, 130])}${sheen(256, 256, 206)}
      <g clip-path="url(#${p}lab)"><rect x="138" y="138" width="118" height="236" fill="url(#${p}m)"/><rect x="256" y="138" width="118" height="236" fill="url(#${p}h)"/></g>
      <rect x="252" y="138" width="8" height="236" fill="#0b0c0f"/>
      ${cross(197, 256, 50, '#fff', 17)}${check(318, 262, 62, '#14200a', 17)}
      <circle cx="256" cy="256" r="118" fill="none" stroke="#0b0c0f" stroke-width="6"/>`;
  } else if (id === 'nadel') {
    d += glow(p, v.miss[1]);
    b = `<rect width="512" height="512" fill="url(#${p}gl)"/>
      <g filter="url(#${p}sh)"><circle cx="228" cy="288" r="180" fill="#0b0814"/></g>${grooves(228, 288, [166, 148, 130, 112, 94])}${sheen(228, 288, 180)}
      <circle cx="228" cy="288" r="62" fill="url(#${p}m)"/><circle cx="228" cy="288" r="8" fill="#0b0814"/>
      <circle cx="408" cy="104" r="34" fill="url(#${p}h)" stroke="#0b0814" stroke-width="6"/><circle cx="408" cy="104" r="11" fill="#0b0814"/>
      <g filter="url(#${p}sh)"><path d="M408 104L292 330L226 262" fill="none" stroke="url(#${p}h)" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/></g>
      <rect x="200" y="236" width="50" height="34" rx="9" fill="${v.hit[1]}" stroke="#0b0814" stroke-width="5" transform="rotate(45 225 253)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs>${d}</defs><rect width="512" height="512" fill="url(#${p}bg)"/>${b}</svg>`;
}

if (process.argv[2]) { process.stdout.write(logo(process.argv[2]) + '\n'); process.exit(0); }

// Vorschau: Logo groß/mittel/klein, Farben und ein Spielbildschirm im Kleinformat
const card = (id) => {
  const v = V[id];
  return `<section class="opt" style="--h1:${v.hit[0]};--h2:${v.hit[1]};--m1:${v.miss[0]};--m2:${v.miss[1]};--a1:${v.acc[0]};--a2:${v.acc[1]};--b1:${v.bg[0]};--b2:${v.bg[1]}">
    <div class="row"><div class="big">${logo(id, id + 'A')}</div>
      <div class="txt"><h2>${v.name}</h2><p>${v.sub}</p>
        <div class="sw"><i style="background:${v.hit[1]}"></i>Hit <i style="background:${v.miss[1]}"></i>Miss <i style="background:${v.acc[1]}"></i>Akzent</div>
        <div class="small"><div>${logo(id, id + 'B')}</div><div class="s32">${logo(id, id + 'C')}</div><span class="appname">Hit or Miss</span></div>
      </div></div>
    <div class="mock">
      <div class="m-head"><div class="m-logo">${logo(id, id + 'D')}</div><b>Hit or Miss</b></div>
      <div class="m-bar"><i></i></div>
      <div class="m-deck"><div class="m-card back"></div><div class="m-card"><span class="stamp">HIT</span><small>Africa · Toto</small><b>erschien in den <span>80ern</span></b></div></div>
      <div class="m-btns"><span class="mb miss">✗</span><span class="mb hit">✓</span></div>
    </div>
  </section>`;
};
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hit or Miss – Logo-Auswahl</title><link rel="stylesheet" href="../css/fonts.css"><style>
body{margin:0;background:#0c0c0f;color:#f4f4f6;font-family:Outfit,system-ui,sans-serif;padding:24px 16px 60px}
h1{text-align:center;margin:0 0 4px}.lead{text-align:center;color:#a1a1aa;margin:0 0 24px}
.grid{display:grid;gap:22px;max-width:1100px;margin:0 auto}
.opt{display:grid;grid-template-columns:1.4fr 1fr;gap:20px;align-items:center;padding:20px;border-radius:26px;background:linear-gradient(135deg,color-mix(in srgb,var(--b1) 70%,#000),#0f0f14);border:1px solid #ffffff1a}
.row{display:flex;gap:20px;align-items:center}.big svg{width:200px;height:200px;border-radius:44px;display:block;box-shadow:0 18px 40px -16px #000}
h2{margin:0 0 6px;font-size:1.5rem}.txt p{margin:0 0 12px;color:#c4c4cc;line-height:1.45;font-size:.95rem}
.sw{display:flex;align-items:center;gap:6px;font-size:.85rem;color:#a1a1aa;margin-bottom:12px}.sw i{width:18px;height:18px;border-radius:6px;display:inline-block;margin-left:6px}
.small{display:flex;align-items:center;gap:12px}.small svg{width:64px;height:64px;border-radius:15px;display:block}.small .s32 svg{width:32px;height:32px;border-radius:8px}
.appname{font-size:.8rem;color:#a1a1aa}
.mock{background:linear-gradient(160deg,color-mix(in srgb,var(--b1) 55%,#111),#0b0b10);border-radius:22px;padding:14px;border:1px solid #ffffff14}
.m-head{display:flex;align-items:center;gap:8px;margin-bottom:10px}.m-logo svg{width:28px;height:28px;border-radius:8px;display:block}
.m-head b{background:linear-gradient(90deg,var(--m1),#fff 45%,var(--h1));-webkit-background-clip:text;background-clip:text;color:transparent}
.m-bar{height:12px;border-radius:9px;background:#ffffff14;overflow:hidden;margin-bottom:12px}.m-bar i{display:block;height:100%;width:70%;background:linear-gradient(90deg,var(--a2),var(--a1))}
.m-deck{position:relative;height:130px;margin-bottom:12px}
.m-card{position:absolute;inset:0;border-radius:18px;background:#1c1b24;border:1px solid #ffffff22;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transform:rotate(5deg) translateX(14px);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--h2) 45%,transparent),0 12px 26px -12px #000}
.m-card.back{transform:scale(.94) translateY(8px);opacity:.5;box-shadow:none}
.m-card small{color:#a1a1aa}.m-card b{font-size:1.1rem}.m-card b span{color:var(--a1)}
.stamp{position:absolute;top:10px;left:12px;color:var(--h2);border:3px solid var(--h2);border-radius:8px;padding:0 6px;font-weight:900;transform:rotate(-14deg)}
.m-btns{display:flex;justify-content:center;gap:26px}.mb{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-size:1.4rem;font-weight:900;background:#15151c;border:3px solid}
.mb.miss{color:var(--m2);border-color:var(--m2)}.mb.hit{color:var(--h2);border-color:var(--h2)}
@media(max-width:760px){.opt{grid-template-columns:1fr}.row{flex-direction:column;text-align:center}.sw,.small{justify-content:center}}
</style></head><body><h1>Hit or Miss – Logo &amp; Farben</h1><p class="lead">Vier Entwürfe. Rechts jeweils, wie das Spiel damit aussieht.</p>
<div class="grid">${Object.keys(V).map(card).join('')}</div></body></html>`;
const out = path.join(__dirname, '..', 'logo-options');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('logo-options/index.html geschrieben (' + Object.keys(V).join(', ') + ')');
