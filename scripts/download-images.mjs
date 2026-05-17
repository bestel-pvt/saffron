/**
 * download-images.mjs
 * Downloads relevant, category-specific beauty product images from Unsplash.
 * Saves to public/images/ and generates the image map used by update-image-map.mjs
 */

import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root   = join(__dirname, '..')
const imgDir = join(root, 'public', 'images')
mkdirSync(imgDir, { recursive: true })

// ── CATEGORY IMAGES (tall portrait, 800w) ─────────────────────────────────────
// One hero image per category for the category tile grid
const CATEGORY_IMGS = {
  'cat-skincare.jpg':     'g6q3lFAe3kA',  // skincare bottles with botanical leaves
  'cat-makeup.jpg':       'tvLvkRMNl70',  // makeup brushes & cosmetics flat lay
  'cat-fragrance.jpg':    'LkT5-JCePUY',  // clear glass perfume bottle
  'cat-haircare.jpg':     'pzAap-PGUw4',  // hair care products arrangement
  'cat-bodycare.jpg':     'nAy-SAYgqCw',  // body lotion and skincare
  'cat-lipcare.jpg':      'yiRVnkOVWtE',  // lip balm & lip care products
  'cat-eyecare.jpg':      'ermtNd7gLz4',  // eye cream and eye care products
  'cat-mensgrooming.jpg': 'UAyWfIT6Nx0',  // men's grooming products
  'cat-wellness.jpg':     'Yqxvvle3cDg',  // supplements and beauty vitamins
  'cat-tools.jpg':        'UrQo_45bf3g',  // makeup brushes and beauty tools
  'cat-giftsets.jpg':     'Z0atx-HNL2s',  // luxury gift box
}

