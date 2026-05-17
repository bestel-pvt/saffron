/**
 * storage.js — localStorage persistence layer for Saffron & Co
 * Cart, wishlist, orders, stock, customer info, cookie consent
 */

const KEYS = {
  cart:     'sc_cart',
  wishlist: 'sc_wishlist',
  orders:   'sc_orders',
  stock:    'sc_stock',
  customer: 'sc_customer',
  cookies:  'sc_cookie_consent',
  orderSeq: 'sc_order_seq',
}

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ── Cart ──────────────────────────────────────────────────────────────────────
export function loadCart()        { return load(KEYS.cart, []) }
export function saveCart(items)   { save(KEYS.cart, items) }
export function clearCart()       { save(KEYS.cart, []) }

// ── Wishlist ──────────────────────────────────────────────────────────────────
export function loadWishlist()        { return load(KEYS.wishlist, []) }
export function saveWishlist(ids)     { save(KEYS.wishlist, ids) }

// ── Orders ────────────────────────────────────────────────────────────────────
export function loadOrders()          { return load(KEYS.orders, []) }
export function saveOrder(order)      {
  const orders = loadOrders()
  orders.unshift(order)
  save(KEYS.orders, orders)
}

// ── Stock ─────────────────────────────────────────────────────────────────────
export function loadStock()           { return load(KEYS.stock, {}) }
export function decrementStock(items) {
  const stock = loadStock()
  items.forEach(item => {
    const current = stock[item.id] ?? (item.stock ?? 99)
    stock[item.id] = Math.max(0, current - (item.qty || 1))
  })
  save(KEYS.stock, stock)
}
export function getStock(productId, defaultStock = 99) {
  const stock = loadStock()
  return stock[productId] ?? defaultStock
}

// ── Customer ──────────────────────────────────────────────────────────────────
export function loadCustomer()        { return load(KEYS.customer, {}) }
export function saveCustomer(info)    { save(KEYS.customer, info) }

// ── Cookie Consent ────────────────────────────────────────────────────────────
export function loadCookieConsent()   { return load(KEYS.cookies, null) }
export function saveCookieConsent(v)  { save(KEYS.cookies, v) }

// ── Sequential Order Numbers ──────────────────────────────────────────────────
export function nextOrderNumber() {
  const year = new Date().getFullYear()
  const seq  = load(KEYS.orderSeq, { year, n: 0 })
  const n    = seq.year === year ? seq.n + 1 : 1
  save(KEYS.orderSeq, { year, n })
  return `SC-${year}-${String(n).padStart(4, '0')}`
}
