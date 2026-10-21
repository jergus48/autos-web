// Reading a furniture product page: name, price, picture, colour, and above all the real measurements (width, depth, height) in metres, together
// with the words on the page they came from, so a person can check them. Pure functions on the HTML text (the server fetches the page, lib/fetchpage.js).
//
// What real shops publish (checked on IKEA, JYSK and Pigu pages):
//   * IKEA: a "measurements" tab with labelled rows (Width, Depth, Height; tables and beds say Length and Width). The schema.org JSON-LD width and depth are
//     NOT reliable there (for a table, width is the short side). A "set" page (a sofa sold in parts) has only package sizes; its parts have pages with the real rows.
//   * JYSK: "Size assembled Width: 216 cm, Height: 78 cm, Depth: 84 cm" in the text, next to "Size unassembled ...", plus JSON-LD with width and height only.
//   * Pigu and similar marketplaces: "Plotis: 135 cm" in a specification list, "135x65x76" in the title (width x depth x height), sentences with the number first.
// So the reader collects groups of labelled values from the text (in a dozen languages), ignores the packaged, unassembled and part sizes (seat, armrest, mattress, drawer,
// shelf, ...), and picks the best group; JSON-LD and the title are fallbacks. Nothing is guessed: when no measurements are found the sizes stay empty and the person types them.

const strip = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ł/g, 'l').replace(/ø/g, 'o').replace(/đ/g, 'd').replace(/ß/g, 'ss').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/ı/g, 'i')
export const decodeEntities = (s) => String(s ?? '').replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos|nbsp|deg|times|ndash|mdash|shy);/gi, (m, e) => {
  const t = e.toLowerCase()
  if (t[0] === '#') { const n = t[1] === 'x' ? parseInt(t.slice(2), 16) : parseInt(t.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m }
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', deg: '°', times: '×', ndash: '–', mdash: '—', shy: '' }[t] ?? m
})

// ---------------------------------------------------------------- units
const UNIT_M = { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, inch: 0.0254, inches: 0.0254, '"': 0.0254, ft: 0.3048, feet: 0.3048 }
export const toMetres = (value, unit) => { const k = UNIT_M[String(unit || '').toLowerCase().replace('″', '"')]; const v = Number(String(value).replace(',', '.')); return k && Number.isFinite(v) ? v * k : null }
const sane = (m) => m !== null && m >= 0.05 && m <= 6
const r3 = (v) => Math.round(v * 1000) / 1000

// ---------------------------------------------------------------- labels in many languages (no accents: the text is accent-stripped before matching)
const LABELS = {
  w: ['width', 'overall width', 'plotis', 'breite', 'breedte', 'largeur', 'ancho', 'anchura', 'larghezza', 'szerokosc', 'platums', 'laius', 'sirka', 'sirina', 'ширина', 'bredd', 'bredde', 'leveys', 'szelesseg', 'latime', 'lungime sofa'],
  d: ['depth', 'overall depth', 'gylis', 'tiefe', 'diepte', 'profondeur', 'fondo', 'profundidad', 'profondita', 'glebokosc', 'dzilums', 'sugavus', 'hloubka', 'hlbka', 'globina', 'глубина', 'djup', 'dybde', 'syvyys', 'melyseg', 'adancime'],
  h: ['height', 'overall height', 'aukstis', 'hohe', 'hoehe', 'hoogte', 'hauteur', 'alto', 'altura', 'altezza', 'wysokosc', 'augstums', 'korgus', 'vyska', 'visina', 'высота', 'hojd', 'hoyde', 'hojde', 'korkeus', 'magassag', 'inaltime'],
  l: ['length', 'ilgis', 'lange', 'laenge', 'lengte', 'longueur', 'largo', 'lunghezza', 'dlugosc', 'garums', 'pikkus', 'delka', 'dolzina', 'длина', 'langd', 'laengde', 'lengde', 'pituus', 'hosszusag', 'lungime'],
}
// words that turn a width or height into a part of the piece (seat width, mattress length, drawer depth, ...): those are not the size of the piece
const PART = ['seat', 'sitting', 'armrest', 'arm', 'back', 'backrest', 'mattress', 'sleeping', 'bed', 'drawer', 'shelf', 'cushion', 'clearance', 'leg', 'legs', 'inner', 'inside', 'internal', 'headboard', 'footboard', 'under', 'free', 'between', 'opening', 'door', 'recess', 'frame', 'tabletop', 'top', 'package', 'packaging', 'parcel', 'carton', 'box', 'unassembled', 'sedim', 'sedynes', 'sedimos', 'sitz', 'lehne', 'matratze', 'schublade', 'miegam', 'kojel', 'rankos', 'stalcius', 'dezes', 'pakuot', 'max', 'min', 'load', 'weight', 'volume', 'including']
const CONTEXT_BAD = /unassembled|package|packaging|parcel|carton|shipping|packed|nesurink|pakuot|verpack|emballage|opakowan/
const CONTEXT_GOOD = /assembled|product dimension|dimensions|measurements|overall|size\b|matmen|isma|abmessung|masse|dimensions|dimensiones|dimensioni|wymiar|izmeri|mootmed|rozmery/

