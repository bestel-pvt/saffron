/**
 * server/routes/admin.js — admin endpoints (JWT-protected except /login)
 */
import express from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  verifyAdmin, getAllOrders, getOrderByNumber, updateOrderStatus,
  setOrderTracking, clearOrderTracking, setPaymentProof,
  getAllStock, setStock, getAllCustomers, getStats,
  getAllReviews, setReviewStatus, deleteReview,
  getAllProductOverrides, setProductOverride, clearProductOverride,
} from '../db.js'
import { signAdminToken, requireAdmin } from '../auth.js'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dir, '..', 'uploads', 'payment-proofs')

const router = express.Router()

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'username + password required' })
  const ok = await verifyAdmin(username, password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  const token = signAdminToken(username)
  res.json({ token, username })
})

router.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin })
})

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', requireAdmin, async (req, res) => {
  const stats = await getStats()
  res.json(stats)
})

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/orders', requireAdmin, async (req, res) => {
  const orders = await getAllOrders()
  res.json({ orders })
})

router.get('/orders/:number', requireAdmin, async (req, res) => {
  const order = await getOrderByNumber(req.params.number)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
})

router.patch('/orders/:number/status', requireAdmin, async (req, res) => {
  const { status, notes } = req.body
  const valid = ['awaiting_payment', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled']
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' })
  const order = await updateOrderStatus(req.params.number, status, notes)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
})

router.post('/orders/:number/tracking', requireAdmin, async (req, res) => {
  const { carrier, trackingNumber, trackingUrl } = req.body
  if (!carrier || !trackingNumber) {
    return res.status(400).json({ error: 'carrier + trackingNumber required' })
  }
  const order = await setOrderTracking(req.params.number, { carrier, trackingNumber, trackingUrl })
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
})

router.delete('/orders/:number/tracking', requireAdmin, async (req, res) => {
  const order = await clearOrderTracking(req.params.number)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
})

router.get('/orders/:number/proof', requireAdmin, async (req, res) => {
  const order = await getOrderByNumber(req.params.number)
  if (!order) return res.status(404).json({ error: 'Order not found' })
  if (!order.paymentProof?.filename) return res.status(404).json({ error: 'No proof uploaded' })
  const filepath = path.join(UPLOAD_DIR, order.paymentProof.filename)
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found on disk' })
  res.sendFile(filepath)
})

router.post('/orders/:number/verify-payment', requireAdmin, async (req, res) => {
  const order = await updateOrderStatus(req.params.number, 'confirmed', 'Payment verified by admin')
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
})

router.post('/orders/:number/reject-payment', requireAdmin, async (req, res) => {
  const { reason } = req.body
  const order = await updateOrderStatus(req.params.number, 'awaiting_payment', reason || 'Payment rejected — please re-upload proof')
  if (!order) return res.status(404).json({ error: 'Order not found' })
  res.json({ order })
})

// ── Stock ─────────────────────────────────────────────────────────────────────
router.get('/stock', requireAdmin, async (req, res) => {
  const stock = await getAllStock()
  res.json({ stock })
})

router.patch('/stock/:productId', requireAdmin, async (req, res) => {
  const { count } = req.body
  const newCount = await setStock(req.params.productId, count)
  res.json({ productId: req.params.productId, count: newCount })
})

// ── Customers ─────────────────────────────────────────────────────────────────
router.get('/customers', requireAdmin, async (req, res) => {
  const customers = await getAllCustomers()
  res.json({ customers })
})

// ── Reviews moderation ────────────────────────────────────────────────────────
router.get('/reviews', requireAdmin, async (req, res) => {
  const status = req.query.status || null
  const reviews = await getAllReviews(status)
  res.json({ reviews })
})

router.post('/reviews/:id/approve', requireAdmin, async (req, res) => {
  const review = await setReviewStatus(req.params.id, 'approved')
  if (!review) return res.status(404).json({ error: 'Review not found' })
  res.json({ review })
})

router.post('/reviews/:id/reject', requireAdmin, async (req, res) => {
  const review = await setReviewStatus(req.params.id, 'rejected')
  if (!review) return res.status(404).json({ error: 'Review not found' })
  res.json({ review })
})

router.delete('/reviews/:id', requireAdmin, async (req, res) => {
  const ok = await deleteReview(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Review not found' })
  res.json({ success: true })
})

// ── Product Overrides ─────────────────────────────────────────────────────────
router.get('/products/overrides', requireAdmin, async (req, res) => {
  const overrides = await getAllProductOverrides()
  res.json({ overrides })
})

router.patch('/products/:id/override', requireAdmin, async (req, res) => {
  try {
    const { disabled, price, stock, badge, note } = req.body
    const patch = {}
    if (disabled !== undefined) patch.disabled = !!disabled
    if (price !== undefined)    patch.price = price === null ? null : Math.max(0, parseFloat(price) || 0)
    if (stock !== undefined)    patch.stock = stock === null ? null : Math.max(0, parseInt(stock, 10) || 0)
    if (badge !== undefined)    patch.badge = badge ? String(badge).trim() : null
    if (note !== undefined)     patch.note = String(note || '').trim().slice(0, 500)
    const override = await setProductOverride(req.params.id, patch)
    res.json({ override })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/products/:id/override', requireAdmin, async (req, res) => {
  await clearProductOverride(req.params.id)
  res.json({ success: true })
})

export default router
