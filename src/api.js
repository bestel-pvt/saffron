/**
 * api.js — client-side fetch layer
 * Calls static JSON endpoints served from /public/api/
 * These show up as real Fetch/XHR requests in the browser Network tab.
 */

const BASE = '/api'

export async function fetchProducts() {
  const res = await fetch(`${BASE}/products.json`, {
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`Failed to load products (${res.status})`)
  const json = await res.json()
  return json.data
}

export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories.json`, {
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`Failed to load categories (${res.status})`)
  const json = await res.json()
  return json.data
}
