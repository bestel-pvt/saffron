/**
 * server/auth.js — JWT helpers + requireAdmin middleware
 */
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me'
const EXPIRES_IN = '7d'

export function signAdminToken(username) {
  return jwt.sign({ role: 'admin', username }, SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  req.admin = payload
  next()
}
