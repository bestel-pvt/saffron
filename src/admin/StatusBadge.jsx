const STYLES = {
  awaiting_payment: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Awaiting Payment' },
  confirmed:        { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Confirmed' },
  processing:       { bg: 'bg-purple-100',text: 'text-purple-700',label: 'Processing' },
  dispatched:       { bg: 'bg-indigo-100',text: 'text-indigo-700',label: 'Dispatched' },
  delivered:        { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
  cancelled:        { bg: 'bg-red-100',   text: 'text-red-700',   label: 'Cancelled' },
}

export default function StatusBadge({ status }) {
  const s = STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-body font-500 text-[10px] uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
