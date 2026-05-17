import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { X, ShoppingBag, Heart, CheckCircle, AlertCircle, Info } from 'lucide-react'

let _setToasts = null
let _counter = 0

export function toast(message, type = 'success') {
  if (_setToasts) {
    const id = ++_counter
    _setToasts(ts => [...ts.slice(-4), { id, message, type }])
    setTimeout(() => {
      _setToasts(ts => ts.filter(t => t.id !== id))
    }, 3800)
  }
}

const ICONS = {
  success: <CheckCircle size={15} />,
  error:   <AlertCircle size={15} />,
  info:    <Info size={15} />,
  cart:    <ShoppingBag size={15} />,
  wish:    <Heart size={15} />,
}

const COLORS = {
  success: { bg: '#C9825A', text: '#fff' },
  error:   { bg: '#2C1810', text: '#FAF6F1' },
  info:    { bg: '#7D6352', text: '#fff' },
  cart:    { bg: '#C9825A', text: '#fff' },
  wish:    { bg: '#E8A0A0', text: '#2C1810' },
}

function ToastItem({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => setVisible(false), 3400)
    return () => clearTimeout(t)
  }, [])

  const col = COLORS[type] || COLORS.success

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl min-w-[220px] max-w-[320px] font-body text-sm transition-all duration-300"
      style={{
        background: col.bg,
        color: col.text,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
      }}
    >
      <span className="shrink-0 opacity-90">{ICONS[type] || ICONS.success}</span>
      <span className="flex-1 leading-snug">{message}</span>
      <button onClick={() => onRemove(id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1">
        <X size={13} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])
  _setToasts = setToasts

  const remove = (id) => setToasts(ts => ts.filter(t => t.id !== id))

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-6 right-4 z-[300] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onRemove={remove} />
        </div>
      ))}
    </div>,
    document.body
  )
}
