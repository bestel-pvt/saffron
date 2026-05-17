import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { adminLogin } from '../api.js'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await adminLogin(username, password)
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-body text-xs text-saffron uppercase tracking-[0.35em] mb-3">Saffron & Co</p>
          <h1 className="font-display font-300 text-4xl text-bark">Admin Portal</h1>
        </div>

        <form onSubmit={onSubmit} className="bg-white border border-bark/8 rounded-3xl p-7 space-y-4 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-600 shrink-0"/>
              <p className="font-body text-xs text-red-700">{error}</p>
            </div>
          )}
          <div>
            <label className="font-body text-[10px] text-bark/40 uppercase tracking-widest block mb-2">Username</label>
            <div className="flex items-center gap-2 bg-cream border border-bark/10 rounded-xl px-3 py-2.5 focus-within:border-saffron/50">
              <User size={14} className="text-bark/40"/>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="flex-1 bg-transparent font-body text-sm text-bark outline-none"
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label className="font-body text-[10px] text-bark/40 uppercase tracking-widest block mb-2">Password</label>
            <div className="flex items-center gap-2 bg-cream border border-bark/10 rounded-xl px-3 py-2.5 focus-within:border-saffron/50">
              <Lock size={14} className="text-bark/40"/>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="flex-1 bg-transparent font-body text-sm text-bark outline-none"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-saffron hover:bg-saffron-dark text-white py-3 rounded-xl font-body font-500 text-sm tracking-wide transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin"/> : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-5 font-body text-[11px] text-bark/30">
          Default: admin / changeme — change in production
        </p>
      </div>
    </div>
  )
}
