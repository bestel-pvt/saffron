import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, Search, Package, X } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import StatusBadge from './StatusBadge.jsx'
import { adminListOrders } from '../api.js'

const fmtPKR = (n) => 'PKR ' + (Number(n) || 0).toLocaleString()
const fmtDate = (s) => new Date(s).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    let cancelled = false
    adminListOrders()
      .then(o => { if (!cancelled) setOrders(o) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const counts = useMemo(() => ({
    all: orders.length,
    awaiting_payment: orders.filter(o => o.status === 'awaiting_payment').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    dispatched: orders.filter(o => o.status === 'dispatched').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }), [orders])

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (filter !== 'all' && o.status !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = [o.orderNumber, o.customer?.name, o.customer?.phone, o.customer?.city, o.customer?.address].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [orders, filter, search])

  return (
    <AdminLayout title="Orders" subtitle={`${orders.length} total`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600"/>
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-bark/8 rounded-2xl p-3 mb-5 flex flex-wrap items-center gap-2">
        {[
          ['all', `All (${counts.all})`],
          ['awaiting_payment', `Awaiting (${counts.awaiting_payment})`],
          ['confirmed', `Confirmed (${counts.confirmed})`],
          ['dispatched', `Dispatched (${counts.dispatched})`],
          ['delivered', `Delivered (${counts.delivered})`],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${
              filter === k ? 'bg-saffron text-white font-500' : 'text-bark/50 hover:bg-cream'
            }`}
          >
            {l}
          </button>
        ))}
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-cream border border-bark/10 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-bark/40"/>
          <input
            type="text"
            placeholder="Search order # / name / phone / city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent font-body text-sm text-bark placeholder:text-bark/30 outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-bark/30"/></button>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-saffron animate-spin"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-bark/8 rounded-2xl p-12 text-center">
          <Package size={28} className="text-bark/20 mx-auto mb-3"/>
          <p className="font-display text-lg text-bark/60">No orders match</p>
          <p className="font-body text-xs text-bark/40 mt-1">Try clearing filters or the search box.</p>
        </div>
      ) : (
        <div className="bg-white border border-bark/8 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-cream border-b border-bark/8 font-body text-[10px] text-bark/40 uppercase tracking-widest">
            <div className="col-span-2">Order #</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Payment</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Total</div>
          </div>
          {filtered.map(o => (
            <Link
              key={o.orderNumber}
              to={`/admin/orders/${o.orderNumber}`}
              className="grid md:grid-cols-12 gap-3 px-5 py-4 border-b border-bark/5 hover:bg-cream transition-colors items-center"
            >
              <div className="md:col-span-2">
                <p className="font-mono text-sm text-saffron">{o.orderNumber}</p>
                <p className="font-body text-[10px] text-bark/30 md:hidden mt-0.5">{fmtDate(o.createdAt)}</p>
              </div>
              <div className="md:col-span-3">
                <p className="font-body font-500 text-sm text-bark">{o.customer.name}</p>
                <p className="font-body text-xs text-bark/40">{o.customer.phone} · {o.customer.city}</p>
              </div>
              <div className="md:col-span-2 hidden md:block">
                <p className="font-body text-xs text-bark/50">{fmtDate(o.createdAt)}</p>
              </div>
              <div className="md:col-span-2">
                <span className="font-body text-xs text-bark/60 uppercase">{o.payment === 'easypaisa' ? 'EasyPaisa' : 'COD'}</span>
                {o.paymentProof && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500" title="Proof uploaded"/>}
              </div>
              <div className="md:col-span-2">
                <StatusBadge status={o.status}/>
              </div>
              <div className="md:col-span-1 md:text-right">
                <p className="font-body font-500 text-sm text-bark">{fmtPKR(o.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
