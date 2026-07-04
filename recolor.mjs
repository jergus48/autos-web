import fs from "fs";

// ---------- helpers ----------
const hexToRgb = (hex) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// build both "rgb(r, g, b)" and "rgb(r,g,b)" spacing variants
const rgbForms = ([r, g, b]) => [`rgb(${r}, ${g}, ${b})`, `rgb(${r},${g},${b})`];

// Deck palette
const LIME       = '#b0e562';   // primary accent
const LIME_LIGHT = '#c5f07a';   // gradient top
const LIME_DEEP  = '#a0d64a';   // gradient bottom / hover
const PAPER      = '#f4f2ef';   // warm off-white surface
const PAPER_2    = '#ece9e1';   // slightly deeper paper
const BORDER     = '#e7e3da';   // warm hairline border
const INK        = '#0a0a0c';   // near-black
const INK_2      = '#1a1a1c';   // raised dark

// map: source hex -> target hex. rgb() equivalents generated automatically.
const HEXMAP = {
  // --- accent purples -> lime ---
  '#7c3aed': LIME, '#a855f7': LIME, '#8b3df2': LIME, '#923bf6': LIME,
  '#9f54f7': LIME, '#770bf4': LIME, '#8523f5': LIME,
  '#34098f': '#5b7d1e', // deep purple gradient stop -> deep olive-lime
  // --- pale lavender / near-white surfaces -> paper ---
  '#f6f2fb': PAPER, '#efe6fb': PAPER, '#f6f0fe': PAPER, '#f2e6fd': PAPER,
  '#eee6fd': PAPER, '#f6f7f9': PAPER, '#f7f6f9': PAPER, '#f2f4f6': PAPER,
  '#f8f9fa': PAPER, '#edeff3': PAPER,
  '#e3cefc': '#e9ecd9', // saturated lavender -> pale lime tint
  '#ecebf0': PAPER_2, '#e6e2ee': PAPER_2, '#e6e9ee': PAPER_2,
  '#e1e4eb': BORDER,
  // --- darks -> deck near-black ---
  '#191919': INK, '#262626': INK_2,
  // --- lavender-tinted greys -> warm neutral greys ---
  '#8a8595': '#8a8780', '#5b5566': '#57544c', '#3a3442': '#35322c',
};

function applyColorMap(s) {
  // longest sources first to avoid partial overlaps
  const entries = Object.entries(HEXMAP).sort((a, b) => b[0].length - a[0].length);
  for (const [src, dst] of entries) {
    const dstRgb = hexToRgb(dst);
    // replace hex (case-insensitive)
    s = s.replace(new RegExp(src.replace('#', '#'), 'gi'), dst);
    // replace rgb() forms
    for (const form of rgbForms(hexToRgb(src))) {
      s = s.split(form).join(`rgb(${dstRgb[0]}, ${dstRgb[1]}, ${dstRgb[2]})`);
    }
  }
  // rgba() purple glows -> lime glow (keep alpha)
  s = s.replace(/rgba\(\s*52,\s*9,\s*143,/g, 'rgba(176, 229, 98,');
  // any leftover rgba with the accent purple channels
  s = s.replace(/rgba\(\s*124,\s*61,\s*237,/g, 'rgba(176, 229, 98,');
  s = s.replace(/rgba\(\s*168,\s*85,\s*247,/g, 'rgba(176, 229, 98,');
  s = s.replace(/rgba\(\s*159,\s*84,\s*247,/g, 'rgba(176, 229, 98,');
  s = s.replace(/rgba\(\s*146,\s*59,\s*246,/g, 'rgba(176, 229, 98,');
  return s;
}

function fixButtons(s) {
  // give the primary CTA buttons a distinct lime gradient (sentinel we can target in CSS)
  const btnGrads = [
    'linear-gradient(rgb(159, 84, 247) 0%, rgb(133, 35, 245) 100%)',
    'linear-gradient(rgb(119, 11, 244) 0%, rgb(159, 84, 247) 100%)',
    'linear-gradient(135deg, #a855f7, #7c3aed)',
    'linear-gradient(135deg, #a855f7, #34098f)',
  ];
  const limeGrad = `linear-gradient(135deg, ${LIME_LIGHT} 0%, ${LIME_DEEP} 100%)`;
  for (const g of btnGrads) s = s.split(g).join(limeGrad);
  return s;
}

const files = ['index.html', 'lt/index.html', 'css/inline_styles.css'];
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('skip (missing):', f); continue; }
  let s = fs.readFileSync(f, 'utf8');
  const before = s;
  s = fixButtons(s);      // before generic map so sentinels survive
  s = applyColorMap(s);
  fs.writeFileSync(f, s, 'utf8');
  console.log(`${f}: ${before === s ? 'no change' : 'recolored'} (${s.length} bytes)`);
}
console.log('done');
