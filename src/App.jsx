import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate as useRouterNavigate, useLocation, Routes, Route } from 'react-router-dom'
import {
  ShoppingBag, Heart, Search, Menu, X, ArrowRight, ChevronRight,
  Star, Truck, RefreshCw, Shield, ChevronDown,
  Check, MapPin, Phone, User, Leaf, Droplets, Sun, Sparkles,
  Package, UserCircle2, ClipboardList, Mail, FileText, Loader2, Upload, AlertCircle,
} from 'lucide-react'
import { ALL_PRODUCTS, CATEGORIES_DATA, TESTIMONIALS, CITIES } from './data.js'
import CategoryDetailPage from './components/CategoryDetailPage.jsx'
import ProductDetailPage from './components/ProductDetailPage.jsx'
import Invoice from './components/Invoice.jsx'
import ToastContainer, { toast } from './components/Toast.jsx'
import CookieBanner from './components/CookieBanner.jsx'
import { fetchProducts, fetchCategories, placeOrder as apiPlaceOrder, uploadPaymentProof, trackOrdersByPhone, getProductOverrides } from './api.js'
import {
  loadCart, saveCart, clearCart,
  loadWishlist, saveWishlist,
  loadOrders, saveOrder, decrementStock,
  loadCustomer, saveCustomer,
  nextOrderNumber,
} from './utils/storage.js'
import AdminGuard from './admin/AdminGuard.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'
import AdminOrders from './admin/AdminOrders.jsx'
import AdminOrderDetail from './admin/AdminOrderDetail.jsx'
import AdminCustomers from './admin/AdminCustomers.jsx'
import AdminStock from './admin/AdminStock.jsx'
import AdminReviews from './admin/AdminReviews.jsx'
import AdminProducts from './admin/AdminProducts.jsx'

/* ─────────────────────────────────────────────────────
   URL ROUTING HELPERS
───────────────────────────────────────────────────── */
const toSlug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function pageToPath(page, category, productId) {
  switch (page) {
    case 'home':        return '/'
    case 'shop':        return '/shop'
    case 'collections': return '/collections'
    case 'about':       return '/about'
    case 'ingredients': return '/ingredients'
    case 'account':     return '/account'
    case 'category':    return category ? `/collections/${toSlug(category)}` : '/collections'
    case 'product':     return productId != null ? `/products/${productId}` : '/'
    case 'contact':     return '/contact'
    case 'privacy':     return '/privacy'
    case 'terms':       return '/terms'
    default:            return '/'
  }
}

function pathToState(pathname, cats, products) {
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return { page: 'home' }
  switch (parts[0]) {
    case 'shop':        return { page: 'shop' }
    case 'about':       return { page: 'about' }
    case 'ingredients': return { page: 'ingredients' }
    case 'account':     return { page: 'account' }
    case 'collections': {
      if (!parts[1]) return { page: 'collections' }
      const cat = cats.find(c => toSlug(c.name) === parts[1])
      return cat ? { page: 'category', category: cat.name } : { page: 'collections' }
    }
    case 'products': {
      if (!parts[1]) return { page: 'home' }
      const numId = parseInt(parts[1])
      const prod = products.find(p => p.id === (isNaN(numId) ? parts[1] : numId))
      return prod ? { page: 'product', product: prod.id } : { page: 'shop' }
    }
    case 'contact':   return { page: 'contact' }
    case 'privacy':   return { page: 'privacy' }
    case 'terms':     return { page: 'terms' }
    default: return { page: 'home' }
  }
}

/* ─────────────────────────────────────────────────────
   INGREDIENTS (kept here for JSX icons)
───────────────────────────────────────────────────── */
const INGREDIENTS_DATA = [
  { name:'Saffron',          origin:'Kashmir, Pakistan',   icon:<Sparkles size={20}/>, benefit:'Brightens & evens tone',      color:'#D4956A', desc:'The world\'s most precious spice — each thread hand-harvested. Saffron\'s crocin content visibly reduces pigmentation and imparts a golden radiance to skin.' },
  { name:'Rose Extract',     origin:'Taif, Saudi Arabia',  icon:<Leaf size={20}/>,    benefit:'Hydrates & soothes',           color:'#E8A0A0', desc:'Cold-pressed from Damask rose petals at peak bloom. Rich in antioxidants and natural moisturising factors that strengthen the skin barrier over time.' },
  { name:'Jasmine Absolute', origin:'Multan, Pakistan',    icon:<Droplets size={20}/>,benefit:'Repairs & nourishes',          color:'#F5E6A3', desc:'Steam-distilled from jasmine sambac flowers picked before dawn. Deeply regenerative — promotes elastin production for firmer, more supple skin.' },
  { name:'Turmeric',         origin:'Sindh, Pakistan',     icon:<Sun size={20}/>,     benefit:'Purifies & anti-inflammatory', color:'#F0C040', desc:'Organic turmeric standardised to 5% curcumin content. Clinical studies show a 40% reduction in post-inflammatory hyperpigmentation in 8 weeks.' },
  { name:'Vitamin C',        origin:'Synthesised (stable)',icon:<Sparkles size={20}/>,benefit:'Brightens & protects',         color:'#A8D8A8', desc:'Ascorbyl glucoside — the most stable form of Vitamin C. Unlike L-ascorbic acid, it doesn\'t oxidise and maintains efficacy for the full shelf life.' },
  { name:'Hyaluronic Acid',  origin:'Bio-fermented',       icon:<Droplets size={20}/>,benefit:'Plumps & deeply hydrates',     color:'#A8C8E8', desc:'Three molecular weights for multi-depth hydration — from surface plumping to deep dermal moisture. Holds 1,000× its weight in water.' },
]

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.08 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

function useNavScroll() {
  const [s, setS] = useState(false)
  useEffect(() => {
    const fn = () => setS(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return s
}

/* ─────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-cream">
      <div className="mb-6">
        <p className="font-display text-3xl font-400 text-bark tracking-[0.12em]">
          SAFFRON <span className="text-saffron">&</span> CO
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-saffron rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   PAYMENT
───────────────────────────────────────────────────── */
const EASYPAISA_ACCOUNT = { name: 'Saffron & Company', number: '0344-4183049' }

function EasyPaisaLogo({ size = 'md' }) {
  const h = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-8' : 'h-10'
  return <img src="https://crystalpng.com/wp-content/uploads/2024/10/Easypaisa-logo.png" alt="EasyPaisa" className={`${h} w-auto object-contain bg-white rounded-lg p-1.5`} />
}

/* ─────────────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────────────── */
function Stars({ n }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className={i < n ? 'fill-saffron text-saffron' : 'text-bark/15'} />)}
    </span>
  )
}

