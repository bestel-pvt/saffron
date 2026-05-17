import { createPortal } from 'react-dom'
import { X, Printer, MapPin, Phone, Mail, Package, CheckCircle } from 'lucide-react'

const fmt = (n) => 'PKR ' + Number(n).toLocaleString()
const fmtDate = (s) => new Date(s).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })

const EASYPAISA_LOGO = 'https://crystalpng.com/wp-content/uploads/2024/10/Easypaisa-logo.png'

export default function Invoice({ order, onClose }) {
  if (!order) return null
  const { orderNumber, items, customer, payment, easyTid, subtotal, delivery, total, createdAt } = order
  const isEasypaisa = payment === 'easypaisa'

  return createPortal(
    <div id="sc-invoice-overlay" className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(44,24,16,0.7)', backdropFilter: 'blur(6px)' }}>
      <div id="sc-invoice-card" className="bg-white rounded-2xl w-full max-w-xl max-h-[96vh] overflow-y-auto shadow-2xl">

        {/* Toolbar */}
        <div id="sc-invoice-toolbar" className="sticky top-0 bg-white border-b border-bark/10 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(180deg,#C9825A,#D4956A)' }} />
            <h2 className="font-display text-xl text-bark">Invoice</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-body"
              style={{ background: 'linear-gradient(135deg,#C9825A,#D4956A)' }}>
              <Printer size={15} /> Print
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-rose/50 flex items-center justify-center hover:bg-rose transition-colors">
              <X size={16} className="text-bark/60" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-8" id="sc-invoice">
          {/* Brand header */}
          <div className="flex justify-between items-start mb-6 gap-3">
            {/* Left: brand + contact */}
            <div className="min-w-0 flex-1">
              <p className="font-display text-2xl text-bark tracking-[0.1em] mb-1">
                SAFFRON <span style={{ color: '#C9825A' }}>&</span> CO
              </p>
              <p className="font-body text-[10px] text-bark/35 tracking-wider mb-2">Luxury Beauty. Rooted in Nature.</p>
              <div className="font-body text-[10px] text-bark/40 space-y-0.5">
                <p className="flex items-center gap-1.5"><MapPin size={10} /> Office 3A, Paradise Apartment, Gujju Matta, Ferozpur Road, Lahore</p>
                <p className="flex items-center gap-1.5"><Phone size={10} /> 0344-4183049</p>
                <p className="flex items-center gap-1.5"><Mail size={10} /> info@saffronco.pk</p>
              </div>
            </div>
            {/* Right: status + order number */}
            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full mb-2" style={{ background: 'rgba(201,130,90,0.1)' }}>
                <CheckCircle size={11} style={{ color: '#C9825A' }} />
                <span className="font-body text-[9px] font-700 tracking-wider uppercase" style={{ color: '#C9825A' }}>Order Confirmed</span>
              </div>
              <h2 className="font-display text-base whitespace-nowrap" style={{ color: '#C9825A' }}>{orderNumber}</h2>
              <p className="font-body text-[10px] text-bark/40 mt-0.5">{fmtDate(createdAt)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mb-6" style={{ background: 'linear-gradient(90deg,rgba(201,130,90,0.3),rgba(212,149,106,0.3),transparent)' }} />

          {/* Customer + Delivery */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl p-4" style={{ background: 'rgba(240,221,208,0.3)' }}>
              <p className="font-body text-[10px] text-bark/35 uppercase tracking-widest font-700 mb-2">Bill To</p>
              <p className="font-display text-base text-bark">{customer.name}</p>
              <p className="font-body text-sm text-bark/50 mt-0.5">{customer.phone}</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(240,221,208,0.3)' }}>
              <p className="font-body text-[10px] text-bark/35 uppercase tracking-widest font-700 mb-2">Deliver To</p>
              <p className="font-display text-base text-bark">{customer.city}</p>
              <p className="font-body text-xs text-bark/45 mt-0.5 leading-relaxed">{customer.address}</p>
            </div>
          </div>

          {/* Payment method */}
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl border" style={{ background: isEasypaisa ? 'rgba(0,166,81,0.06)' : 'rgba(240,221,208,0.2)', borderColor: isEasypaisa ? 'rgba(0,166,81,0.2)' : 'rgba(44,24,16,0.08)' }}>
            {isEasypaisa ? (
              <>
                <img src={EASYPAISA_LOGO} alt="EasyPaisa" className="h-9 object-contain bg-white rounded-lg p-1 border" style={{ borderColor: 'rgba(0,166,81,0.15)' }} />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-700 text-bark">EasyPaisa Transfer</p>
                  <p className="font-body text-xs text-bark/40">To Saffron &amp; Company · 0344-4183049{easyTid ? ` · TID ${easyTid}` : ''}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-body text-sm font-700 text-bark">Cash on Delivery</p>
                  <p className="font-body text-xs text-bark/40">Pay when order arrives at your door</p>
                </div>
              </>
            )}
          </div>

          {/* Items */}
          <div className="mb-6">
            <p className="font-body text-[10px] text-bark/35 uppercase tracking-widest font-700 mb-3">Order Items</p>
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'rgba(44,24,16,0.08)' }}>
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '45%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '23%' }} />
                </colgroup>
                <thead style={{ background: 'rgba(240,221,208,0.2)' }}>
                  <tr>
                    {['Product', 'Qty', 'Price', 'Total'].map(h => (
                      <th key={h} className="text-left px-2 sm:px-4 py-2.5 font-body text-[9px] font-700 text-bark/35 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(240,221,208,0.1)' }}>
                      <td className="px-2 sm:px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <img src={item.img} alt={item.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="font-display text-xs text-bark leading-snug line-clamp-2">{item.name}</p>
                            <p className="font-body text-[10px] text-bark/35 truncate">{item.cat}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 font-body text-xs text-bark text-center">{item.qty || 1}</td>
                      <td className="px-2 sm:px-4 py-2.5 font-body text-xs text-bark/60">{fmt(item.price)}</td>
                      <td className="px-2 sm:px-4 py-2.5 font-body text-xs font-700 text-bark">{fmt(item.price * (item.qty || 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-56 space-y-2">
              <div className="flex justify-between font-body text-sm text-bark/50"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between font-body text-sm text-bark/50">
                <span>Delivery</span>
                <span style={delivery === 0 ? { color: '#C9825A', fontWeight: 700 } : {}}>{delivery === 0 ? 'FREE' : fmt(delivery)}</span>
              </div>
              <div className="flex justify-between font-display text-lg border-t pt-2" style={{ borderColor: 'rgba(44,24,16,0.1)', color: '#C9825A' }}>
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-6 text-center" style={{ borderColor: 'rgba(44,24,16,0.08)' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package size={15} style={{ color: '#C9825A' }} />
              <span className="font-body text-sm text-bark font-600">Thank you for shopping with Saffron & Co!</span>
            </div>
            <p className="font-body text-xs text-bark/30">
              Expected delivery 2–4 working days · info@saffronco.pk · 0344-4183049
            </p>
            <p className="font-body text-[10px] text-bark/20 mt-2">
              © 2026 Saffron & Co · Office 3A, Paradise Apartment, Gujju Matta, Ferozpur Road, Lahore
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          #root { display: none !important; }
          #sc-invoice-overlay {
            display: block !important;
            position: static !important;
            background: white !important;
            padding: 0 !important;
          }
          #sc-invoice-card {
            display: block !important;
            position: static !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: none !important;
            background: white !important;
          }
          #sc-invoice-toolbar { display: none !important; }
        }
      `}</style>
    </div>,
    document.body
  )
}
