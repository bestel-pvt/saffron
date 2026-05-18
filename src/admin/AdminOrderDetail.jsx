import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, Truck, Check, X, Eye, FileImage, Copy, MapPin, Phone, User } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import StatusBadge from './StatusBadge.jsx'
import {
  adminGetOrder, adminUpdateOrderStatus, adminSetTracking, adminClearTracking,
  adminVerifyPayment, adminRejectPayment, adminFetchPaymentProofBlob,
} from '../api.js'
import { toast } from '../components/Toast.jsx'

const fmtPKR = (n) => 'PKR ' + (Number(n) || 0).toLocaleString()
const fmtDate = (s) => new Date(s).toLocaleString('en-PK', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

const CARRIERS = [
  { id: 'tcs',      label: 'TCS Express',     urlPrefix: 'https://www.tcsexpress.com/track/' },
  { id: 'leopards', label: 'Leopards Courier',urlPrefix: 'https://www.leopardscourier.com/leopards-tracking?cn=' },
  { id: 'other',    label: 'Other / Manual',  urlPrefix: '' },
]

export default function AdminOrderDetail() {
  const { number } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const [proofUrl, setProofUrl] = useState(null)

  const [showTracking, setShowTracking] = useState(false)
  const [trackingForm, setTrackingForm] = useState({ carrier: 'tcs', trackingNumber: '', trackingUrl: '' })

  async function load() {
    setLoading(true)
    try {
      const o = await adminGetOrder(number)
      setOrder(o)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [number])

  async function loadProof() {
    try {
      // If the proof has a public URL (R2-backed), use it directly — no JWT fetch needed.
      if (order?.paymentProof?.url) {
        setProofUrl(order.paymentProof.url)
        return
      }
      const blob = await adminFetchPaymentProofBlob(number)
      setProofUrl(URL.createObjectURL(blob))
    } catch (err) {
      toast('Failed to load proof: ' + err.message, 'error')
    }
  }

  async function doVerify() {
    setWorking(true)
    try { await adminVerifyPayment(number); toast('Payment verified', 'success'); load() }
    catch (e) { toast(e.message, 'error') }
    finally { setWorking(false) }
  }
  async function doReject() {
    const reason = window.prompt('Rejection reason (shown to admin only):', 'Payment proof unclear')
    if (!reason) return
    setWorking(true)
    try { await adminRejectPayment(number, reason); toast('Payment rejected', 'success'); load() }
    catch (e) { toast(e.message, 'error') }
    finally { setWorking(false) }
  }
  async function doStatus(status) {
    if (!window.confirm(`Mark order as "${status}"?`)) return
    setWorking(true)
    try { await adminUpdateOrderStatus(number, status); toast('Status updated', 'success'); load() }
    catch (e) { toast(e.message, 'error') }
    finally { setWorking(false) }
  }
  async function saveTracking() {
    if (!trackingForm.trackingNumber.trim()) { toast('Enter tracking number', 'error'); return }
    setWorking(true)
    try {
      const carrier = CARRIERS.find(c => c.id === trackingForm.carrier)
      const url = trackingForm.trackingUrl.trim() ||
        (carrier?.urlPrefix ? carrier.urlPrefix + trackingForm.trackingNumber.trim() : '')
      await adminSetTracking(number, {
        carrier: carrier?.label || 'Other',
        trackingNumber: trackingForm.trackingNumber.trim(),
        trackingUrl: url,
      })
      toast('Tracking saved', 'success')
      setShowTracking(false)
      load()
    } catch (e) { toast(e.message, 'error') }
    finally { setWorking(false) }
  }
  async function clearTracking() {
    if (!window.confirm('Clear tracking info?')) return
    setWorking(true)
    try { await adminClearTracking(number); toast('Tracking cleared', 'success'); load() }
    catch (e) { toast(e.message, 'error') }
    finally { setWorking(false) }
  }

  return (
    <AdminLayout title={loading ? 'Loading...' : `Order ${order?.orderNumber || ''}`} subtitle={order?.customer?.name}>
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 font-body text-xs text-bark/50 hover:text-bark mb-4">
        <ArrowLeft size={13}/> Back to orders
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600"/>
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={20} className="text-saffron animate-spin"/></div>
      ) : !order ? null : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status + actions */}
            <div className="bg-white border border-bark/8 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <p className="font-body text-[10px] text-bark/40 uppercase tracking-widest mb-1">Current Status</p>
                  <StatusBadge status={order.status}/>
                  {order.statusUpdatedAt && (
                    <p className="font-body text-[10px] text-bark/40 mt-1.5">Updated {fmtDate(order.statusUpdatedAt)}</p>
                  )}
                </div>
              </div>
              {order.notes && (
                <div className="bg-cream border border-bark/8 rounded-xl p-3 mb-3">
                  <p className="font-body text-[10px] text-bark/40 uppercase tracking-widest mb-1">Notes</p>
                  <p className="font-body text-sm text-bark/70 italic">{order.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {order.status === 'awaiting_payment' && (
                  <>
                    <button onClick={doVerify} disabled={working} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40">
                      <Check size={12}/> Verify Payment
                    </button>
                    <button onClick={doReject} disabled={working} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40">
                      <X size={12}/> Reject Payment
                    </button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <button onClick={() => doStatus('processing')} disabled={working} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-40">
                    Mark Processing
                  </button>
                )}
                {(order.status === 'confirmed' || order.status === 'processing') && (
                  <button onClick={() => setShowTracking(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100">
                    <Truck size={12}/> Add Tracking & Dispatch
                  </button>
                )}
                {order.status === 'dispatched' && (
                  <button onClick={() => doStatus('delivered')} disabled={working} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40">
                    <Check size={12}/> Mark Delivered
                  </button>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button onClick={() => doStatus('cancelled')} disabled={working} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-bark/5 text-bark/60 border border-bark/10 hover:bg-bark/10 disabled:opacity-40 ml-auto">
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="bg-white border border-bark/8 rounded-2xl p-5">
              <p className="font-display text-lg text-bark mb-3">Items ({order.items.length})</p>
              <div className="space-y-3">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-bark/5 pb-3 last:border-b-0 last:pb-0">
                    {it.img && <img src={it.img} alt={it.name} className="w-12 h-12 rounded-lg object-cover bg-cream"/>}
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-500 text-sm text-bark truncate">{it.name}</p>
                      <p className="font-body text-xs text-bark/40">{it.cat} · {it.size || '–'} · qty {it.quantity}</p>
                    </div>
                    <p className="font-body font-500 text-sm text-bark">{fmtPKR(it.price * it.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-bark/8 space-y-1 font-body text-sm">
                <div className="flex justify-between text-bark/60"><span>Subtotal</span><span>{fmtPKR(order.subtotal)}</span></div>
                <div className="flex justify-between text-bark/60"><span>Delivery</span><span>{order.delivery === 0 ? 'Free' : fmtPKR(order.delivery)}</span></div>
                <div className="flex justify-between font-500 text-bark text-base pt-1 border-t border-bark/8 mt-1"><span>Total</span><span>{fmtPKR(order.total)}</span></div>
              </div>
            </div>

            {/* Tracking display */}
            {order.tracking && (
              <div className="bg-white border border-bark/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display text-lg text-bark">Tracking</p>
                  <button onClick={clearTracking} className="font-body text-[10px] text-red-600 hover:underline">Clear</button>
                </div>
                <p className="font-body text-sm text-bark/70">
                  <strong className="text-bark">{order.tracking.carrier}</strong> · <span className="font-mono text-saffron">{order.tracking.trackingNumber}</span>
                </p>
                {order.tracking.trackingUrl && (
                  <a href={order.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-body text-xs text-saffron hover:underline mt-1 inline-block">
                    View on {order.tracking.carrier} →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white border border-bark/8 rounded-2xl p-5">
              <p className="font-body text-[10px] text-bark/40 uppercase tracking-widest mb-3">Customer</p>
              <div className="space-y-2">
                <p className="flex items-center gap-2 font-body text-sm text-bark"><User size={13} className="text-bark/40"/>{order.customer.name}</p>
                <p className="flex items-center gap-2 font-body text-sm text-bark"><Phone size={13} className="text-bark/40"/>{order.customer.phone}</p>
                <p className="flex items-start gap-2 font-body text-sm text-bark"><MapPin size={13} className="text-bark/40 mt-1 shrink-0"/><span>{order.customer.address}, {order.customer.city}</span></p>
              </div>
            </div>

            <div className="bg-white border border-bark/8 rounded-2xl p-5">
              <p className="font-body text-[10px] text-bark/40 uppercase tracking-widest mb-3">Payment</p>
              <p className="font-body text-sm text-bark mb-2">
                {order.payment === 'easypaisa' ? 'EasyPaisa Transfer' : 'Cash on Delivery'}
              </p>
              {order.easyTid && (
                <div className="bg-cream border border-bark/8 rounded-lg px-3 py-2 mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-bark">{order.easyTid}</span>
                  <button onClick={() => { navigator.clipboard.writeText(order.easyTid); toast('TID copied', 'success') }}>
                    <Copy size={12} className="text-bark/40"/>
                  </button>
                </div>
              )}
              {order.paymentProof ? (
                <div>
                  <p className="font-body text-[10px] text-bark/40 mb-1.5">Proof uploaded {fmtDate(order.paymentProof.uploadedAt)}</p>
                  {!proofUrl ? (
                    <button onClick={loadProof} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-body text-xs bg-saffron/10 text-saffron border border-saffron/30 hover:bg-saffron/20">
                      <Eye size={12}/> View Proof
                    </button>
                  ) : (
                    <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={proofUrl} alt="Payment proof" className="w-full rounded-lg border border-bark/8"/>
                    </a>
                  )}
                </div>
              ) : order.payment === 'easypaisa' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2">
                  <FileImage size={13} className="text-amber-700"/>
                  <p className="font-body text-[11px] text-amber-700">No proof uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tracking modal */}
      {showTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setShowTracking(false)} className="absolute inset-0 bg-bark/40"/>
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-lg text-bark">Add Tracking</p>
              <button onClick={() => setShowTracking(false)}><X size={18} className="text-bark/40"/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="font-body text-[10px] text-bark/40 uppercase tracking-widest block mb-1.5">Carrier</label>
                <select value={trackingForm.carrier} onChange={e => setTrackingForm(f => ({...f, carrier: e.target.value}))}
                  className="w-full bg-cream border border-bark/10 rounded-lg px-3 py-2 font-body text-sm text-bark outline-none">
                  {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="font-body text-[10px] text-bark/40 uppercase tracking-widest block mb-1.5">Tracking Number</label>
                <input type="text" value={trackingForm.trackingNumber} onChange={e => setTrackingForm(f => ({...f, trackingNumber: e.target.value}))}
                  placeholder="e.g. TCS123456789" className="w-full bg-cream border border-bark/10 rounded-lg px-3 py-2 font-mono text-sm text-bark outline-none"/>
              </div>
              <div>
                <label className="font-body text-[10px] text-bark/40 uppercase tracking-widest block mb-1.5">Tracking URL (optional, auto-filled)</label>
                <input type="url" value={trackingForm.trackingUrl} onChange={e => setTrackingForm(f => ({...f, trackingUrl: e.target.value}))}
                  placeholder="Leave blank for default carrier URL" className="w-full bg-cream border border-bark/10 rounded-lg px-3 py-2 font-body text-xs text-bark outline-none"/>
              </div>
              <button onClick={saveTracking} disabled={working} className="w-full bg-saffron hover:bg-saffron-dark text-white py-2.5 rounded-lg font-body font-500 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
                {working ? <Loader2 size={14} className="animate-spin"/> : <><Truck size={14}/> Save & Mark Dispatched</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