function ProductCard({ p, onAdd, wishlist, onWish, onView }) {
  const [hov, setHov] = useState(false)
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null
  const badgeColors = { Bestseller: 'bg-saffron-dark text-white', New: 'bg-bark text-cream', Sale: 'bg-rose text-bark', Luxury: 'bg-saffron-light text-bark' }
  return (
    <div className="group relative" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="relative overflow-hidden rounded-2xl bg-rose/40 aspect-[3/4]" onClick={onView} style={{ cursor: onView ? 'pointer' : undefined }}>
        <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        {p.badge && <span className={`absolute top-3 left-3 text-[10px] font-body font-500 uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeColors[p.badge]}`}>{p.badge}</span>}
        {disc && <span className="absolute top-3 right-10 bg-white text-bark text-xs font-body font-500 px-2 py-0.5 rounded-full shadow-sm">-{disc}%</span>}
        <div className={`absolute inset-0 bg-bark/0 transition-colors duration-300 ${hov ? 'bg-bark/8' : ''}`} />
        <button onClick={e => { e.stopPropagation(); onWish && onWish(p.id) }} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm z-10">
          <Heart size={13} className={wishlist?.includes(p.id) ? 'fill-saffron text-saffron' : 'text-bark/50'} />
        </button>
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${hov ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <button onClick={e => { e.stopPropagation(); onAdd(p) }} className="w-full btn-shimmer text-white font-body text-sm py-2.5 rounded-xl flex items-center justify-center gap-2">
            <ShoppingBag size={14} /> Add to Bag
          </button>
        </div>
      </div>
      <div className="mt-3 px-1 space-y-0.5" onClick={onView} style={{ cursor: onView ? 'pointer' : undefined }}>
        <p className="font-display text-lg text-bark leading-tight hover:text-saffron transition-colors">{p.name}</p>
        <p className="font-body text-xs text-bark/40">{p.cat}</p>
        <Stars n={Math.floor(p.rating)} />
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-body font-500 text-sm text-bark">PKR {p.price.toLocaleString()}</span>
          {p.originalPrice && <span className="font-body text-xs text-bark/35 line-through">PKR {p.originalPrice.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ tag, title, center = false }) {
  return (
    <div className={`mb-12 reveal ${center ? 'text-center' : ''}`}>
      <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-2">{tag}</p>
      <h2 className="font-display text-4xl lg:text-5xl text-bark font-400">{title}</h2>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   SEARCH OVERLAY
───────────────────────────────────────────────────── */
function SearchOverlay({ allProducts, categoriesData, onClose, onNavigate }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const results = q.length > 1
    ? allProducts.filter(p => [p.name, p.cat, p.desc].some(s => s.toLowerCase().includes(q.toLowerCase()))).slice(0, 6)
    : []
  const catResults = q.length > 1
    ? categoriesData.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
    : []

  return (
    <div className="fixed inset-0 z-50 bg-cream/97 backdrop-blur-lg flex flex-col">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-bark/10">
        <Search size={18} className="text-saffron shrink-0" />
        <input ref={inputRef} type="text" placeholder="Search products, categories..." value={q} onChange={e => setQ(e.target.value)}
          className="flex-1 bg-transparent font-display text-2xl text-bark placeholder:text-bark/25 outline-none" />
        <button onClick={onClose} className="text-bark/40 hover:text-bark transition-colors"><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl mx-auto w-full">
        {q.length < 2 && (
          <div>
            <p className="font-body text-xs text-bark/30 uppercase tracking-widest mb-4">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {['Rose Serum', 'Saffron Cream', 'Vitamin C', 'Oud Perfume', 'Hair Mask', 'Gift Set'].map(s => (
                <button key={s} onClick={() => setQ(s)}
                  className="px-4 py-2 border border-bark/15 text-bark/50 font-body text-sm hover:border-saffron hover:text-saffron transition-colors rounded-full">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {catResults.length > 0 && (
          <div className="mb-6">
            <p className="font-body text-xs text-saffron uppercase tracking-widest mb-3">Categories</p>
            {catResults.map(c => (
              <button key={c.name} onClick={() => { onNavigate('category', { category: c.name }); onClose() }}
                className="w-full flex items-center gap-4 py-3 border-b border-bark/8 hover:text-saffron transition-colors group text-left">
                <div className="w-8 h-8 bg-rose/50 rounded-full flex items-center justify-center text-saffron shrink-0"><Leaf size={14} /></div>
                <div className="flex-1">
                  <p className="font-display text-base text-bark group-hover:text-saffron">{c.name}</p>
                  <p className="font-body text-xs text-bark/40 mt-0.5">{c.count} products</p>
                </div>
                <ChevronRight size={14} className="text-bark/20 group-hover:text-saffron" />
              </button>
            ))}
          </div>
        )}
        {results.length > 0 && (
          <div>
            <p className="font-body text-xs text-saffron uppercase tracking-widest mb-3">Products ({results.length})</p>
            {results.map(p => (
              <button key={p.id} onClick={() => { onNavigate('product', { product: p.id }); onClose() }}
                className="w-full flex items-center gap-4 py-3 border-b border-bark/8 hover:bg-rose/20 transition-colors group text-left rounded-xl px-2">
                <img src={p.img} alt={p.name} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base text-bark group-hover:text-saffron truncate">{p.name}</p>
                  <p className="font-body text-xs text-bark/40 mt-0.5">{p.cat}</p>
                </div>
                <p className="font-body text-sm font-500 text-saffron shrink-0">PKR {p.price.toLocaleString()}</p>
              </button>
            ))}
          </div>
        )}
        {q.length > 1 && results.length === 0 && catResults.length === 0 && (
          <div className="text-center py-16">
            <Search size={36} className="text-bark/10 mx-auto mb-4" />
            <p className="font-display text-xl text-bark/30">No results for "{q}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   CHECKOUT MODAL
───────────────────────────────────────────────────── */
function CheckoutModal({ items, onClose, onSuccess }) {
  const saved = loadCustomer()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: saved.name || '',
    phone: saved.phone || '',
    city: saved.city || '',
    address: saved.address || '',
    payment: 'cod',
  })
  const [easyTid, setEasyTid] = useState('')
  const [copied, setCopied] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState(null)
  const [placedOrder, setPlacedOrder] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [proofUploaded, setProofUploaded] = useState(false)

  const copyAccount = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(EASYPAISA_ACCOUNT.number).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }).catch(() => {})
    }
  }

  const subtotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0)
  const delivery = subtotal > 4000 ? 0 : 200
  const grand = subtotal + delivery
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const placeOrder = async () => {
    setPlacing(true); setPlaceError(null)
    try {
      const order = await apiPlaceOrder({
        items: items.map(it => ({
          id: it.id, name: it.name, cat: it.cat, price: it.price,
          quantity: it.qty || 1, img: it.img, size: it.size,
        })),
        customer: {
          name: form.name,
          phone: '+92 ' + form.phone,
          city: form.city,
          address: form.address,
        },
        payment: form.payment,
        easyTid: form.payment === 'easypaisa' ? easyTid.trim() : '',
        subtotal, delivery, total: grand,
      })
      // Cache locally too so the user can see their orders in Account even offline
      saveOrder(order)
      decrementStock(items)
      saveCustomer({ name: form.name, phone: form.phone, city: form.city, address: form.address })
      setPlacedOrder(order)
      if (form.payment === 'easypaisa') {
        setStep(5) // proof upload step
      } else {
        setStep(4) // success
        onSuccess(order)
      }
    } catch (err) {
      setPlaceError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const submitProof = async () => {
    if (!proofFile || !placedOrder) return
    setUploadingProof(true); setPlaceError(null)
    try {
      await uploadPaymentProof(placedOrder.orderNumber, proofFile)
      setProofUploaded(true)
      setTimeout(() => {
        setStep(4)
        onSuccess(placedOrder)
      }, 800)
    } catch (err) {
      setPlaceError(err.message || 'Upload failed')
    } finally {
      setUploadingProof(false)
    }
  }

  const skipProof = () => {
    if (!window.confirm("Skip proof upload? You'll need to send it via WhatsApp to 0344-4183049 before we can confirm.")) return
    setStep(4)
    onSuccess(placedOrder)
  }

  const StepDot = ({ n }) => (
    <div className={`flex items-center ${n < 4 ? 'flex-1' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-body font-500 text-xs transition-all ${step >= n ? 'bg-saffron text-white' : 'bg-bark/10 text-bark/30'}`}>
        {step > n ? <Check size={13} /> : n}
      </div>
      {n < 4 && <div className={`flex-1 h-px mx-1.5 transition-all ${step > n ? 'bg-saffron' : 'bg-bark/10'}`} />}
    </div>
  )

  const canPay = form.payment === 'cod' || (form.payment === 'easypaisa' && easyTid.trim().length >= 6)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bark/40 backdrop-blur-sm" onClick={step < 4 ? onClose : undefined} />
      <div className="relative w-full max-w-lg bg-cream border border-bark/10 rounded-2xl flex flex-col shadow-2xl" style={{ maxHeight: '92vh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-bark/10 shrink-0">
          <p className="font-display text-xl text-bark">{['', 'Order Summary', 'Delivery Details', 'Payment', 'Order Confirmed'][step]}</p>
          {step < 4 && <button onClick={onClose}><X size={18} className="text-bark/40 hover:text-bark" /></button>}
        </div>
        {step < 4 && (
          <div className="flex items-center px-6 py-4 border-b border-bark/8 shrink-0">
            {[1, 2, 3, 4].map(n => <StepDot key={n} n={n} />)}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3 items-center bg-rose/30 rounded-xl p-3">
                  <img src={item.img} alt={item.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base text-bark truncate">{item.name}</p>
                    <p className="font-body text-xs text-bark/40 mt-0.5">{item.cat}</p>
                  </div>
                  <p className="font-body font-500 text-sm text-saffron shrink-0">PKR {item.price.toLocaleString()}</p>
                </div>
              ))}
              <div className="border-t border-bark/10 pt-3 space-y-2">
                <div className="flex justify-between font-body text-sm text-bark/50"><span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between font-body text-sm text-bark/50">
                  <span className="flex items-center gap-1"><Truck size={12} /> Delivery</span>
                  <span className={delivery === 0 ? 'text-saffron' : ''}>{delivery === 0 ? 'FREE' : `PKR ${delivery}`}</span>
                </div>
                {delivery === 0 && <p className="font-body text-xs text-saffron/70">Free delivery on orders above PKR 4,000</p>}
                <div className="flex justify-between font-display text-lg text-bark border-t border-bark/10 pt-2">
                  <span>Total</span><span className="text-saffron">PKR {grand.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Full Name', icon: <User size={14} />, type: 'text', ph: 'Sara Ahmed' },
                { key: 'phone', label: 'Phone Number', icon: <Phone size={14} />, type: 'tel', ph: '03XX XXXXXXX', prefix: '+92' },
              ].map(({ key, label, icon, type, ph, prefix }) => (
                <div key={key}>
                  <label className="font-body text-xs text-bark/40 uppercase tracking-widest block mb-1.5">{label}</label>
                  <div className="flex items-center gap-3 bg-white border border-bark/12 focus-within:border-saffron/50 rounded-xl px-4 py-3 transition-colors">
                    <span className="text-bark/30 shrink-0">{icon}</span>
                    {prefix && <span className="font-body text-sm text-bark/40">{prefix}</span>}
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => set(key, e.target.value)}
                      className="flex-1 bg-transparent font-body text-sm text-bark placeholder:text-bark/20 outline-none" />
                  </div>
                </div>
              ))}
              <div>
                <label className="font-body text-xs text-bark/40 uppercase tracking-widest block mb-1.5">City</label>
                <div className="flex items-center gap-3 bg-white border border-bark/12 focus-within:border-saffron/50 rounded-xl px-4 py-3 transition-colors">
                  <MapPin size={14} className="text-bark/30 shrink-0" />
                  <select value={form.city} onChange={e => set('city', e.target.value)} className="flex-1 bg-transparent font-body text-sm text-bark outline-none appearance-none">
                    <option value="" disabled>Select your city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="text-bark/30 shrink-0" />
                </div>
              </div>
              <div>
                <label className="font-body text-xs text-bark/40 uppercase tracking-widest block mb-1.5">Delivery Address</label>
                <div className="bg-white border border-bark/12 focus-within:border-saffron/50 rounded-xl px-4 py-3 transition-colors">
                  <textarea placeholder="House #, Street, Area, Landmark..." value={form.address} onChange={e => set('address', e.target.value)} rows={3}
                    className="w-full bg-transparent font-body text-sm text-bark placeholder:text-bark/20 outline-none resize-none" />
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <p className="font-body text-sm text-bark/50 leading-relaxed">Choose how you'd like to pay.</p>
              {/* COD */}
              <label className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                style={form.payment === 'cod' ? { borderColor: '#16a34a80', backgroundColor: '#16a34a08' } : { borderColor: 'rgba(44,24,16,0.1)' }}>
                <input type="radio" name="pm" value="cod" checked={form.payment === 'cod'} onChange={e => set('payment', e.target.value)} className="hidden" />
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all" style={{ borderColor: form.payment === 'cod' ? '#16a34a' : 'rgba(44,24,16,0.15)' }}>
                  {form.payment === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Package size={16} className="text-emerald-600" />
                    </div>
                    <p className="font-body text-sm font-700 text-bark">Cash on Delivery</p>
                  </div>
                  <p className="font-body text-xs text-bark/40 leading-relaxed">Pay cash when your order arrives at your door. No advance needed.</p>
                </div>
              </label>
              {/* EasyPaisa */}
              <label className="flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                style={form.payment === 'easypaisa' ? { borderColor: '#00A65150', backgroundColor: '#00A65108' } : { borderColor: 'rgba(44,24,16,0.1)' }}>
                <input type="radio" name="pm" value="easypaisa" checked={form.payment === 'easypaisa'} onChange={e => set('payment', e.target.value)} className="hidden" />
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-1" style={{ borderColor: form.payment === 'easypaisa' ? '#00A651' : 'rgba(44,24,16,0.15)' }}>
                  {form.payment === 'easypaisa' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#00A651' }} />}
                </div>
                <div className="flex-1">
                  <EasyPaisaLogo size="md" />
                  <p className="font-body text-xs text-bark/40 mt-2 leading-relaxed">Send the total via EasyPaisa to our account, then share your Transaction ID below.</p>
                </div>
              </label>
              {form.payment === 'easypaisa' && (
                <div className="rounded-xl p-4 border space-y-3" style={{ borderColor: '#00A65130', backgroundColor: '#00A65108' }}>
                  <p className="font-body text-[10px] uppercase tracking-widest font-700" style={{ color: '#00A651' }}>Send payment to</p>
                  <div className="bg-white rounded-lg border divide-y" style={{ borderColor: 'rgba(0,166,81,0.15)' }}>
                    <div className="flex justify-between items-center px-3 py-2.5">
                      <span className="font-body text-[11px] text-bark/40 uppercase tracking-widest">Account Name</span>
                      <span className="font-body text-sm font-700 text-bark">{EASYPAISA_ACCOUNT.name}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5">
                      <span className="font-body text-[11px] text-bark/40 uppercase tracking-widest">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-body text-sm font-700 text-bark tracking-wide">{EASYPAISA_ACCOUNT.number}</span>
                        <button type="button" onClick={copyAccount}
                          className="font-body text-[10px] uppercase tracking-widest px-2 py-1 rounded-md border transition-colors"
                          style={{ borderColor: 'rgba(0,166,81,0.3)', color: copied ? '#fff' : '#00A651', backgroundColor: copied ? '#00A651' : 'transparent' }}>
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5">
                      <span className="font-body text-[11px] text-bark/40 uppercase tracking-widest">Amount</span>
                      <span className="font-body text-sm font-700" style={{ color: '#00A651' }}>PKR {grand.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-bark/40 uppercase tracking-widest block mb-1.5">
                      Transaction ID (TID) <span className="text-red-500 normal-case tracking-normal">*required</span>
                    </label>
                    <input type="text" placeholder="e.g. 1234567890" value={easyTid} onChange={e => setEasyTid(e.target.value)}
                      className={`w-full bg-white border rounded-xl px-4 py-3 font-body text-sm text-bark placeholder:text-bark/20 outline-none transition-colors ${
                        easyTid.trim().length === 0
                          ? 'border-bark/12 focus:border-saffron/50'
                          : easyTid.trim().length < 6
                            ? 'border-red-300 focus:border-red-400'
                            : 'border-green-300 focus:border-green-400'
                      }`} />
                    {easyTid.trim().length > 0 && easyTid.trim().length < 6 && (
                      <p className="font-body text-xs text-red-600 mt-1.5">TID must be at least 6 characters</p>
                    )}
                    <p className="font-body text-xs text-bark/40 mt-1.5 leading-relaxed">
                      After payment, EasyPaisa will SMS you the TID. Enter it here so we can verify and dispatch your order. You can also send the TID to <span className="text-bark/60 font-500">0344-4183049</span> on WhatsApp.
                    </p>
                  </div>
                </div>
              )}
              <div className="bg-rose/30 rounded-xl p-4 flex justify-between items-center">
                <p className="font-body text-sm text-bark/50">{items.length} item{items.length !== 1 ? 's' : ''} + delivery</p>
                <p className="font-display text-lg text-saffron">PKR {grand.toLocaleString()}</p>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-saffron/10 border-2 border-saffron/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={36} className="text-saffron" />
              </div>
              <h3 className="font-display text-3xl text-bark mb-1">Order Placed!</h3>
              <p className="font-body text-sm text-bark/40 mb-8">
                {placedOrder?.status === 'awaiting_payment'
                  ? "We'll dispatch your order once your payment is verified."
                  : "Your order has been successfully confirmed."}
              </p>
              <div className="bg-rose/30 border border-bark/8 rounded-xl p-5 text-left space-y-3 mb-5">
                {[
                  ['Order ID', <span key="o" className="text-saffron font-500">{placedOrder?.orderNumber || '—'}</span>],
                  ['Customer', form.name || 'Customer'],
                  ['Phone', '+92 ' + form.phone],
                  ['Delivery to', form.city],
                  ['Total', `PKR ${grand.toLocaleString()}`],
                  ['Payment via', form.payment === 'easypaisa' ? <EasyPaisaLogo key="ep" size="sm" /> : 'Cash on Delivery'],
                  ...(form.payment === 'easypaisa' && easyTid ? [['Transaction ID', easyTid]] : []),
                  ['Est. Delivery', '2–4 working days'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="font-body text-xs text-bark/30 uppercase tracking-widest">{k}</span>
                    <span className="font-body text-sm text-bark">{v}</span>
                  </div>
                ))}
              </div>
              <p className="font-body text-xs text-bark/20">Thank you for shopping with Saffron & Co.</p>
            </div>
          )}
          {step === 5 && placedOrder && (
            <div className="py-2">
              <h3 className="font-display text-2xl text-bark mb-1">Upload Payment Proof</h3>
              <p className="font-body text-xs text-bark/40 mb-5">
                Order <span className="text-saffron font-500">{placedOrder.orderNumber}</span> · PKR {grand.toLocaleString()} via EasyPaisa
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-700 shrink-0 mt-0.5"/>
                <p className="font-body text-xs text-amber-800">
                  Please upload your EasyPaisa transfer screenshot so we can verify and dispatch your order.
                </p>
              </div>

              {proofUploaded ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-green-100 border-2 border-green-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="text-green-700"/>
                  </div>
                  <p className="font-display text-lg text-bark">Proof uploaded</p>
                  <p className="font-body text-xs text-bark/40 mt-1">Redirecting...</p>
                </div>
              ) : (
                <>
                  <label className={`block bg-cream border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer hover:border-saffron/50 transition-colors ${proofFile ? 'border-saffron/60' : 'border-bark/15'}`}>
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={e => setProofFile(e.target.files?.[0] || null)} className="hidden"/>
                    <Upload size={20} className="text-saffron mx-auto mb-2"/>
                    {proofFile ? (
                      <>
                        <p className="font-body font-500 text-sm text-bark truncate">{proofFile.name}</p>
                        <p className="font-body text-[11px] text-bark/40 mt-1">{(proofFile.size / 1024).toFixed(0)} KB · click to change</p>
                      </>
                    ) : (
                      <>
                        <p className="font-body text-sm text-bark">Click to choose screenshot</p>
                        <p className="font-body text-[11px] text-bark/40 mt-1">JPG / PNG / WebP · max 5 MB</p>
                      </>
                    )}
                  </label>
                </>
              )}

              {placeError && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle size={13} className="text-red-600"/>
                  <p className="font-body text-xs text-red-700">{placeError}</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-bark/10 shrink-0">
          {step === 1 && <button onClick={() => setStep(2)} className="w-full btn-shimmer text-white font-body py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm">Continue to Delivery <ArrowRight size={15} /></button>}
          {step === 2 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-bark/15 py-3.5 rounded-xl font-body text-sm text-bark/40 hover:text-bark hover:border-bark/30 transition-colors">Back</button>
              <button onClick={() => setStep(3)} disabled={!form.name || !form.phone || !form.city || !form.address}
                className="flex-[2] btn-shimmer text-white font-body py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">Continue to Payment <ArrowRight size={15} /></button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              {placeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle size={13} className="text-red-600"/>
                  <p className="font-body text-xs text-red-700">{placeError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} disabled={placing} className="flex-1 border border-bark/15 py-3.5 rounded-xl font-body text-sm text-bark/40 hover:text-bark hover:border-bark/30 transition-colors disabled:opacity-40">Back</button>
                <button onClick={placeOrder} disabled={!canPay || placing}
                  className="flex-[2] btn-shimmer text-white font-body py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                  {placing ? <><Loader2 size={14} className="animate-spin"/> Placing...</> : <>Place Order · PKR {grand.toLocaleString()} <Check size={14} /></>}
                </button>
              </div>
            </div>
          )}
          {step === 4 && <button onClick={onClose} className="w-full btn-shimmer text-white font-body py-3.5 rounded-xl text-sm">Continue Shopping</button>}
          {step === 5 && (
            <div className="flex gap-3">
              <button onClick={skipProof} disabled={uploadingProof} className="flex-1 border border-bark/15 py-3.5 rounded-xl font-body text-sm text-bark/40 hover:text-bark transition-colors disabled:opacity-40">Skip for now</button>
              <button onClick={submitProof} disabled={!proofFile || uploadingProof || proofUploaded}
                className="flex-[2] btn-shimmer text-white font-body py-3.5 rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {uploadingProof ? <><Loader2 size={14} className="animate-spin"/> Uploading...</> : <><Upload size={14}/> Upload Proof</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   ACCOUNT PAGE
───────────────────────────────────────────────────── */
function AccountPage({ allProducts, wishlist, onWish, onAdd, navigate }) {
  useReveal()
  const [tab, setTab] = useState('orders')
  const [phone, setPhone] = useState('')
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [orders, setOrders] = useState([])
  const [invoiceOrder, setInvoiceOrder] = useState(null)

  const search = async () => {
    setSearching(true); setSearchError(null)
    try {
      // Try backend first; fall back to localStorage if offline
      let found = []
      try {
        found = await trackOrdersByPhone(phone)
      } catch {
        const all = loadOrders()
        const normalized = phone.replace(/\s/g, '').replace(/\D/g, '')
        found = all.filter(o => String(o.customer?.phone || '').replace(/\D/g, '').includes(normalized))
      }
      setOrders(found)
      setSearched(true)
    } catch (err) {
      setSearchError(err.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id))

  return (
    <div className="pt-24 pb-20 bg-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10 reveal">
          <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-2">My Account</p>
          <h1 className="font-display text-4xl text-bark font-400">Your Orders & Wishlist</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 reveal">
          {[['orders', <ClipboardList size={15} />, 'Order History'], ['wishlist', <Heart size={15} />, `Wishlist (${wishlist.length})`]].map(([id, icon, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm transition-all ${tab === id ? 'bg-saffron text-white' : 'border border-bark/15 text-bark/60 hover:border-saffron hover:text-saffron'}`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <div>
            {/* Phone search */}
            <div className="bg-white border border-bark/10 rounded-2xl p-6 mb-6 reveal">
              <p className="font-body text-sm text-bark/50 mb-4">Enter your phone number to find your orders.</p>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-3 bg-cream border border-bark/12 focus-within:border-saffron/50 rounded-xl px-4 py-3 transition-colors">
                  <Phone size={14} className="text-bark/30 shrink-0" />
                  <span className="font-body text-sm text-bark/40">+92</span>
                  <input type="tel" placeholder="3XX XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    className="flex-1 bg-transparent font-body text-sm text-bark placeholder:text-bark/20 outline-none" />
                </div>
                <button onClick={search} disabled={searching || !phone.trim()}
                  className="btn-shimmer text-white font-body text-sm px-6 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 min-w-[100px]">
                  {searching ? <Loader2 size={14} className="animate-spin"/> : 'Track'}
                </button>
              </div>
            </div>

            {searched && orders.length === 0 && (
              <div className="text-center py-16">
                <Package size={40} className="text-bark/10 mx-auto mb-3" />
                <p className="font-display text-xl text-bark/30">No orders found</p>
                <p className="font-body text-sm text-bark/25 mt-1">Try a different number or check your spelling.</p>
              </div>
            )}

            {orders.map((order, i) => {
              const statusMap = {
                awaiting_payment: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Awaiting Payment' },
                confirmed:        { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Confirmed' },
                processing:       { bg: 'bg-purple-100',text: 'text-purple-700',label: 'Processing' },
                dispatched:       { bg: 'bg-indigo-100',text: 'text-indigo-700',label: 'Dispatched' },
                delivered:        { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
                cancelled:        { bg: 'bg-red-100',   text: 'text-red-700',   label: 'Cancelled' },
              }
              const sty = statusMap[order.status] || { bg: 'bg-saffron/10', text: 'text-saffron', label: order.status || 'Confirmed' }
              return (
              <div key={order.orderNumber || i} className="bg-white border border-bark/8 rounded-2xl p-5 mb-4">
                <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <p className="font-body font-500 text-sm text-saffron">{order.orderNumber}</p>
                    <p className="font-body text-xs text-bark/30 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-body font-500 text-[10px] uppercase tracking-wider ${sty.bg} ${sty.text}`}>
                      {sty.label}
                    </span>
                    <button onClick={() => setInvoiceOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-bark/15 font-body text-xs text-bark/50 hover:border-saffron hover:text-saffron transition-colors">
                      Invoice
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {order.items.slice(0, 3).map((item, j) => (
                    <img key={j} src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-bark/8" />
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-rose/30 flex items-center justify-center font-body text-xs text-bark/50">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                {order.tracking && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3 flex items-start gap-2">
                    <Truck size={14} className="text-indigo-700 mt-0.5 shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-indigo-700">
                        <strong>{order.tracking.carrier}</strong> · <span className="font-mono">{order.tracking.trackingNumber}</span>
                      </p>
                      {order.tracking.trackingUrl && (
                        <a href={order.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-body text-[11px] text-indigo-600 hover:underline">
                          Track on {order.tracking.carrier} →
                        </a>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-bark/8">
                  <p className="font-body text-xs text-bark/40">{order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.customer.city}</p>
                  <p className="font-display text-base text-bark">PKR {order.total.toLocaleString()}</p>
                </div>
              </div>
            )})}

            {!searched && (
              <div className="text-center py-12 reveal">
                <ClipboardList size={40} className="text-bark/10 mx-auto mb-3" />
                <p className="font-body text-sm text-bark/30">Enter your phone number to view your order history.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'wishlist' && (
          <div>
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-16 reveal">
                <Heart size={40} className="text-bark/10 mx-auto mb-3" />
                <p className="font-display text-xl text-bark/30">Your wishlist is empty</p>
                <p className="font-body text-sm text-bark/25 mt-1 mb-6">Tap the heart icon on any product to save it here.</p>
                <button onClick={() => navigate('shop')} className="btn-shimmer text-white font-body text-sm px-6 py-2.5 rounded-full inline-flex items-center gap-2">
                  Browse Products <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {wishlistProducts.map((p, i) => (
                  <div key={p.id} className={`reveal delay-${(i % 3) + 1}`}>
                    <ProductCard p={p} onAdd={onAdd} wishlist={wishlist} onWish={onWish}
                      onView={() => navigate('product', { product: p.id })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {invoiceOrder && <Invoice order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────── */
function Navbar({ cartCount, wishCount, onCart, onSearch, navigate, currentPage }) {
  const scrolled = useNavScroll()
  const [open, setOpen] = useState(false)
  const links = ['Shop', 'Collections', 'Ingredients', 'About Us', 'Contact']
  const linkRoute = n => n === 'About Us' ? 'about' : n.toLowerCase()
  // Always solid on non-home pages so text stays readable over dark hero images
  const solid = scrolled || currentPage !== 'home'
  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${solid ? 'bg-cream/95 backdrop-blur-md shadow-[0_1px_0_rgba(44,24,16,0.08)]' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button className="lg:hidden text-bark" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <nav className="hidden lg:flex items-center gap-7">
              {links.slice(0, 2).map(n => (
                <button key={n} onClick={() => navigate(linkRoute(n))}
                  className={`font-body text-sm tracking-wide transition-colors ${currentPage === linkRoute(n) ? 'text-saffron' : 'text-bark/60 hover:text-saffron'}`}>{n}</button>
              ))}
            </nav>
          </div>
          <button onClick={() => navigate('home')} className="font-display text-2xl font-400 text-bark tracking-[0.12em] absolute left-1/2 -translate-x-1/2">
            SAFFRON <span className="text-saffron">&</span> CO
          </button>
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-7">
              {links.slice(2).map(n => (
                <button key={n} onClick={() => navigate(linkRoute(n))}
                  className={`font-body text-sm tracking-wide transition-colors ${currentPage === linkRoute(n) ? 'text-saffron' : 'text-bark/60 hover:text-saffron'}`}>{n}</button>
              ))}
            </nav>
            <button onClick={onSearch} className="text-bark/50 hover:text-saffron transition-colors"><Search size={17} /></button>
            <button onClick={() => navigate('account')} className="relative text-bark/50 hover:text-saffron transition-colors">
              <UserCircle2 size={17} />
              {wishCount > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose text-bark text-[9px] rounded-full flex items-center justify-center font-body font-500">{wishCount}</span>}
            </button>
            <button onClick={onCart} className="relative text-bark/50 hover:text-saffron transition-colors">
              <ShoppingBag size={17} />
              {cartCount > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-saffron text-white text-[9px] rounded-full flex items-center justify-center font-body font-500">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — outside header to avoid backdrop-filter stacking context */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ backgroundColor: '#FAF6F1' }}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-bark/8">
            <button onClick={() => { navigate('home'); setOpen(false) }}
              className="font-display text-xl font-400 text-bark tracking-[0.12em]">
              SAFFRON <span className="text-saffron">&</span> CO
            </button>
            <button onClick={() => setOpen(false)} className="text-bark/50 hover:text-bark transition-colors">
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-col px-6 py-4">
            {links.map(n => (
              <button key={n} onClick={() => { navigate(linkRoute(n)); setOpen(false) }}
                className={`text-left py-4 border-b border-bark/8 font-display text-3xl font-400 transition-colors ${currentPage === linkRoute(n) ? 'text-saffron' : 'text-bark hover:text-saffron'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => { navigate('account'); setOpen(false) }}
              className="text-left py-4 border-b border-bark/8 font-display text-3xl font-400 text-bark hover:text-saffron transition-colors">
              Account
            </button>
          </div>
          <div className="px-6 pb-8 mt-auto">
            <button onClick={() => { navigate('shop'); setOpen(false) }}
              className="w-full btn-shimmer text-white font-body py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
              Shop Now <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────
   CART DRAWER
───────────────────────────────────────────────────── */
function CartDrawer({ items, onClose, onCheckout, onRemove }) {
  const total = items.reduce((s, i) => s + i.price * (i.qty || 1), 0)
  const delivery = total > 4000 ? 0 : 200
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-bark/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-cream h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-bark/10">
          <h2 className="font-display text-2xl text-bark">Your Bag ({items.length})</h2>
          <button onClick={onClose}><X size={20} className="text-bark/40 hover:text-bark" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <ShoppingBag size={36} className="text-bark/10" />
              <p className="font-body text-sm text-bark/30">Your bag is empty</p>
            </div>
          ) : items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center bg-rose/30 rounded-xl p-3">
              <img src={item.img} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-display text-base text-bark truncate">{item.name}</p>
                <p className="font-body text-xs text-bark/40">{item.cat}</p>
                <p className="font-body text-sm text-saffron font-500">PKR {item.price.toLocaleString()}</p>
              </div>
              <button onClick={() => onRemove(i)} className="text-bark/20 hover:text-bark transition-colors"><X size={15} /></button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="p-5 border-t border-bark/10 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between font-body text-sm text-bark/40"><span>Subtotal</span><span>PKR {total.toLocaleString()}</span></div>
              <div className="flex justify-between font-body text-sm text-bark/40">
                <span className="flex items-center gap-1"><Truck size={11} /> Delivery</span>
                <span className={delivery === 0 ? 'text-saffron' : ''}>{delivery === 0 ? 'FREE' : 'PKR ' + delivery}</span>
              </div>
              <div className="flex justify-between font-display text-lg text-bark border-t border-bark/10 pt-2">
                <span>Total</span><span className="text-saffron">PKR {(total + delivery).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 py-2 border-y border-bark/8">
              <span className="font-body text-xs text-bark/40 flex items-center gap-1.5"><Package size={12} className="text-emerald-600" /> Cash on Delivery</span>
              <span className="text-bark/15 text-xs">·</span>
              <EasyPaisaLogo size="sm" />
            </div>
            <button onClick={onCheckout} className="w-full btn-shimmer text-white font-body py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
              Checkout <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────── */
function Footer({ navigate }) {
  return (
    <footer className="bg-bark text-cream pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-cream/10">
          <div>
            <button onClick={() => navigate('home')} className="font-display text-2xl font-400 mb-4 block">
              SAFFRON <span className="text-saffron-light">&</span> CO
            </button>
            <p className="font-body text-sm text-cream/40 leading-relaxed mb-4">Luxury beauty rooted in nature. Every product crafted with intention and botanical wisdom.</p>
            <div className="space-y-1.5 mb-6">
              <p className="font-body text-xs text-cream/35 flex items-start gap-2"><MapPin size={12} className="mt-0.5 shrink-0 text-saffron-light" />Office 3A, Paradise Apartment, Gujju Matta, Ferozpur Road, Lahore</p>
              <p className="font-body text-xs text-cream/35 flex items-center gap-2"><Phone size={12} className="shrink-0 text-saffron-light" />0344-4183049</p>
              <p className="font-body text-xs text-cream/35 flex items-center gap-2"><Mail size={12} className="shrink-0 text-saffron-light" />info@saffronco.pk</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/10 border border-cream/15">
                <Package size={13} className="text-emerald-400" />
                <span className="font-body text-xs text-cream/70">Cash on Delivery</span>
              </div>
              <EasyPaisaLogo size="sm" />
            </div>
          </div>
          {[
            { title: 'Shop', links: [['shop', 'All Products', {}], ['collections', 'Collections', {}], ['shop', 'New Arrivals', {filter: 'New Arrivals'}], ['shop', 'Sale', {filter: 'Sale'}]] },
            { title: 'Explore', links: [['ingredients', 'Ingredients', {}], ['about', 'Our Story', {}], ['about', 'Blog', {}], ['contact', 'Careers', {}]] },
            { title: 'Help', links: [['account', 'Track Order', {}], ['contact', 'Returns & Refunds', {}], ['contact', 'FAQs', {}], ['contact', 'Contact Us', {}]] },
          ].map(col => (
            <div key={col.title}>
              <p className="font-body text-xs text-cream/30 uppercase tracking-widest mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(([pg, lbl, params]) => (
                  <li key={lbl}><button onClick={() => navigate(pg, params)} className="font-body text-sm text-cream/50 hover:text-saffron-light transition-colors text-left">{lbl}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="font-body text-xs text-cream/20">© 2026 Saffron & Co. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('privacy')} className="font-body text-xs text-cream/35 hover:text-saffron-light transition-colors">Privacy Policy</button>
              <span className="text-cream/15">·</span>
              <button onClick={() => navigate('terms')} className="font-body text-xs text-cream/35 hover:text-saffron-light transition-colors">Terms of Service</button>
            </div>
            <p className="font-body text-xs text-cream/20">Secure checkout · EasyPaisa & Cash on Delivery</p>
          </div>
          <div className="text-center">
            <p className="font-body text-xs text-cream/30">Powered by{' '}
              <a href="https://brilliontech.vercel.app" target="_blank" rel="noopener noreferrer" className="text-saffron-light hover:underline underline-offset-2">BrillionTech</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────
   NEWSLETTER
───────────────────────────────────────────────────── */
function NewsletterSection() {
  const [email, setEmail] = useState('')
  const handleSubscribe = () => {
    if (!email || !email.includes('@')) {
      toast('Please enter a valid email address.', 'error')
      return
    }
    toast('Thank you for subscribing! Welcome to the Inner Circle.', 'success')
    setEmail('')
  }
  return (
    <section className="py-20 max-w-xl mx-auto px-6 text-center reveal">
      <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-3">Members Only</p>
      <h2 className="font-display text-4xl lg:text-5xl text-bark font-400 mb-4">Join the Inner Circle</h2>
      <p className="font-body text-bark/50 mb-8 leading-relaxed">Get early access to new launches, exclusive offers, and beauty rituals from our experts.</p>
      <div className="flex gap-2 bg-white rounded-full p-1.5 shadow-sm border border-bark/10">
        <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
          className="flex-1 px-4 py-2 font-body text-sm text-bark bg-transparent border-none outline-none" />
        <button onClick={handleSubscribe} className="btn-shimmer text-white font-body text-sm px-6 py-2 rounded-full whitespace-nowrap">Subscribe</button>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────
   PAGES
───────────────────────────────────────────────────── */
function HomePage({ allProducts, categoriesData, onAdd, navigate, wishlist, onWish }) {
  useReveal()
  const bestsellers = allProducts.filter(p => p.badge === 'Bestseller').slice(0, 8)

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-cream">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&auto=format&fit=crop" alt="hero" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/80 to-cream/20" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center pt-20">
          <div>
            <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-4 reveal">New Collection 2026</p>
            <h1 className="font-display text-6xl lg:text-8xl font-300 text-bark leading-[1.02] reveal delay-1">
              Glow<br /><em className="text-saffron not-italic">Rooted</em><br />in Nature
            </h1>
            <div className="w-12 h-px bg-saffron mt-6 mb-6 reveal delay-2" />
            <p className="font-body text-bark/55 leading-relaxed max-w-sm reveal delay-2">
              Luxury skincare, makeup, and fragrance crafted from rare botanicals — saffron, rose, jasmine — across 12 curated categories.
            </p>
            <div className="flex items-center gap-4 mt-8 reveal delay-3">
              <button onClick={() => navigate('shop')} className="btn-shimmer text-white font-body text-sm px-7 py-3 rounded-full flex items-center gap-2">
                Explore Collection <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate('about')} className="font-body text-sm text-bark/55 hover:text-saffron transition-colors flex items-center gap-2">
                Our Story <ArrowRight size={13} />
              </button>
            </div>
            <div className="flex items-center gap-8 mt-10 pt-10 border-t border-bark/8 reveal delay-3">
              {[['180+', 'Products'], ['12', 'Categories'], ['30-Day', 'Returns']].map(([n, l]) => (
                <div key={l}><p className="font-display text-2xl text-bark">{n}</p><p className="font-body text-xs text-bark/40 mt-0.5">{l}</p></div>
              ))}
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-3xl overflow-hidden h-64"><img src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&auto=format&fit=crop" alt="" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" /></div>
              <div className="rounded-3xl overflow-hidden h-40"><img src="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&auto=format&fit=crop" alt="" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" /></div>
            </div>
            <div className="space-y-4 mt-8">
              <div className="rounded-3xl overflow-hidden h-40"><img src="https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&auto=format&fit=crop" alt="" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" /></div>
              <div className="rounded-3xl overflow-hidden h-64"><img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&auto=format&fit=crop" alt="" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-bark/8 py-4 bg-rose/30">
        <div className="marquee-track">{['Skincare', 'Makeup', 'Fragrance', 'Hair Care', 'Body Care', 'Lip Care', 'Eye Care', 'Men\'s Grooming', 'Bath & Spa', 'Wellness', 'Tools', 'Gift Sets', 'Skincare', 'Makeup', 'Fragrance', 'Hair Care'].map((t, i) => (
          <span key={i} className="font-display text-base italic text-bark/50 mx-8 flex items-center gap-8">{t} <span className="text-saffron text-xl not-italic">·</span></span>
        ))}</div>
      </div>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <SectionHeader tag="Explore" title="Shop by Category" center />
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categoriesData.map((c, i) => (
            <button key={c.name} onClick={() => navigate('category', { category: c.name })}
              className={`group relative rounded-3xl overflow-hidden aspect-[4/5] reveal delay-${(i % 4) + 1}`}>
              <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-bark/70 via-bark/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                <h3 className="font-display text-2xl text-cream">{c.name}</h3>
                <p className="font-body text-xs text-cream/60 mt-1">{c.sub}</p>
                <div className="flex items-center gap-2 mt-2 text-saffron-light font-body text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-rose/20 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <SectionHeader tag="Handpicked" title="Bestsellers" />
            <button onClick={() => navigate('shop')} className="hidden md:flex items-center gap-2 font-body text-sm text-bark/50 hover:text-saffron transition-colors reveal">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.slice(0, 4).map((p, i) => (
              <div key={p.id} className={`reveal delay-${i + 1}`}>
                <ProductCard p={p} onAdd={onAdd} wishlist={wishlist} onWish={onWish}
                  onView={() => navigate('product', { product: p.id })} />
              </div>
            ))}
          </div>
          <div className="text-center mt-10 reveal">
            <button onClick={() => navigate('shop')} className="btn-shimmer text-white font-body text-sm px-8 py-3.5 rounded-full inline-flex items-center gap-2">
              View All Products <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-y border-bark/8 py-10 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 reveal">
          {[{ icon: <Truck size={18} />, t: 'Free Delivery', s: 'On orders over PKR 4,000' }, { icon: <RefreshCw size={18} />, t: '30-Day Returns', s: 'No questions asked' }, { icon: <Shield size={18} />, t: '100% Authentic', s: 'Certified botanical ingredients' }].map(({ icon, t, s }) => (
            <div key={t} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-saffron/10 rounded-xl flex items-center justify-center text-saffron">{icon}</div>
              <div><p className="font-body font-500 text-sm text-bark">{t}</p><p className="font-body text-xs text-bark/40 mt-0.5">{s}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <section className="bg-bark py-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader tag="Reviews" title="What She Said" center />
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.slice(0, 3).map((t, i) => (
              <div key={t.name} className={`bg-bark-light rounded-3xl p-7 reveal delay-${i + 1}`}>
                <Stars n={t.rating} />
                <p className="font-display text-lg italic text-cream/75 mt-4 mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-cream/10">
                  <div className="w-10 h-10 rounded-full bg-saffron flex items-center justify-center font-display text-lg text-white">{t.name[0]}</div>
                  <div><p className="font-body text-sm font-500 text-cream">{t.name}</p><p className="font-body text-xs text-cream/35">{t.city}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSection />
    </>
  )
}

function ShopPage({ allProducts, categoriesData, onAdd, wishlist, onWish, navigate, initialFilter = 'All' }) {
  useReveal()
  const [filter, setFilter] = useState(initialFilter)
  const filters = ['All', 'New Arrivals', ...categoriesData.map(c => c.name), 'Sale']
  const filtered = filter === 'All' ? allProducts
    : filter === 'New Arrivals' ? allProducts.filter(p => p.badge === 'New')
    : filter === 'Sale' ? allProducts.filter(p => p.originalPrice)
    : allProducts.filter(p => p.cat === filter)

  return (
    <div className="pt-24 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader tag="Shop All" title={`All Products (${allProducts.length})`} />
        <div className="flex flex-wrap gap-2 mb-8 reveal">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 font-body text-sm rounded-full border transition-all ${filter === f ? 'bg-saffron text-white border-saffron' : 'border-bark/15 text-bark/55 hover:border-saffron hover:text-saffron'}`}>
              {f}
            </button>
          ))}
        </div>
        <p className="font-body text-xs text-bark/30 mb-8">{filtered.length} products</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map((p) => (
            <div key={p.id}>
              <ProductCard p={p} onAdd={onAdd} wishlist={wishlist} onWish={onWish}
                onView={() => navigate('product', { product: p.id })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CollectionsPage({ categoriesData, navigate }) {
  useReveal()
  return (
    <div className="pt-24 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader tag="Curated" title="All Collections" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriesData.map((c, i) => (
            <button key={c.name} onClick={() => navigate('category', { category: c.name })}
              className={`group relative rounded-3xl overflow-hidden text-left transition-all reveal delay-${(i % 3) + 1} hover:ring-2 hover:ring-saffron`}>
              <div className="aspect-[4/5] overflow-hidden">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-bark/75 via-bark/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-3xl text-cream">{c.name}</h3>
                <p className="font-body text-sm text-cream/60 mt-1 mb-3">{c.sub}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.items.slice(0, 4).map(item => (
                    <span key={item} className="font-body text-[10px] text-cream/50 border border-cream/20 px-2 py-0.5 rounded-full">{item}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 text-saffron-light font-body text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Browse {c.count} products <ArrowRight size={14} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function IngredientsPage() {
  useReveal()
  return (
    <div className="pt-24 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-3 reveal">Transparency</p>
          <h1 className="font-display text-5xl lg:text-6xl text-bark font-300 reveal delay-1">What Goes<br />On Your Skin</h1>
          <div className="w-12 h-px bg-saffron mx-auto mt-6 mb-6 reveal delay-1" />
          <p className="font-body text-bark/50 leading-relaxed reveal delay-2">
            We believe you deserve to know exactly what's in every formula. Each ingredient is chosen for a specific purpose — nothing is accidental, nothing is hidden.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {INGREDIENTS_DATA.map((ing, i) => (
            <div key={ing.name} className={`bg-white border border-bark/8 rounded-3xl p-7 reveal delay-${(i % 3) + 1}`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: ing.color + '20', color: ing.color }}>
                {ing.icon}
              </div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display text-2xl text-bark">{ing.name}</h3>
                <span className="font-body text-[10px] text-bark/35 border border-bark/10 px-2.5 py-1 rounded-full mt-1">{ing.benefit}</span>
              </div>
              <p className="font-body text-xs text-saffron uppercase tracking-wide mb-3">Origin: {ing.origin}</p>
              <p className="font-body text-sm text-bark/55 leading-relaxed">{ing.desc}</p>
            </div>
          ))}
        </div>
        <div className="bg-bark rounded-3xl p-12 text-center reveal">
          <p className="font-body text-xs text-saffron-light uppercase tracking-[0.3em] mb-3">Our Promise</p>
          <h2 className="font-display text-4xl text-cream font-300 mb-4">No Harmful Ingredients. Ever.</h2>
          <p className="font-body text-cream/40 max-w-xl mx-auto leading-relaxed mb-8">Every Saffron & Co formula is free from parabens, sulphates, synthetic fragrance, mineral oil, and over 1,400 flagged ingredients.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Paraben-Free', 'Sulphate-Free', 'No Synthetic Fragrance', 'Cruelty-Free', 'pH Balanced', 'Dermatologist Tested'].map(b => (
              <span key={b} className="font-body text-xs text-cream/60 border border-cream/20 px-4 py-2 rounded-full flex items-center gap-2">
                <Check size={11} className="text-saffron-light" />{b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AboutPage({ navigate }) {
  useReveal()
  const timeline = [
    { year: '2016', e: 'Founded in Lahore with a single rose serum and a commitment to botanical luxury.' },
    { year: '2018', e: 'Expanded to Karachi & Islamabad. First 5,000 customers milestone.' },
    { year: '2020', e: 'Launched Saffron Collection — our hero range using Kashmiri saffron.' },
    { year: '2022', e: '12,000 customers. Featured in Vogue Pakistan and Dawn Images.' },
    { year: '2024', e: 'Full 12-category range with 180+ products. Shipping across Pakistan.' },
  ]
  return (
    <div className="pt-24 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-3 reveal">Our Story</p>
          <h1 className="font-display text-5xl lg:text-7xl text-bark font-300 reveal delay-1">
            Beauty that<br />honours <em>nature</em><br />&amp; you
          </h1>
        </div>
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div className="reveal">
            <div className="relative rounded-3xl overflow-hidden aspect-square">
              <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop" alt="About" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="reveal delay-2">
            <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-4">The Philosophy</p>
            <h2 className="font-display text-3xl lg:text-4xl text-bark font-300 mb-6">Luxury and nature need not be opposites</h2>
            <div className="space-y-4 font-body text-sm text-bark/55 leading-relaxed">
              <p>Saffron & Co was born from a belief that the finest skincare doesn't require a laboratory full of synthetics. We started with saffron — the world's most precious spice — and asked: what happens when we combine this with the best botanical science has to offer?</p>
              <p>Eight years later, every formula we create still starts with that question. Rare saffron from Kashmir, rose from Taif, jasmine from Multan — sourced directly from farmers who share our values.</p>
              <p>We never compromise on what goes on your skin. No parabens, no sulphates, no synthetic fragrance. Just honest, effective beauty rooted in botanical wisdom.</p>
            </div>
          </div>
        </div>
        <div className="mb-20">
          <SectionHeader tag="Our Values" title="What We Believe" center />
          <div className="grid md:grid-cols-4 gap-5">
            {[{ icon: <Leaf size={22} />, t: 'Botanical First', s: 'Every ingredient begins with a plant.' }, { icon: <Shield size={22} />, t: 'Nothing Hidden', s: 'Full ingredient transparency, always.' }, { icon: <Sparkles size={22} />, t: 'Efficacy Proven', s: 'Formulas tested in independent labs.' }, { icon: <Heart size={22} />, t: 'Cruelty Free', s: 'No animal testing. Ever.' }].map(({ icon, t, s }, i) => (
              <div key={t} className={`bg-white border border-bark/8 rounded-3xl p-6 text-center reveal delay-${i + 1}`}>
                <div className="w-12 h-12 bg-saffron/10 rounded-2xl flex items-center justify-center text-saffron mx-auto mb-4">{icon}</div>
                <h3 className="font-display text-xl text-bark mb-2">{t}</h3>
                <p className="font-body text-xs text-bark/45 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-20">
          <SectionHeader tag="Since 2016" title="Our Journey" center />
          <div className="max-w-2xl mx-auto">
            {timeline.map((t, i) => (
              <div key={t.year} className={`flex gap-6 reveal delay-${(i % 4) + 1}`}>
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-10 h-10 bg-saffron text-white rounded-full flex items-center justify-center font-body font-500 text-xs">{t.year.slice(2)}</div>
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-bark/10 my-2" />}
                </div>
                <div className="pb-8">
                  <p className="font-body font-500 text-sm text-saffron uppercase tracking-wide">{t.year}</p>
                  <p className="font-body text-sm text-bark/55 leading-relaxed mt-1">{t.e}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center bg-rose/30 border border-bark/8 rounded-3xl p-12 reveal">
          <h2 className="font-display text-4xl text-bark font-300 mb-4">Ready to Begin Your Ritual?</h2>
          <p className="font-body text-bark/50 mb-8 max-w-md mx-auto leading-relaxed text-sm">Explore 180+ products across 12 categories — crafted for your most radiant self.</p>
          <button onClick={() => navigate('shop')} className="btn-shimmer text-white font-body text-sm px-8 py-3.5 rounded-full inline-flex items-center gap-2">
            Shop All Products <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   CONTACT PAGE
───────────────────────────────────────────────────── */
function ContactPage() {
  useReveal()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    toast("Message sent! We'll get back to you within 24 hours.", 'success')
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="pt-24 pb-20 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-3 reveal">Get in Touch</p>
          <h1 className="font-display text-5xl lg:text-6xl text-bark font-300 reveal delay-1">We'd Love to<br />Hear From You</h1>
          <div className="w-12 h-px bg-saffron mx-auto mt-6 mb-6 reveal delay-1" />
          <p className="font-body text-bark/50 leading-relaxed reveal delay-2">Whether you have a question about a product, need help with an order, or just want to say hello — our team is here for you.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
          <div className="reveal">
            <h2 className="font-display text-2xl text-bark mb-8">Our Details</h2>
            <div className="space-y-6">
              {[
                { icon: <MapPin size={18} />, title: 'Address', lines: ['Office 3A, Paradise Apartment', 'Gujju Matta, Ferozpur Road', 'Lahore, Pakistan'] },
                { icon: <Phone size={18} />, title: 'Phone', lines: ['0344-4183049', 'Mon – Sat, 9am – 6pm PKT'] },
                { icon: <Mail size={18} />, title: 'Email', lines: ['info@saffronco.pk', 'support@saffronco.pk'] },
              ].map(({ icon, title, lines }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-11 h-11 bg-saffron/10 rounded-2xl flex items-center justify-center text-saffron shrink-0">{icon}</div>
                  <div>
                    <p className="font-body font-500 text-sm text-bark mb-1">{title}</p>
                    {lines.map(l => <p key={l} className="font-body text-sm text-bark/50">{l}</p>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 bg-rose/30 rounded-3xl border border-bark/8">
              <p className="font-body font-500 text-sm text-bark mb-3">Business Hours</p>
              <div className="space-y-1.5">
                {[['Monday – Friday', '9:00 AM – 7:00 PM'], ['Saturday', '10:00 AM – 5:00 PM'], ['Sunday', 'Closed']].map(([d, t]) => (
                  <div key={d} className="flex justify-between font-body text-xs text-bark/50">
                    <span>{d}</span><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="reveal delay-2">
            <h2 className="font-display text-2xl text-bark mb-8">Send a Message</h2>
            {sent ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-saffron/10 rounded-full flex items-center justify-center text-saffron mx-auto mb-4"><Check size={28} /></div>
                <p className="font-display text-2xl text-bark mb-2">Message Sent!</p>
                <p className="font-body text-sm text-bark/50 mb-6">Thank you for reaching out. We'll respond within 24 hours.</p>
                <button onClick={() => setSent(false)} className="font-body text-sm text-saffron hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: 'name', label: 'Your Name', type: 'text', ph: 'Sara Ahmed' },
                  { key: 'email', label: 'Email Address', type: 'email', ph: 'sara@email.com' },
                  { key: 'subject', label: 'Subject (optional)', type: 'text', ph: 'Order enquiry, product question...' },
                ].map(({ key, label, type, ph }) => (
                  <div key={key}>
                    <label className="font-body text-xs text-bark/40 uppercase tracking-widest block mb-1.5">{label}</label>
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => set(key, e.target.value)}
                      className="w-full bg-white border border-bark/12 focus:border-saffron/50 rounded-xl px-4 py-3 font-body text-sm text-bark placeholder:text-bark/20 outline-none transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="font-body text-xs text-bark/40 uppercase tracking-widest block mb-1.5">Message</label>
                  <textarea rows={5} placeholder="How can we help you?" value={form.message} onChange={e => set('message', e.target.value)}
                    className="w-full bg-white border border-bark/12 focus:border-saffron/50 rounded-xl px-4 py-3 font-body text-sm text-bark placeholder:text-bark/20 outline-none transition-colors resize-none" />
                </div>
                <button type="submit" className="w-full btn-shimmer text-white font-body py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
                  Send Message <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   PRIVACY POLICY PAGE
───────────────────────────────────────────────────── */
function PrivacyPage() {
  useReveal()
  const sections = [
    { title: 'Information We Collect', content: 'We collect information you provide directly, such as your name, email address, phone number, and delivery address when you place an order or contact us. We also automatically collect certain technical information when you visit our website, including your IP address, browser type, and browsing patterns.' },
    { title: 'How We Use Your Information', content: 'Your information is used to process and fulfill your orders, communicate with you about your purchases, provide customer support, send you marketing communications (with your consent), improve our website and services, and comply with legal obligations.' },
    { title: 'Information Sharing', content: 'We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website, processing payments, and delivering orders. All such parties are bound by confidentiality agreements.' },
    { title: 'Cookies', content: 'We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyse website traffic. You can control cookie settings through your browser settings. Disabling cookies may affect some website functionality.' },
    { title: 'Data Security', content: 'We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure. We encourage you to use a secure password and protect your account credentials.' },
    { title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time. To exercise these rights, please contact us at privacy@saffronco.pk.' },
    { title: 'Changes to This Policy', content: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting a notice on our website. Your continued use of our services after changes constitutes acceptance of the updated policy.' },
    { title: 'Contact Us', content: 'If you have any questions about this Privacy Policy, please contact us at privacy@saffronco.pk or write to us at Office 3A, Paradise Apartment, Gujju Matta, Ferozpur Road, Lahore.' },
  ]
  return (
    <div className="pt-24 pb-20 bg-cream">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 reveal">
          <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-3">Legal</p>
          <h1 className="font-display text-5xl text-bark font-300 mb-4">Privacy Policy</h1>
          <p className="font-body text-sm text-bark/40">Last updated: January 2024</p>
          <div className="w-12 h-px bg-saffron mt-6" />
        </div>
        <p className="font-body text-bark/55 leading-relaxed mb-10 reveal">At Saffron & Co, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our website and services.</p>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={s.title} className={`reveal delay-${(i % 4) + 1}`}>
              <h2 className="font-display text-xl text-bark mb-3">{i + 1}. {s.title}</h2>
              <p className="font-body text-sm text-bark/55 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   TERMS OF SERVICE PAGE
───────────────────────────────────────────────────── */
function TermsPage() {
  useReveal()
  const sections = [
    { title: 'Acceptance of Terms', content: 'By accessing and using the Saffron & Co website and purchasing our products, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.' },
    { title: 'Products and Pricing', content: 'All prices are listed in Pakistani Rupees (PKR) and are inclusive of applicable taxes unless stated otherwise. We reserve the right to change prices at any time without prior notice. Product images are for illustrative purposes and actual products may vary slightly.' },
    { title: 'Orders and Payment', content: 'By placing an order, you confirm that you are authorised to use the payment method. We accept EasyPaisa transfers (to "Saffron & Company", 0344-4183049) and Cash on Delivery (COD). EasyPaisa orders are confirmed once we verify the transfer; COD orders are confirmed once the delivery arrangement is approved.' },
    { title: 'Shipping and Delivery', content: 'We deliver across Pakistan. Standard delivery takes 3–5 business days. Free delivery is offered on orders above PKR 4,000. Delivery times are estimates and may vary due to factors beyond our control. We are not liable for delays caused by courier services.' },
    { title: 'Returns and Refunds', content: 'We offer a 30-day return policy for unused, unopened products in their original packaging. To initiate a return, contact us at support@saffronco.pk. Refunds are processed within 7–10 business days. Shipping costs are non-refundable unless the return is due to our error.' },
    { title: 'Product Use', content: 'Our products are intended for external use only unless specifically stated. Always perform a patch test before full application. We are not liable for any adverse reactions caused by misuse or failure to follow product instructions. If you have sensitive skin or medical conditions, consult a dermatologist before use.' },
    { title: 'Intellectual Property', content: 'All content on this website, including images, text, logos, and product descriptions, is the property of Saffron & Co and is protected by copyright law. Unauthorised use, reproduction, or distribution is strictly prohibited.' },
    { title: 'Limitation of Liability', content: 'Saffron & Co shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the amount paid for the specific order in question.' },
    { title: 'Governing Law', content: 'These Terms of Service are governed by the laws of Pakistan. Any disputes shall be resolved in the courts of Lahore, Pakistan.' },
    { title: 'Contact', content: 'For any questions regarding these terms, please contact us at legal@saffronco.pk or write to us at Office 3A, Paradise Apartment, Gujju Matta, Ferozpur Road, Lahore.' },
  ]
  return (
    <div className="pt-24 pb-20 bg-cream">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-12 reveal">
          <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-3">Legal</p>
          <h1 className="font-display text-5xl text-bark font-300 mb-4">Terms of Service</h1>
          <p className="font-body text-sm text-bark/40">Last updated: January 2024</p>
          <div className="w-12 h-px bg-saffron mt-6" />
        </div>
        <p className="font-body text-bark/55 leading-relaxed mb-10 reveal">Welcome to Saffron & Co. These Terms of Service govern your use of our website and the purchase of our products. Please read these terms carefully before using our services.</p>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={s.title} className={`reveal delay-${(i % 4) + 1}`}>
              <h2 className="font-display text-xl text-bark mb-3">{i + 1}. {s.title}</h2>
              <p className="font-body text-sm text-bark/55 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   APP
───────────────────────────────────────────────────── */
function AdminApp() {
  return (
    <div className="admin-shell">
      <Routes>
        <Route path="/admin/login"                element={<AdminLogin/>}/>
        <Route path="/admin"                      element={<AdminGuard><AdminDashboard/></AdminGuard>}/>
        <Route path="/admin/orders"               element={<AdminGuard><AdminOrders/></AdminGuard>}/>
        <Route path="/admin/orders/:number"       element={<AdminGuard><AdminOrderDetail/></AdminGuard>}/>
        <Route path="/admin/products"             element={<AdminGuard><AdminProducts/></AdminGuard>}/>
        <Route path="/admin/reviews"              element={<AdminGuard><AdminReviews/></AdminGuard>}/>
        <Route path="/admin/stock"                element={<AdminGuard><AdminStock/></AdminGuard>}/>
        <Route path="/admin/customers"            element={<AdminGuard><AdminCustomers/></AdminGuard>}/>
      </Routes>
      <ToastContainer />
    </div>
  )
}

export default function App() {
  const location = useLocation()
  if (location.pathname.startsWith('/admin')) {
    return <AdminApp/>
  }
  return <Storefront/>
}

function Storefront() {
  const routerNav  = useRouterNavigate()
  const location   = useLocation()

  const [loading, setLoading]         = useState(true)
  const [cart, setCart]               = useState(() => loadCart())
  const [wishlist, setWishlist]       = useState(() => loadWishlist())
  const [cartOpen, setCartOpen]       = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)
  const [page, setPage]               = useState('home')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProduct, setSelectedProduct]   = useState(null)
  const [invoiceOrder, setInvoiceOrder]         = useState(null)
  const [baseProducts, setBaseProducts]         = useState(ALL_PRODUCTS)
  const [productOverrides, setProductOverrides] = useState({})
  const [categoriesData, setCategoriesData]     = useState(CATEGORIES_DATA)
  const [shopFilter, setShopFilter]             = useState('All')

  // Apply overrides on top of base products. Disabled products are filtered out entirely.
  const allProducts = useMemo(() => {
    return baseProducts
      .filter(p => !productOverrides[p.id]?.disabled)
      .map(p => {
        const o = productOverrides[p.id]
        if (!o) return p
        const out = { ...p }
        if (o.price != null) out.price = o.price
        if (o.stock != null) out.stock = o.stock
        if (o.badge !== undefined && o.badge !== null) out.badge = o.badge
        return out
      })
  }, [baseProducts, productOverrides])

  // Initialise page state from URL on first load
  useEffect(() => {
    const { page: p, category, product } = pathToState(location.pathname, CATEGORIES_DATA, ALL_PRODUCTS)
    setPage(p)
    if (category !== undefined) setSelectedCategory(category)
    if (product  !== undefined) setSelectedProduct(product)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state when user navigates with browser back/forward
  useEffect(() => {
    const { page: p, category, product } = pathToState(location.pathname, categoriesData, allProducts)
    setPage(p)
    if (category !== undefined) setSelectedCategory(category)
    if (product  !== undefined) setSelectedProduct(product)
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch from static API (shows in Network tab)
  useEffect(() => {
    fetchProducts().then(data => setBaseProducts(data)).catch(() => {})
    fetchCategories().then(data => setCategoriesData(data)).catch(() => {})
  }, [])

  // Poll product overrides every 60s (cheap, keeps disabled products hidden)
  useEffect(() => {
    let cancelled = false
    const fetchOverrides = () => {
      getProductOverrides()
        .then(o => { if (!cancelled) setProductOverrides(o || {}) })
        .catch(() => {})
    }
    fetchOverrides()
    const t = setInterval(fetchOverrides, 60_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  // Splash screen
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])

  // Persist cart & wishlist
  useEffect(() => { saveCart(cart) }, [cart])
  useEffect(() => { saveWishlist(wishlist) }, [wishlist])

  const navigate = (p, params = {}) => {
    setPage(p)
    if (params.category !== undefined) setSelectedCategory(params.category)
    if (params.product  !== undefined) setSelectedProduct(params.product)
    if (p === 'shop' && params.filter !== undefined) setShopFilter(params.filter)
    else if (p === 'shop' && params.filter === undefined) setShopFilter('All')
    const path = pageToPath(p, params.category ?? selectedCategory, params.product ?? selectedProduct)
    routerNav(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setCartOpen(false)
  }

  const addCart = (p) => {
    setCart(c => [...c, p])
    setCartOpen(true)
    toast(`${p.name} added to bag`, 'cart')
  }
  const removeCart = (i) => {
    const name = cart[i]?.name
    setCart(c => c.filter((_, idx) => idx !== i))
    if (name) toast(`${name} removed`, 'info')
  }
  const toggleWish = (id) => {
    const p = allProducts.find(x => x.id === id)
    const inWish = wishlist.includes(id)
    setWishlist(w => inWish ? w.filter(x => x !== id) : [...w, id])
    if (p) toast(inWish ? `${p.name} removed from wishlist` : `${p.name} saved to wishlist`, 'wish')
  }
  const onSuccess = (order) => {
    setCart([])
    clearCart()
    setInvoiceOrder(order)
    toast(`Order ${order.orderNumber} confirmed!`, 'success')
  }

  const currentCategory = categoriesData.find(c => c.name === selectedCategory)
  const currentProduct  = allProducts.find(p => p.id === selectedProduct)

  if (loading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-cream">
      <Navbar
        cartCount={cart.length}
        wishCount={wishlist.length}
        onCart={() => setCartOpen(true)}
        onSearch={() => setSearchOpen(true)}
        navigate={navigate}
        currentPage={page}
      />
      <main>
        {page === 'home'        && <HomePage allProducts={allProducts} categoriesData={categoriesData} onAdd={addCart} navigate={navigate} wishlist={wishlist} onWish={toggleWish} />}
        {page === 'shop'        && <ShopPage key={shopFilter} initialFilter={shopFilter} allProducts={allProducts} categoriesData={categoriesData} onAdd={addCart} wishlist={wishlist} onWish={toggleWish} navigate={navigate} />}
        {page === 'collections' && <CollectionsPage categoriesData={categoriesData} navigate={navigate} />}
        {page === 'ingredients' && <IngredientsPage />}
        {page === 'about'       && <AboutPage navigate={navigate} />}
        {page === 'account'     && <AccountPage allProducts={allProducts} wishlist={wishlist} onWish={toggleWish} onAdd={addCart} navigate={navigate} />}
        {page === 'contact'     && <ContactPage />}
        {page === 'privacy'     && <PrivacyPage />}
        {page === 'terms'       && <TermsPage />}
        {page === 'category' && currentCategory && (
          <CategoryDetailPage
            category={currentCategory}
            allProducts={allProducts}
            navigate={navigate}
            onAdd={addCart}
            wishlist={wishlist}
            onWish={toggleWish}
          />
        )}
        {page === 'product' && currentProduct && (
          <ProductDetailPage
            product={currentProduct}
            allProducts={allProducts}
            navigate={navigate}
            onAdd={addCart}
            wishlist={wishlist}
            onWish={toggleWish}
          />
        )}
      </main>
      <Footer navigate={navigate} />
      {cartOpen     && <CartDrawer items={cart} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }} onRemove={removeCart} />}
      {checkoutOpen && <CheckoutModal items={cart} onClose={() => setCheckoutOpen(false)} onSuccess={onSuccess} />}
      {searchOpen   && <SearchOverlay allProducts={allProducts} categoriesData={categoriesData} onClose={() => setSearchOpen(false)} onNavigate={navigate} />}
      {invoiceOrder && <Invoice order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}
      <ToastContainer />
      <CookieBanner />
    </div>
  )
}
