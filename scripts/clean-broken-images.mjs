/**
 * clean-broken-images.mjs
 * Removes categories and products with 404 image URLs from data.js and generate-api.mjs.
 *
 * Broken URLs confirmed by HTTP HEAD audit:
 *   IMG.f2  → photo-1541643600914-78b084683702  (404)
 *   IMG.f3  → photo-1547887538-047dc6497d68     (404)
 *   IMG.x1  → photo-1570194065650-d99fb4b8ccb0  (404)
 *   IMG.x2  → photo-1559056199-641a0ac8b55d     (404)
 *   IMG.x5  → photo-1548679847-1d4ff48016c9     (404)
 *   Bath & Spa category image → photo-1570554520913-ce2f665fd1d4 (404, data.js only)
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// ── helpers ──────────────────────────────────────────────────────────────────

function removeProductLines(content, idsToRemove) {
  const idSet = new Set(idsToRemove)
  const lines = content.split('\n')
  const kept = lines.filter(line => {
    // Match numeric id:N or string id:'xx' at start of a product line
    const numMatch = line.match(/^\s+\{ id:(\d+),/)
    if (numMatch) return !idSet.has(parseInt(numMatch[1]))
    const strMatch = line.match(/^\s+\{ id:'([^']+)',/)
    if (strMatch) return !idSet.has(strMatch[1])
    return true
  })
  return kept.join('\n')
}

function removeSectionComment(content, commentText) {
  // Remove a /* ── SECTION ... */ comment line (with optional leading newline)
  const escaped = commentText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return content.replace(new RegExp(`\\n\\s+/\\* ── ${escaped}[^*]*\\*/\\n`), '\n')
}

function updateCategoryCount(content, uniqueSub, newCount) {
  // Find the first occurrence of the unique sub value and update the count: 15 nearby
  const subIndex = content.indexOf(`'${uniqueSub}'`)
  if (subIndex === -1) {
    console.warn(`  ⚠  Could not find sub: '${uniqueSub}'`)
    return content
  }
  const before = content.substring(0, subIndex)
  const after  = content.substring(subIndex)
  const updated = after.replace(/count: \d+,/, `count: ${newCount},`)
  return before + updated
}

function removeImgKey(content, key) {
  // Remove a line like:  key: U('...'),\n  or  key: U('...', '&q=80'),\n
  return content.replace(new RegExp(`\\s+${key}: U\\([^)]+\\),\\n`), '\n')
}

// ── 1. Clean src/data.js ─────────────────────────────────────────────────────
console.log('\n📂  Cleaning src/data.js …')
let dataJs = readFileSync(join(root, 'src/data.js'), 'utf8')

// Remove broken IMG keys (and x6 which is also unused after removals)
for (const key of ['f2', 'f3', 'x1', 'x2', 'x5', 'x6']) {
  dataJs = removeImgKey(dataJs, key)
  console.log(`  ✓ Removed IMG.${key}`)
}

// Remove Bath & Spa category block from CATEGORIES_DATA
// The block is a multi-line object. We match from "  {\n    name: 'Bath & Spa'" to the closing "},\n"
dataJs = dataJs.replace(
  /  \{\n    name: 'Bath & Spa'[\s\S]*?color: '[^']+',\n  \},\n/,
  ''
)
console.log("  ✓ Removed 'Bath & Spa' from CATEGORIES_DATA")

// Update counts in CATEGORIES_DATA (for categories that lose products)
const dataJsCountUpdates = [
  ['Serums, Moisturisers & More', 14],   // Skincare: removed id 9
  ['Perfumes, Attars & Body Mists', 6],  // Fragrance: removed ids 32,33,35,36,38,39,41,42,44
  ['Shampoos, Oils & Masks', 12],        // Hair Care: removed ids 50,53,57
  ['Lotions, Scrubs & Oils', 11],        // Body Care: removed ids 66,68,69,75
  ['Face, Beard & Body', 13],            // Men's Grooming: removed ids 109,113
  ['Supplements & Aromatherapy', 14],    // Wellness: removed id 140
]
for (const [sub, count] of dataJsCountUpdates) {
  dataJs = updateCategoryCount(dataJs, sub, count)
  console.log(`  ✓ Updated count for "${sub}" → ${count}`)
}

// Remove Bath & Spa section comment and all 15 Bath & Spa products (ids 121-135)
dataJs = removeSectionComment(dataJs, 'BATH & SPA \\(121–135\\)')
const bathSpaIds = [121,122,123,124,125,126,127,128,129,130,131,132,133,134,135]
dataJs = removeProductLines(dataJs, bathSpaIds)
console.log(`  ✓ Removed all 15 Bath & Spa products (ids 121–135)`)

