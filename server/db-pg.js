/**
 * server/db-pg.js — Postgres persistence for Saffron & Co
 *
 * Drop-in replacement for db.js. Same exports, same return shapes — different
 * storage backend. Used when STORAGE_BACKEND=postgres + DATABASE_URL are set.
 *
 * Storage: Neon Postgres (or any Postgres). Free tier: 3 GiB, never expires.
 */
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  idleTimeoutMillis: 30000,
})

let initialized = false

async function runMigrations() {
  const sql = await readFile(path.join(__dir, 'migrations', '001_init.sql'), 'utf8')
  await pool.query(sql)
  console.log('[db-pg] Migrations applied')
}

async function seedAdminIfEmpty() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM admins')
  if (rows[0].n === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'changeme'
    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2)',
      [username, hash]
    )
    console.log(`[db-pg] Seeded default admin: ${username}`)
  }
}

async function ensureDb() {
  if (initialized) return
  await runMigrations()
  await seedAdminIfEmpty()
  initialized = true
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizePhone(phone) {
  let p = String(phone || '').replace(/\D/g, '')
  if (p.startsWith('92') && p.length === 12) p = p.slice(2)
  else if (p.startsWith('0') && p.length === 11) p = p.slice(1)
  return p
}

function abbreviateName(fullName) {
  if (!fullName) return 'Anonymous'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

// Row → API order shape. Handles SQL → camelCase + datetimes → ISO strings.
function rowToOrder(row) {
  if (!row) return null
  return {
    orderNumber:      row.order_number,
    status:           row.status,
    customer:         row.customer,
    items:            row.items,
    payment:          row.payment,
    easyTid:          row.easy_tid || undefined,
    subtotal:         row.subtotal,
    delivery:         row.delivery,
    total:            row.total,
    tracking:         row.tracking || undefined,
    notes:            row.notes || undefined,
    paymentProof:     row.payment_proof || undefined,
    createdAt:        row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    statusUpdatedAt:  row.status_updated_at instanceof Date ? row.status_updated_at.toISOString() : row.status_updated_at,
  }
}

function rowToCustomer(row) {
  if (!row) return null
  return {
    phoneDigits:   row.phone_digits,
    name:          row.name,
    phone:         row.phone,
    city:          row.city,
    address:       row.address,
    totalOrders:   row.total_orders,
    totalSpent:    row.total_spent,
    firstOrderAt:  row.first_order_at instanceof Date ? row.first_order_at.toISOString() : row.first_order_at,
    lastOrderAt:   row.last_order_at instanceof Date ? row.last_order_at.toISOString() : row.last_order_at,
  }
}

function rowToReview(row) {
  if (!row) return null
  return {
    id:             row.id,
    productId:      row.product_id,
    orderNumber:    row.order_number || undefined,
    customerName:   row.customer_name,
    customerPhone:  row.customer_phone,
    rating:         row.rating,
    title:          row.title || '',
    comment:        row.comment || '',
    status:         row.status,
    createdAt:      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    moderatedAt:    row.moderated_at instanceof Date ? row.moderated_at.toISOString() : row.moderated_at,
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────
export async function nextOrderNumber() {
  await ensureDb()
  const year = new Date().getFullYear()

  // Atomic upsert: increment counter for current year
  const sql = `
    INSERT INTO counters (key, value)
    VALUES ('orderSeq', jsonb_build_object('year', $1::int, 'n', 1))
    ON CONFLICT (key) DO UPDATE SET value =
      CASE
        WHEN (counters.value->>'year')::int = $1 THEN
          jsonb_build_object('year', $1::int, 'n', (counters.value->>'n')::int + 1)
        ELSE
          jsonb_build_object('year', $1::int, 'n', 1)
      END
    RETURNING value
  `
  const { rows } = await pool.query(sql, [year])
  const n = rows[0].value.n
  return `SC-${year}-${String(n).padStart(4, '0')}`
}

export async function createOrder(order) {
  await ensureDb()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Upsert customer — keyed by NORMALIZED phone (no 0/92 prefix), so all
    // formats ("03001234567", "+92 300 1234567", "923001234567") collapse to
    // the same customer record.
    const phoneNormalized = normalizePhone(order.customer?.phone)
    await client.query(
      `INSERT INTO customers (phone_digits, name, phone, city, address, total_orders, total_spent, first_order_at, last_order_at)
       VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
       ON CONFLICT (phone_digits) DO UPDATE SET
         total_orders  = customers.total_orders + 1,
         total_spent   = customers.total_spent + EXCLUDED.total_spent,
         last_order_at = NOW(),
         name          = EXCLUDED.name,
         city          = EXCLUDED.city,
         address       = EXCLUDED.address`,
      [
        phoneNormalized,
        order.customer.name,
        order.customer.phone,
        order.customer.city,
        order.customer.address,
        order.total || 0,
      ]
    )

    // Insert order
    await client.query(
      `INSERT INTO orders (order_number, status, customer, items, payment, easy_tid, subtotal, delivery, total, created_at)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, $10)`,
      [
        order.orderNumber,
        order.status,
        JSON.stringify(order.customer),
        JSON.stringify(order.items),
        order.payment,
        order.easyTid || null,
        order.subtotal || 0,
        order.delivery || 0,
        order.total || 0,
        order.createdAt || new Date().toISOString(),
      ]
    )

    // Decrement stock
    for (const item of order.items) {
      await client.query(
        `UPDATE stock SET count = GREATEST(0, count - $2) WHERE product_id = $1`,
        [item.id, item.quantity || 1]
      )
    }

    await client.query('COMMIT')
    return order
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function getAllOrders() {
  await ensureDb()
  const { rows } = await pool.query(`SELECT * FROM orders ORDER BY created_at DESC`)
  return rows.map(rowToOrder)
}

export async function getOrderByNumber(orderNumber) {
  await ensureDb()
  const { rows } = await pool.query(`SELECT * FROM orders WHERE order_number = $1`, [orderNumber])
  return rowToOrder(rows[0])
}

export async function getOrdersByPhone(phone) {
  await ensureDb()
  const normalized = normalizePhone(phone)
  if (!normalized) return []
  // Strip non-digits from stored phone, then ALSO strip leading 0/92, then exact match.
  // This handles every reasonable Pakistani phone format on both sides.
  const sql = `
    SELECT * FROM orders
    WHERE regexp_replace(
            regexp_replace(customer->>'phone', '\\D', '', 'g'),
            '^(0|92)',
            ''
          ) = $1
    ORDER BY created_at DESC
  `
  const { rows } = await pool.query(sql, [normalized])
  return rows.map(rowToOrder)
}

export async function updateOrderStatus(orderNumber, status, notes) {
  await ensureDb()
  const { rows } = await pool.query(
    `UPDATE orders SET status = $2, status_updated_at = NOW(), notes = COALESCE($3, notes) WHERE order_number = $1 RETURNING *`,
    [orderNumber, status, notes || null]
  )
  return rowToOrder(rows[0])
}

export async function setOrderTracking(orderNumber, tracking) {
  await ensureDb()
  const trackingObj = {
    carrier: tracking.carrier,
    trackingNumber: tracking.trackingNumber,
    trackingUrl: tracking.trackingUrl || '',
    addedAt: new Date().toISOString(),
  }
  const { rows } = await pool.query(
    `UPDATE orders SET
       tracking = $2::jsonb,
       status = CASE WHEN status IN ('confirmed','processing') THEN 'dispatched' ELSE status END,
       status_updated_at = CASE WHEN status IN ('confirmed','processing') THEN NOW() ELSE status_updated_at END
     WHERE order_number = $1
     RETURNING *`,
    [orderNumber, JSON.stringify(trackingObj)]
  )
  return rowToOrder(rows[0])
}

export async function clearOrderTracking(orderNumber) {
  await ensureDb()
  const { rows } = await pool.query(
    `UPDATE orders SET tracking = NULL WHERE order_number = $1 RETURNING *`,
    [orderNumber]
  )
  return rowToOrder(rows[0])
}

export async function setPaymentProof(orderNumber, proofMeta) {
  await ensureDb()
  const proof = {
    filename: proofMeta.filename,
    originalName: proofMeta.originalName,
    size: proofMeta.size,
    mimetype: proofMeta.mimetype,
    uploadedAt: new Date().toISOString(),
    ...(proofMeta.url ? { url: proofMeta.url } : {}),
  }
  const { rows } = await pool.query(
    `UPDATE orders SET payment_proof = $2::jsonb WHERE order_number = $1 RETURNING *`,
    [orderNumber, JSON.stringify(proof)]
  )
  return rowToOrder(rows[0])
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export async function createReview(input) {
  await ensureDb()
  const phone = normalizePhone(input.customerPhone)

  // Find matching orders by normalized phone
  const matchSql = `
    SELECT order_number, status, items, customer FROM orders
    WHERE regexp_replace(
      regexp_replace(customer->>'phone', '\\D', '', 'g'),
      '^(0|92)',
      ''
    ) = $1
  `
  const { rows: matching } = await pool.query(matchSql, [phone])

  if (matching.length === 0) {
    throw new Error('No order found for this phone number. You can only review products you have purchased.')
  }

  const validStatuses = ['confirmed', 'processing', 'dispatched', 'delivered']
  const owningOrder = matching.find(o =>
    validStatuses.includes(o.status) &&
    o.items.some(it => String(it.id) === String(input.productId))
  )
  if (!owningOrder) {
    throw new Error('Product not found in any of your confirmed orders.')
  }

  // Duplicate check
  const dup = await pool.query(
    `SELECT id FROM reviews WHERE product_id = $1 AND customer_phone = $2 LIMIT 1`,
    [String(input.productId), phone]
  )
  if (dup.rows.length > 0) {
    throw new Error('You have already reviewed this product')
  }

  const rating = Math.max(1, Math.min(5, parseInt(input.rating, 10) || 0))
  if (rating < 1) throw new Error('Rating must be between 1 and 5')

  const id = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const review = {
    id,
    productId: String(input.productId),
    orderNumber: owningOrder.order_number,
    customerName: abbreviateName(input.customerName || owningOrder.customer.name),
    customerPhone: phone,
    rating,
    title: String(input.title || '').trim().slice(0, 100),
    comment: String(input.comment || '').trim().slice(0, 1000),
    status: 'pending',
  }

  await pool.query(
    `INSERT INTO reviews (id, product_id, order_number, customer_name, customer_phone, rating, title, comment, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [review.id, review.productId, review.orderNumber, review.customerName, review.customerPhone, review.rating, review.title, review.comment, review.status]
  )

  return { ...review, createdAt: new Date().toISOString() }
}

export async function getApprovedReviewsForProduct(productId) {
  await ensureDb()
  const { rows } = await pool.query(
    `SELECT id, product_id, customer_name, rating, title, comment, created_at
     FROM reviews
     WHERE product_id = $1 AND status = 'approved'
     ORDER BY created_at DESC`,
    [String(productId)]
  )
  return rows.map(r => ({
    id: r.id,
    productId: r.product_id,
    customerName: r.customer_name,
    rating: r.rating,
    title: r.title || '',
    comment: r.comment || '',
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }))
}

export async function getReviewAggregates(productId) {
  const reviews = await getApprovedReviewsForProduct(productId)
  if (reviews.length === 0) return { count: 0, average: null, distribution: {} }
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1 })
  return {
    count: reviews.length,
    average: Math.round((sum / reviews.length) * 10) / 10,
    distribution,
  }
}

export async function getAllReviews(statusFilter = null) {
  await ensureDb()
  let sql = `SELECT * FROM reviews`
  const params = []
  if (statusFilter) {
    sql += ` WHERE status = $1`
    params.push(statusFilter)
  }
  sql += ` ORDER BY created_at DESC`
  const { rows } = await pool.query(sql, params)
  return rows.map(rowToReview)
}

export async function setReviewStatus(reviewId, status) {
  await ensureDb()
  const { rows } = await pool.query(
    `UPDATE reviews SET status = $2, moderated_at = NOW() WHERE id = $1 RETURNING *`,
    [reviewId, status]
  )
  return rowToReview(rows[0])
}

export async function deleteReview(reviewId) {
  await ensureDb()
  const { rowCount } = await pool.query(`DELETE FROM reviews WHERE id = $1`, [reviewId])
  return rowCount > 0
}

// ── Stock ─────────────────────────────────────────────────────────────────────
export async function getAllStock() {
  await ensureDb()
  const { rows } = await pool.query(`SELECT product_id, count FROM stock`)
  const out = {}
  rows.forEach(r => { out[r.product_id] = r.count })
  return out
}

export async function setStock(productId, count) {
  await ensureDb()
  const c = Math.max(0, parseInt(count, 10) || 0)
  await pool.query(
    `INSERT INTO stock (product_id, count) VALUES ($1, $2)
     ON CONFLICT (product_id) DO UPDATE SET count = EXCLUDED.count`,
    [productId, c]
  )
  return c
}

// ── Product Overrides ─────────────────────────────────────────────────────────
export async function getAllProductOverrides() {
  await ensureDb()
  const { rows } = await pool.query(`SELECT product_id, data FROM product_overrides`)
  const out = {}
  rows.forEach(r => { out[r.product_id] = r.data })
  return out
}

export async function setProductOverride(productId, patch) {
  await ensureDb()
  const { rows: cur } = await pool.query(
    `SELECT data FROM product_overrides WHERE product_id = $1`,
    [productId]
  )
  const current = cur[0]?.data || {}
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
  if (patch.disabled === true && !current.disabled) {
    next.disabledAt = new Date().toISOString()
  }
  if (patch.disabled === false) {
    delete next.disabledAt
  }
  await pool.query(
    `INSERT INTO product_overrides (product_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (product_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [productId, JSON.stringify(next)]
  )
  return next
}

export async function clearProductOverride(productId) {
  await ensureDb()
  await pool.query(`DELETE FROM product_overrides WHERE product_id = $1`, [productId])
  return true
}

// ── Customers ─────────────────────────────────────────────────────────────────
export async function getAllCustomers() {
  await ensureDb()
  const { rows } = await pool.query(
    `SELECT * FROM customers ORDER BY COALESCE(last_order_at, first_order_at) DESC`
  )
  return rows.map(rowToCustomer)
}

// ── Admin auth ────────────────────────────────────────────────────────────────
export async function verifyAdmin(username, password) {
  await ensureDb()
  const { rows } = await pool.query(
    `SELECT password_hash FROM admins WHERE username = $1`,
    [username]
  )
  if (rows.length === 0) return false
  return bcrypt.compare(password, rows[0].password_hash)
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getStats() {
  await ensureDb()
  // One round trip is enough — single query with FILTER clauses
  const sql = `
    SELECT
      (SELECT COUNT(*)::int FROM orders)                                                                       AS total_orders,
      (SELECT COUNT(*)::int FROM customers)                                                                    AS total_customers,
      (SELECT COALESCE(SUM(total), 0)::int FROM orders WHERE status != 'cancelled')                            AS total_revenue,
      (SELECT COUNT(*)::int FROM orders WHERE status IN ('awaiting_payment','confirmed'))                      AS pending_orders,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'dispatched')                                           AS dispatched,
      (SELECT COUNT(*)::int FROM reviews WHERE status = 'pending')                                             AS pending_reviews,
      (SELECT COUNT(*)::int FROM reviews)                                                                      AS total_reviews
  `
  const { rows } = await pool.query(sql)
  const r = rows[0]
  return {
    totalOrders: r.total_orders,
    totalCustomers: r.total_customers,
    totalRevenue: r.total_revenue,
    pendingOrders: r.pending_orders,
    dispatched: r.dispatched,
    pendingReviews: r.pending_reviews,
    totalReviews: r.total_reviews,
  }
}

// Eager-initialize on import so first request isn't slow
await ensureDb()
