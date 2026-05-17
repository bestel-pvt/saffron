import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { adminMe } from '../api.js'

export default function AdminGuard({ children }) {
  const [state, setState] = useState('checking')  // checking | ok | unauth

  useEffect(() => {
    let cancelled = false
    adminMe()
      .then(admin => { if (!cancelled) setState(admin ? 'ok' : 'unauth') })
      .catch(() => { if (!cancelled) setState('unauth') })
    return () => { cancelled = true }
  }, [])

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 size={20} className="text-saffron animate-spin"/>
      </div>
    )
  }
  if (state === 'unauth') return <Navigate to="/admin/login" replace />
  return children
}
