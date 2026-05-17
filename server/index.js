/**
 * server/index.js — Saffron & Co backend
 * Express server with lowdb + JWT admin auth + multer payment-proof uploads.
 */
import express from 'express'
import cors from 'cors'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'

import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import reviewsRouter from './routes/reviews.js'
import { getAllProductOverrides } from './db.js'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dir, '..')

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Request logger (very lightweight)
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`)
  })
  next()
})

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve generated /api/*.json files (products.json, categories.json) from /public/api/.
// In dev, Vite proxies /api/* → backend, so these would 404 without this handler.
// In production, Vite-built dist/ also includes /api/*.json — handled by static below.
const publicApiDir = path.join(ROOT, 'public', 'api')
app.use('/api', express.static(publicApiDir, {
  extensions: false,
  index: false,
  // Only serve .json files, let everything else fall through to API routes
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-cache')
    }
  },
}))

// Public — read-only product overrides (used by frontend to hide disabled products)
app.get('/api/products/overrides', async (req, res) => {
  try {
    const overrides = await getAllProductOverrides()
    res.json({ overrides })
  } catch (err) {
    console.error('[GET /api/products/overrides]', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.use('/api/orders', ordersRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/admin', adminRouter)

// ── Static & SPA fallback ─────────────────────────────────────────────────────
// Serve dist/ whenever it exists. This handles production deployments
// (Railway etc.) without requiring NODE_ENV.
const distPath = path.join(ROOT, 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log(`[server] Serving frontend from ${distPath}`)
} else {
  console.log('[server] No dist/ — API-only mode (run `npm run build` to bundle frontend)')
}

// ── Listen ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

// Print mounted routes
function listRoutes(prefix, router) {
  const out = []
  router.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase())
      methods.forEach(m => out.push(`  ${m.padEnd(11)} ${prefix}${layer.route.path}`))
    }
  })
  return out
}

app.listen(PORT, () => {
  console.log(`\n[server] Saffron & Co API listening on http://localhost:${PORT}`)
  console.log('[server] Mounted routes:')
  console.log('  GET         /api/health')
  console.log('  GET         /api/products/overrides')
  listRoutes('/api/orders', ordersRouter).forEach(r => console.log(r))
  listRoutes('/api/reviews', reviewsRouter).forEach(r => console.log(r))
  listRoutes('/api/admin', adminRouter).forEach(r => console.log(r))
  console.log('\n[server] Vite proxies /api/* from 5173 → ' + PORT)
})