const labelRe = (() => {
  const all = Object.entries(LABELS).flatMap(([k, arr]) => arr.map((a) => [strip(a), k]).filter(([a]) => /^[a-z]/.test(a) || true))
  return { all, alt: all.map(([a]) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((x, y) => y.length - x.length).join('|') }
})()
const keyOf = (label) => (labelRe.all.find(([a]) => a === label) || [])[1]
const NUM = '(\\d{1,4}(?:[.,]\\d{1,2})?)', UNIT = '(mm|cm|m|inches|inch|in|ft|feet|"|″)'

// ---------------------------------------------------------------- text of a page
export function visibleText(html) {
  let t = String(html ?? '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<!--[\s\S]*?-->/gi, ' ')
  t = t.replace(/<(br|\/p|\/li|\/tr|\/div|\/h\d|\/dd|\/dt)\b[^>]*>/gi, ' | ').replace(/<[^>]+>/g, ' ')
  return decodeEntities(t).replace(/\s+/g, ' ').trim()
}

// groups of labelled sizes in a text: "Width: 216 cm, Height: 78 cm, Depth: 84 cm" or "Plotis 135 cm Gylis 65 cm" or "222 cm pločio, 92 cm aukščio" or "W80 x D40 x H120 cm"
export function labelledGroups(text) {
  const t = strip(text), found = []
  const push = (index, end, key, value, unit, raw) => { const m = toMetres(value, unit); if (sane(m)) found.push({ index, end, key, m, raw }) }
  // label then number: "width: 216 cm", "plotis 135 cm"
  const a = new RegExp(`(^|[^a-z])(${labelRe.alt})\\s*(?:\\(([^)]{0,12})\\))?\\s*[:=\\-–|]?\\s*(?:is\\s*)?${NUM}\\s*${UNIT}(?![a-z])`, 'gi')
  for (let m; (m = a.exec(t));) {
    const before = t.slice(Math.max(0, m.index - 22), m.index + m[1].length).split(/[^a-z]+/).filter(Boolean).slice(-2), key = keyOf(m[2])
    if (before.some((w) => PART.includes(w))) continue
    found.push({ index: m.index + m[1].length, end: m.index + m[0].length, key, m: toMetres(m[4], m[5]), raw: m[0].trim() })
  }
  // number then label: "92 cm aukscio", "216 cm wide" (adjectives of the same languages)
  const adj = { w: ['wide', 'plocio', 'breit', 'breed', 'large', 'ancho', 'larga', 'szeroki', 'platu'], d: ['deep', 'gylio', 'tief', 'diep', 'profond', 'profundo', 'gleboki'], h: ['high', 'tall', 'aukscio', 'hoch', 'hoog', 'haut', 'alto', 'wysoki'], l: ['long', 'ilgio', 'lang', 'long', 'largo', 'dlugi'] }
  const b = new RegExp(`${NUM}\\s*${UNIT}\\s+(${Object.values(adj).flat().join('|')})(?![a-z])`, 'gi')
  for (let m; (m = b.exec(t));) { const key = Object.keys(adj).find((k) => adj[k].includes(m[3])); push(m.index, m.index + m[0].length, key, m[1], m[2], m[0]) }
  // W80 x D40 x H120 cm, 80W x 40D x 120H cm
  const c = new RegExp(`(?:^|[^a-z])w\\s*${NUM}\\s*(?:x|×|\\*)?\\s*d\\s*${NUM}\\s*(?:x|×|\\*)?\\s*h\\s*${NUM}\\s*${UNIT}`, 'gi')
  for (let m; (m = c.exec(t));) { push(m.index, m.index + 1, 'w', m[1], m[4], m[0]); push(m.index, m.index + 1, 'd', m[2], m[4], m[0]); push(m.index, m.index + 1, 'h', m[3], m[4], m[0]) }
  const c2 = new RegExp(`${NUM}\\s*w\\s*(?:x|×|\\*)\\s*${NUM}\\s*d\\s*(?:x|×|\\*)\\s*${NUM}\\s*h\\s*${UNIT}`, 'gi')
  for (let m; (m = c2.exec(t));) { push(m.index, m.index + 1, 'w', m[1], m[4], m[0]); push(m.index, m.index + 1, 'd', m[2], m[4], m[0]); push(m.index, m.index + 1, 'h', m[3], m[4], m[0]) }
  // (a label followed by a part word, "height backrest 46 cm" or "width of drawer", has no number right after the label, so the patterns above never match it)
  found.sort((x, y) => x.index - y.index)
  const real = found
  // group values that sit close together; the words before the group say what kind of size it is
  const groups = [], measures = (x, y) => (t.slice(x, y).match(new RegExp(`${NUM}\\s*(?:mm|cm)(?![a-z])`, 'g')) || []).length
  for (const f of real) {
    const g = groups[groups.length - 1], gap = g ? f.index - g.end : Infinity, between = g ? t.slice(g.end, f.index) : ''
    // close together, or only a few other measurements in between (a row "depth of drawer 40 cm" in a list); never into a package or unassembled size
    const chain = g && !CONTEXT_BAD.test(between) && (gap < 45 || (gap < 160 && measures(g.end, f.index) >= 1 && measures(g.end, f.index) <= 3 && !/size|assembled|package/.test(between)))
    if (chain) { g.items.push(f); g.end = f.end } else groups.push({ start: f.index, end: f.end, items: [f] })
  }
  return groups.map((g) => {
    const ctx = t.slice(Math.max(0, g.start - 70), g.start), vals = {}
    for (const it of g.items) if (vals[it.key] === undefined) vals[it.key] = it.m
    return { ...vals, context: ctx, bad: CONTEXT_BAD.test(ctx), good: CONTEXT_GOOD.test(ctx), evidence: g.items.map((i) => i.raw).join(', '), index: g.start, count: Object.keys(vals).length }
  })
}

// sizes from a title: "80x28x202 cm", "135x65x76", "140x60 cm"
export function titleSizes(text) {
  const t = String(text ?? '').replace(/,(?=\d)/g, '.'), m = t.match(/(\d{1,4}(?:\.\d{1,2})?)\s*[x×*]\s*(\d{1,4}(?:\.\d{1,2})?)(?:\s*[x×*]\s*(\d{1,4}(?:\.\d{1,2})?))?\s*(mm|cm|m)?/i)
  if (!m) return null
  const unit = (m[4] || 'cm').toLowerCase(), v = [m[1], m[2], m[3]].filter(Boolean).map((x) => toMetres(x, unit))
  return v.every(sane) ? { values: v, evidence: m[0].trim() } : null
}

// ---------------------------------------------------------------- structured data
export function jsonLd(html) {
  const out = []
  for (const m of String(html).matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const j = JSON.parse(m[1].trim()); const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { out.push(x); if (x['@graph']) walk(x['@graph']) } }; walk(j) } catch { /* a broken block is skipped */ }
  }
  return out
}
const isType = (x, t) => [].concat(x?.['@type'] || []).some((v) => String(v).toLowerCase() === t.toLowerCase())
const text1 = (v) => (v === undefined || v === null ? '' : typeof v === 'object' ? text1(v.name ?? v.value ?? v['@value'] ?? '') : decodeEntities(String(v)).trim())
// schema.org sizes are "28 cm", {value: "216", unitText: "cm"} or {value: 216, unitCode: "CMT"}
function schemaSize(v) {
  if (v === undefined || v === null) return null
  if (typeof v === 'string') { const m = v.match(new RegExp(`${NUM}\\s*${UNIT}?`)); return m ? toMetres(m[1], m[2] || 'cm') : null }
  if (typeof v === 'number') return toMetres(v, 'cm')
  const code = String(v.unitText || v.unitCode || 'cm').toLowerCase(), unit = { cmt: 'cm', mmt: 'mm', mtr: 'm', inh: 'in', cm: 'cm', mm: 'mm', m: 'm', in: 'in' }[code] || code
  return toMetres(v.value ?? v.minValue, unit)
}
const imageUrls = (v) => [].concat(v || []).flatMap((x) => (typeof x === 'string' ? [x] : x?.contentUrl || x?.url ? [x.contentUrl || x.url] : [])).filter((u) => /^https?:\/\//.test(u))
const meta = (html, prop) => { const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, 'i'), m = String(html).match(re); const c = m && m[0].match(/content=["']([^"']*)["']/i); return c ? decodeEntities(c[1]) : '' }