// Remove individual products with broken images from other categories
const brokenProductIds = [
  9,                              // Skincare: IMG.x1
  32, 33, 35, 36, 38, 39, 41, 42, 44, // Fragrance: IMG.f2 / IMG.f3
  50, 53, 57,                     // Hair Care: IMG.x2
  66, 68, 69, 75,                 // Body Care: IMG.x1 / IMG.x2
  109, 113,                       // Men's Grooming: IMG.x2 / IMG.f2
  140,                            // Wellness: IMG.x1
]
dataJs = removeProductLines(dataJs, brokenProductIds)
console.log(`  ✓ Removed ${brokenProductIds.length} products with broken images`)

writeFileSync(join(root, 'src/data.js'), dataJs, 'utf8')
console.log('  ✅  src/data.js written\n')

// ── 2. Clean scripts/generate-api.mjs ────────────────────────────────────────
console.log('📂  Cleaning scripts/generate-api.mjs …')
let genApi = readFileSync(join(root, 'scripts/generate-api.mjs'), 'utf8')

// Remove broken IMG keys (x6 is still used in generate-api products, keep it)
for (const key of ['f2', 'f3', 'x1', 'x2', 'x5']) {
  genApi = removeImgKey(genApi, key)
  console.log(`  ✓ Removed IMG.${key}`)
}

// Update category counts in CATEGORIES array
// (Bath & Spa category image is valid in generate-api.mjs so we keep the category)
const genApiCountUpdates = [
  // sub string (partial)          new count
  ['Perfumes, Attars & Body Mists', 5],   // Fragrance: keep f1,f4,f7,f10,f13
  ['Masks, Oils & Treatments', 7],        // Hair Care: keep h3,h4,h6,h9,h10,h12,h15
  ['Lotions, Scrubs & Oils', 8],          // Body Care: keep b1,b3,b6,b7,b9,b12,b13,b15
  ['Face, Beard & Body', 8],              // Men's Grooming: keep g1,g3,g6,g7,g9,g12,g13,g15
  ['Salts, Bombs & Rituals', 8],          // Bath & Spa: keep sp2,sp3,sp5,sp8,sp9,sp11,sp14,sp15
  ['Curated Collections & Hampers', 5],   // Gift Sets: keep gs1,gs4,gs7,gs10,gs13
]
for (const [sub, count] of genApiCountUpdates) {
  genApi = updateCategoryCount(genApi, sub, count)
  console.log(`  ✓ Updated count for "${sub}" → ${count}`)
}

// Remove products with broken images from generate-api.mjs
// Broken IMG keys: f2, f3, x1, x2, x5
// Fragrance: f2=IMG.f2✗, f3=IMG.f3✗, f5=IMG.f2✗, f6=IMG.f3✗, f8=IMG.f2✗,
//            f9=IMG.f3✗, f11=IMG.f2✗, f12=IMG.f3✗, f14=IMG.f2✗, f15=IMG.f3✗
// Hair Care: h1=x1✗, h2=x2✗, h5=x5✗, h7=x1✗, h8=x2✗, h11=x5✗, h13=x1✗, h14=x2✗
// Body Care: b2=x5✗, b4=x1✗, b5=x2✗, b8=x5✗, b10=x1✗, b11=x2✗, b14=x5✗
// Men's:     g2=x5✗, g4=x1✗, g5=x2✗, g8=x5✗, g10=x1✗, g11=x2✗, g14=x5✗
// Bath&Spa:  sp1=x2✗, sp4=x5✗, sp6=x1✗, sp7=x2✗, sp10=x5✗, sp12=x1✗, sp13=x2✗
// Gift Sets: gs2=f2✗, gs3=f3✗, gs5=f2✗, gs6=f3✗, gs8=f2✗, gs9=f3✗,
//            gs11=f2✗, gs12=f3✗, gs14=f2✗, gs15=f3✗
const genApiBrokenIds = [
  'f2','f3','f5','f6','f8','f9','f11','f12','f14','f15',
  'h1','h2','h5','h7','h8','h11','h13','h14',
  'b2','b4','b5','b8','b10','b11','b14',
  'g2','g4','g5','g8','g10','g11','g14',
  'sp1','sp4','sp6','sp7','sp10','sp12','sp13',
  'gs2','gs3','gs5','gs6','gs8','gs9','gs11','gs12','gs14','gs15',
]
genApi = removeProductLines(genApi, genApiBrokenIds)
console.log(`  ✓ Removed ${genApiBrokenIds.length} products with broken images`)

writeFileSync(join(root, 'scripts/generate-api.mjs'), genApi, 'utf8')
console.log('  ✅  scripts/generate-api.mjs written\n')

console.log('🎉  Done. Run: node scripts/generate-api.mjs  to rebuild public/api/')
