// Products read from shop pages, as the project keeps them, turned into what the layout engine takes (plan._overrides and plan._extras, see layout/engine.js).
// A stored product: { id, at ({ x, z, rot }: the spot chosen on the plan, extras only), link, host, name, brand, image, price, type, dims: { w, d, h } (metres), finish (main colour as a number or null), finish2 (legs, frame and details, or null), mode: 'replace' | 'extra', roomId }
import { TYPES } from './catalog.js'
import { modelKeyOf } from './models.js'
import { classify, bedLike } from '../lib/product.js'

// the pieces a client can say a product is: free-standing furniture (a kitchen run, the bath and the toilet come with the plan)
const FIXED = new Set(['counter', 'bathtub', 'shower', 'toilet', 'vanity'])
export const PRODUCT_TYPES = Object.keys(TYPES).filter((t) => !FIXED.has(t)).map((type) => ({ type, label: TYPES[type].label }))
export const isProductType = (type) => Boolean(TYPES[type]) && !FIXED.has(type)

export const SIZE_LIMITS = { min: 0.05, max: 6 }          // metres, each side
export const sizeOk = (d) => ['w', 'd', 'h'].every((k) => Number.isFinite(d?.[k]) && d[k] >= SIZE_LIMITS.min && d[k] <= SIZE_LIMITS.max)

export const productSpec = (p) => ({
  type: p.type, w: p.dims.w, d: p.dims.d, h: p.dims.h,
  product: { id: p.id, name: p.name, fullName: p.fullName || p.name, brand: p.brand || '', host: p.host || '', link: p.link || '', image: p.image || '', ...(p.link && modelKeyOf(p.link) ? { modelKey: modelKeyOf(p.link) } : {}) },
  ...(p.at && Number.isFinite(p.at.x) && Number.isFinite(p.at.z) ? { at: { x: p.at.x, z: p.at.z, rot: p.at.rot || 0 } } : {}),          // the spot the person clicked on the plan
  ...(Number.isFinite(p.finish) || Number.isFinite(p.finish2) ? { finish: { ...(Number.isFinite(p.finish) ? { hex: p.finish } : {}), ...(Number.isFinite(p.finish2) ? { hex2: p.finish2 } : {}) } } : {}),
})

// a shop page can give the size of only the main part of a set (a sofa frame without its chaise). A model made from the pictures knows the size of the whole piece and the wrong size it replaces
// (model.pageDims): a piece that still has the page's size (within 1.5 cm, so nothing the person typed) takes the size of the model
// (model.staleDims: other wrong sizes a piece may have been stored with, for example the size an earlier automatic draft of the same product had)
export const withModelSize = (p, model) => {
  const olds = [model?.pageDims, ...(model?.staleDims || [])].filter(Boolean)
  return model?.dims && p?.dims && olds.some((o) => ['w', 'd', 'h'].every((k) => Math.abs(p.dims[k] - o[k]) < 0.015)) ? { ...p, dims: { w: model.dims.w, d: model.dims.d, h: model.dims.h } } : p
}

// plan._overrides[roomIndex][type]: the product that is the piece of that type in that room; plan._extras: products added on top. Products of rooms that are gone are left out.
// a piece stored as "other piece" before its kind could be recognised (a kitchen island) is read again by its name
export const reclassified = (p) => {
  if (p.type !== 'product') return p
  let t = classify({ name: p.fullName || p.name }).type
  if ((!t || t === 'product') && bedLike(p.dims)) t = 'bed'          // no word, but a bed's size
  if (!t || t === 'product' || !isProductType(t)) return p
  return { ...p, type: t, dims: t === 'bed' && p.dims.w > p.dims.d ? { ...p.dims, w: p.dims.d, d: p.dims.w } : p.dims }          // a bed is as wide as its width: the long side is its length (depth)
}
export function applyProducts(plan, products = []) {
  const overrides = {}, extras = []
  for (const p0 of products) {
    const p = reclassified(p0)
    const i = plan.rooms.findIndex((r) => r.id === p.roomId)
    if (i < 0 || !isProductType(p.type) || !sizeOk(p.dims)) continue
    const spec = productSpec(p)
    if (p.mode === 'replace') (overrides[i] ||= {})[p.type] = spec
    else extras.push({ room: i, ...spec })
  }
  plan._overrides = Object.keys(overrides).length ? overrides : null
  plan._extras = extras.length ? extras : null
  return plan
}
// a short text that changes when any product (or where it goes) changes: part of the key of the layout cache
export const productKey = (plan) => (plan._overrides || plan._extras ? JSON.stringify([plan._overrides, plan._extras]) : '')