// ---------------------------------------------------------------- what the piece is
// keyword -> catalogue type (accents are stripped first). The most specific words come first.
const KINDS = [
  ['kitchen_island', /kitchen island|kitchen trolley|kucheninsel|kuecheninsel|kuchenwagen|ilot de cuisine|isola cucina|isla de cocina|wyspa kuchenna|keukeneiland|virtuves sala|virtuvės sala/],
  ['tv_unit', /tv-?bank|tv-?schrank|tv-?m(oe|ö)bel|tv ?(bench|unit|stand|cabinet|table|furniture|combination|storage|wall)|tv-?komb\w*|fernsehkomb\w*|media (unit|wall|combination|storage)|entertainment (unit|cent(er|re))|tv stal|tv spintel|fernsehtisch|tv-?board|lowboard|szafka rtv|tv-?kast|meuble tv/],
  ['coffee_table', /coffee table|kavos stal|couchtisch|salontisch|table basse|mesa de centro|tavolino|stolik kawowy|koffietafel|sofabord|sohvapoyta|zurnalinis|sofa table/],
  ['nightstand', /bedside|night ?stand|night table|naktin\w* stal|prie loves|nachttisch|nachtkastje|table de chevet|mesilla de noche|comodino|szafka nocna/],
  ['side_table', /side table|end table|sofa end|nesting table|zonin\w* stal|beistelltisch|table d.appoint|mesa auxiliar|stolik pomocniczy/],
  ['dining_table', /dining table|valgomojo stal|esstisch|table a manger|mesa de comedor|tavolo da pranzo|stol jadalniany|eettafel|spisebord|matbord|extendable table|kitchen table|virtuves stal/],
  ['desk', /\bdesk|rasomasis stal|raso stal|darbo stal|schreibtisch|bureau\b|escritorio|scrivania|biurko|skrivebord|skrivbord|kirjoituspoyta|computer table|kompiuterio stal/],
  ['shoe_cabinet', /shoe (cabinet|storage|rack|bench)|batu (spintel|lentyn|stovas)|schuhschrank|schuhregal|meuble a chaussures|zapatero|scarpiera|szafka na buty/],
  ['wardrobe', /wardrobe|clothes cabinet|spinta drabuz|drabuziu spint|kleiderschrank|garde-?robe|armoire|armario|guardaroba|szafa\b|garderobekast|klaedeskab|klader skap|vaatekaappi|pax\b|closet/],
  ['shelf', /bookcase|bookshelf|book shelf|shelving unit|shelf unit|etagere|regal\b|knygu (spint|lentyn)|lentyn|buecherregal|bibliotheque|libreria|biblioteca|biblioteczka|boekenkast|reol|bokhylla|kirjahylly/],
  ['sideboard', /sideboard|aufbewahrungskomb\w*|storage combination|schrankkomb\w*|chest of drawers|dresser|buffet|cupboard|storage cabinet|cabinet\b|komod|kommode|commode|cassettiera|cajonera|szafka|spintel|kast\b|skab|skap\b/],
  ['armchair', /arm ?chair|lounge chair|wing chair|recliner|fotel|sessel|fauteuil|sillon|poltrona|fotelis|fåtölj|nojatuoli|lounge ?stuhl/],
  ['sofa', /sofa|couch|settee|loveseat|canape|divano|kanapa|soffa|sohva|trivie|dvivie|kampin|corner sofa|sectional/],
  ['bed', /\bbed\b|bed frame|bedstead|\blova\b|lovos? remas|kusetes? remas|loveles|bett\b|bettgestell|bettrahmen|bettkasten|boxspring|lit\b|cama\b|letto\b|lozko|bed met|seng\b|sang\b|sanky|vuode/],
  ['chair', /\bchair|kede\b|stuhl|chaise|silla|sedia|krzeslo|stoel|stool|baro kede|taburet/],
  ['floor_lamp', /floor lamp|standard lamp|torsher|toršer|stehlampe|lampadaire|lampara de pie|lampada da terra|lampa podlogowa|vloerlamp|golvlampa/],
  ['rug', /\brug\b|carpet|kilim|teppich|tapis|alfombra|tappeto|dywan|vloerkleed/],
  ['plant', /plant\b|augal|pflanze|plante|planta\b|roslina|kamerplant|vaso con/],
  ['dining_table', /\btable\b|\bstal(as|iuk\w*)\b|tisch\b|\btafel\b|\bmesa\b|tavolo|stolik/],          // any other table; the height decides (refineType) whether it is a dining or a coffee table
]
// a piece no word could place, but whose size is a bed's (one side 1.9 to 2.35 m, the other 0.75 to 2.2 m, up to 1.3 m high): a bed, the long side is its length (depth)
export const bedLike = (d) => { const a = Math.max(d.w ?? 0, d.d ?? 0), b = Math.min(d.w ?? 9, d.d ?? 9); return a >= 1.9 && a <= 2.35 && b >= 0.75 && b <= 2.2 && (d.h ?? 9) <= 1.3 }
export function classify({ name = '', category = '', breadcrumbs = [], typeName = '', url = '' } = {}) {
  // the name is the most specific (IKEA files a desk under "Table bar combinations"), then the category, then the wider breadcrumbs, then the link; a plain "table" word only counts when nothing more specific was found anywhere
  const title = strip(name), cat = strip([category, breadcrumbs.at(-1), typeName].filter(Boolean).join(' | ')), crumbs = strip(breadcrumbs.slice(-4).join(' | ')), path = strip(decodeURIComponent(String(url).split('?')[0].split('/').slice(-2).join(' ')).replace(/[-_]+/g, ' '))
  const sources = [['the name', title, 0.85], ['the category', cat, 0.9], ['the breadcrumbs', crumbs, 0.7], ['the link', path, 0.55]], specific = KINDS.slice(0, -1), generic = KINDS.at(-1)
  for (const [where, hay, confidence] of sources) for (const [type, re] of specific) if (re.test(hay)) return { type, from: where, confidence }
  for (const [where, hay, confidence] of sources) if (generic[1].test(hay)) return { type: generic[0], from: where, confidence: confidence * 0.8 }
  return { type: 'product', from: 'nothing', confidence: 0 }
}

