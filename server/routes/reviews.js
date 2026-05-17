/**
 * server/routes/reviews.js — public review endpoints
 */
import express from 'express'
import { createReview, getApprovedReviewsForProduct, getReviewAggregates } from '../db.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { productId, customerPhone, customerName, rating, title, comment } = req.body
    if (!productId)     return res.status(400).json({ error: 'productId required' })
    if (!customerPhone) return res.status(400).json({ error: 'customerPhone required' })
    if (!rating)        return res.status(400).json({ error: 'rating required' })
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({ error: 'Comment must be at least 10 characters' })
    }
    const review = await createReview({ productId, customerPhone, customerName, rating, title, comment })
    res.json({
      success: true,
      message: 'Thanks! Your review will be visible once our team approves it (usually within 24 hours).',
      reviewId: review.id,
    })
  } catch (err) {
    console.error('[POST /api/reviews] error:', err)
    res.status(400).json({ error: err.message || 'Failed to submit review' })
  }
})

router.get('/:productId', async (req, res) => {
  try {
    const reviews = await getApprovedReviewsForProduct(req.params.productId)
    res.json({ reviews })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:productId/summary', async (req, res) => {
  try {
    const summary = await getReviewAggregates(req.params.productId)
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
