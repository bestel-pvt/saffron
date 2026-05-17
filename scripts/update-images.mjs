/**
 * update-images.mjs
 * Replaces all image URLs in data.js and generate-api.mjs with relevant,
 * category/subcategory-specific photos sourced from Unsplash search results.
 *
 * Photo IDs were collected live from Unsplash search pages via Playwright.
 * All IDs are confirmed-working CDN paths.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// ── PHOTO ID REFERENCE ────────────────────────────────────────────────────────
// Format: photo-XXXXXXXXXXXXXXXXXX  (taken directly from Unsplash <img src="...">)

const P = {
  // ── CATEGORY HEROES (searched specifically for each category) ──
  // Skincare: skincare serum bottle search
  SK1: '1665763630810-e6251bdd392d',
  SK2: '1616750819801-4311f2c43890',
  SK3: '1623143445418-40c192fa3d11',
  SK4: '1679394270597-e90694d70350',
  SK5: '1713768704571-6aeb0d0e5105',
  SK6: '1710410815589-dd83514104d0',
  SK7: '1638609269267-f0128098a809',

  // Makeup: makeup lipstick cosmetics flatlay search
  MK1: '1617176892739-98fc49fdcbe7',
  MK2: '1559828350-dbd975c52096',
  MK3: '1617178965450-9ca355aee975',
  MK4: '1680789526783-5a33ecedf154',
  MK5: '1625093742435-6fa192b6fb10',
  MK6: '1598452963314-b09f397a5c48',

  // Fragrance: perfume bottle luxury search
  FR1: '1588405748880-12d1d2a59f75',
  FR2: '1615160460366-2c9a41771b51',
  FR3: '1701291927826-c7775869d822',
  FR4: '1458538977777-0549b2370168',
  FR5: '1622618991746-fe6004db3a47',
  FR6: '1595425959632-34f2822322ce',

  // Hair Care: hair care shampoo products search
  HC1: '1610705267928-1b9f2fa7f1c5',
  HC2: '1686121544157-6f178a23d584',
  HC3: '1686121543784-f194e16832dc',
  HC4: '1631729371254-42c2892f0e6e',
  HC5: '1655892817271-c66841c2506e',
  HC6: '1701992679010-7cf5dfee49d5',

  // Body Care: body lotion cream skincare search
  BC1: '1498843053639-170ff2122f35',
  BC2: '1609097164673-7cfafb51b926',
  BC3: '1601065732058-029db52c86b4',
  BC4: '1585945037805-5fd82c2e60b1',
  BC5: '1608068811588-3a67006b7489',
  BC6: '1586220742613-b731f66f7743',

  // Lip Care: lip balm lipstick beauty search
  LC1: '1586495777744-4413f21062fa',
  LC2: '1570088727237-68500d217455',
  LC3: '1577195594933-f844fa36c37c',
  LC4: '1631214499500-2e34edcaccfe',
  LC5: '1613255348289-1407e4f2f980',

  // Eye Care: eye cream skincare beauty search
  EC1: '1643379855542-82c0c7483f3a',
  EC2: '1622910076411-b126ff7e469b',
  EC3: '1566534268110-74c44e12e34d',
  EC4: '1622618991227-412b19e4fef9',
  EC5: '1598440947619-2c35fc9aa908',

  // Men's Grooming: mens grooming shaving beard search
  MG1: '1532710093739-9470acff878f',
  MG2: '1693755807658-17ce5331aacb',
  MG3: '1553265576-8533b2cdc606',
  MG4: '1739302493888-6f96cbc37105',
  MG5: '1503951914875-452162b0f3f1',
  MG6: '1517832606299-7ae9b720a186',

  // Wellness: vitamins supplements health wellness search
  WL1: '1732900293895-233f769299b3',
  WL2: '1732900490015-a5167a642998',
  WL3: '1707129785947-ddc627a8bab9',
  WL4: '1664956618021-73c47736845e',
  WL5: '1565071783280-719b01b29912',

  // Tools & Accessories: makeup brushes beauty tools search
  TL1: '1583241800806-1ab2556fabd0',
  TL2: '1583241800804-8eea95214a87',
  TL3: '1583241800967-3b926edea1f2',
  TL4: '1583241800882-d0087e27c920',
  TL5: '1777390435474-9f96d60435c6',
  TL6: '1680244169777-a3d7d758a264',

  // Gift Sets: luxury gift box beauty wrapped search
  GS1: '1574885914529-e157b2664e4c',
  GS2: '1575075835950-99efb232e2eb',
}

const img = (id, w = 500) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop`

// ── CATEGORY → IMAGE URL (700px wide for category tiles) ─────────────────────
const CAT_IMAGES = {
  'Skincare':            img(P.SK1, 700),
  'Makeup':              img(P.MK1, 700),
  'Fragrance':           img(P.FR1, 700),
  'Hair Care':           img(P.HC1, 700),
  'Body Care':           img(P.BC1, 700),
  'Lip Care':            img(P.LC1, 700),
  'Eye Care':            img(P.EC1, 700),
  "Men's Grooming":      img(P.MG1, 700),
  'Wellness':            img(P.WL1, 700),
  'Tools & Accessories': img(P.TL1, 700),
  'Gift Sets':           img(P.GS1, 700),
}

// ── SUBCATEGORY → IMAGE URL (500px for product cards) ────────────────────────
const SUB_IMAGE = {
  // Skincare subcategories
  'Serums':        img(P.SK1),
  'Moisturisers':  img(P.SK2),
  'Masks':         img(P.SK3),
  'Toners':        img(P.SK4),
  'Cleansers':     img(P.SK5),
  'SPF':           img(P.SK6),
  // Makeup subcategories
  'Foundation':    img(P.MK1),
  'Lip Colour':    img(P.MK2),
  'Eyes':          img(P.MK3),
  'Cheeks':        img(P.MK4),
  'Face':          img(P.MK5),
  'Lip Gloss':     img(P.MK6),
  // Fragrance subcategories
  'Eau de Parfum': img(P.FR1),
  'Attar':         img(P.FR2),
  'Body Mist':     img(P.FR3),
  'Oud':           img(P.FR4),
  'Floral':        img(P.FR5),
  // Hair Care subcategories
  'Hair Oils':     img(P.HC1),
  'Shampoos':      img(P.HC2),
  'Conditioners':  img(P.HC3),
  'Hair Masks':    img(P.HC4),
  'Hair Serum':    img(P.HC5),
  'Treatments':    img(P.HC6),
  // Body Care subcategories
  'Body Lotions':  img(P.BC1),
  'Body Scrubs':   img(P.BC2),
  'Body Butters':  img(P.BC3),
  'Body Creams':   img(P.BC3),
  'Body Oils':     img(P.BC4),
  'Body Washes':   img(P.BC5),
  'Gels':          img(P.BC6),
  // Lip Care subcategories
  'Lip Balms':     img(P.LC1),
  'Lip Oils':      img(P.LC2),
  'Lip Masks':     img(P.LC3),
  'Lip Serums':    img(P.LC4),
  'SPF Lips':      img(P.LC1),
  // Eye Care subcategories
  'Eye Creams':    img(P.EC1),
  'Eye Serums':    img(P.EC2),
  'Eye Patches':   img(P.EC3),
  'Eye Gels':      img(P.EC4),
  'Eye Tools':     img(P.EC5),
  // Men's Grooming subcategories
  'Face Wash':     img(P.MG1),
  'Beard Care':    img(P.MG2),
  'Aftershave':    img(P.MG4),
  'Body Spray':    img(P.MG6),
  'Face Masks':    img(P.MG1),
  // Wellness subcategories
  'Collagen':      img(P.WL1),
  'Vitamins':      img(P.WL2),
  'Supplements':   img(P.WL3),
  'Teas':          img(P.WL4),
  'Essential Oils':img(P.WL5),
  'Tools':         img(P.TL1),
  // Tools & Accessories subcategories
  'Rollers':          img(P.TL1),
  'Gua Sha':          img(P.TL2),
  'Brushes':          img(P.TL3),
  'Sponges':          img(P.TL4),
  'Cleansing Tools':  img(P.TL4),
  'Devices':          img(P.TL5),
  'Accessories':      img(P.TL6),
  'Brow Tools':       img(P.TL3),
  // Gift Sets subcategories
  'Skincare Sets':    img(P.GS1),
  'Makeup Sets':      img(P.GS2),
  'Fragrance Sets':   img(P.GS1),
  'Premium Sets':     img(P.GS1),
  'Mini Sets':        img(P.GS2),
}

// Cat-scoped fallback for subcategories that share names (e.g., 'Serums' in Hair Care vs Skincare)
const CAT_SUB_IMAGE = {
  "Men's Grooming|Moisturisers": img(P.MG3),
  "Men's Grooming|Serums":       img(P.MG3),
  "Men's Grooming|SPF":          img(P.MG5),
  'Hair Care|Serums':            img(P.HC5),
  'Skincare|Eye Care':           img(P.EC1),   // Eye Care subcategory within Skincare
}

function getProductImg(cat, subcategory) {
  const key = `${cat}|${subcategory}`
  if (CAT_SUB_IMAGE[key]) return CAT_SUB_IMAGE[key]
  if (SUB_IMAGE[subcategory]) return SUB_IMAGE[subcategory]
  // Final fallback: use category image
  return CAT_IMAGES[cat] || img(P.SK1)
}

// ── KEYWORD-BASED IMAGE PICKER (for generate-api.mjs products without subcategory) ──
function getImgByName(name, cat) {
  const n = name.toLowerCase()
  // Fragrance
  if (cat === 'Fragrance') {
    if (n.includes('attar') || n.includes('oud') || n.includes('sandal')) return img(P.FR2)
    if (n.includes('mist') || n.includes('body mist')) return img(P.FR3)
    if (n.includes('parfum') || n.includes('edp') || n.includes('eau')) return img(P.FR1)
    return img(P.FR4)
  }
  // Skincare
  if (cat === 'Skincare') {
    if (n.includes('serum') || n.includes('drops') || n.includes('booster') || n.includes('essence') || n.includes('pads') || n.includes('renewal')) return img(P.SK1)
    if (n.includes('moisturiser') || n.includes('cream') || n.includes('night')) return img(P.SK2)
    if (n.includes('mask') || n.includes('pack')) return img(P.SK3)
    if (n.includes('toner') || n.includes('mist')) return img(P.SK4)
    if (n.includes('cleanser') || n.includes('cleansing') || n.includes('wash')) return img(P.SK5)
    if (n.includes('spf') || n.includes('sunscreen') || n.includes('shield')) return img(P.SK6)
    return img(P.SK1)
  }
  // Makeup
  if (cat === 'Makeup') {
    if (n.includes('foundation') || n.includes('concealer') || n.includes('base') || n.includes('primer') || n.includes('powder') || n.includes('bronzer') || n.includes('setting') || n.includes('highlighter')) return img(P.MK5)
    if (n.includes('lip') || n.includes('gloss')) { if (n.includes('gloss')) return img(P.MK6); return img(P.MK2) }
    if (n.includes('mascara') || n.includes('eyeliner') || n.includes('kohl') || n.includes('eyebrow') || n.includes('eye') || n.includes('brow') || n.includes('lash') || n.includes('shadow') || n.includes('liner')) return img(P.MK3)
    if (n.includes('blush') || n.includes('cheek')) return img(P.MK4)
    return img(P.MK1)
  }
  // Hair Care
  if (cat === 'Hair Care') {
    if (n.includes('oil')) return img(P.HC1)
    if (n.includes('shampoo') || n.includes('bar') || n.includes('anti-dandruff') || n.includes('dandruff') || n.includes('hibiscus colour')) return img(P.HC2)
    if (n.includes('conditioner') || n.includes('moisture')) return img(P.HC3)
    if (n.includes('mask') || n.includes('pack') || n.includes('repair') || n.includes('overnight')) return img(P.HC4)
    if (n.includes('serum') || n.includes('tonic') || n.includes('rinse') || n.includes('gummy') || n.includes('gummies') || n.includes('biotin')) return img(P.HC5)
    if (n.includes('heat') || n.includes('mousse') || n.includes('volumising') || n.includes('frizz') || n.includes('curl') || n.includes('spray')) return img(P.HC6)
    return img(P.HC1)
  }
  // Body Care
  if (cat === 'Body Care') {
    if (n.includes('lotion') || n.includes('brightening body') || n.includes('firming body')) return img(P.BC1)
    if (n.includes('scrub') || n.includes('exfol') || n.includes('tan removal')) return img(P.BC2)
    if (n.includes('butter') || n.includes('stretch mark') || n.includes('cream')) return img(P.BC3)
    if (n.includes('oil') || n.includes('glow oil') || n.includes('cellulite') || n.includes('rosehip')) return img(P.BC4)
    if (n.includes('wash') || n.includes('shower') || n.includes('gel') || n.includes('aloe')) return img(P.BC5)
    if (n.includes('mist') || n.includes('milk bath') || n.includes('pillow') || n.includes('rose water')) return img(P.BC6)
    return img(P.BC1)
  }
  // Lip Care
  if (cat === 'Lip Care') {
    if (n.includes('balm') || n.includes('butter') || n.includes('pomegranate') || n.includes('mint') || n.includes('coconut lip') || n.includes('berry') || n.includes('spf')) return img(P.LC1)
    if (n.includes('oil') || n.includes('gloss')) return img(P.LC2)
    if (n.includes('mask') || n.includes('gold lip') || n.includes('honey') || n.includes('overnight')) return img(P.LC3)
    if (n.includes('serum') || n.includes('plump') || n.includes('peptide') || n.includes('caffeine') || n.includes('collagen') || n.includes('hyaluronic') || n.includes('anti-ageing') || n.includes('treatment')) return img(P.LC4)
    if (n.includes('lipstick') || n.includes('tint') || n.includes('nude') || n.includes('matte') || n.includes('ombre')) return img(P.LC5)
    return img(P.LC1)
  }
  // Eye Care
  if (cat === 'Eye Care') {
    if (n.includes('cream') || n.includes('dark circle') || n.includes('firming') || n.includes('anti-wrinkle') || n.includes('peptide eye') || n.includes('vitamin k')) return img(P.EC1)
    if (n.includes('serum') || n.includes('booster') || n.includes('lifting') || n.includes('brightening')) return img(P.EC2)
    if (n.includes('patch') || n.includes('mask') || n.includes('hydrogel')) return img(P.EC3)
    if (n.includes('gel') || n.includes('puffiness') || n.includes('cooling') || n.includes('roller') || n.includes('quartz')) return img(P.EC4)
    return img(P.EC1)
  }
  // Men's Grooming
  if (cat === "Men's Grooming") {
    if (n.includes('wash') || n.includes('scrub') || n.includes('mask') || n.includes('charcoal')) return img(P.MG1)
    if (n.includes('beard')) return img(P.MG2)
    if (n.includes('moisturiser') || n.includes('moisturizer') || n.includes('face cream') || n.includes('matte face') || n.includes('serum') || n.includes('vitamin c') || n.includes('eye')) return img(P.MG3)
    if (n.includes('aftershave') || n.includes('after shave') || n.includes('shaving') || n.includes('aloe')) return img(P.MG4)
    if (n.includes('spf') || n.includes('sunblock') || n.includes('scalp')) return img(P.MG5)
    if (n.includes('spray') || n.includes('musk') || n.includes('travel') || n.includes('kit')) return img(P.MG6)
    return img(P.MG1)
  }
  // Wellness
  if (cat === 'Wellness') {
    if (n.includes('collagen')) return img(P.WL1)
    if (n.includes('biotin') || n.includes('vitamin') || n.includes('zinc') || n.includes('omega') || n.includes('primrose')) return img(P.WL2)
    if (n.includes('probiotic') || n.includes('ashwagandha') || n.includes('turmeric') || n.includes('beauty sleep') || n.includes('supplement') || n.includes('gummies') || n.includes('capsule')) return img(P.WL3)
    if (n.includes('tea')) return img(P.WL4)
    if (n.includes('aromatherapy') || n.includes('lavender') || n.includes('oil') || n.includes('essential')) return img(P.WL5)
    if (n.includes('roller') || n.includes('gua sha') || n.includes('jade')) return img(P.TL2)
    return img(P.WL2)
  }
  // Tools & Accessories
  if (cat === 'Tools & Accessories') {
    if (n.includes('roller') || n.includes('globe') || n.includes('massager') || n.includes('wand')) return img(P.TL1)
    if (n.includes('gua sha') || n.includes('jade')) return img(P.TL2)
    if (n.includes('brush') || n.includes('kabuki')) return img(P.TL3)
    if (n.includes('sponge') || n.includes('silicone') || n.includes('konjac') || n.includes('headband') || n.includes('sleep mask') || n.includes('organiser') || n.includes('eye mask')) return img(P.TL4)
    if (n.includes('led') || n.includes('derma') || n.includes('micro') || n.includes('curler') || n.includes('lash') || n.includes('brow') || n.includes('mirror')) return img(P.TL5)
    return img(P.TL6)
  }
  // Gift Sets
  if (cat === 'Gift Sets') {
    if (n.includes('makeup') || n.includes('glam') || n.includes('birthday') || n.includes('travel') || n.includes('starter') || n.includes('glow getter') || n.includes('sunday') || n.includes('ramadan')) return img(P.GS2)
    return img(P.GS1)
  }
  return CAT_IMAGES[cat] || img(P.SK1)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. UPDATE data.js
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📂  Updating src/data.js …')
let dataJs = readFileSync(join(root, 'src/data.js'), 'utf8')

// 1a. Update CATEGORIES_DATA img fields
for (const [cat, url] of Object.entries(CAT_IMAGES)) {
  // Match the category block and replace its img line
  // Each category block has a unique name field
  const escapedCat = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\"]")
  const re = new RegExp(`(name: ['"]${escapedCat}['"][\\s\\S]*?img: ')[^']+(')`,'')
  dataJs = dataJs.replace(re, `$1${url}$2`)
}

// 1b. Update ALL_PRODUCTS img fields (each product is on one line)
const prodLines = dataJs.split('\n').map(line => {
  // Only process product lines
  if (!line.match(/^\s+\{ id:\d+,/)) return line

  // Extract cat and subcategory from the line
  const catMatch  = line.match(/cat:'([^']+)'/)
  const subMatch  = line.match(/subcategory:'([^']+)'/)
  if (!catMatch) return line

  const cat        = catMatch[1]
  const subcategory = subMatch ? subMatch[1] : ''
  const newImg     = getProductImg(cat, subcategory)

  // Replace the img field — it may be IMG.xx or an existing URL string
  return line
    .replace(/img:IMG\.\w+/, `img:'${newImg}'`)
    .replace(/img:'https:\/\/[^']+'/,  `img:'${newImg}'`)
    .replace(/img:"https:\/\/[^"]+"/, `img:"${newImg}"`)
})
dataJs = prodLines.join('\n')

// 1c. Clean up the IMG object (no longer needed for product references)
// Remove it and replace with a simple comment
dataJs = dataJs.replace(
  /\/\/ ─── IMAGE HELPERS[^][\s\S]*?}\n\n\/\/ ─── CATEGORIES/,
  '// ─── CATEGORIES'
)

writeFileSync(join(root, 'src/data.js'), dataJs, 'utf8')
console.log('  ✅  src/data.js updated')

// ─────────────────────────────────────────────────────────────────────────────
// 2. UPDATE scripts/generate-api.mjs
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📂  Updating scripts/generate-api.mjs …')
let genApi = readFileSync(join(root, 'scripts/generate-api.mjs'), 'utf8')

// 2a. Update CATEGORIES img fields
for (const [cat, url] of Object.entries(CAT_IMAGES)) {
  const escaped = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\"]")
  // Each category is on ONE line in generate-api.mjs — replace its img value inline
  genApi = genApi.replace(
    new RegExp(`(name: ['"]${escaped}['"][^\\n]*img: ')[^']+(')`),
    `$1${url}$2`
  )
}

// 2b. Replace the IMG object with a lookup function approach
// Replace each product's img:IMG.xx with the keyword-based URL
const genLines = genApi.split('\n').map(line => {
  if (!line.match(/^\s+\{ id:'[^']+'/) ) return line

  const catMatch  = line.match(/cat:'([^']+)'/)
  const nameMatch = line.match(/name:'([^']+)'/)
  if (!catMatch || !nameMatch) return line

  const cat  = catMatch[1]
  const name = nameMatch[1]
  const url  = getImgByName(name, cat)

  return line
    .replace(/img:IMG\.\w+/, `img:'${url}'`)
    .replace(/img:'https:\/\/[^']+'/,  `img:'${url}'`)
})
genApi = genLines.join('\n')

writeFileSync(join(root, 'scripts/generate-api.mjs'), genApi, 'utf8')
console.log('  ✅  scripts/generate-api.mjs updated')

// ─────────────────────────────────────────────────────────────────────────────
// 3. REBUILD public/api/
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📂  Rebuilding public/api/ …')
// We import and re-run generate-api inline via a child process
const { execSync } = await import('child_process')
execSync('node scripts/generate-api.mjs', { cwd: root, stdio: 'inherit' })

console.log('\n🎉  All done! Images are now relevant and category-specific.')
console.log('    Run the dev server to preview: npm run dev')