// ---------------------------------------------------------------- colours: words in a few languages to a muted display colour
const COLOURS = [
  [/white|balt|weiss|blanc|blanco|bianco|bialy|wit\b/, 0xf1efea], [/black|juod|schwarz|noir|negro|nero|czarn|zwart/, 0x2b2b2e], [/dark ?gr[ae]y|anthracite|antrac|graphite|tamsiai pilk/, 0x555a60], [/light ?gr[ae]y|silver|sidabr|sviesiai pilk|hellgrau/, 0xc4c7cb],
  [/gr[ae]y|pilk|grau|gris|grigio|szar|grijs/, 0x8b9096], [/beige|smel|sand|cream|kremin|creme|ecru|natural|linen|\blin\b/, 0xd9ccb2], [/oak|ozio|eiche|chene|roble|rovere|dab|eik/, 0xc9a56e], [/walnut|riesut|nuss|noyer|nogal|noce|orzech/, 0x6b4a33],
  [/birch|beržo|berzo|birke|bouleau|abedul|betulla|brzoz/, 0xe3cfa2], [/pine|pusies|kiefer|pin\b|pino|sosna/, 0xd8b377], [/beech|buko|buche|hetre|haya|faggio|buk/, 0xd2a870], [/brown|rud|braun|marron|marrone|brazow|bruin/, 0x7a5638], [/wood|medien|holz|bois|madera|legno|drewn/, 0xc4a070],
  [/red|raud|rot\b|rouge|rojo|rosso|czerw|rood/, 0xb4443a], [/orange|oranz|orang/, 0xd98a3d], [/yellow|gelton|gelb|jaune|amarillo|giallo|zolt|geel/, 0xe0b94a], [/green|zal|grun|gruen|vert|verde|zielon|groen/, 0x6f8f6a], [/turquoise|turkio|turkis|turquoise/, 0x4f9a9a],
  [/blue|mel[yi]n|blau|bleu|azul|blu\b|niebiesk|blauw/, 0x4f6f94], [/pink|roz|rosa|rose\b|rosé/, 0xd8a0a8], [/purple|violet|violet|lila|viol|fiolet/, 0x7d6a9a],
]
export function colourOf(...texts) {
  const t = strip(texts.filter(Boolean).join(' '))
  for (const [re, hex] of COLOURS) if (re.test(t)) return { hex, word: (t.match(re) || [''])[0] }
  return null
}

