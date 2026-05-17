import { useState } from 'react'
import { ArrowLeft, ChevronRight, Heart, ShoppingBag, Star } from 'lucide-react'

const badgeColors = {
  Bestseller: 'bg-saffron-dark text-white',
  New: 'bg-bark text-cream',
  Sale: 'bg-rose text-bark',
  Luxury: 'bg-saffron-light text-bark',
}

function ProductCard({ p, onAdd, wishlist, onWish, onView }) {
  const [hov, setHov] = useState(false)
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : null

  return (
    <div className="group relative" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div
        className="relative overflow-hidden rounded-2xl bg-rose/40 aspect-[3/4] cursor-pointer"
        onClick={onView}
      >
        <img
          src={p.img}
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {p.badge && (
          <span className={`absolute top-3 left-3 text-[10px] font-body font-500 uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeColors[p.badge]}`}>
            {p.badge}
          </span>
        )}
        {disc && (
          <span className="absolute top-3 right-10 bg-white text-bark text-xs font-body font-500 px-2 py-0.5 rounded-full shadow-sm">
            -{disc}%
          </span>
        )}
        <div className={`absolute inset-0 bg-bark/0 transition-colors duration-300 ${hov ? 'bg-bark/8' : ''}`} />
        <button
          onClick={e => { e.stopPropagation(); onWish && onWish(p.id) }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm z-10"
        >
          <Heart size={13} className={wishlist?.includes(p.id) ? 'fill-saffron text-saffron' : 'text-bark/50'} />
        </button>
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${hov ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <button
            onClick={e => { e.stopPropagation(); onAdd(p) }}
            className="w-full btn-shimmer text-white font-body text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} /> Add to Bag
          </button>
        </div>
      </div>
      <div className="mt-3 px-1 space-y-0.5 cursor-pointer" onClick={onView}>
        <p className="font-display text-lg text-bark leading-tight hover:text-saffron transition-colors">{p.name}</p>
        <p className="font-body text-xs text-bark/40">{p.subcategory || p.cat}</p>
        {p.rating != null && (
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={10} className={i < Math.floor(p.rating) ? 'fill-saffron text-saffron' : 'text-bark/15'} />
            ))}
          </span>
        )}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-body font-500 text-sm text-bark">PKR {p.price.toLocaleString()}</span>
          {p.originalPrice && (
            <span className="font-body text-xs text-bark/35 line-through">PKR {p.originalPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CategoryDetailPage({ category, allProducts, navigate, onAdd, wishlist, onWish }) {
  const [subFilter, setSubFilter] = useState('All')

  const categoryProducts = allProducts.filter(p => p.cat === category.name)
  // Only show subcategory filter if at least some products have a subcategory field
  const hasSubcategories = categoryProducts.some(p => p.subcategory)
  const filtered = (subFilter === 'All' || !hasSubcategories)
    ? categoryProducts
    : categoryProducts.filter(p => p.subcategory === subFilter)

  return (
    <div className="bg-cream min-h-screen pt-16">
      {/* Hero Banner */}
      <div className="relative h-72 lg:h-96 overflow-hidden">
        <img src={category.img} alt={category.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-bark/75 via-bark/40 to-bark/10" />
        <div className="absolute inset-0 flex flex-col justify-end pb-10 px-6 lg:px-16">
          <button
            onClick={() => navigate('collections')}
            className="flex items-center gap-1.5 text-cream/50 hover:text-cream font-body text-xs uppercase tracking-widest mb-4 transition-colors w-fit"
          >
            <ArrowLeft size={12} /> Collections <ChevronRight size={10} /> {category.name}
          </button>
          <p className="font-body text-xs text-saffron-light uppercase tracking-[0.3em] mb-2">{category.sub}</p>
          <h1 className="font-display text-5xl lg:text-6xl text-cream font-300">{category.name}</h1>
          <p className="font-body text-sm text-cream/55 mt-3 max-w-lg leading-relaxed hidden lg:block">{category.desc}</p>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Subcategory Filters — only show if products have subcategory data */}
        {hasSubcategories && (
          <div className="flex flex-wrap gap-2 mb-6">
            {['All', ...category.items].map(sub => (
              <button
                key={sub}
                onClick={() => setSubFilter(sub)}
                className={`px-5 py-2 font-body text-sm rounded-full border transition-all ${
                  subFilter === sub
                    ? 'bg-saffron text-white border-saffron'
                    : 'border-bark/15 text-bark/55 hover:border-saffron hover:text-saffron'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        <p className="font-body text-xs text-bark/30 mb-10">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Product Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                p={p}
                onAdd={onAdd}
                wishlist={wishlist}
                onWish={onWish}
                onView={() => navigate('product', { product: p.id })}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border border-bark/8 rounded-3xl">
            <p className="font-display text-2xl text-bark/30">No products in this subcategory yet</p>
            <button onClick={() => setSubFilter('All')} className="mt-4 font-body text-sm text-saffron hover:underline">
              View all {category.name}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
