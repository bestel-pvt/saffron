/**
 * fetch-image-urls.mjs
 * Uses Playwright to scrape real Unsplash CDN photo URLs for each beauty category
 * and product subcategory. Outputs a JSON map that update-images.mjs can consume.
 */

import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Search terms for each category / product type
const SEARCHES = [
  // CATEGORIES
  { key: 'cat_skincare',     q: 'skincare serum moisturizer bottles' },
  { key: 'cat_makeup',       q: 'makeup cosmetics lipstick flat lay' },
  { key: 'cat_fragrance',    q: 'perfume bottle luxury fragrance' },
  { key: 'cat_haircare',     q: 'hair care shampoo conditioner products' },
  { key: 'cat_bodycare',     q: 'body lotion skincare cream bottle' },
  { key: 'cat_lipcare',      q: 'lip balm lipstick lip care' },
  { key: 'cat_eyecare',      q: 'eye cream skincare under eye' },
  { key: 'cat_mensgrooming', q: 'men grooming shaving products' },
  { key: 'cat_wellness',     q: 'vitamins supplements beauty health' },
  { key: 'cat_tools',        q: 'makeup brushes beauty tools' },
  { key: 'cat_giftsets',     q: 'luxury gift box beauty hamper' },

  // PRODUCT SUBCATEGORIES
  { key: 'prod_serum',           q: 'face serum dropper bottle skincare' },
  { key: 'prod_moisturizer',     q: 'moisturizer cream jar skincare' },
  { key: 'prod_face_mask',       q: 'face mask clay kaolin beauty' },
  { key: 'prod_toner',           q: 'toner essence bottle skincare' },
  { key: 'prod_cleanser',        q: 'facial cleanser face wash beauty' },
  { key: 'prod_spf',             q: 'sunscreen spf cream tube' },
  { key: 'prod_foundation',      q: 'foundation makeup bottle' },
  { key: 'prod_lipstick',        q: 'lipstick lip colour makeup' },
  { key: 'prod_eyeshadow',       q: 'eyeshadow palette makeup' },
  { key: 'prod_blush',           q: 'blush bronzer powder palette' },
  { key: 'prod_concealer',       q: 'concealer makeup face product' },
  { key: 'prod_mascara',         q: 'mascara eyeliner eye makeup' },
  { key: 'prod_lip_gloss',       q: 'lip gloss shiny clear beauty' },
  { key: 'prod_edp',             q: 'eau de parfum perfume bottle' },
  { key: 'prod_attar',           q: 'attar oud perfume oil bottle' },
  { key: 'prod_body_mist',       q: 'body mist spray fragrance' },
  { key: 'prod_hair_oil',        q: 'hair oil bottle argan castor' },
  { key: 'prod_shampoo',         q: 'shampoo bottle hair product' },
  { key: 'prod_conditioner',     q: 'conditioner hair product bottle' },
  { key: 'prod_hair_mask',       q: 'hair mask treatment jar' },
  { key: 'prod_hair_serum',      q: 'hair serum treatment bottle' },
  { key: 'prod_body_lotion',     q: 'body lotion moisturizer bottle' },
  { key: 'prod_body_scrub',      q: 'body scrub exfoliant jar beauty' },
  { key: 'prod_body_butter',     q: 'shea body butter cream jar' },
  { key: 'prod_body_oil',        q: 'body oil dry oil beauty glow' },
  { key: 'prod_body_wash',       q: 'body wash shower gel bottle' },
  { key: 'prod_lip_balm',        q: 'lip balm chapstick tube beauty' },
  { key: 'prod_lip_oil',         q: 'lip oil gloss shiny bottle' },
  { key: 'prod_lip_mask',        q: 'lip mask sleeping pack beauty' },
  { key: 'prod_lip_serum',       q: 'lip serum peptide treatment' },
  { key: 'prod_eye_cream',       q: 'eye cream jar skincare under eye' },
  { key: 'prod_eye_patches',     q: 'eye patches hydrogel collagen' },
  { key: 'prod_eye_gel',         q: 'eye gel cooling skincare' },
  { key: 'prod_mens_facewash',   q: 'mens face wash skincare grooming' },
  { key: 'prod_beard_oil',       q: 'beard oil grooming mens' },
  { key: 'prod_mens_moisturizer',q: 'mens moisturizer face cream' },
  { key: 'prod_aftershave',      q: 'aftershave balm mens grooming' },
  { key: 'prod_collagen',        q: 'collagen supplement beauty drink powder' },
  { key: 'prod_vitamins',        q: 'beauty vitamins gummies supplements' },
  { key: 'prod_beauty_tea',      q: 'herbal tea wellness beauty' },
  { key: 'prod_face_roller',     q: 'rose quartz face roller beauty tool' },
  { key: 'prod_gua_sha',         q: 'gua sha stone facial tool' },
  { key: 'prod_brushes',         q: 'makeup brush set beauty' },
  { key: 'prod_device',          q: 'facial beauty device led tool' },
  { key: 'prod_gift_box',        q: 'luxury beauty gift box wrapped' },
]

async function getPhotoUrls(page, query, count = 4) {
  const url = `https://unsplash.com/s/photos/${encodeURIComponent(query).replace(/%20/g, '-')}`
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)

    const urls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('figure img[src*="images.unsplash.com/photo-"]'))
      return imgs.slice(0, 6).map(img => {
        // Clean URL — keep just the photo ID part, strip extra params
        const src = img.src
        const match = src.match(/(https:\/\/images\.unsplash\.com\/photo-[^?]+)/)
        return match ? match[1] : src
      }).filter(Boolean)
    })
    return urls.slice(0, count)
  } catch (e) {
    console.warn(`  ⚠ Failed for "${query}": ${e.message}`)
    return []
  }
}

const browser = await chromium.launch({ headless: true })
const page    = await browser.newPage()
await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })

const results = {}
let done = 0

for (const { key, q } of SEARCHES) {
  process.stdout.write(`  [${++done}/${SEARCHES.length}] ${key}… `)
  const urls = await getPhotoUrls(page, q, 4)
  results[key] = urls
  console.log(urls.length > 0 ? `${urls.length} URLs` : '⚠ none')
}

await browser.close()

// Write results
const outPath = join(root, 'scripts', 'image-urls.json')
writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8')
console.log(`\n✅  Saved to scripts/image-urls.json (${Object.keys(results).length} entries)`)