// ---------------------------------------------------------------- measurements of a product, assembled from the best source
// the type decides which side is the width of the piece: tables, desks and benches are as long as their "Length", a bed is as wide as its "Width"
const LENGTH_IS_DEPTH = new Set(['bed'])
function fromLabels(vals, type) {
  const { w, d, h, l } = vals
  let W = w ?? null, D = d ?? null, H = h ?? null
  if (l !== undefined && D === null) { if (LENGTH_IS_DEPTH.has(type)) D = l; else if (W !== null) { D = Math.min(W, l); W = Math.max(W, l) } else W = l }
  else if (l !== undefined && W === null) W = l
  return { w: W, d: D, h: H }
}

export function parseProduct(html, url = '') {
  const notes = [], ld = jsonLd(html), prod = ld.find((x) => isType(x, 'Product') || isType(x, 'ProductGroup')), crumbs = ld.find((x) => isType(x, 'BreadcrumbList'))
  const breadcrumbs = (crumbs?.itemListElement || []).map((i) => text1(i.name ?? i.item?.name)).filter(Boolean)
  const title = decodeEntities((String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim()
  const h1 = decodeEntities((String(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const rawName = text1(prod?.name) || meta(html, 'og:title') || h1 || title
  const name = rawName.replace(/\s*[-–]\s*[^-–]*\d{2,3}\s*[x×]\s*\d{2,3}(?:\s*[x×]\s*\d{2,3})?\s*(?:cm|mm)?\s*$/i, '').replace(/\s*\|\s*[A-Za-z]+$/, '').replace(/\s+/g, ' ').trim() || rawName
  const category = text1(prod?.category), color = text1(prod?.color)
  const images = [...new Set([...imageUrls(prod?.image), ...(meta(html, 'og:image') ? [meta(html, 'og:image')] : [])])].slice(0, 6)
  const offer = [].concat(prod?.offers || prod?.hasVariant?.[0]?.offers || [])[0], priceRaw = offer?.price ?? offer?.lowPrice ?? meta(html, 'product:price:amount')
  const price = priceRaw !== undefined && priceRaw !== '' && Number.isFinite(Number(String(priceRaw).replace(',', '.'))) ? { amount: Number(String(priceRaw).replace(',', '.')), currency: offer?.priceCurrency || meta(html, 'product:price:currency') || '' } : null
  const models = ld.filter((x) => isType(x, '3DModel')).flatMap((x) => [].concat(x.encoding || []).map((e) => e.contentUrl).filter(Boolean))
  const cls = classify({ name, category, breadcrumbs, url })

  // the measurements: groups of labelled values from the visible text first (most shops), then JSON-LD, then the title
  // an IKEA page: only the rows of its measurements tab count (the rest of the page is full of package sizes and sizes of parts); a set page has no rows and the part pages have
  const isIkea = /pipf-/.test(html), rows = isIkea ? [...String(html).matchAll(/pipf-measurements-tab__measurement-name">([^<]*)<\/span><span class="pipf-measurements-tab__measurement-value">([^<]*)</g)] : []
  const text = isIkea ? 'Measurements | ' + rows.map((r) => `${decodeEntities(r[1])} ${decodeEntities(r[2])}`).join(' | ') : visibleText(html), groups = labelledGroups(text)
  const score = (g) => g.count * 10 + (g.good ? 4 : 0) - (g.bad ? 100 : 0) - Math.min(g.index / 100000, 3) + (g.w !== undefined && g.h !== undefined && g.d !== undefined ? 6 : 0)
  const best = groups.filter((g) => g.count >= 2 && !g.bad).sort((a, b) => score(b) - score(a))[0]
  let dims = { w: null, d: null, h: null }, source = null, evidence = ''
  if (best) { dims = fromLabels(best, cls.type); source = 'the measurements on the page'; evidence = best.evidence }
  const ldv = { w: schemaSize(prod?.width), d: schemaSize(prod?.depth), h: schemaSize(prod?.height) }
  const ldHas = Object.values(ldv).filter((v) => v !== null && sane(v)).length
  if (!best || dims.w === null || dims.d === null || dims.h === null) {
    // fill the gaps from JSON-LD only where the page text gave nothing for that side (JSON-LD width and depth can be swapped, so it never overrides)
    for (const k of ['w', 'd', 'h']) if (dims[k] === null && ldv[k] !== null && sane(ldv[k])) { dims[k] = ldv[k]; source ||= 'the product data of the page'; evidence ||= `${k === 'w' ? 'width' : k === 'd' ? 'depth' : 'height'} ${Math.round(ldv[k] * 100)} cm (structured data)` }
    if ((dims.w === null || dims.d === null) && ldHas >= 1) notes.push('Some sizes come from the structured data of the page, where width and depth can be swapped. Check them.')
  }
  if (dims.w === null || dims.d === null) {
    const ts = titleSizes(title || rawName) || titleSizes(rawName)
    if (ts) {
      const [a, b, c] = ts.values
      // 3 numbers: width x depth x height; 2 numbers: width x depth (a bed or a rug: width x length)
      if (dims.w === null) dims.w = a; if (dims.d === null) dims.d = b; if (dims.h === null && c !== undefined) dims.h = c
      source ||= 'the name of the product'; evidence ||= ts.evidence + ' cm (from the name)'
      notes.push('The sizes come from the name of the product (width x depth x height). Check them.')
    }
  }
  for (const k of ['w', 'd', 'h']) if (dims[k] !== null) dims[k] = r3(dims[k])
  // IKEA "sets": no measurements of their own, but parts that have pages with them
  const parts = []
  for (const m of String(html).matchAll(/"typeName":"([^"]{2,60})"[^{}]{0,400}?"pipUrl":"(https?:[^"]+)"/g)) parts.push({ typeName: decodeEntities(m[1]), url: m[2].replace(/\\u002F/g, '/').replace(/\\\//g, '/') })
  let type = cls.type
  if (type === 'product' && bedLike(dims)) { type = 'bed'; if (dims.w > dims.d) [dims.w, dims.d] = [dims.d, dims.w] }          // no word placed it, but its size is a bed's
  return {
    url, host: (() => { try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' } })(), name, brand: text1(prod?.brand), category: category || breadcrumbs.at(-1) || '', breadcrumbs, color, description: text1(prod?.description).slice(0, 400),
    images, price, models, type: refineType(type, dims), typeFrom: cls.from, typeConfidence: cls.confidence,
    dims: { ...dims }, complete: dims.w !== null && dims.d !== null && dims.h !== null, source, evidence, notes, parts,
    finish: colourOf(color, name, title),
  }
}

// which part of a set page holds the piece itself (the frame of a sofa, the bed frame), never the covers, cushions, legs or slats
// the type from the words is checked against the size: a "table" 45 cm high is a coffee table, a small low "chest of drawers" is a bedside table, a tall closed cabinet is a wardrobe
export function refineType(type, d) {
  const h = d.h, w = d.w
  if (type === 'dining_table' && h !== null && h <= 0.58) return 'coffee_table'
  if (type === 'coffee_table' && h !== null && h >= 0.66) return 'dining_table'
  if (type === 'sideboard' && w !== null && h !== null && w <= 0.65 && h <= 0.72) return 'nightstand'
  if (type === 'sideboard' && h !== null && h >= 1.5) return 'wardrobe'
  if (type === 'shelf' && w !== null && w >= 1.2 && h !== null && h <= 0.9) return 'sideboard'
  return type
}
export function mainPart(parts) {
  const bad = /cover|bezug|housse|cushion|kissen|leg|slat|mattress|pillow|throw|insert|screw|bracket|shelf board|lighting|accessor|drawer|door|panel|chaise|longue|r[ée]camier|ottoman|footstool|armlehne|armrest|arm rest/i, good = /frame|sofa|bed|table|desk|wardrobe|cabinet|unit|bench|chair|armchair|shelving|bookcase|chest|rack|gestell|sitzelement/i
  return parts.find((p) => good.test(p.typeName) && !bad.test(p.typeName)) || null
}

// how sure the sizes are, for the card: 'ok' (all three read from the page), 'check' (some missing or from the name/structured data), 'missing'
export function sizeStatus(p) {
  const n = ['w', 'd', 'h'].filter((k) => p.dims[k] !== null).length
  if (n === 0) return 'missing'
  return p.complete && p.source === 'the measurements on the page' && !p.notes.length ? 'ok' : 'check'
}
