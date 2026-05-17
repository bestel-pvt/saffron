/**
 * api.js — client-side API layer for Saffron & Co
 * Talks to Express backend (proxied via Vite in dev, served same-origin in prod).
 */

const BASE = '/api'

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function getAdminToken() {
  try { return localStorage.getItem('sc_admin_token') || null } catch { return null }
}
export function setAdminToken(token) {
  try { localStorage.setItem('sc_admin_token', token) } catch {}
}
export function clearAdminToken() {
  try { localStorage.removeItem('sc_admin_token') } catch {}
}
function authHeaders() {
  const t = getAdminToken()
  return t ? { 'Authorization': `Bearer ${t}` } : {}
}

async function jsonOrThrow(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

/* ── Catalog (existing) ───────────────────────────────────────────────────── */
export async function fetchProducts() {
  const res = await fetch(`${BASE}/products.json`, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw new Error(`Failed to load products (${res.status})`)
  return (await res.json()).data
}

export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories.json`, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw new Error(`Failed to load categories (${res.status})`)
  return (await res.json()).data
}

/* ── Product overrides (public) ──────────────────────────────────────────── */
export async function getProductOverrides() {
  try {
    const res = await fetch(`${BASE}/products/overrides`)
    if (!res.ok) return {}
    return (await res.json()).overrides || {}
  } catch { return {} }
}

/* ── Orders ───────────────────────────────────────────────────────────────── */
export async function placeOrder(payload) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return (await jsonOrThrow(res)).order
}

export async function uploadPaymentProof(orderNumber, file) {
  const fd = new FormData()
  fd.append('proof', file)
  const res = await fetch(`${BASE}/orders/${encodeURIComponent(orderNumber)}/proof`, {
    method: 'POST',
    body: fd,
  })
  return jsonOrThrow(res)
}

export async function trackOrdersByPhone(phone) {
  const res = await fetch(`${BASE}/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  return (await jsonOrThrow(res)).orders
}

export async function getOrderByNumber(orderNumber) {
  const res = await fetch(`${BASE}/orders/${encodeURIComponent(orderNumber)}`)
  return (await jsonOrThrow(res)).order
}

/* ── Reviews (public) ─────────────────────────────────────────────────────── */
export async function submitReview(payload) {
  const res = await fetch(`${BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return jsonOrThrow(res)
}
export async function getProductReviews(productId) {
  const res = await fetch(`${BASE}/reviews/${encodeURIComponent(productId)}`)
  if (!res.ok) return []
  return (await res.json()).reviews || []
}
export async function getProductReviewSummary(productId) {
  const res = await fetch(`${BASE}/reviews/${encodeURIComponent(productId)}/summary`)
  if (!res.ok) return { count: 0, average: null, distribution: {} }
  return (await res.json()).summary
}

/* ── Admin ────────────────────────────────────────────────────────────────── */
export async function adminLogin(username, password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await jsonOrThrow(res)
  setAdminToken(data.token)
  return data
}
export async function adminMe() {
  const res = await fetch(`${BASE}/admin/me`, { headers: authHeaders() })
  if (!res.ok) return null
  return (await res.json()).admin
}
export async function adminStats() {
  const res = await fetch(`${BASE}/admin/stats`, { headers: authHeaders() })
  return jsonOrThrow(res)
}

export async function adminListOrders() {
  const res = await fetch(`${BASE}/admin/orders`, { headers: authHeaders() })
  return (await jsonOrThrow(res)).orders
}
export async function adminGetOrder(orderNumber) {
  const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderNumber)}`, { headers: authHeaders() })
  return (await jsonOrThrow(res)).order
}
export async function adminUpdateOrderStatus(orderNumber, status, notes) {
  const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status, notes }),
  })
  return (await jsonOrThrow(res)).order
}
export async function adminSetTracking(orderNumber, payload) {
  const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderNumber)}/tracking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return (await jsonOrThrow(res)).order
}
export async function adminClearTracking(orderNumber) {
  const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderNumber)}/tracking`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return (await jsonOrThrow(res)).order
}
export function adminPaymentProofUrl(orderNumber) {
  const t = getAdminToken()
  // Use blob fetch instead (so auth header works) — wrapped below
  return `/api/admin/orders/${encodeURIComponent(orderNumber)}/proof`
}
export async function adminFetchPaymentProofBlob(orderNumber) {
  const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderNumber)}/proof`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to load proof')
  return res.blob()
}
export async function adminVerifyPayment(orderNumber) {
  const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderNumber)}/verify-payment`, {
    method: 'POST', headers: authHeaders(),
  })
  return (await jsonOrThrow(res)).order
}
export async function adminRejectPayment(orderNumber, reason) {
  const res = await fetch(`${BASE}/admin/orders/${encodeURIComponent(orderNumber)}/reject-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ reason }),
  })
  return (await jsonOrThrow(res)).order
}

export async function adminListStock() {
  const res = await fetch(`${BASE}/admin/stock`, { headers: authHeaders() })
  return (await jsonOrThrow(res)).stock
}
export async function adminSetStock(productId, count) {
  const res = await fetch(`${BASE}/admin/stock/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ count }),
  })
  return jsonOrThrow(res)
}

export async function adminListCustomers() {
  const res = await fetch(`${BASE}/admin/customers`, { headers: authHeaders() })
  return (await jsonOrThrow(res)).customers
}

export async function adminListReviews(status = null) {
  const url = status ? `${BASE}/admin/reviews?status=${status}` : `${BASE}/admin/reviews`
  const res = await fetch(url, { headers: authHeaders() })
  return (await jsonOrThrow(res)).reviews
}
export async function adminApproveReview(id) {
  const res = await fetch(`${BASE}/admin/reviews/${encodeURIComponent(id)}/approve`, {
    method: 'POST', headers: authHeaders(),
  })
  return (await jsonOrThrow(res)).review
}
export async function adminRejectReview(id) {
  const res = await fetch(`${BASE}/admin/reviews/${encodeURIComponent(id)}/reject`, {
    method: 'POST', headers: authHeaders(),
  })
  return (await jsonOrThrow(res)).review
}
export async function adminDeleteReview(id) {
  const res = await fetch(`${BASE}/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: authHeaders(),
  })
  return jsonOrThrow(res)
}

export async function adminListProductOverrides() {
  const res = await fetch(`${BASE}/admin/products/overrides`, { headers: authHeaders() })
  return (await jsonOrThrow(res)).overrides
}
export async function adminSetProductOverride(productId, patch) {
  const res = await fetch(`${BASE}/admin/products/${encodeURIComponent(productId)}/override`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(patch),
  })
  return (await jsonOrThrow(res)).override
}
export async function adminClearProductOverride(productId) {
  const res = await fetch(`${BASE}/admin/products/${encodeURIComponent(productId)}/override`, {
    method: 'DELETE', headers: authHeaders(),
  })
  return jsonOrThrow(res)
}
