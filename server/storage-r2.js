/**
 * server/storage-r2.js — Cloudflare R2 (S3-compatible) upload helper for
 * payment-proof images. Replaces the local /uploads/payment-proofs directory
 * when STORAGE_BACKEND=postgres (the same flag enables Postgres).
 *
 * R2 free tier: 10 GB storage, no egress fees. Forever free, no card required
 * beyond Cloudflare account verification.
 *
 * Env vars needed:
 *   R2_ACCOUNT_ID     — Cloudflare account ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET         — bucket name, e.g. "saffron-payment-proofs"
 *   R2_PUBLIC_URL     — public r2.dev or custom domain, e.g. "https://pub-xxxxx.r2.dev"
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomBytes } from 'crypto'
import path from 'path'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET
const PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')

export function isR2Configured() {
  return Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID &&
                 process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET && process.env.R2_PUBLIC_URL)
}

/**
 * Upload a buffer to R2 and return public URL + metadata.
 * @param {Buffer} buffer       file bytes
 * @param {string} originalName original filename for the extension
 * @param {string} mimetype     MIME type
 * @param {string} prefix       folder prefix in bucket (e.g. "payment-proofs")
 */
export async function uploadBuffer(buffer, originalName, mimetype, prefix = 'payment-proofs') {
  if (!isR2Configured()) {
    throw new Error('R2 not configured — set R2_* env vars')
  }

  const ext = path.extname(originalName || '').toLowerCase().replace(/[^a-z0-9.]/g, '') || ''
  const filename = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`
  const key = `${prefix}/${filename}`

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype || 'application/octet-stream',
  }))

  return {
    filename,                                  // just the name (no folder)
    key,                                       // full path inside bucket
    originalName: originalName || filename,
    size: buffer.length,
    mimetype: mimetype || 'application/octet-stream',
    url: `${PUBLIC_URL}/${key}`,               // public URL clients can hit directly
  }
}

export async function deleteObject(key) {
  if (!isR2Configured()) return
  try {
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch (err) {
    console.error('[r2] Delete failed:', err.message)
  }
}
