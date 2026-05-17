import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Users as UsersIcon, TrendingUp, Truck, MessageSquare, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { adminStats } from '../api.js'

const fmtPKR = (n) => 'PKR ' + (Number(n) || 0).toLocaleString()

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    adminStats()
      .then(s => { if (!cancelled) { setStats(s); setError(null) } })
      .catch(e => { if (!cancelled) setError(e.message || 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <AdminLayout title="Dashboard" subtitle="Saffron & Co — orders, customers, revenue at a glance">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="text-saffron animate-spin"/>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-600"/>
          <p className="font-body text-sm text-red-700">{error}</p>
        </div>
      ) : stats && (
        <div className="space-y-5">
          {/* Stat cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <ShoppingBag size={16}/>,  label: 'Total Orders',    value: stats.totalOrders },
              { icon: <TrendingUp size={16}/>,   label: 'Revenue',         value: fmtPKR(stats.totalRevenue) },
              { icon: <UsersIcon size={16}/>,    label: 'Customers',       value: stats.totalCustomers },
              { icon: <Truck size={16}/>,        label: 'In Transit',      value: stats.dispatched },
            ].map(s => (
              <div key={s.label} className="bg-white border border-bark/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-saffron mb-3">
                  <div className="w-8 h-8 bg-saffron/10 rounded-lg flex items-center justify-center">{s.icon}</div>
                </div>
                <p className="font-body text-[11px] text-bark/40 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="font-display text-2xl text-bark">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Highlights */}
          {stats.pendingOrders > 0 && (
            <Link to="/admin/orders" className="block bg-amber-50 border border-amber-200 rounded-2xl p-5 hover:bg-amber-100/60 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-body font-500 text-[11px] text-amber-700 uppercase tracking-widest mb-1">Needs Attention</p>
                  <p className="font-body text-sm text-bark">
                    <strong className="text-amber-700">{stats.pendingOrders}</strong> order{stats.pendingOrders !== 1 ? 's' : ''} awaiting payment or confirmation
                  </p>
                </div>
                <ArrowRight size={18} className="text-amber-700"/>
              </div>
            </Link>
          )}

          {stats.pendingReviews > 0 && (
            <Link to="/admin/reviews" className="block bg-blue-50 border border-blue-200 rounded-2xl p-5 hover:bg-blue-100/60 transition-colors">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-body font-500 text-[11px] text-blue-700 uppercase tracking-widest mb-1">Reviews Awaiting Moderation</p>
                  <p className="font-body text-sm text-bark">
                    <strong className="text-blue-700">{stats.pendingReviews}</strong> review{stats.pendingReviews !== 1 ? 's' : ''} pending approval
                  </p>
                </div>
                <ArrowRight size={18} className="text-blue-700"/>
              </div>
            </Link>
          )}

          {/* Quick links */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { to: '/admin/orders',    label: 'Manage Orders' },
              { to: '/admin/products',  label: 'Manage Products' },
              { to: '/admin/reviews',   label: 'Moderate Reviews' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="block bg-white border border-bark/8 rounded-2xl p-4 hover:border-saffron/40 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-body font-500 text-sm text-bark">{l.label}</p>
                  <ArrowRight size={14} className="text-bark/30"/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