// ── PRODUCT IMAGES (square-ish, 500w) ─────────────────────────────────────────
// One image per product subcategory type — every product gets a matching relevant photo
const PRODUCT_IMGS = {
  // ── Skincare ──
  'prod-serum.jpg':           'k6TcBM1tKFE',  // face serum dropper bottle close-up
  'prod-moisturizer.jpg':     'BCozEYDNmOQ',  // moisturizer cream jar flat lay
  'prod-face-mask.jpg':       '40R7IStB16M',  // face mask / clay mask jar
  'prod-toner.jpg':           'gtxxkGEoaBM',  // toner bottle product shot
  'prod-cleanser.jpg':        'ayBCtRueEtI',  // cosmetic cleanser kit flat lay
  'prod-spf.jpg':             'Fez9sPtXOzM',  // SPF / sunscreen tube
  'prod-eye-serum.jpg':       '1eX9t4U0l6E',  // eye serum applicator

  // ── Makeup ──
  'prod-foundation.jpg':      'GecwRYaolBk',  // foundation / makeup tube
  'prod-lipstick.jpg':        'n57LqBlWZxo',  // lipstick product
  'prod-eyeshadow.jpg':       'EyrjiJAwLjQ',  // eyeshadow palette flat lay
  'prod-blush.jpg':           'xwM61TPMlYk',  // blush / cheek palette brush
  'prod-concealer.jpg':       'NnsqpLjiA94',  // concealer / face product
  'prod-mascara.jpg':         'LztiG1kL8GQ',  // mascara wand
  'prod-lip-gloss.jpg':       't-mgZnfCvrg',  // lip gloss tube

  // ── Fragrance ──
  'prod-edp.jpg':             'OD08LTmdfEY',  // perfume bottle luxury
  'prod-attar.jpg':           'dtLGvOl0hEs',  // attar / concentrate bottle on table
  'prod-body-mist.jpg':       'BlcA2-o-7IM',  // light fragrance / body mist

  // ── Hair Care ──
  'prod-hair-oil.jpg':        'kwu9Ny5dKOE',  // hair oil bottle
  'prod-shampoo.jpg':         'pfYYEJMQnek',  // shampoo bottle
  'prod-conditioner.jpg':     'K1k8M_bb2bM',  // conditioner product
  'prod-hair-mask.jpg':       'i6nNdYKB4Fw',  // hair mask / treatment jar
  'prod-hair-serum.jpg':      '1DMNn6gBbwQ',  // hair serum bottle
  'prod-hair-treatment.jpg':  'Rfk_fVd-RwE',  // hair treatment / spray

  // ── Body Care ──
  'prod-body-lotion.jpg':     'CxmQXVqzyIE',  // body lotion bottle
  'prod-body-scrub.jpg':      'y_CSTKJ0bEs',  // body scrub jar
  'prod-body-butter.jpg':     'LtGwgq7r_mc',  // body butter tub
  'prod-body-oil.jpg':        'VxAwTeiqDao',  // body oil dropper
  'prod-body-wash.jpg':       'paN-5NCLxvQ',  // body wash / shower gel

  // ── Lip Care ──
  'prod-lip-balm.jpg':        'apoPPB5UbfU',  // lip balm tube
  'prod-lip-oil.jpg':         'QxDdDFoi_vk',  // lip oil gloss
  'prod-lip-mask.jpg':        'phYKolpoQ9A',  // lip sleeping mask
  'prod-lip-serum.jpg':       'Wtx8c2wLUQ4',  // lip serum / treatment

  // ── Eye Care ──
  'prod-eye-cream.jpg':       'ermtNd7gLz4',  // eye cream jar
  'prod-eye-patches.jpg':     'cUy8UUGnsqg',  // eye patches / hydrogel pads
  'prod-eye-gel.jpg':         'xzoyyDHJU3E',  // eye gel cooling

  // ── Men's Grooming ──
  'prod-mens-facewash.jpg':   'Qp9_F2Lvr1E',  // men's face wash
  'prod-beard-oil.jpg':       '4vifU_h3VmY',  // beard oil bottle
  'prod-mens-moisturizer.jpg':'5faV3178KnA',  // men's moisturizer
  'prod-aftershave.jpg':      '6yjvjCqg8Ss',  // aftershave balm
  'prod-mens-spf.jpg':        'dh8_9YhLs4s',  // men's SPF / face cream
  'prod-beard-care.jpg':      'DuRSi6EGopU',  // beard conditioning / grooming

  // ── Wellness ──
  'prod-collagen.jpg':        'hQSEkX5l5Rk',  // collagen powder / drink
  'prod-vitamins.jpg':        '1mcLFXCKLz0',  // vitamin capsules / gummies
  'prod-supplements.jpg':     'J8Udz8J7lcQ',  // beauty supplements
  'prod-beauty-tea.jpg':      '3KsFrV7ySoQ',  // herbal beauty tea
  'prod-essential-oil.jpg':   'MA3u5u2hnrc',  // essential oil dropper

  // ── Tools & Accessories ──
  'prod-face-roller.jpg':     '2cIKjkmPh1E',  // rose quartz face roller
  'prod-gua-sha.jpg':         'qeavteaUSC8',  // gua sha stone tool
  'prod-brushes.jpg':         'YZ8usdlqw8A',  // makeup brush set
  'prod-sponge.jpg':          'BjqLa-5vLeI',  // beauty sponge / blender
  'prod-device.jpg':          'Wm9TEWYOsz4',  // facial device / LED mask
  'prod-accessory.jpg':       'KJ-us7cIsl0',  // beauty accessories

  // ── Gift Sets ──
  'prod-gift-box.jpg':        '6JtuGvLzh20',  // luxury gift box wrapped
  'prod-gift-hamper.jpg':     '6p72iURpK4c',  // beauty gift hamper
}

async function download(url, filepath, label) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) {
      console.log(`  ✗ [${res.status}] ${label}`)
      return false
    }
    const buf = await res.arrayBuffer()
    writeFileSync(filepath, Buffer.from(buf))
    console.log(`  ✓ ${label.padEnd(35)} ${Math.round(buf.byteLength / 1024)}KB`)
    return true
  } catch (e) {
    console.log(`  ✗ ERROR ${label}: ${e.message}`)
    return false
  }
}

const ok = [], fail = []

console.log('\n📂  Saving to:', imgDir)
console.log('\n🏷️  Category images (11)…')
for (const [file, id] of Object.entries(CATEGORY_IMGS)) {
  const url = `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=85`
  const success = await download(url, join(imgDir, file), file)
  ;(success ? ok : fail).push(file)
}

console.log('\n🖼️  Product images (' + Object.keys(PRODUCT_IMGS).length + ')…')
for (const [file, id] of Object.entries(PRODUCT_IMGS)) {
  const url = `https://images.unsplash.com/photo-${id}?w=500&auto=format&fit=crop&q=80`
  const success = await download(url, join(imgDir, file), file)
  ;(success ? ok : fail).push(file)
}

console.log(`\n✅  Downloaded: ${ok.length}  ❌  Failed: ${fail.length}`)
if (fail.length) {
  console.log('Failed files:')
  fail.forEach(f => console.log('  -', f))
}
