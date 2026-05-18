/**
 * server/store.js — backend selector.
 *
 * If STORAGE_BACKEND=postgres (+ DATABASE_URL is set), use db-pg.js (Postgres).
 * Otherwise fall back to db.js (lowdb, JSON file on disk).
 *
 * All route handlers import from this module, not directly from db.js / db-pg.js.
 *
 * Local dev: no env vars → uses lowdb (db.json in server/data/), same as before.
 * Production on Render free + Neon: set STORAGE_BACKEND=postgres + DATABASE_URL.
 */
const usePostgres = process.env.STORAGE_BACKEND === 'postgres' && process.env.DATABASE_URL

const backend = usePostgres
  ? await import('./db-pg.js')
  : await import('./db.js')

console.log(`[store] Using ${usePostgres ? 'Postgres' : 'lowdb (local JSON)'} backend`)

// Re-export every symbol from the chosen backend so callers can do:
//   import { createOrder, getStats } from '../store.js'
export const nextOrderNumber              = backend.nextOrderNumber
export const createOrder                  = backend.createOrder
export const getAllOrders                 = backend.getAllOrders
export const getOrderByNumber             = backend.getOrderByNumber
export const getOrdersByPhone             = backend.getOrdersByPhone
export const updateOrderStatus            = backend.updateOrderStatus
export const setOrderTracking             = backend.setOrderTracking
export const clearOrderTracking           = backend.clearOrderTracking
export const setPaymentProof              = backend.setPaymentProof
export const createReview                 = backend.createReview
export const getApprovedReviewsForProduct = backend.getApprovedReviewsForProduct
export const getReviewAggregates          = backend.getReviewAggregates
export const getAllReviews                = backend.getAllReviews
export const setReviewStatus              = backend.setReviewStatus
export const deleteReview                 = backend.deleteReview
export const getAllStock                  = backend.getAllStock
export const setStock                     = backend.setStock
export const getAllProductOverrides       = backend.getAllProductOverrides
export const setProductOverride           = backend.setProductOverride
export const clearProductOverride         = backend.clearProductOverride
export const getAllCustomers              = backend.getAllCustomers
export const verifyAdmin                  = backend.verifyAdmin
export const getStats                     = backend.getStats

export const usingPostgres = usePostgres
