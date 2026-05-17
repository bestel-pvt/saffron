/**
 * server/db.js — lowdb persistence for Saffron & Co
 *
 * Stores:
 *  - orders             : { orderNumber, items, customer, payment, status, ... }
 *  - customers          : aggregated phone-keyed customer records
 *  - reviews            : { productId, customerPhone, rating, status, ... }
 *  - stock              : { [productId]: count }
 *  - productOverrides   : { [productId]: { disabled?, price?, stock?, badge?, note? } }
 *  - orderSeq           : { year, n }
 *  - admins             : [{ username, passwordHash }]
 */
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import bcrypt from 'bcryptjs'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR = process.env.DB_DIR || path.join(__dir, 'data')
const DB_PATH = path.join(DB_DIR, 'db.json')

const defaultData = {
  orders: [],
  customers: [],
  reviews: [],
  stock: {},
  productOverrides: {},
  orderSeq: { year: new Date().getFullYear(), n: 0 },
  admins: [],
}

const adapter = new JSONFile(DB_PATH)
const db = new Low(adapter, defaultData)

let initialized = false

async function ensureDb() {
  if (!existsSync(DB_DIR)) {
    await mkdir(DB_DIR, { recursive: true })
  }
  await db.read()
  if (!db.data) db.data = defaultData

  for (const key of Object.keys(defaultData)) {
    if (db.data[key] === undefined) db.data[key] = defaultData[key]
  }

  // Seed default admin if none exists
  if (db.data.admins.length === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'changeme'
    const passwordHash = await bcrypt.hash(password, 10)
    db.data.admins.push({ username, passwordHash })
    await db.write()
    console.log(`[db] Seeded default admin: ${username} (change ADMIN_PASSWORD env in production!)`)
  }

  initialized = true
}

// Single-writer queue to avoid concurrent file-write corruption
let queue = Promise.resolve()
function enqueue(work) {
  const next = queue.then(work).catch(e => { console.error('[db] write failed:', e) })
  queue = next.then(() => {}, () => {})
  return next
}

async function getDb() {
  if (!initialized) await ensureDb()
  return db
}

// ── Orders ────────────────────────────────────────────────────────────────────
export async function nextOrderNumber() {
  return enqueue(async () => {
    const d = await getDb()
    const year = new Date().getFullYear()
    if (d.data.orderSeq.year !== year) {
      d.data.orderSeq = { year, n: 0 }
    }
    d.data.orderSeq.n += 1
    await d.write()
    return `SC-${year}-${String(d.data.orderSeq.n).padStart(4, '0')}`
  })
}

export async function createOrder(order) {
  return enqueue(async () => {
    const d = await getDb()
    const phoneDigits = String(order.customer?.phone || '').replace(/\D/g, '')

    // Upsert customer
    let customer = d.data.customers.find(c => c.phoneDigits === phoneDigits)
    if (!customer) {
      customer = {
        phoneDigits,
        name: order.customer.name,
        phone: order.customer.phone,
        city: order.customer.city,
        address: order.customer.address,
        firstOrderAt: new Date().toISOString(),
        totalOrders: 0,
        totalSpent: 0,
      }
      d.data.customers.push(customer)
    }
    customer.totalOrders += 1
    customer.totalSpent += order.total || 0
    customer.lastOrderAt = new Date().toISOString()
    customer.name = order.customer.name
    customer.city = order.customer.city
    customer.address = order.customer.address

    d.data.orders.push(order)

    // Decrement stock
    order.items.forEach(item => {
      const current = d.data.stock[item.id]
      if (current !== undefined) {
        d.data.stock[item.id] = Math.max(0, current - (item.quantity || 1))
      }
    })

    await d.write()
    return order
  })
}

