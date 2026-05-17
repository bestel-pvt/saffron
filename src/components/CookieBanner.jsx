import { useState, useEffect } from 'react'
import { Cookie, X } from 'lucide-react'
import { loadCookieConsent, saveCookieConsent } from '../utils/storage.js'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (loadCookieConsent() === null) {
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = () => { saveCookieConsent('accepted'); setVisible(false) }
  const decline = () => { saveCookieConsent('declined'); setVisible(false) }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-sm z-[250] rounded-2xl shadow-2xl border border-bark/10 p-5"
      style={{ background: '#FAF6F1' }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 bg-saffron/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Cookie size={16} className="text-saffron" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body font-500 text-sm text-bark mb-1">We use cookies</p>
          <p className="font-body text-xs text-bark/50 leading-relaxed">
            We use cookies to enhance your experience, remember your cart, and personalise content.
            No data is shared with third parties.
          </p>
        </div>
        <button onClick={decline} className="text-bark/25 hover:text-bark/60 transition-colors shrink-0">
          <X size={15} />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={decline}
          className="flex-1 border border-bark/15 py-2 rounded-xl font-body text-xs text-bark/50 hover:border-bark/30 hover:text-bark transition-colors"
        >
          Decline
        </button>
        <button
          onClick={accept}
          className="flex-[2] py-2 rounded-xl font-body text-xs text-white transition-colors"
          style={{ background: 'linear-gradient(135deg,#C9825A,#D4956A)' }}
        >
          Accept All
        </button>
      </div>
    </div>
  )
}
