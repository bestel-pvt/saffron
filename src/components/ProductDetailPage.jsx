import { useState, useEffect } from 'react'
import {
  Heart, ShoppingBag, Star, ArrowLeft, ChevronRight,
  Truck, RefreshCw, Shield, Check, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react'
import { getProductReviews, getProductReviewSummary, submitReview } from '../api.js'

const badgeColors = {
  Bestseller: 'bg-saffron-dark text-white',
  New: 'bg-bark text-cream',
  Sale: 'bg-rose text-bark',
  Luxury: 'bg-saffron-light text-bark',
}

function Stars({ n }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < n ? 'fill-saffron text-saffron' : 'text-bark/15'} />
      ))}
    </span>
  )
}

function RelatedCard({ p, onAdd, wishlist, onWish, onView }) {
  const [hov, setHov] = useState(false)
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null
  return (
    <div className="group relative" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div className="relative overflow-hidden rounded-2xl bg-rose/40 aspect-[3/4] cursor-pointer" onClick={onView}>
        <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        {p.badge && (
          <span className={`absolute top-3 left-3 text-[10px] font-body font-500 uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeColors[p.badge]}`}>{p.badge}</span>
        )}
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
      <div className="mt-3 px-1 space-y-0.5 cursor-pointer" onClick={onView}>
        <p className="font-display text-lg text-bark leading-tight hover:text-saffron transition-colors">{p.name}</p>
        <p className="font-body text-xs text-bark/40">{p.subcategory || p.cat}</p>
        {p.rating != null && <Stars n={Math.floor(p.rating)} />}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-body font-500 text-sm text-bark">PKR {p.price.toLocaleString()}</span>
          {p.originalPrice && <span className="font-body text-xs text-bark/35 line-through">PKR {p.originalPrice.toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}

function ProductRatingInline({ productId, fallbackRating, fallbackReviews }) {
  const [summary, setSummary] = useState(null)
  useEffect(() => {
    let cancelled = false
    getProductReviewSummary(productId)
      .then(s => { if (!cancelled) setSummary(s) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [productId])

  const count = summary?.count ?? 0
  const avg = summary?.average

  if (count === 0) {
    return (
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-0.5">
          {Array.from({length:5}).map((_,i) => <Star key={i} size={13} className="text-bark/15"/>)}
        </div>
        <span className="font-body text-sm text-bark/40">No reviews yet</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 mb-6">
      <Stars n={Math.round(avg)} />
      <span className="font-body text-sm text-bark/40">{avg} · {count} review{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

function ReviewsSection({ product }) {
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', rating: 5, title: '', comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        getProductReviews(product.id),
        getProductReviewSummary(product.id),
      ])
      setReviews(r)
      setSummary(s)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [product.id])

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true); setSubmitError(null); setSubmitMessage(null)
    try {
      const res = await submitReview({
        productId: product.id,
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
      })
      setSubmitMessage(res.message || 'Thanks! Your review will be visible after approval.')
      setForm({ name: '', phone: '', rating: 5, title: '', comment: '' })
      setShowForm(false)
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const count = summary?.count ?? 0
  const avg = summary?.average
  const dist = summary?.distribution || { 5:0, 4:0, 3:0, 2:0, 1:0 }

  return (
    <section className="mb-24">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-2">Customer Reviews</p>
          <h2 className="font-display text-4xl text-bark font-400">What People Are Saying</h2>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="font-body text-sm border border-saffron text-saffron px-5 py-2.5 rounded-full hover:bg-saffron hover:text-white transition-colors">
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {submitMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Check size={16} className="text-green-700 shrink-0"/>
          <p className="font-body text-sm text-green-800">{submitMessage}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="bg-white border border-bark/8 rounded-3xl p-6 mb-8 space-y-4">
          <p className="font-body text-xs text-bark/40 leading-relaxed">
            Please use the same phone number you used to place an order. Reviews are linked to verified purchases and visible after admin approval.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-[11px] text-bark/40 uppercase tracking-widest block mb-1.5">Your Name</label>
              <input type="text" required value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))}
                className="w-full bg-cream border border-bark/12 focus:border-saffron/50 rounded-xl px-4 py-2.5 font-body text-sm text-bark outline-none"/>
            </div>
            <div>
              <label className="font-body text-[11px] text-bark/40 uppercase tracking-widest block mb-1.5">Phone Number (purchase phone)</label>
              <input type="tel" required value={form.phone} onChange={e => setForm(f=>({...f, phone:e.target.value}))}
                placeholder="03XX XXXXXXX"
                className="w-full bg-cream border border-bark/12 focus:border-saffron/50 rounded-xl px-4 py-2.5 font-body text-sm text-bark outline-none"/>
            </div>
          </div>
          <div>
            <label className="font-body text-[11px] text-bark/40 uppercase tracking-widest block mb-1.5">Rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f=>({...f,rating:n}))}>
                  <Star size={24} className={n <= form.rating ? 'fill-saffron text-saffron' : 'text-bark/15'}/>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-body text-[11px] text-bark/40 uppercase tracking-widest block mb-1.5">Title (optional)</label>
            <input type="text" maxLength="100" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
              placeholder="Short summary of your experience"
              className="w-full bg-cream border border-bark/12 focus:border-saffron/50 rounded-xl px-4 py-2.5 font-body text-sm text-bark outline-none"/>
          </div>
          <div>
            <label className="font-body text-[11px] text-bark/40 uppercase tracking-widest block mb-1.5">Your Review</label>
            <textarea required minLength="10" maxLength="1000" rows="4" value={form.comment} onChange={e => setForm(f=>({...f,comment:e.target.value}))}
              placeholder="Tell other customers what you thought (min 10 characters)"
              className="w-full bg-cream border border-bark/12 focus:border-saffron/50 rounded-xl px-4 py-2.5 font-body text-sm text-bark outline-none resize-none"/>
          </div>
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-600"/>
              <p className="font-body text-xs text-red-700">{submitError}</p>
            </div>
          )}
          <button type="submit" disabled={submitting}
            className="btn-shimmer text-white font-body text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
            {submitting ? <><Loader2 size={14} className="animate-spin"/> Submitting...</> : 'Submit Review'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={18} className="text-saffron animate-spin"/></div>
      ) : count === 0 ? (
        <div className="bg-white border border-bark/8 rounded-3xl p-12 text-center">
          <Star size={28} className="text-bark/15 mx-auto mb-3"/>
          <p className="font-display text-xl text-bark/50 mb-2">No reviews yet</p>
          <p className="font-body text-sm text-bark/40">Be the first to share your experience with {product.name}.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="bg-rose/20 border border-bark/8 rounded-3xl p-6 mb-8 grid sm:grid-cols-2 gap-6">
            <div className="text-center sm:border-r sm:border-bark/10 sm:pr-6">
              <p className="font-display text-5xl text-bark mb-1">{avg}</p>
              <Stars n={Math.round(avg)} />
              <p className="font-body text-xs text-bark/40 mt-1">Based on {count} review{count !== 1 ? 's' : ''}</p>
            </div>
            <div className="space-y-1.5">
              {[5,4,3,2,1].map(r => {
                const n = dist[r] || 0
                const pct = count > 0 ? Math.round((n/count)*100) : 0
                return (
                  <div key={r} className="flex items-center gap-2">
                    <span className="font-body text-xs text-bark/40 w-3">{r}</span>
                    <Star size={11} className="fill-saffron text-saffron"/>
                    <div className="flex-1 h-1.5 bg-bark/10 rounded-full overflow-hidden">
                      <div className="h-full bg-saffron" style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="font-body text-xs text-bark/40 w-8 text-right">{n}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white border border-bark/8 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                  <div>
                    <p className="font-body font-500 text-sm text-bark">{r.customerName}</p>
                    <p className="font-body text-[11px] text-bark/35">
                      {new Date(r.createdAt).toLocaleDateString('en-PK',{day:'numeric',month:'long',year:'numeric'})}
                      <span className="ml-2 text-green-600">✓ Verified purchase</span>
                    </p>
                  </div>
                  <Stars n={r.rating}/>
                </div>
                {r.title && <p className="font-body font-500 text-base text-bark mt-1 mb-1">{r.title}</p>}
                <p className="font-body text-sm text-bark/60 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default function ProductDetailPage({ product, allProducts, navigate, onAdd, wishlist, onWish }) {
  const [added, setAdded] = useState(false)

  if (!product) return null

  const disc = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  const related = allProducts
    .filter(p => p.cat === product.cat && p.id !== product.id)
    .slice(0, 4)

  const handleAdd = () => {
    onAdd(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const categoryObj = { name: product.cat }

  return (
    <div className="bg-cream min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-body text-xs text-bark/35 mb-10">
          <button onClick={() => navigate('home')} className="hover:text-saffron transition-colors">Home</button>
          <ChevronRight size={12} />
          <button onClick={() => navigate('category', { category: product.cat })} className="hover:text-saffron transition-colors capitalize">
            {product.cat}
          </button>
          <ChevronRight size={12} />
          <span className="text-bark/55 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid lg:grid-cols-2 gap-16 mb-24">

          {/* ── Image ─────────────────────────────────── */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden bg-rose/40 aspect-[3/4] sticky top-24">
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className={`absolute top-5 left-5 text-[11px] font-body font-500 uppercase tracking-widest px-3 py-1.5 rounded-full ${badgeColors[product.badge]}`}>
                  {product.badge}
                </span>
              )}
              {disc && (
                <span className="absolute top-5 right-5 bg-white text-bark text-sm font-body font-500 px-3 py-1 rounded-full shadow-sm">
                  -{disc}%
                </span>
              )}
            </div>
          </div>

          {/* ── Info ──────────────────────────────────── */}
          <div className="flex flex-col">

            {/* Category tag */}
            <button
              onClick={() => navigate('category', { category: product.cat })}
              className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-3 text-left hover:underline w-fit"
            >
              {product.cat}
            </button>

            {/* Name */}
            <h1 className="font-display text-4xl lg:text-5xl text-bark font-400 leading-tight mb-4">
              {product.name}
            </h1>

            {/* Rating — live from /api/reviews/:id/summary */}
            <ProductRatingInline productId={product.id} fallbackRating={product.rating} fallbackReviews={product.reviews} />

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-3xl text-bark">PKR {product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="font-body text-base text-bark/35 line-through">PKR {product.originalPrice.toLocaleString()}</span>
              )}
              {disc && (
                <span className="font-body text-sm text-saffron font-500">Save {disc}%</span>
              )}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-bark/8 mb-6" />

            {/* Description */}
            <p className="font-body text-sm text-bark/55 leading-relaxed mb-6">
              {product.desc}
            </p>

            {/* Size */}
            {product.size && (
              <div className="mb-6">
                <p className="font-body text-xs text-bark/35 uppercase tracking-widest mb-2">Size</p>
                <span className="inline-block font-body text-sm text-bark px-5 py-2 border-2 border-saffron rounded-xl">
                  {product.size}
                </span>
              </div>
            )}

            {/* Key Ingredients */}
            {product.keyIngredients && product.keyIngredients.length > 0 && (
              <div className="mb-6">
                <p className="font-body text-xs text-bark/35 uppercase tracking-widest mb-3">Key Ingredients</p>
                <div className="flex flex-wrap gap-2">
                  {product.keyIngredients.map(ing => (
                    <span key={ing} className="font-body text-xs text-bark/55 border border-bark/15 px-3 py-1.5 rounded-full">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* How to Use */}
            {product.howToUse && (
              <div className="mb-8 bg-rose/30 rounded-2xl p-5">
                <p className="font-body text-xs text-saffron uppercase tracking-widest mb-2">How to Use</p>
                <p className="font-body text-sm text-bark/60 leading-relaxed">{product.howToUse}</p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAdd}
                className="flex-1 btn-shimmer text-white font-body py-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
              >
                {added ? (
                  <><Check size={16} /> Added to Bag</>
                ) : (
                  <><ShoppingBag size={16} /> Add to Bag</>
                )}
              </button>
              <button
                onClick={() => onWish && onWish(product.id)}
                className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center transition-all ${
                  wishlist?.includes(product.id)
                    ? 'border-saffron bg-saffron/5'
                    : 'border-bark/15 hover:border-saffron'
                }`}
              >
                <Heart
                  size={18}
                  className={wishlist?.includes(product.id) ? 'fill-saffron text-saffron' : 'text-bark/40'}
                />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-bark/8">
              {[
                { icon: <Truck size={15} />, text: 'Free delivery above PKR 4,000' },
                { icon: <RefreshCw size={15} />, text: '30-day hassle-free returns' },
                { icon: <Shield size={15} />, text: '100% authentic certified' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 bg-saffron/10 rounded-xl flex items-center justify-center text-saffron">
                    {icon}
                  </div>
                  <p className="font-body text-[10px] text-bark/40 leading-tight">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection product={product} />

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="font-body text-xs text-saffron uppercase tracking-[0.3em] mb-2">From {product.cat}</p>
                <h2 className="font-display text-4xl text-bark font-400">You May Also Like</h2>
              </div>
              <button
                onClick={() => navigate('category', { category: product.cat })}
                className="hidden md:flex items-center gap-2 font-body text-sm text-bark/50 hover:text-saffron transition-colors"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {related.map(p => (
                <RelatedCard
                  key={p.id}
                  p={p}
                  onAdd={onAdd}
                  wishlist={wishlist}
                  onWish={onWish}
                  onView={() => navigate('product', { product: p.id })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
