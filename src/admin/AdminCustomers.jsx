import { useEffect, useState, useMemo } from 'react'
import { Loader2, AlertCircle, Search, Users as UsersIcon, X } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { adminListCustomers } from '../api.js'

const fmtPKR = (n) => 'PKR ' + (Number(n) || 0).toLocaleString()
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' }) : '—'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminListCustomers()
      .then(setCustomers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    )
  }, [customers, search])

  return (
    <AdminLayout title="Customers" subtitle={`${customers.length} total`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600"/>
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-bark/8 rounded-2xl p-3 mb-5 flex items-center gap-2">
        <Search size={14} className="text-bark/40 ml-2"/>
        <input
          type="text"
          placeholder="Search name / phone / city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent font-body text-sm text-bark placeholder:text-bark/30 outline-none"
        />
        {search && <button onClick={() => setSearch('')}><X size={13} className="text-bark/30"/></button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={20} className="text-saffron animate-spin"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-bark/8 rounded-2xl p-12 text-center">
          <UsersIcon size={28} className="text-bark/20 mx-auto mb-3"/>
          <p className="font-display text-lg text-bark/60">No customers</p>
        </div>
      ) : (
        <div className="bg-white border border-bark/8 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-cream border-b border-bark/8 font-body text-[10px] text-bark/40 uppercase tracking-widest">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">City</div>
            <div className="col-span-1 text-right">Orders</div>
            <div className="col-span-2 text-right">Spent</div>
            <div className="col-span-2 text-right">Last order</div>
          </div>
          {filtered.map(c => (
            <div key={c.phoneDigits} className="grid md:grid-cols-12 gap-3 px-5 py-4 border-b border-bark/5 last:border-b-0 items-center">
              <div className="md:col-span-3">
                <p className="font-body font-500 text-sm text-bark">{c.name}</p>
                <p className="font-body text-xs text-bark/40 md:hidden">{c.phone}</p>
              </div>
              <div className="md:col-span-2 hidden md:block"><p className="font-body text-xs text-bark/60">{c.phone}</p></div>
              <div className="md:col-span-2"><p className="font-body text-xs text-bark/60">{c.city || '—'}</p></div>
              <div className="md:col-span-1 md:text-right"><p className="font-body font-500 text-sm text-bark">{c.totalOrders}</p></div>
              <div className="md:col-span-2 md:text-right"><p className="font-body font-500 text-sm text-saffron">{fmtPKR(c.totalSpent)}</p></div>
              <div className="md:col-span-2 md:text-right"><p className="font-body text-xs text-bark/50">{fmtDate(c.lastOrderAt || c.firstOrderAt)}</p></div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
