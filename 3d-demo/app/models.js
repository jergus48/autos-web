// Models of real products made from their pictures (layout/models.js): app/data/models/index.json maps a product key to a model file (made by hand from the pictures),
// app/data/models/auto/index.json the same for the models the vision model wrote (lib/automodel.js); a hand-made model of the same key always wins.
import { registerModel, modelProblems } from '../layout/models.js'

async function loadDir(dir, skip) {
  let n = 0, keys = []
  try {
    const res = await fetch(`./data/models/${dir}index.json?v=` + Date.now()); if (!res.ok) return { n, keys }
    const index = await res.json(); keys = Object.keys(index)
    await Promise.all(Object.entries(index).filter(([key]) => !skip.has(key)).map(async ([key, file]) => {
      try { const m = await (await fetch(`./data/models/${dir}${file}?v=` + Date.now())).json(); if (!modelProblems({ ...m, key }).length) { registerModel({ ...m, key }); n++ } } catch { /* a model that cannot be read is left out */ }
    }))
  } catch { /* no models yet */ }
  return { n, keys }
}
let loading = null
export function loadModels() {
  loading ||= (async () => { const hand = await loadDir('', new Set()), auto = await loadDir('auto/', new Set(hand.keys)); return hand.n + auto.n })()
  return loading
}
// read the lists again (a model was made by someone else, or in another session)
export function reloadModels() { loading = null; return loadModels() }
