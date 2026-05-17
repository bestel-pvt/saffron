import { useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle, MessageSquare, Star, Check, X, Trash2 } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import {
  adminListReviews, adminApproveReview, adminRejectReview, adminDeleteReview,
  fetchProducts,
} from '../api.js'
import { toast } from '../components/Toast.jsx'

const fmtDate = (s) => new Date(s).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' })

const STATUS_STYLE = {
  pending:  { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50',   text: 'text-red-700',   label: 'Rejected' },
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [productMap, setProductMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [working, setWorking] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [r, p] = await Promise.all([adminListReviews(), fetchProducts()])
      setReviews(r)
      setProductMap(Object.fromEntries(p.map(x => [String(x.id), x])))
      setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const counts = useMemo(() => ({
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  }), [reviews])

  const filtered = useMemo(() => {
    if (filter === 'all') return reviews
    return reviews.filter(r => r.status === filter)
  }, [reviews, filter])

  async function doAction(action, id) {
    setWorking(id)
    try {
      if (action === 'approve') { await adminApproveReview(id); toast('Approved', 'success') }
      else if (action === 'reject') { await adminRejectReview(id); toast('Rejected', 'success') }
      else if (action === 'delete') {
        if (!window.confirm('Permanently delete this review?')) { setWorking(null); return }
        await adminDeleteReview(id); toast('Deleted', 'success')
      }
      await load()
    } catch (e) { toast(e.message, 'error') }
    finally { setWorking(null) }
  }

  return (
    <AdminLayout title="Reviews" subtitle="Moderate customer reviews">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600"/>
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-bark/8 rounded-2xl p-2 mb-5 flex gap-1 flex-wrap">
        {[
          ['all', `All (${counts.all})`],
          ['pending', `Pending (${counts.pending})`],
          ['approved', `Approved (${counts.approved})`],
          ['rejected', `Rejected (${counts.rejected})`],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${
              filter === k ? 'bg-saffron text-white font-500' : 'text-bark/50 hover:bg-cream'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-saffron animate-spin"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-bark/8 rounded-2xl p-12 text-center">
          <MessageSquare size={28} className="text-bark/20 mx-auto mb-3"/>
          <p className="font-display text-lg text-bark/60">No reviews</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const product = productMap[String(r.productId)]
            const stat = STATUS_STYLE[r.status] || STATUS_STYLE.pending
            return (
              <div key={r.id} className="bg-white border border-bark/8 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div className="flex items-center gap-3">
                    {product?.img && <img src={product.img} alt="" className="w-10 h-10 rounded-lg object-cover bg-cream"/>}
                    <div>
                      <p className="font-body font-500 text-sm text-bark">{product?.name || `Product ${r.productId}`}</p>
                      <p className="font-body text-[11px] text-bark/40">
                        Order <span className="font-mono text-saffron">{r.orderNumber}</span> · {r.customerPhone} · {fmtDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`font-body font-500 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${stat.bg} ${stat.text}`}>
                    {stat.label}
                  </span>
                </div>
                <div className="bg-cream rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-body font-500 text-sm text-bark">{r.customerName}</p>
                    <div className="flex gap-0.5">
                      {Array.from({length:5}).map((_,i) => <Star key={i} size={11} className={i < r.rating ? 'fill-saffron text-saffron' : 'text-bark/15'}/>)}
                    </div>
                  </div>
                  {r.title && <p className="font-body font-500 text-sm text-bark/80 mb-1">{r.title}</p>}
                  <p className="font-body text-sm text-bark/60 leading-relaxed">{r.comment}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {r.status !== 'approved' && (
                    <button onClick={() => doAction('approve', r.id)} disabled={working === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40">
                      <Check size={12}/> Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => doAction('reject', r.id)} disabled={working === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-40">
                      <X size={12}/> Reject
                    </button>
                  )}
                  <button onClick={() => doAction('delete', r.id)} disabled={working === r.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 ml-auto">
                    <Trash2 size={12}/> Delete
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
