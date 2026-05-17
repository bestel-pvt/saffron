import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare,
  Boxes, Users, LogOut, Menu, X, ExternalLink,
} from 'lucide-react'
import { clearAdminToken } from '../api.js'

const NAV = [
  { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { to: '/admin/orders',    label: 'Orders',     icon: Package },
  { to: '/admin/products',  label: 'Products',   icon: ShoppingBag },
  { to: '/admin/reviews',   label: 'Reviews',    icon: MessageSquare },
  { to: '/admin/stock',     label: 'Stock',      icon: Boxes },
  { to: '/admin/customers', label: 'Customers',  icon: Users },
]

export default function AdminLayout({ title, subtitle, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  function logout() {
    clearAdminToken()
    navigate('/admin/login')
  }

  function isActive(item) {
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-60 bg-white border-r border-bark/8 transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-5 border-b border-bark/8">
          <div>
            <p className="font-body text-[10px] text-saffron uppercase tracking-[0.3em]">Admin</p>
            <p className="font-display text-xl text-bark">Saffron & Co</p>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-bark/40">
            <X size={18}/>
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map(item => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm transition-colors ${
                  active ? 'bg-saffron/10 text-saffron font-500' : 'text-bark/60 hover:bg-cream hover:text-bark'
                }`}
              >
                <Icon size={15}/>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-bark/8 space-y-1 bg-white">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm text-bark/60 hover:bg-cream hover:text-bark transition-colors"
          >
            <ExternalLink size={15}/> View Store
          </a>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15}/> Log Out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-bark/30 z-30 lg:hidden"/>}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-bark/8 px-5 py-4 flex items-center justify-between gap-4">
          <button onClick={() => setOpen(true)} className="lg:hidden text-bark/60">
            <Menu size={18}/>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl text-bark truncate">{title}</h1>
            {subtitle && <p className="font-body text-xs text-bark/40 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