export async function getAllOrders() {
  const d = await getDb()
  return d.data.orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getOrderByNumber(orderNumber) {
  const d = await getDb()
  return d.data.orders.find(o => o.orderNumber === orderNumber) || null
}

export async function getOrdersByPhone(phone) {
  const d = await getDb()
  const digits = String(phone).replace(/\D/g, '')
  return d.data.orders
    .filter(o => String(o.customer?.phone || '').replace(/\D/g, '').includes(digits))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function updateOrderStatus(orderNumber, status, notes) {
  return enqueue(async () => {
    const d = await getDb()
    const order = d.data.orders.find(o => o.orderNumber === orderNumber)
    if (!order) return null
    order.status = status
    order.statusUpdatedAt = new Date().toISOString()
    if (notes) order.notes = notes
    await d.write()
    return order
  })
}

export async function setOrderTracking(orderNumber, tracking) {
  return enqueue(async () => {
    const d = await getDb()
    const order = d.data.orders.find(o => o.orderNumber === orderNumber)
    if (!order) return null
    order.tracking = {
      carrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      trackingUrl: tracking.trackingUrl || '',
      addedAt: new Date().toISOString(),
    }
    if (order.status === 'confirmed' || order.status === 'processing') {
      order.status = 'dispatched'
      order.statusUpdatedAt = new Date().toISOString()
    }
    await d.write()
    return order
  })
}

export async function clearOrderTracking(orderNumber) {
  return enqueue(async () => {
    const d = await getDb()
    const order = d.data.orders.find(o => o.orderNumber === orderNumber)
    if (!order) return null
    delete order.tracking
    await d.write()
    return order
  })
}

export async function setPaymentProof(orderNumber, proofMeta) {
  return enqueue(async () => {
    const d = await getDb()
    const order = d.data.orders.find(o => o.orderNumber === orderNumber)
    if (!order) return null
    order.paymentProof = {
      filename: proofMeta.filename,
      originalName: proofMeta.originalName,
      size: proofMeta.size,
      mimetype: proofMeta.mimetype,
      uploadedAt: new Date().toISOString(),
    }
    await d.write()
    return order
  })
}

// ── Reviews ───────────────────────────────────────────────────────────────────
function abbreviateName(fullName) {
  if (!fullName) return 'Anonymous'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

export async function createReview(input) {
  const d = await getDb()
  const phone = String(input.customerPhone || '').replace(/\D/g, '')
  const matchingOrders = d.data.orders.filter(o =>
    String(o.customer?.phone || '').replace(/\D/g, '') === phone
  )

  if (matchingOrders.length === 0) {
    throw new Error('No order found for this phone number. You can only review products you have purchased.')
  }

  const validStatuses = ['confirmed', 'processing', 'dispatched', 'delivered']
  const owningOrder = matchingOrders.find(o =>
    validStatuses.includes(o.status) &&
    o.items.some(it => String(it.id) === String(input.productId))
  )
  if (!owningOrder) {
    throw new Error('Product not found in any of your confirmed orders.')
  }

  const existing = d.data.reviews.find(r =>
    String(r.productId) === String(input.productId) &&
    String(r.customerPhone || '').replace(/\D/g, '') === phone
  )
  if (existing) throw new Error('You have already reviewed this product')

  const rating = Math.max(1, Math.min(5, parseInt(input.rating, 10) || 0))
  if (rating < 1) throw new Error('Rating must be between 1 and 5')

  const review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    productId: input.productId,
    orderNumber: owningOrder.orderNumber,
    customerName: abbreviateName(input.customerName || owningOrder.customer.name),
    customerPhone: phone,
    rating,
    title: String(input.title || '').trim().slice(0, 100),
    comment: String(input.comment || '').trim().slice(0, 1000),
    createdAt: new Date().toISOString(),
    status: 'pending',
  }

  return enqueue(async () => {
    d.data.reviews.push(review)
    await d.write()
    return review
  })
}

export async function getApprovedReviewsForProduct(productId) {
  const d = await getDb()
  return d.data.reviews
    .filter(r => String(r.productId) === String(productId) && r.status === 'approved')
    .map(r => ({
      id: r.id,
      productId: r.productId,
      customerName: r.customerName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      createdAt: r.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getReviewAggregates(productId) {
  const reviews = await getApprovedReviewsForProduct(productId)
  if (reviews.length === 0) return { count: 0, average: null, distribution: {} }
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  const distribution = { 5:0, 4:0, 3:0, 2:0, 1:0 }
  reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1 })
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
    distribution,
  }
}

export async function getAllReviews(statusFilter = null) {
  const d = await getDb()
  let list = d.data.reviews.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  if (statusFilter) list = list.filter(r => r.status === statusFilter)
  return list
}

export async function setReviewStatus(reviewId, status) {
  return enqueue(async () => {
    const d = await getDb()
    const review = d.data.reviews.find(r => r.id === reviewId)
    if (!review) return null
    review.status = status
    review.moderatedAt = new Date().toISOString()
    await d.write()
    return review
  })
}

export async function deleteReview(reviewId) {
  return enqueue(async () => {
    const d = await getDb()
    const before = d.data.reviews.length
    d.data.reviews = d.data.reviews.filter(r => r.id !== reviewId)
    await d.write()
    return d.data.reviews.length < before
  })
}

// ── Stock ─────────────────────────────────────────────────────────────────────
export async function getAllStock() {
  const d = await getDb()
  return d.data.stock
}

export async function setStock(productId, count) {
  return enqueue(async () => {
    const d = await getDb()
    d.data.stock[productId] = Math.max(0, parseInt(count, 10) || 0)
    await d.write()
    return d.data.stock[productId]
  })
}

// ── Product Overrides ─────────────────────────────────────────────────────────
export async function getAllProductOverrides() {
  const d = await getDb()
  return d.data.productOverrides || {}
}

export async function setProductOverride(productId, patch) {
  return enqueue(async () => {
    const d = await getDb()
    const current = d.data.productOverrides[productId] || {}
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
    if (patch.disabled === true && !current.disabled) {
      next.disabledAt = new Date().toISOString()
    }
    if (patch.disabled === false) {
      delete next.disabledAt
    }
    d.data.productOverrides[productId] = next
    await d.write()
    return next
  })
}

export async function clearProductOverride(productId) {
  return enqueue(async () => {
    const d = await getDb()
    delete d.data.productOverrides[productId]
    await d.write()
    return true
  })
}

// ── Customers ─────────────────────────────────────────────────────────────────
export async function getAllCustomers() {
  const d = await getDb()
  return d.data.customers.slice().sort((a, b) => new Date(b.lastOrderAt || b.firstOrderAt) - new Date(a.lastOrderAt || a.firstOrderAt))
}

// ── Admin auth ────────────────────────────────────────────────────────────────
export async function verifyAdmin(username, password) {
  const d = await getDb()
  const admin = d.data.admins.find(a => a.username === username)
  if (!admin) return false
  return bcrypt.compare(password, admin.passwordHash)
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getStats() {
  const d = await getDb()
  const orders = d.data.orders
  const reviews = d.data.reviews
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + (o.total || 0), 0)
  return {
    totalOrders: orders.length,
    totalCustomers: d.data.customers.length,
    totalRevenue,
    pendingOrders: orders.filter(o => o.status === 'awaiting_payment' || o.status === 'confirmed').length,
    dispatched: orders.filter(o => o.status === 'dispatched').length,
    pendingReviews: reviews.filter(r => r.status === 'pending').length,
    totalReviews: reviews.length,
  }
}

// Initialize on import
await ensureDb()
