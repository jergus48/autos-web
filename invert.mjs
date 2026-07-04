import fs from "fs";

// Flip the (already paper/lime) theme to a black/white/green dark theme by
// inverting NEUTRAL colours only. Saturated colours (lime, semantic green/blue/red)
// are preserved. The custom <style> block is protected and hand-tuned separately.

const INK = [10, 10, 12];       // near-black floor
const PAPER = [244, 242, 239];  // paper ceiling

function invChannel(v) { return 255 - v; }

function neutralInvert(r, g, b) {
  let nr = invChannel(r), ng = invChannel(g), nb = invChannel(b);
  if (nr < 16 && ng < 16 && nb < 16) return INK;            // clamp to deck black
  if (nr > 240 && ng > 240 && nb > 240) return PAPER;       // clamp to deck paper
  return [nr, ng, nb];
}

const spread = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
const isNeutral = (r, g, b) => spread(r, g, b) <= 30;
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function hex2rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgb2hex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

function processColors(s) {
  // hex colors
  s = s.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, (m) => {
    const [r, g, b] = hex2rgb(m);
    if (!isNeutral(r, g, b)) return m;            // keep saturated
    return rgb2hex(neutralInvert(r, g, b));
  });
  // rgb()
  s = s.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g, (m, r, g, b) => {
    r = +r; g = +g; b = +b;
    if (!isNeutral(r, g, b)) return m;
    const [nr, ng, nb] = neutralInvert(r, g, b);
    return `rgb(${nr}, ${ng}, ${nb})`;
  });
  // rgba(): only flip LIGHT overlays to dark; keep dark shadows/tints as-is
  s = s.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (m, r, g, b, a) => {
    r = +r; g = +g; b = +b;
    if (!isNeutral(r, g, b)) return m;            // keep coloured glows
    if (lum(r, g, b) < 0.6) return m;             // keep dark shadows
    const [nr, ng, nb] = neutralInvert(r, g, b);
    return `rgba(${nr}, ${ng}, ${nb}, ${a})`;
  });
  return s;
}

function processHtml(file) {
  let h = fs.readFileSync(file, 'utf8');
  // protect <style> blocks
  const styles = [];
  h = h.replace(/<style[\s\S]*?<\/style>/gi, (m) => {
    styles.push(m);
    return `@@STYLE_${styles.length - 1}@@`;
  });
  h = processColors(h);
  h = h.replace(/@@STYLE_(\d+)@@/g, (_, i) => styles[+i]);
  fs.writeFileSync(file, h, 'utf8');
  console.log(`${file}: inverted (${styles.length} style blocks protected)`);
}

for (const f of ['index.html', 'lt/index.html']) {
  if (fs.existsSync(f)) processHtml(f);
}
if (fs.existsSync('css/inline_styles.css')) {
  let c = fs.readFileSync('css/inline_styles.css', 'utf8');
  c = processColors(c);
  fs.writeFileSync('css/inline_styles.css', c, 'utf8');
  console.log('css/inline_styles.css: inverted');
}
console.log('done');
