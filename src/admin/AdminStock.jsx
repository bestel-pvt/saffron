import { useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Search, Boxes, Minus, Plus, X } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { adminListStock, adminSetStock, fetchProducts } from '../api.js'
import { toast } from '../components/Toast.jsx'

export default function AdminStock() {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState({})  // { [pid]: value }

  async function load() {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([fetchProducts(), adminListStock()])
      setProducts(p); setStock(s); setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q)
    )
  }, [products, search])

  async function bump(pid, delta) {
    const current = stock[pid] ?? products.find(p => p.id === pid)?.stock ?? 0
    const next = Math.max(0, current + delta)
    try {
      const r = await adminSetStock(pid, next)
      setStock(s => ({ ...s, [pid]: r.count }))
      toast(`Stock updated: ${r.count}`, 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  async function setExact(pid) {
    const v = editing[pid]
    if (v === undefined) return
    try {
      const r = await adminSetStock(pid, v)
      setStock(s => ({ ...s, [pid]: r.count }))
      setEditing(e => { const c = {...e}; delete c[pid]; return c })
      toast('Stock updated', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <AdminLayout title="Stock" subtitle={`${products.length} products`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600"/>
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-bark/8 rounded-2xl p-3 mb-5 flex items-center gap-2">
        <Search size={14} className="text-bark/40 ml-2"/>
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent font-body text-sm text-bark placeholder:text-bark/30 outline-none"/>
        {search && <button onClick={() => setSearch('')}><X size={13} className="text-bark/30"/></button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-saffron animate-spin"/></div>
      ) : (
        <div className="bg-white border border-bark/8 rounded-2xl overflow-hidden">
          {filtered.map(p => {
            const current = stock[p.id] ?? p.stock ?? 0
            const isEditing = editing[p.id] !== undefined
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-bark/5 last:border-b-0">
                {p.img && <img src={p.img} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-cream"/>}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-500 text-sm text-bark truncate">{p.name}</p>
                  <p className="font-body text-[11px] text-bark/40">{p.id} · {p.cat}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => bump(p.id, -1)} className="w-7 h-7 rounded-lg bg-cream hover:bg-bark/10 text-bark flex items-center justify-center">
                    <Minus size={12}/>
                  </button>
                  {isEditing ? (
                    <input type="number" min="0" value={editing[p.id]}
                      onChange={e => setEditing(s => ({...s, [p.id]: e.target.value}))}
                      onBlur={() => setExact(p.id)}
                      onKeyDown={e => e.key === 'Enter' && setExact(p.id)}
                      autoFocus
                      className="w-14 text-center bg-cream border border-saffron/40 rounded font-body text-sm text-bark outline-none"/>
                  ) : (
                    <button onClick={() => setEditing(s => ({...s, [p.id]: current}))}
                      className="w-14 text-center font-body font-500 text-sm text-bark py-1 rounded hover:bg-cream">
                      {current}
                    </button>
                  )}
                  <button onClick={() => bump(p.id, +1)} className="w-7 h-7 rounded-lg bg-cream hover:bg-bark/10 text-bark flex items-center justify-center">
                    <Plus size={12}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
