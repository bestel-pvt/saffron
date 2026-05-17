/**
 * server/routes/orders.js — public order endpoints
 */
import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import {
  nextOrderNumber, createOrder, getOrderByNumber, getOrdersByPhone,
  updateOrderStatus, setPaymentProof,
} from '../db.js'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dir, '..', 'uploads', 'payment-proofs')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const orderNumber = req.params.number || 'unknown'
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const ts = Date.now()
    cb(null, `${orderNumber}-${ts}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpe?g|png|webp)$/.test(file.mimetype)
    cb(ok ? null : new Error('Only JPG/PNG/WebP images allowed'), ok)
  },
})

const router = express.Router()

// ── POST /api/orders — place order ────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { items, customer, payment, easyTid, subtotal, delivery, total } = req.body

    if (!items?.length) return res.status(400).json({ error: 'No items in order' })
    if (!customer?.name) return res.status(400).json({ error: 'Customer name required' })
    if (!customer?.phone) return res.status(400).json({ error: 'Customer phone required' })
    if (String(customer.phone).replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }
    if (!customer?.address) return res.status(400).json({ error: 'Delivery address required' })
    if (!customer?.city) return res.status(400).json({ error: 'City required' })
    if (!['cod', 'easypaisa'].includes(payment)) {
      return res.status(400).json({ error: 'Invalid payment method' })
    }

    if (payment === 'easypaisa') {
      const tid = String(easyTid || '').trim()
      if (tid.length < 6) {
        return res.status(400).json({ error: 'EasyPaisa Transaction ID must be at least 6 characters' })
      }
    }

    const orderNumber = await nextOrderNumber()
    const order = {
      orderNumber,
      items: items.map(it => ({
        id: it.id,
        name: it.name,
        cat: it.cat,
        price: it.price,
        quantity: it.quantity || 1,
        img: it.img,
        size: it.size,
      })),
      customer: {
        name: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        city: String(customer.city).trim(),
        address: String(customer.address).trim(),
      },
      payment,
      easyTid: payment === 'easypaisa' ? String(easyTid).trim() : '',
      subtotal: Number(subtotal) || 0,
      delivery: Number(delivery) || 0,
      total: Number(total) || 0,
      createdAt: new Date().toISOString(),
      status: payment === 'easypaisa' ? 'awaiting_payment' : 'confirmed',
    }

    await createOrder(order)
    res.json({ success: true, order })
  } catch (err) {
    console.error('[POST /api/orders] error:', err)
    res.status(500).json({ error: err.message || 'Failed to place order' })
  }
})

// ── POST /api/orders/track — track orders by phone ────────────────────────────
router.post('/track', async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone || String(phone).replace(/\D/g, '').length < 4) {
      return res.status(400).json({ error: 'Enter a valid phone number' })
    }
    const orders = await getOrdersByPhone(phone)
    res.json({ orders })
  } catch (err) {
    console.error('[POST /api/orders/track] error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/orders/:number/proof — upload payment proof ─────────────────────
router.post('/:number/proof', upload.single('proof'), async (req, res) => {
  try {
    const { number } = req.params
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const order = await getOrderByNumber(number)
    if (!order) {
      // Clean up the file
      try { fs.unlinkSync(req.file.path) } catch {}
      return res.status(404).json({ error: 'Order not found' })
    }
    await setPaymentProof(number, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })
    res.json({ success: true, filename: req.file.filename })
  } catch (err) {
    console.error('[POST /api/orders/:number/proof] error:', err)
    res.status(500).json({ error: err.message || 'Upload failed' })
  }
})

// ── GET /api/orders/:number — single order lookup ─────────────────────────────
router.get('/:number', async (req, res) => {
  try {
    const order = await getOrderByNumber(req.params.number)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json({ order })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
