/**
 * generate-api.mjs
 * Run: node scripts/generate-api.mjs
 * Writes public/api/products.json and public/api/categories.json
 * from the src/data.js source of truth.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '..')
const outDir    = join(root, 'public', 'api')

mkdirSync(outDir, { recursive: true })

// ─── IMAGE HELPERS ─────────────────────────────────────────────────────────────
const U = (id, q = '') =>
  `https://images.unsplash.com/photo-${id}?w=500&auto=format&fit=crop${q}`

const IMG = {
  s1: U('1620916566398-39f1143ab7be'),
  s2: U('1629380150561-5fe77dab7fc6'),
  s3: U('1556228578-8c89e6adf883'),
  s4: U('1571781926291-c477ebfd024b'),
  s5: U('1512496015851-a90fb38ba796'),
  s6: U('1556228720-195a672e8a03'),
  s7: U('1611591437281-460bfbe1220a'),
  m1: U('1522335789203-aabd1fc54bc9'),
  m2: U('1583241475880-083f84372725'),
  m3: U('1512207736890-6ffed8a84e8d'),
  m4: U('1599305090598-fe179d501227'),
  f1: U('1596462502278-27bfdc403348'),
  x3: U('1519125323398-675f0ddb6308'),
  x4: U('1532187863486-abf9dbad1b69', '&q=80'),
  x6: U('1535585209827-a15fcdbc4c2d', '&q=80'),
}

// ─── CATEGORIES ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Skincare',         sub: 'Serums, Moisturisers & More',      count: 15, color: '#E8C4A8', img: 'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=700&auto=format&fit=crop', items: ['Serums','Moisturisers','Masks','Toners','Cleansers','Eye Care','SPF'] },
  { name: 'Makeup',           sub: 'Foundation, Lips & Eyes',          count: 15, color: '#F0DDD0', img: 'https://images.unsplash.com/photo-1617176892739-98fc49fdcbe7?w=700&auto=format&fit=crop', items: ['Foundation','Lip Colour','Eyes','Cheeks','Face','Lip Gloss'] },
  { name: 'Fragrance',        sub: 'Perfumes, Attars & Body Mists',    count: 5, color: '#D4A8C4', img: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=700&auto=format&fit=crop', items: ['Eau de Parfum','Attars','Body Mists','Oud'] },
  { name: 'Hair Care',        sub: 'Masks, Oils & Treatments',         count: 7, color: '#C8D4A8', img: 'https://images.unsplash.com/photo-1610705267928-1b9f2fa7f1c5?w=700&auto=format&fit=crop', items: ['Masks','Oils','Shampoo','Conditioner','Serums'] },
  { name: 'Body Care',        sub: 'Lotions, Scrubs & Oils',           count: 8, color: '#A8C8D4', img: 'https://images.unsplash.com/photo-1498843053639-170ff2122f35?w=700&auto=format&fit=crop', items: ['Lotions','Scrubs','Body Oils','Butters'] },
  { name: 'Lip Care',         sub: 'Balms, Oils & Treatments',         count: 15, color: '#D4A8A8', img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=700&auto=format&fit=crop', items: ['Balms','Lip Oils','Glosses','Treatments'] },
  { name: 'Eye Care',         sub: 'Creams, Serums & Patches',         count: 15, color: '#B8C8E8', img: 'https://images.unsplash.com/photo-1643379855542-82c0c7483f3a?w=700&auto=format&fit=crop', items: ['Eye Creams','Serums','Patches','Masks'] },
  { name: "Men's Grooming",   sub: 'Face, Beard & Body',               count: 8, color: '#C4C8B8', img: 'https://images.unsplash.com/photo-1532710093739-9470acff878f?w=700&auto=format&fit=crop', items: ['Face Wash','Beard Oil','Moisturiser','After Shave'] },
  { name: 'Wellness',         sub: 'Supplements & Inner Beauty',       count: 15, color: '#D8C8A8', img: 'https://images.unsplash.com/photo-1732900293895-233f769299b3?w=700&auto=format&fit=crop', items: ['Supplements','Teas','Aromatherapy','Wellness Kits'] },
  { name: 'Tools & Accessories', sub: 'Brushes, Rollers & More',       count: 15, color: '#C8D8C8', img: 'https://images.unsplash.com/photo-1583241800806-1ab2556fabd0?w=700&auto=format&fit=crop', items: ['Brushes','Rollers','Gua Sha','Applicators'] },
  { name: 'Gift Sets',        sub: 'Curated Collections & Hampers',    count: 5, color: '#D4C8B8', img: 'https://images.unsplash.com/photo-1574885914529-e157b2664e4c?w=700&auto=format&fit=crop', items: ['Skincare Sets','Makeup Kits','Fragrance Sets','Hampers'] },
]

// ─── PRODUCTS ──────────────────────────────────────────────────────────────────
function makeProducts() {
  const data = [
    // SKINCARE (15)
    { id:'s1',  name:'Saffron Glow Serum',          cat:'Skincare', price:2800, originalPrice:3500, badge:'Bestseller', rating:4.9, stock:45, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'24-karat saffron extract serum for luminous, even-toned skin.' },
    { id:'s2',  name:'Rose Petal Moisturiser',       cat:'Skincare', price:2200, badge:'New',        rating:4.7, stock:38, img:'https://images.unsplash.com/photo-1616750819801-4311f2c43890?w=500&auto=format&fit=crop', desc:'Lightweight gel-cream with Damask rose and hyaluronic acid.' },
    { id:'s3',  name:'Turmeric Brightening Mask',    cat:'Skincare', price:1800, originalPrice:2200, badge:'Sale',       rating:4.6, stock:52, img:'https://images.unsplash.com/photo-1623143445418-40c192fa3d11?w=500&auto=format&fit=crop', desc:'Weekly purifying mask with organic turmeric and kaolin clay.' },
    { id:'s4',  name:'Vitamin C Radiance Drops',     cat:'Skincare', price:3200, badge:'Luxury',     rating:4.8, stock:28, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'Stable ascorbyl glucoside for glass-skin radiance.' },
    { id:'s5',  name:'Jasmine Night Cream',          cat:'Skincare', price:2600, badge:'Bestseller', rating:4.8, stock:35, img:'https://images.unsplash.com/photo-1616750819801-4311f2c43890?w=500&auto=format&fit=crop', desc:'Overnight repair cream with jasmine absolute and peptides.' },
    { id:'s6',  name:'Hyaluronic Plump Toner',       cat:'Skincare', price:1600, badge:'New',        rating:4.5, stock:60, img:'https://images.unsplash.com/photo-1679394270597-e90694d70350?w=500&auto=format&fit=crop', desc:'Three-weight HA toner for multi-depth hydration.' },
    { id:'s7',  name:'SPF 50 Botanical Shield',      cat:'Skincare', price:2400, rating:4.7, stock:42, img:'https://images.unsplash.com/photo-1710410815589-dd83514104d0?w=500&auto=format&fit=crop', desc:'Invisible, reef-safe SPF with green tea antioxidants.' },
    { id:'s8',  name:'Bakuchiol Retinol Alternative',cat:'Skincare', price:3800, badge:'Luxury',     rating:4.9, stock:20, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'Plant-based retinol alternative. Safe for sensitive skin.' },
    { id:'s9',  name:'Rose Hip Face Oil',            cat:'Skincare', price:2100, rating:4.6, stock:48, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'Cold-pressed rosehip oil rich in vitamin A and essential fatty acids.' },
    { id:'s10', name:'Glycolic Renewal Pads',        cat:'Skincare', price:1900, badge:'Bestseller', rating:4.7, stock:55, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'Pre-soaked AHA pads for smooth, refined texture overnight.' },
    { id:'s11', name:'Centella Calm Essence',        cat:'Skincare', price:1700, rating:4.5, stock:44, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'Cica-centred essence that calms redness and strengthens barrier.' },
    { id:'s12', name:'Peptide Eye Concentrate',      cat:'Skincare', price:2900, badge:'Luxury',     rating:4.8, stock:25, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'Multi-peptide formula that targets fine lines and dark circles.' },
    { id:'s13', name:'Watermelon Jelly Cleanser',    cat:'Skincare', price:1400, badge:'New',        rating:4.4, stock:70, img:'https://images.unsplash.com/photo-1713768704571-6aeb0d0e5105?w=500&auto=format&fit=crop', desc:'Refreshing gel cleanser that melts away makeup without stripping.' },
    { id:'s14', name:'Niacinamide 10% Serum',        cat:'Skincare', price:1600, badge:'Sale', originalPrice:2000, rating:4.6, stock:58, img:'https://images.unsplash.com/photo-1665763630810-e6251bdd392d?w=500&auto=format&fit=crop', desc:'High-strength niacinamide to minimise pores and balance oil.' },
    { id:'s15', name:'Gold Leaf Firming Mask',       cat:'Skincare', price:4200, badge:'Luxury',     rating:4.9, stock:15, img:'https://images.unsplash.com/photo-1623143445418-40c192fa3d11?w=500&auto=format&fit=crop', desc:'24K gold leaf and collagen-boosting ingredients in one decadent mask.' },

    // MAKEUP (15)
    { id:'m1',  name:'Saffron Liquid Foundation',   cat:'Makeup', price:2400, badge:'Bestseller', rating:4.8, stock:40, img:'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=500&auto=format&fit=crop', desc:'Buildable, skin-tint foundation in 20 shades for South Asian skin.' },
    { id:'m2',  name:'Rose Lip Tint',               cat:'Makeup', price:1200, badge:'New',        rating:4.7, stock:65, img:'https://images.unsplash.com/photo-1559828350-dbd975c52096?w=500&auto=format&fit=crop', desc:'Sheer, buildable lip tint with rose extract for a natural flush.' },
    { id:'m3',  name:'Kohl Eye Pencil',             cat:'Makeup', price:900,  badge:'Bestseller', rating:4.6, stock:80, img:'https://images.unsplash.com/photo-1617178965450-9ca355aee975?w=500&auto=format&fit=crop', desc:'Smooth, smudge-proof kohl pencil with almond oil conditioning.' },
    { id:'m4',  name:'Blush Duo Palette',           cat:'Makeup', price:1800, rating:4.5, stock:35, img:'https://images.unsplash.com/photo-1680789526783-5a33ecedf154?w=500&auto=format&fit=crop', desc:'Two complementary blush shades inspired by saffron sunrise.' },
    { id:'m5',  name:'Brow Defining Pomade',        cat:'Makeup', price:1400, badge:'New',        rating:4.6, stock:50, img:'https://images.unsplash.com/photo-1617178965450-9ca355aee975?w=500&auto=format&fit=crop', desc:'Long-wearing brow pomade with feather-like precision tip.' },
    { id:'m6',  name:'Luminous Setting Powder',     cat:'Makeup', price:2000, badge:'Luxury',     rating:4.7, stock:30, img:'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=500&auto=format&fit=crop', desc:'Finely milled powder with saffron mica for a lit-from-within glow.' },
    { id:'m7',  name:'Volumising Mascara',          cat:'Makeup', price:1600, badge:'Bestseller', rating:4.8, stock:55, img:'https://images.unsplash.com/photo-1617178965450-9ca355aee975?w=500&auto=format&fit=crop', desc:'Botanical-infused mascara for 24h volume without clumping.' },
    { id:'m8',  name:'Lip Liner Collection',        cat:'Makeup', price:800,  badge:'Sale', originalPrice:1100, rating:4.4, stock:75, img:'https://images.unsplash.com/photo-1559828350-dbd975c52096?w=500&auto=format&fit=crop', desc:'6-shade collection of long-wearing lip liners in earthy tones.' },
    { id:'m9',  name:'Contour & Highlight Stick',   cat:'Makeup', price:1900, rating:4.6, stock:42, img:'https://images.unsplash.com/photo-1617176892739-98fc49fdcbe7?w=500&auto=format&fit=crop', desc:'Dual-ended stick for sculpting and highlighting in one swipe.' },
    { id:'m10', name:'Primer Perfecting Base',      cat:'Makeup', price:1700, badge:'New',        rating:4.5, stock:48, img:'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=500&auto=format&fit=crop', desc:'Skin-smoothing primer with hyaluronic acid and botanical extracts.' },
    { id:'m11', name:'Eyeshadow Quad — Desert Rose',cat:'Makeup', price:2200, badge:'Luxury',     rating:4.8, stock:22, img:'https://images.unsplash.com/photo-1617178965450-9ca355aee975?w=500&auto=format&fit=crop', desc:'Four harmonious shades from petal pink to deep burgundy.' },
    { id:'m12', name:'Concealer Radiance Wand',     cat:'Makeup', price:1500, rating:4.5, stock:53, img:'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=500&auto=format&fit=crop', desc:'Brightening concealer with vitamin C for under-eye darkness.' },
    { id:'m13', name:'Translucent Bronzer',         cat:'Makeup', price:2100, badge:'Bestseller', rating:4.7, stock:37, img:'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=500&auto=format&fit=crop', desc:'Sun-kissed bronzer with warm saffron undertones.' },
    { id:'m14', name:'Eyeliner Felt Tip',           cat:'Makeup', price:1000, badge:'Sale', originalPrice:1300, rating:4.6, stock:68, img:'https://images.unsplash.com/photo-1617178965450-9ca355aee975?w=500&auto=format&fit=crop', desc:'Precision felt-tip liner for sharp wings and smudge-free definition.' },
    { id:'m15', name:'Setting Spray Glow Mist',     cat:'Makeup', price:1300, badge:'New',        rating:4.5, stock:60, img:'https://images.unsplash.com/photo-1625093742435-6fa192b6fb10?w=500&auto=format&fit=crop', desc:'Rose water setting spray that extends wear and adds a dewy finish.' },

    // FRAGRANCE (15)
    { id:'f1',  name:'Saffron Oud Eau de Parfum',   cat:'Fragrance', price:5800, badge:'Luxury',     rating:4.9, stock:18, img:'https://images.unsplash.com/photo-1615160460366-2c9a41771b51?w=500&auto=format&fit=crop', desc:'The signature scent. Kashmiri saffron on a base of aged oud.' },
    { id:'f4',  name:'Citrus Neroli Mist',          cat:'Fragrance', price:1800, badge:'New',        rating:4.5, stock:55, img:'https://images.unsplash.com/photo-1701291927826-c7775869d822?w=500&auto=format&fit=crop', desc:'Refreshing body mist with Italian neroli and green mandarin.' },
    { id:'f7',  name:'Patchouli Oud Intense',       cat:'Fragrance', price:6200, badge:'Luxury',     rating:4.9, stock:12, img:'https://images.unsplash.com/photo-1615160460366-2c9a41771b51?w=500&auto=format&fit=crop', desc:'Dark, complex patchouli and Cambodian oud for the bold wearer.' },
    { id:'f10', name:'Lavender Calm EDP',           cat:'Fragrance', price:3400, badge:'New',        rating:4.6, stock:28, img:'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500&auto=format&fit=crop', desc:'Provence lavender with bergamot for a calming, wearable scent.' },
    { id:'f13', name:'Oudh Bakhoor Chips',          cat:'Fragrance', price:2600, badge:'Bestseller', rating:4.8, stock:45, img:'https://images.unsplash.com/photo-1615160460366-2c9a41771b51?w=500&auto=format&fit=crop', desc:'Hand-selected bakhoor chips for home fragrance and gifting.' },

    // HAIR CARE (15)
    { id:'h3',  name:'Scalp Nourishing Serum',      cat:'Hair Care', price:2600, badge:'Luxury',     rating:4.8, stock:28, img:'https://images.unsplash.com/photo-1655892817271-c66841c2506e?w=500&auto=format&fit=crop', desc:'Active-ingredient scalp serum targeting thinning and dryness.' },
    { id:'h4',  name:'Botanical Shampoo Bar',       cat:'Hair Care', price:1200, badge:'Sale', originalPrice:1600, rating:4.5, stock:65, img:'https://images.unsplash.com/photo-1686121544157-6f178a23d584?w=500&auto=format&fit=crop', desc:'Zero-waste shampoo bar with rosemary and peppermint.' },
    { id:'h6',  name:'Castor Growth Oil',           cat:'Hair Care', price:1600, badge:'Bestseller', rating:4.7, stock:48, img:'https://images.unsplash.com/photo-1610705267928-1b9f2fa7f1c5?w=500&auto=format&fit=crop', desc:'Black castor oil with nettle extract for visible hair density.' },
    { id:'h9',  name:'Dandruff Control Shampoo',    cat:'Hair Care', price:1500, rating:4.5, stock:58, img:'https://images.unsplash.com/photo-1686121544157-6f178a23d584?w=500&auto=format&fit=crop', desc:'Zinc pyrithione and neem formula that clears dandruff gently.' },
    { id:'h10', name:'Curl Defining Cream',         cat:'Hair Care', price:1700, badge:'New',        rating:4.6, stock:44, img:'https://images.unsplash.com/photo-1701992679010-7cf5dfee49d5?w=500&auto=format&fit=crop', desc:'Frizz-free curl definition with flaxseed and aloe vera.' },
    { id:'h12', name:'Argan Shine Serum',           cat:'Hair Care', price:1900, badge:'Sale', originalPrice:2400, rating:4.6, stock:38, img:'https://images.unsplash.com/photo-1655892817271-c66841c2506e?w=500&auto=format&fit=crop', desc:'2-in-1 serum: heat protectant and glossing treatment in one.' },
    { id:'h15', name:'Hibiscus Hair Mask',          cat:'Hair Care', price:1600, badge:'Luxury',     rating:4.7, stock:40, img:'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500&auto=format&fit=crop', desc:'Hibiscus and amla mask for colour-treated and fragile hair.' },

    // BODY CARE (15)
    { id:'b1',  name:'Saffron Body Lotion',         cat:'Body Care', price:1800, badge:'Bestseller', rating:4.8, stock:55, img:'https://images.unsplash.com/photo-1498843053639-170ff2122f35?w=500&auto=format&fit=crop', desc:'Fast-absorbing lotion with saffron and shea butter for silky skin.' },
    { id:'b3',  name:'Rose Body Oil',               cat:'Body Care', price:2200, badge:'Luxury',     rating:4.8, stock:32, img:'https://images.unsplash.com/photo-1585945037805-5fd82c2e60b1?w=500&auto=format&fit=crop', desc:'Luxurious dry oil with 100 rose petals per bottle.' },
    { id:'b6',  name:'Jasmine Body Mist',           cat:'Body Care', price:1200, badge:'New',        rating:4.5, stock:65, img:'https://images.unsplash.com/photo-1586220742613-b731f66f7743?w=500&auto=format&fit=crop', desc:'Light, everyday jasmine body mist. Spritz, glow, go.' },
    { id:'b7',  name:'Brightening Body Wash',       cat:'Body Care', price:1300, badge:'Bestseller', rating:4.6, stock:58, img:'https://images.unsplash.com/photo-1498843053639-170ff2122f35?w=500&auto=format&fit=crop', desc:'Daily brightening body wash with niacinamide and licorice.' },
    { id:'b9',  name:'Oat & Honey Body Wash',       cat:'Body Care', price:1100, rating:4.4, stock:72, img:'https://images.unsplash.com/photo-1608068811588-3a67006b7489?w=500&auto=format&fit=crop', desc:'Gentle, soap-free body wash for sensitive skin.' },
    { id:'b12', name:'Stretch Mark Butter',         cat:'Body Care', price:2200, badge:'Bestseller', rating:4.7, stock:40, img:'https://images.unsplash.com/photo-1601065732058-029db52c86b4?w=500&auto=format&fit=crop', desc:'Cocoa and shea butter blend clinically proven to reduce stretch marks.' },
    { id:'b13', name:'Lavender Pillow Mist',        cat:'Body Care', price:900,  badge:'Sale', originalPrice:1200, rating:4.6, stock:80, img:'https://images.unsplash.com/photo-1586220742613-b731f66f7743?w=500&auto=format&fit=crop', desc:'Calming lavender mist for linens, pillows, and body.' },
    { id:'b15', name:'Coconut Oil Whipped Body Butter', cat:'Body Care', price:1700, badge:'Luxury',rating:4.8, stock:30, img:'https://images.unsplash.com/photo-1601065732058-029db52c86b4?w=500&auto=format&fit=crop', desc:'Whipped coconut and jojoba butter that melts on contact.' },

    // LIP CARE (15)
    { id:'l1',  name:'Rose Lip Balm',               cat:'Lip Care', price:700,  badge:'Bestseller', rating:4.8, stock:90, img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop', desc:'Tinted rose balm with vitamin E for soft, kissable lips.' },
    { id:'l2',  name:'Saffron Lip Oil',             cat:'Lip Care', price:1100, badge:'New',        rating:4.7, stock:65, img:'https://images.unsplash.com/photo-1570088727237-68500d217455?w=500&auto=format&fit=crop', desc:'Plumping lip oil with saffron and hyaluronic acid.' },
    { id:'l3',  name:'Overnight Lip Mask',          cat:'Lip Care', price:1400, badge:'Luxury',     rating:4.8, stock:40, img:'https://images.unsplash.com/photo-1577195594933-f844fa36c37c?w=500&auto=format&fit=crop', desc:'Intensive sleeping lip mask. Wake up to hydrated, pillowy lips.' },
    { id:'l4',  name:'Tinted Lip Butter',           cat:'Lip Care', price:900,  badge:'Sale', originalPrice:1200, rating:4.5, stock:72, img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop', desc:'Sheer colour + intense moisture in a creamy bullet.' },
    { id:'l5',  name:'Honey Lip Scrub',             cat:'Lip Care', price:800,  badge:'New',        rating:4.6, stock:85, img:'https://images.unsplash.com/photo-1577195594933-f844fa36c37c?w=500&auto=format&fit=crop', desc:'Edible honey and sugar scrub for smooth lip canvas.' },
    { id:'l6',  name:'Plumping Lip Serum',          cat:'Lip Care', price:1600, badge:'Luxury',     rating:4.7, stock:30, img:'https://images.unsplash.com/photo-1631214499500-2e34edcaccfe?w=500&auto=format&fit=crop', desc:'Clinical-grade peptide serum to volumise and define lip borders.' },
    { id:'l7',  name:'Berry Stain Lip Tint',        cat:'Lip Care', price:1000, badge:'Bestseller', rating:4.7, stock:68, img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop', desc:'Buildable berry stain that transfers zero colour to your cup.' },
    { id:'l8',  name:'Collagen Lip Gloss',          cat:'Lip Care', price:1200, badge:'New',        rating:4.6, stock:55, img:'https://images.unsplash.com/photo-1570088727237-68500d217455?w=500&auto=format&fit=crop', desc:'Non-sticky gloss with marine collagen for fuller-looking lips.' },
    { id:'l9',  name:'Matte Lip Cream',             cat:'Lip Care', price:1100, rating:4.5, stock:60, img:'https://images.unsplash.com/photo-1613255348289-1407e4f2f980?w=500&auto=format&fit=crop', desc:'Velvet-matte lip cream in 12 shades. Comfortable for 8+ hours.' },
    { id:'l10', name:'Vitamin C Lip Brightener',    cat:'Lip Care', price:950,  badge:'New',        rating:4.5, stock:75, img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop', desc:'Targeted vitamin C treatment for pigmented lips.' },
    { id:'l11', name:'Shea Lip Sleeping Pack',      cat:'Lip Care', price:1300, badge:'Bestseller', rating:4.8, stock:50, img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop', desc:'Thick shea and ceramide pack to repair severely dry lips overnight.' },
    { id:'l12', name:'Ombre Lip Kit',               cat:'Lip Care', price:2200, badge:'Luxury',     rating:4.7, stock:22, img:'https://images.unsplash.com/photo-1613255348289-1407e4f2f980?w=500&auto=format&fit=crop', desc:'Liner, lipstick, and gloss for a perfect ombre in one kit.' },
    { id:'l13', name:'Peppermint Cooling Balm',     cat:'Lip Care', price:700,  badge:'Sale', originalPrice:950, rating:4.4, stock:88, img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop', desc:'Cooling peppermint balm that soothes and plumps simultaneously.' },
    { id:'l14', name:'Nude Velvet Lipstick',        cat:'Lip Care', price:1400, rating:4.6, stock:45, img:'https://images.unsplash.com/photo-1613255348289-1407e4f2f980?w=500&auto=format&fit=crop', desc:'Nudes inspired by South Asian skin tones. Velvet finish, all day.' },
    { id:'l15', name:'Botanical Lip Rehab Kit',     cat:'Lip Care', price:2800, badge:'Luxury',     rating:4.9, stock:18, img:'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop', desc:'Complete 3-step lip rehab: scrub, serum, and overnight mask.' },

    // EYE CARE (15)
    { id:'e1',  name:'Peptide Eye Cream',           cat:'Eye Care', price:2800, badge:'Bestseller', rating:4.8, stock:35, img:'https://images.unsplash.com/photo-1643379855542-82c0c7483f3a?w=500&auto=format&fit=crop', desc:'Caffeine and peptides for dark circles and puffiness in 4 weeks.' },
    { id:'e2',  name:'Retinol Eye Serum',           cat:'Eye Care', price:3200, badge:'Luxury',     rating:4.9, stock:20, img:'https://images.unsplash.com/photo-1622910076411-b126ff7e469b?w=500&auto=format&fit=crop', desc:'Micro-retinol formula for crow\'s feet and hooded lid improvement.' },
    { id:'e3',  name:'Gold Eye Patches',            cat:'Eye Care', price:1600, badge:'New',        rating:4.7, stock:50, img:'https://images.unsplash.com/photo-1566534268110-74c44e12e34d?w=500&auto=format&fit=crop', desc:'24K gold hydrogel patches. 20 pairs. Bridal-ready results.' },
    { id:'e4',  name:'Cooling Eye Gel',             cat:'Eye Care', price:1400, badge:'Sale', originalPrice:1800, rating:4.5, stock:60, img:'https://images.unsplash.com/photo-1622618991227-412b19e4fef9?w=500&auto=format&fit=crop', desc:'Cucumber and aloe gel that deflates puffiness on contact.' },
    { id:'e5',  name:'Dark Circle Corrector',       cat:'Eye Care', price:2400, badge:'Bestseller', rating:4.7, stock:28, img:'https://images.unsplash.com/photo-1643379855542-82c0c7483f3a?w=500&auto=format&fit=crop', desc:'Vitamin K and kojic acid targeted treatment for stubborn dark circles.' },
    { id:'e6',  name:'Lash Serum',                  cat:'Eye Care', price:2600, badge:'New',        rating:4.8, stock:32, img:'https://images.unsplash.com/photo-1622910076411-b126ff7e469b?w=500&auto=format&fit=crop', desc:'Clinically proven lash growth serum. Visible in 6 weeks.' },
    { id:'e7',  name:'Brow Lamination Gel',         cat:'Eye Care', price:1200, rating:4.5, stock:55, img:'https://images.unsplash.com/photo-1622618991227-412b19e4fef9?w=500&auto=format&fit=crop', desc:'Conditioning clear gel for feathery, laminated-look brows.' },
    { id:'e8',  name:'Eyelid Lifting Cream',        cat:'Eye Care', price:2200, badge:'Luxury',     rating:4.7, stock:25, img:'https://images.unsplash.com/photo-1643379855542-82c0c7483f3a?w=500&auto=format&fit=crop', desc:'DMAE and collagen cream for firmer, more lifted eyelids.' },
    { id:'e9',  name:'Nourishing Eye Balm',         cat:'Eye Care', price:1800, badge:'New',        rating:4.6, stock:42, img:'https://images.unsplash.com/photo-1643379855542-82c0c7483f3a?w=500&auto=format&fit=crop', desc:'Rich balm with sea buckthorn and vitamin E for dry periorbital skin.' },
    { id:'e10', name:'Brightening Eye Mask',        cat:'Eye Care', price:1100, badge:'Sale', originalPrice:1400, rating:4.5, stock:65, img:'https://images.unsplash.com/photo-1622910076411-b126ff7e469b?w=500&auto=format&fit=crop', desc:'Dissolving hydrogel masks with illuminating mica and niacinamide.' },
    { id:'e11', name:'Vitamin C Eye Booster',       cat:'Eye Care', price:2000, badge:'Bestseller', rating:4.7, stock:38, img:'https://images.unsplash.com/photo-1622910076411-b126ff7e469b?w=500&auto=format&fit=crop', desc:'Stable vitamin C eye booster for brightness and collagen support.' },
    { id:'e12', name:'Hyaluronic Eye Serum',        cat:'Eye Care', price:2100, badge:'New',        rating:4.6, stock:44, img:'https://images.unsplash.com/photo-1622910076411-b126ff7e469b?w=500&auto=format&fit=crop', desc:'Hydrating HA eye serum that plumps fine dehydration lines.' },
    { id:'e13', name:'Anti-Ageing Eye Set',         cat:'Eye Care', price:4200, badge:'Luxury',     rating:4.9, stock:15, img:'https://images.unsplash.com/photo-1643379855542-82c0c7483f3a?w=500&auto=format&fit=crop', desc:'Complete duo: day cream + night serum for total eye rejuvenation.' },
    { id:'e14', name:'Collagen Eye Mist',           cat:'Eye Care', price:1300, rating:4.4, stock:58, img:'https://images.unsplash.com/photo-1643379855542-82c0c7483f3a?w=500&auto=format&fit=crop', desc:'Marine collagen setting mist that refreshes eye makeup mid-day.' },
    { id:'e15', name:'Sleep Recovery Eye Mask',     cat:'Eye Care', price:1900, badge:'Bestseller', rating:4.7, stock:36, img:'https://images.unsplash.com/photo-1566534268110-74c44e12e34d?w=500&auto=format&fit=crop', desc:'Overnight sleeping mask specifically designed for the eye area.' },

    // MEN'S GROOMING (15)
    { id:'g1',  name:"Men's Saffron Face Wash",     cat:"Men's Grooming", price:1400, badge:'Bestseller', rating:4.7, stock:55, img:IMG.x4, desc:'Deep-cleansing face wash for men with saffron and charcoal.' },
    { id:'g3',  name:'After Shave Balm',            cat:"Men's Grooming", price:1200, badge:'Bestseller', rating:4.6, stock:60, img:IMG.x6, desc:'Alcohol-free balm that soothes post-shave irritation.' },
    { id:'g6',  name:'Activated Charcoal Scrub',    cat:"Men's Grooming", price:1500, badge:'Sale', originalPrice:1900, rating:4.5, stock:52, img:IMG.x3, desc:'Deep-cleansing scrub that draws out pollution and unclogs pores.' },
    { id:'g7',  name:'Beard Growth Serum',          cat:"Men's Grooming", price:2200, badge:'Bestseller', rating:4.8, stock:30, img:IMG.x4, desc:'DHT-blocking serum with biotin and red clover for denser growth.' },
    { id:'g9',  name:'Scalp & Beard Wash',          cat:"Men's Grooming", price:1300, badge:'New',        rating:4.5, stock:58, img:IMG.x6, desc:'2-in-1 formula for healthy scalp and conditioned beard.' },
    { id:'g12', name:'Shaving Cream Premium',       cat:"Men's Grooming", price:1100, badge:'Sale', originalPrice:1500, rating:4.4, stock:65, img:IMG.x3, desc:'Glycerin-rich shaving cream for a close, irritation-free shave.' },
    { id:'g13', name:'Lip Balm for Men',            cat:"Men's Grooming", price:600,  badge:'New',        rating:4.5, stock:80, img:IMG.x4, desc:'Unscented, unfussy lip balm with beeswax and vitamin E.' },
    { id:'g15', name:'Charcoal Peel-Off Mask',      cat:"Men's Grooming", price:1400, badge:'New',        rating:4.6, stock:50, img:IMG.x6, desc:'Satisfying peel-off mask that extracts blackheads in one go.' },

    // BATH & SPA (15)

    // WELLNESS (15)
    { id:'w1',  name:'Beauty Collagen Drink',       cat:'Wellness', price:3200, badge:'Bestseller', rating:4.8, stock:40, img:'https://images.unsplash.com/photo-1732900293895-233f769299b3?w=500&auto=format&fit=crop', desc:'Marine collagen + vitamin C daily beauty drink for skin and nails.' },
    { id:'w2',  name:'Saffron Mood Tea',            cat:'Wellness', price:1800, badge:'New',        rating:4.7, stock:55, img:'https://images.unsplash.com/photo-1664956618021-73c47736845e?w=500&auto=format&fit=crop', desc:'Certified saffron and chamomile blend for calm focus and mood lift.' },
    { id:'w3',  name:'Vitamin D3 + K2 Drops',      cat:'Wellness', price:2400, badge:'Luxury',     rating:4.8, stock:30, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'Liquid D3/K2 complex for bone, skin, and immune health.' },
    { id:'w4',  name:'Glow Supplement Pack',        cat:'Wellness', price:4200, badge:'Luxury',     rating:4.9, stock:18, img:'https://images.unsplash.com/photo-1707129785947-ddc627a8bab9?w=500&auto=format&fit=crop', desc:'Monthly supply: collagen, biotin, zinc, and vitamin C in one box.' },
    { id:'w5',  name:'Biotin Hair Tablets',         cat:'Wellness', price:1600, badge:'Bestseller', rating:4.7, stock:60, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'High-potency biotin with bamboo silica for hair, skin, and nails.' },
    { id:'w6',  name:'Probiotic Beauty Capsules',   cat:'Wellness', price:2800, badge:'New',        rating:4.7, stock:35, img:'https://images.unsplash.com/photo-1707129785947-ddc627a8bab9?w=500&auto=format&fit=crop', desc:'Multi-strain probiotics clinically linked to clearer, calmer skin.' },
    { id:'w7',  name:'Stress-Ease Adaptogen Blend', cat:'Wellness', price:2200, badge:'New',        rating:4.6, stock:42, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'Ashwagandha and tulsi blend to lower cortisol and support skin barrier.' },
    { id:'w8',  name:'Rose Hip Vitamin C Complex',  cat:'Wellness', price:1800, badge:'Sale', originalPrice:2200, rating:4.6, stock:52, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'Natural vitamin C from rosehip berry extract. 250mg per capsule.' },
    { id:'w9',  name:'Magnesium Beauty Sleep',      cat:'Wellness', price:1900, badge:'Bestseller', rating:4.7, stock:45, img:'https://images.unsplash.com/photo-1707129785947-ddc627a8bab9?w=500&auto=format&fit=crop', desc:'Magnesium glycinate for deep sleep and overnight skin repair.' },
    { id:'w10', name:'Hyaluronic Acid Capsules',    cat:'Wellness', price:2600, badge:'Luxury',     rating:4.8, stock:25, img:'https://images.unsplash.com/photo-1707129785947-ddc627a8bab9?w=500&auto=format&fit=crop', desc:'Internal HA supplementation for plumper skin from the inside.' },
    { id:'w11', name:'Omega-3 Beauty Complex',      cat:'Wellness', price:2000, rating:4.5, stock:48, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'EPA/DHA complex for skin elasticity, hair, and anti-inflammation.' },
    { id:'w12', name:'Turmeric & Ginger Capsules',  cat:'Wellness', price:1400, badge:'New',        rating:4.5, stock:62, img:'https://images.unsplash.com/photo-1707129785947-ddc627a8bab9?w=500&auto=format&fit=crop', desc:'Anti-inflammatory duo for skin clarity and digestive wellness.' },
    { id:'w13', name:'Zinc Skin Balance',           cat:'Wellness', price:1200, badge:'Sale', originalPrice:1600, rating:4.4, stock:70, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'Zinc bisglycinate for acne-prone and oily skin control.' },
    { id:'w14', name:'Evening Primrose Oil Capsules',cat:'Wellness', price:1500, badge:'Bestseller', rating:4.7, stock:58, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'GLA-rich evening primrose oil for hormonal skin and eczema relief.' },
    { id:'w15', name:'Antioxidant Beauty Blend',    cat:'Wellness', price:3000, badge:'Luxury',     rating:4.8, stock:20, img:'https://images.unsplash.com/photo-1732900490015-a5167a642998?w=500&auto=format&fit=crop', desc:'Resveratrol, astaxanthin, and CoQ10 — the anti-ageing triple threat.' },

    // TOOLS & ACCESSORIES (15)
    { id:'t1',  name:'Rose Quartz Roller',          cat:'Tools & Accessories', price:2200, badge:'Bestseller', rating:4.8, stock:35, img:'https://images.unsplash.com/photo-1583241800806-1ab2556fabd0?w=500&auto=format&fit=crop', desc:'Authentic rose quartz facial roller for lymphatic drainage.' },
    { id:'t2',  name:'Gua Sha Stone Set',           cat:'Tools & Accessories', price:1800, badge:'New',        rating:4.7, stock:45, img:'https://images.unsplash.com/photo-1583241800804-8eea95214a87?w=500&auto=format&fit=crop', desc:'Jade and bian stone gua sha set for face sculpting.' },
    { id:'t3',  name:'Kabuki Foundation Brush',     cat:'Tools & Accessories', price:1600, badge:'Bestseller', rating:4.7, stock:55, img:'https://images.unsplash.com/photo-1583241800967-3b926edea1f2?w=500&auto=format&fit=crop', desc:'Densely packed synthetic kabuki for seamless foundation blending.' },
    { id:'t4',  name:'Face Massage Tool',           cat:'Tools & Accessories', price:2600, badge:'Luxury',     rating:4.8, stock:25, img:'https://images.unsplash.com/photo-1680244169777-a3d7d758a264?w=500&auto=format&fit=crop', desc:'Stainless steel facial massager for sculpting and puffiness relief.' },
    { id:'t5',  name:'Brush Cleaning Mat',          cat:'Tools & Accessories', price:900,  badge:'Sale', originalPrice:1200, rating:4.5, stock:70, img:'https://images.unsplash.com/photo-1583241800967-3b926edea1f2?w=500&auto=format&fit=crop', desc:'Textured silicone mat for deep-cleaning all brush sizes.' },
    { id:'t6',  name:'Lash Curler Gold Edition',    cat:'Tools & Accessories', price:1400, badge:'New',        rating:4.6, stock:60, img:'https://images.unsplash.com/photo-1777390435474-9f96d60435c6?w=500&auto=format&fit=crop', desc:'Gold-plated lash curler with 3 replacement pads. Salon-grade.' },
    { id:'t7',  name:'Silicone Face Mask Brush',    cat:'Tools & Accessories', price:700,  badge:'New',        rating:4.4, stock:85, img:'https://images.unsplash.com/photo-1583241800967-3b926edea1f2?w=500&auto=format&fit=crop', desc:'No-waste silicone brush for hygienic mask application.' },
    { id:'t8',  name:'Eyebrow Stencil Kit',         cat:'Tools & Accessories', price:800,  badge:'Sale', originalPrice:1100, rating:4.3, stock:75, img:'https://images.unsplash.com/photo-1777390435474-9f96d60435c6?w=500&auto=format&fit=crop', desc:'12 reusable stencil shapes for perfectly shaped brows every time.' },
    { id:'t9',  name:'Dermaplaning Tool',           cat:'Tools & Accessories', price:1200, badge:'Bestseller', rating:4.7, stock:40, img:'https://images.unsplash.com/photo-1777390435474-9f96d60435c6?w=500&auto=format&fit=crop', desc:'Precision dermaplaning tool for vellus hair removal and smoothing.' },
    { id:'t10', name:'10× Magnifying Mirror',       cat:'Tools & Accessories', price:2400, badge:'Luxury',     rating:4.8, stock:22, img:'https://images.unsplash.com/photo-1777390435474-9f96d60435c6?w=500&auto=format&fit=crop', desc:'LED-lit 10× magnifying mirror. Perfect for skincare and makeup.' },
    { id:'t11', name:'Contour Brush Set (5pc)',     cat:'Tools & Accessories', price:2800, badge:'New',        rating:4.7, stock:30, img:'https://images.unsplash.com/photo-1583241800967-3b926edea1f2?w=500&auto=format&fit=crop', desc:'5 professional contour brushes: blush, highlight, sculpt, blend, liner.' },
    { id:'t12', name:'Jade Rolling Pin',            cat:'Tools & Accessories', price:1600, rating:4.5, stock:48, img:'https://images.unsplash.com/photo-1583241800804-8eea95214a87?w=500&auto=format&fit=crop', desc:'Flat jade rolling pin for facial de-puffing and muscle tension.' },
    { id:'t13', name:'Micro-needle Derma Roller',   cat:'Tools & Accessories', price:2000, badge:'Luxury',     rating:4.6, stock:28, img:'https://images.unsplash.com/photo-1583241800806-1ab2556fabd0?w=500&auto=format&fit=crop', desc:'0.3mm titanium micro-needle roller for serum absorption enhancement.' },
    { id:'t14', name:'Silicone Body Brush',         cat:'Tools & Accessories', price:1100, badge:'Bestseller', rating:4.6, stock:55, img:'https://images.unsplash.com/photo-1583241800967-3b926edea1f2?w=500&auto=format&fit=crop', desc:'Soft-bristle silicone body brush for gentle exfoliation in shower.' },
    { id:'t15', name:'Travel Brush Roll',           cat:'Tools & Accessories', price:1900, badge:'New',        rating:4.7, stock:35, img:'https://images.unsplash.com/photo-1583241800967-3b926edea1f2?w=500&auto=format&fit=crop', desc:'Canvas brush roll holds 12 brushes. Elegant and TSA-safe.' },

    // GIFT SETS (15)
    { id:'gs1', name:'Saffron Glow Gift Set',       cat:'Gift Sets', price:5200, badge:'Bestseller', rating:4.9, stock:20, img:'https://images.unsplash.com/photo-1574885914529-e157b2664e4c?w=500&auto=format&fit=crop', desc:'The best of Saffron & Co: serum, moisturiser, face oil, and lip balm.' },
    { id:'gs4', name:'Skincare Starter Set',        cat:'Gift Sets', price:4200, badge:'Bestseller', rating:4.8, stock:25, img:'https://images.unsplash.com/photo-1575075835950-99efb232e2eb?w=500&auto=format&fit=crop', desc:'5-step routine: cleanser, toner, serum, moisturiser, SPF.' },
    { id:'gs7', name:'Mum\'s Pampering Set',        cat:'Gift Sets', price:3400, badge:'Bestseller', rating:4.9, stock:22, img:'https://images.unsplash.com/photo-1574885914529-e157b2664e4c?w=500&auto=format&fit=crop', desc:'Body lotion, scrub, rose water mist, and bath salts for mum.' },
    { id:'gs10',name:'Body Glow Bundle',            cat:'Gift Sets', price:2800, badge:'New',        rating:4.6, stock:40, img:'https://images.unsplash.com/photo-1574885914529-e157b2664e4c?w=500&auto=format&fit=crop', desc:'Body scrub, body lotion, and dry oil spray for radiant skin.' },
    { id:'gs13',name:'Rose & Saffron Duo',          cat:'Gift Sets', price:4400, badge:'Bestseller', rating:4.8, stock:25, img:'https://images.unsplash.com/photo-1574885914529-e157b2664e4c?w=500&auto=format&fit=crop', desc:'Bestselling rose serum + saffron face oil. Boxed to impress.' },
  ]
  return data
}

const products    = makeProducts()
const now         = new Date().toISOString()

writeFileSync(
  join(outDir, 'products.json'),
  JSON.stringify({ data: products, count: products.length, updated: now }, null, 2),
  'utf8'
)

writeFileSync(
  join(outDir, 'categories.json'),
  JSON.stringify({ data: CATEGORIES, count: CATEGORIES.length, updated: now }, null, 2),
  'utf8'
)

console.log(`✓ Generated ${products.length} products and ${CATEGORIES.length} categories → public/api/`)
