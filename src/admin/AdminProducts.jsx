import { useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, Search, ShoppingBag, Eye, EyeOff, RotateCcw, X } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import {
  adminListProductOverrides, adminSetProductOverride, adminClearProductOverride,
  fetchProducts, fetchCategories,
} from '../api.js'
import { toast } from '../components/Toast.jsx'

const fmtPKR = (n) => 'PKR ' + (Number(n) || 0).toLocaleString()

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [overrides, setOverrides] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('All')
  const [working, setWorking] = useState({})
  const [selected, setSelected] = useState(new Set())
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [p, c, o] = await Promise.all([fetchProducts(), fetchCategories(), adminListProductOverrides()])
      setProducts(p); setCategories(c); setOverrides(o); setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => ({
    all: products.length,
    active: products.filter(p => !overrides[p.id]?.disabled).length,
    disabled: products.filter(p => overrides[p.id]?.disabled).length,
    overridden: Object.keys(overrides).length,
  }), [products, overrides])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const o = overrides[p.id]
      if (filter === 'active' && o?.disabled) return false
      if (filter === 'disabled' && !o?.disabled) return false
      if (filter === 'overridden' && !o) return false
      if (catFilter !== 'All' && p.cat !== catFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !String(p.id).includes(q) && !p.cat.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [products, overrides, filter, catFilter, search])

  async function toggleDisable(pid, currently) {
    setWorking(w => ({...w, [pid]: true}))
    try {
      await adminSetProductOverride(pid, { disabled: !currently })
      toast(currently ? 'Re-enabled' : 'Hidden from shop', 'success')
      await load()
    } catch (e) { toast(e.message, 'error') }
    finally { setWorking(w => { const c = {...w}; delete c[pid]; return c }) }
  }

  async function clearOverride(pid) {
    setWorking(w => ({...w, [pid]: true}))
    try {
      await adminClearProductOverride(pid)
      toast('Reverted to original', 'success')
      setConfirmDelete(null)
      await load()
    } catch (e) { toast(e.message, 'error') }
    finally { setWorking(w => { const c = {...w}; delete c[pid]; return c }) }
  }

  async function bulkDisable() {
    if (!window.confirm(`Hide ${selected.size} products?`)) return
    setLoading(true)
    try {
      for (const id of selected) await adminSetProductOverride(id, { disabled: true })
      toast(`${selected.size} hidden`, 'success')
      setSelected(new Set()); await load()
    } catch (e) { toast(e.message, 'error') }
  }
  async function bulkEnable() {
    setLoading(true)
    try {
      for (const id of selected) await adminSetProductOverride(id, { disabled: false })
      toast(`${selected.size} re-enabled`, 'success')
      setSelected(new Set()); await load()
    } catch (e) { toast(e.message, 'error') }
  }
  function toggleSel(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(filtered.map(p => p.id))) }
  function clearSel() { setSelected(new Set()) }

  return (
    <AdminLayout title="Products" subtitle={`Manage catalog · ${products.length} total`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600"/>
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-bark/8 rounded-2xl p-3 mb-5 space-y-3">
        <div className="flex gap-1 flex-wrap">
          {[
            ['all', `All (${counts.all})`],
            ['active', `Active (${counts.active})`],
            ['disabled', `Hidden (${counts.disabled})`],
            ['overridden', `Modified (${counts.overridden})`],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${
                filter === k ? 'bg-saffron text-white font-500' : 'text-bark/50 hover:bg-cream'
              }`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-cream border border-bark/10 rounded-lg px-3 py-1.5">
            <Search size={13} className="text-bark/40"/>
            <input type="text" placeholder="Search name / ID / category..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent font-body text-sm text-bark placeholder:text-bark/30 outline-none"/>
            {search && <button onClick={() => setSearch('')}><X size={12} className="text-bark/30"/></button>}
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="bg-cream border border-bark/10 rounded-lg px-3 py-1.5 font-body text-sm text-bark outline-none cursor-pointer">
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bg-saffron/10 border border-saffron/30 rounded-xl p-3 mb-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="font-body font-500 text-sm text-saffron-dark">{selected.size} selected</span>
            <button onClick={clearSel} className="font-body text-[10px] text-bark/50 hover:text-bark uppercase tracking-widest">Clear</button>
          </div>
          <div className="flex gap-2">
            <button onClick={bulkEnable} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40">
              <Eye size={12}/> Re-enable
            </button>
            <button onClick={bulkDisable} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-40">
              <EyeOff size={12}/> Hide
            </button>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <p className="font-body text-xs text-bark/40">Showing {filtered.length} of {products.length}</p>
          <button onClick={selected.size === filtered.length ? clearSel : selectAll}
            className="font-body text-[10px] text-saffron hover:underline uppercase tracking-widest">
            {selected.size === filtered.length ? 'Deselect all' : 'Select all visible'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-saffron animate-spin"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-bark/8 rounded-2xl p-12 text-center">
          <ShoppingBag size={28} className="text-bark/20 mx-auto mb-3"/>
          <p className="font-display text-lg text-bark/60">No products match</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const o = overrides[p.id]
            const disabled = !!o?.disabled
            const modified = !!o
            const sel = selected.has(p.id)
            const price = o?.price ?? p.price
            return (
              <div key={p.id} className={`bg-white border rounded-xl p-3 transition-colors ${
                sel ? 'border-saffron/40 bg-saffron/5' : disabled ? 'border-amber-200 opacity-60' : 'border-bark/8'
              }`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={sel} onChange={() => toggleSel(p.id)}
                    className="w-4 h-4 accent-saffron cursor-pointer shrink-0"/>
                  {p.img && <img src={p.img} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-cream shrink-0"/>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body font-500 text-sm text-bark truncate">{p.name}</p>
                      {disabled && <span className="font-body text-[9px] uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Hidden</span>}
                      {modified && !disabled && <span className="font-body text-[9px] uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Modified</span>}
                    </div>
                    <p className="font-body text-[11px] text-bark/40">
                      <span className="font-mono">{p.id}</span> · {p.cat} ·{' '}
                      <span className={o?.price != null ? 'text-blue-600' : 'text-saffron'}>{fmtPKR(price)}</span>
                      {o?.price != null && <span className="text-bark/30 line-through ml-1">{fmtPKR(p.price)}</span>}
                    </p>
                    {o?.note && <p className="font-body text-[11px] text-bark/30 italic mt-0.5">📝 {o.note}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => toggleDisable(p.id, disabled)} disabled={working[p.id]}
                      className={`p-2 rounded-lg border transition-colors disabled:opacity-40 ${
                        disabled ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                 : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      }`}
                      title={disabled ? 'Re-enable' : 'Hide from shop'}>
                      {disabled ? <Eye size={13}/> : <EyeOff size={13}/>}
                    </button>
                    {modified && (
                      <button onClick={() => setConfirmDelete(p.id)} disabled={working[p.id]}
                        className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 disabled:opacity-40"
                        title="Clear override">
                        <RotateCcw size={13}/>
                      </button>
                    )}
                  </div>
                </div>
                {confirmDelete === p.id && (
                  <div className="mt-3 pt-3 border-t border-bark/5 flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-body text-xs text-amber-700">Clear override and revert to original?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded font-body text-xs text-bark/50">Cancel</button>
                      <button onClick={() => clearOverride(p.id)} className="px-3 py-1.5 rounded font-body text-xs bg-red-100 text-red-700">Yes, Clear</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
