import React, { useState, useEffect } from 'react';
import { PackageCheck, Search, CheckCircle2, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { dbSelect, rpc } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface OrderData {
  orderId: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    city: string;
    address: string;
    state: string;
    pincode: string;
    transportPreference: string;
  };
  items: Array<{
    productId: number;
    sNo: number;
    name: string;
    unit: string;
    rate: number;
    quantity: number;
    lineTotal: number;
  }>;
  totalBoxes: number;
  subtotal: number;
  status: string;
  trackingNumber?: string;
  lorryTransportName?: string;
}


interface TrackerScreenProps {
  initialOrderId?: string;
  initialTrackingToken?: string;
}

const TRACKING_STEPS = [
  { key: 'pending', title: 'Order received', description: 'Your order number and itemized request have been registered.' },
  { key: 'confirmed', title: 'Order confirmed', description: 'The team has reviewed the order and confirmation details.' },
  { key: 'processing', title: 'Preparing your order', description: 'Products are being checked and prepared for packing.' },
  { key: 'packed', title: 'Packed at factory', description: 'The order has been packed and is waiting for dispatch.' },
  { key: 'shipped', title: 'Dispatched', description: 'The consignment has left the factory or dispatch point.' },
  { key: 'out_for_delivery', title: 'Out for delivery', description: 'The transport partner is moving the consignment to its destination.' },
  { key: 'delivered', title: 'Delivered', description: 'The order has been marked as delivered.' },
] as const;

const TRACKING_STATUS_ORDER = TRACKING_STEPS.map((step) => step.key);
function trackingStepState(stepIndex: number, status: string): 'complete' | 'current' | 'upcoming' | 'cancelled' {
  const normalized = String(status || '').toLowerCase().trim().replace(/[ -]+/g, '_');
  if (['cancelled', 'canceled', 'rejected', 'refunded', 'failed'].includes(normalized)) return 'cancelled';
  const aliases: Record<string, string> = {
    quotation_created: 'pending', order_created: 'pending', placed: 'pending', booking: 'pending',
    awaiting_payment: 'pending', pending_payment: 'pending', awaiting_confirmation: 'pending',
    approved: 'confirmed', payment_received: 'confirmed', payment_verified: 'confirmed',
    preparing: 'processing', packing: 'processing', packed_at_factory: 'packed',
    dispatched: 'shipped', in_transit: 'shipped', delivering: 'out_for_delivery', completed: 'delivered',
  };
  const normalizedStatus = aliases[normalized] || normalized;
  const currentIndex = TRACKING_STATUS_ORDER.indexOf(normalizedStatus as (typeof TRACKING_STATUS_ORDER)[number]);
  const safeIndex = currentIndex < 0 ? 0 : currentIndex;
  if (safeIndex > stepIndex) return 'complete';
  if (safeIndex === stepIndex) return 'current';
  return 'upcoming';
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({ initialOrderId, initialTrackingToken }) => {
  const { storeInfo: STORE_INFO } = useStore();
  const [searchId, setSearchId] = useState(() => new URLSearchParams(window.location.search).get('n') || initialOrderId || '');
  const [trackingToken, setTrackingToken] = useState(() => new URLSearchParams(window.location.search).get('t') || initialTrackingToken || '');
  const { session } = useAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async (id: string, token = trackingToken) => {
    const normalizedId = id.trim();
    const orderNumber = Number(normalizedId);
    if (!/^\d+$/.test(normalizedId) || !Number.isSafeInteger(orderNumber) || orderNumber <= 0) {
      setOrder(null);
      setError('Enter the numeric order number shown in your confirmation.');
      return;
    }
    setLoading(true); setError(null);
    try {
      let payload:any;
      if (token.trim()) {
        payload = await rpc('get_guest_order',{p_order_number:orderNumber,p_token:token.trim()},session?.access_token);
      } else {
        const rows:any[] = await dbSelect<any>('orders', `select=*,order_items(*),order_addresses(*),order_status_history(*)&order_number=eq.${encodeURIComponent(normalizedId)}&limit=1`, session?.access_token);
        if (!rows[0]) throw new Error('Order not found. Sign in to track an existing account order, or check the order reference with customer support.');
        payload={order:rows[0],items:rows[0].order_items||[],tracking:rows[0].order_status_history||[]};
      }
      if (!payload?.order) throw new Error('Order not found or tracking token is invalid.');
      const o=payload.order;
      const addressRows = Array.isArray(o.order_addresses) ? o.order_addresses : [];
      const address = addressRows.find((row:any) => /delivery|shipping/i.test(String(row.address_role || ''))) || addressRows[0] || {};
      const orderItems = payload.items || o.order_items || [];
      setOrder({orderId:String(o.order_number || o.order_id),createdAt:o.placed_at || o.created_at,customer:{name:address.recipient_name||'',phone:address.recipient_mobile||'',city:address.city||o.delivery_city||'',address:[address.address_line_1,address.address_line_2,address.landmark].filter(Boolean).join(', '),state:address.state||o.delivery_state||'',pincode:address.postal_code||o.delivery_postal_code||'',transportPreference:o.delivery_region||'Confirmed transport'},items:orderItems.map((i:any)=>({productId:Number(i.product_id),sNo:Number(i.product_id),name:i.product_name_snapshot||'Product from prior order',unit:i.pack_type_snapshot,rate:Number(i.unit_price),quantity:Number(i.quantity),lineTotal:Number(i.line_total)})),totalBoxes:orderItems.reduce((sum:number,item:any)=>sum+Number(item.quantity||0),0),subtotal:Number(o.subtotal_amount??o.order_amount??o.total_amount??0),status:o.status,trackingNumber:undefined,lorryTransportName:undefined});
    } catch(err:any) { setOrder(null); setError(err.message || 'Unable to track order'); } finally { setLoading(false); }
  };

  const normalizedStatus = String(order?.status || 'pending').toLowerCase().trim().replace(/[ -]+/g, '_');
  const orderIsCancelled = ['cancelled', 'canceled', 'rejected', 'refunded', 'failed'].includes(normalizedStatus);
  const orderIsDelivered = ['delivered', 'completed'].includes(normalizedStatus);
  const displayStatus = String(order?.status || 'pending').trim().replace(/[_-]+/g, ' ');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingId = initialOrderId || params.get('n') || '';
    const incomingToken = initialTrackingToken ?? params.get('t') ?? '';
    if (incomingId) {
      setSearchId(incomingId);
      setTrackingToken(incomingToken);
      void fetchOrder(incomingId, incomingToken);
    }
    // The route-level order selection intentionally triggers a single live lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId, initialTrackingToken]);

  return (
    <div data-rtc-component="timeline" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div className="border-b border-stone-800 dark:border-stone-800 light:border-stone-200 pb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">
          <PackageCheck className="w-4 h-4 text-emerald-500" />
          <span>Historical Consignment Lookup</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white dark:text-white light:text-stone-900 tracking-tight">
          Review an Existing Consignment
        </h1>
        <p className="text-sm text-stone-300 dark:text-stone-300 light:text-stone-600 mt-2 max-w-2xl leading-relaxed">
          Enter the reference from an existing historical record to review its status, where available. This catalogue does not create new online fireworks orders.
        </p>
      </div>

      {/* Search Bar */}
      <form className="max-w-xl" onSubmit={(event) => { event.preventDefault(); void fetchOrder(searchId, trackingToken); }}>
        <label htmlFor="order-track-id" className="block text-xs font-semibold text-stone-300 dark:text-stone-300 light:text-stone-700 mb-2">
          Enter Order ID:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="order-track-id"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter your order number"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-900 light:bg-white border border-stone-800 dark:border-stone-800 light:border-stone-300 text-sm text-white dark:text-white light:text-stone-900 font-mono placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </div>
        <label htmlFor="guest-tracking-token" className="sr-only">Guest tracking token</label>
        <input id="guest-tracking-token" value={trackingToken} onChange={e=>setTrackingToken(e.target.value)} placeholder="Guest tracking token (only for guest orders)" autoComplete="off" spellCheck={false} className="mt-2 w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs text-white" />
        <div className="mt-2 text-[11px] text-stone-500">Use the numeric order number from your confirmation. Guest orders also need the private tracking token supplied with that order; never share it publicly.</div>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Order lookup failed:</strong>
            {error}
          </div>
        </div>
      )}

      {/* Order Details View */}
      {order && (
        <div className="space-y-8">
          
          {/* Tracking Progress Bar Card */}
          <div className="bg-stone-900/90 dark:bg-stone-900/90 light:bg-white rounded-2xl border border-stone-800 dark:border-stone-800 light:border-stone-200 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-800 dark:border-stone-800 light:border-stone-200 pb-6 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  Current Status
                </span>
                <h2 className="font-display text-2xl font-black text-white dark:text-white light:text-stone-900 mt-0.5">
                  Order #{order.orderId}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Booked for: <strong className="text-stone-200 dark:text-stone-200 light:text-stone-800">{order.customer.name}</strong> · {order.customer.city}, {order.customer.state}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${orderIsCancelled
                  ? 'bg-red-950/50 dark:bg-red-950/50 light:bg-red-100 text-red-300 dark:text-red-300 light:text-red-800 border-red-800/80 dark:border-red-800/80 light:border-red-200'
                  : orderIsDelivered
                    ? 'bg-emerald-950/80 dark:bg-emerald-950/80 light:bg-emerald-100 text-emerald-400 dark:text-emerald-400 light:text-emerald-800 border-emerald-800/80 dark:border-emerald-800/80 light:border-emerald-200'
                    : 'bg-amber-950/50 dark:bg-amber-950/50 light:bg-amber-100 text-amber-300 dark:text-amber-300 light:text-amber-800 border-amber-800/80 dark:border-amber-800/80 light:border-amber-200'}`}>
                  {orderIsCancelled ? <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> : orderIsDelivered ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Clock className="w-3.5 h-3.5" aria-hidden="true" />}
                  {displayStatus}
                </span>
              </div>
            </div>

            {/* The timeline reflects the actual status returned for this order, not optimistic demo stages. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" aria-label="Order progress timeline">
              {TRACKING_STEPS.map((step, stepIndex) => {
                const state = trackingStepState(stepIndex, order.status);
                const stateClasses = state === 'complete'
                  ? 'border-emerald-700/70 bg-emerald-950/20'
                  : state === 'current'
                    ? 'border-amber-500/70 bg-amber-950/20 ring-1 ring-amber-500/20'
                    : state === 'cancelled'
                      ? 'border-red-900/60 bg-red-950/20 opacity-70'
                      : 'border-stone-800 dark:border-stone-800 light:border-stone-200 bg-stone-950 dark:bg-stone-950 light:bg-stone-50';
                return (
                  <div key={step.key} className={`p-4 rounded-xl border ${stateClasses}`} aria-current={state === 'current' ? 'step' : undefined}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${state === 'current' ? 'text-amber-400' : state === 'complete' ? 'text-emerald-400' : 'text-stone-500'}`}>Stage {String(stepIndex + 1).padStart(2, '0')}</span>
                      {state === 'complete' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-label="Complete" /> : state === 'current' ? <Clock className="w-4 h-4 text-amber-400" aria-label="Current stage" /> : state === 'cancelled' ? <AlertCircle className="w-4 h-4 text-red-400" aria-label="Order not progressing" /> : <Clock className="w-4 h-4 text-stone-600" aria-label="Upcoming" />}
                    </div>
                    <h4 className="font-bold text-xs text-white dark:text-white light:text-stone-900">{step.title}</h4>
                    <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>
            {orderIsCancelled && (
              <p className="mt-4 rounded-xl border border-red-800/50 bg-red-950/20 p-3 text-xs text-red-300">This order is marked as {displayStatus}. Contact customer support if you believe this is incorrect.</p>
            )}

            {/* Transport details banner */}
            {order.trackingNumber && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-950/30 dark:bg-emerald-950/30 light:bg-emerald-50 border border-emerald-800/40 text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    Transport Lorry Receipt (LR) Details
                  </span>
                  <div className="font-mono text-sm font-bold text-white dark:text-white light:text-stone-900 mt-0.5">
                    LR No: {order.trackingNumber}
                  </div>
                  <div className="text-stone-400 mt-0.5">
                    Agency: {order.lorryTransportName}
                  </div>
                </div>

                <a
                  href={`https://wa.me/${STORE_INFO.phone}?text=${encodeURIComponent(
                    `Hello RedThunder Crackers, please share LR status and godown contact for order #${order.orderId}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Ask LR on WhatsApp</span>
                </a>
              </div>
            )}
          </div>

          {/* Itemized Order Breakdown */}
          <div className="bg-stone-900/90 dark:bg-stone-900/90 light:bg-white rounded-2xl border border-stone-800 dark:border-stone-800 light:border-stone-200 p-6 shadow-xl">
            <h3 className="font-display text-base font-bold text-white dark:text-white light:text-stone-900 mb-4">
              Items Ordered ({order.items.length} varieties, {order.totalBoxes} units)
            </h3>

            <div className="overflow-x-auto border border-stone-800 dark:border-stone-800 light:border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-950 dark:bg-stone-950 light:bg-stone-100 text-stone-400 font-semibold border-b border-stone-800 dark:border-stone-800 light:border-stone-200">
                    <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                    <th className="py-2.5 px-3">Cracker Item</th>
                    <th className="py-2.5 px-2 text-center w-16">Unit</th>
                    <th className="py-2.5 px-3 text-right w-20">Rate</th>
                    <th className="py-2.5 px-2 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-24">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80 dark:divide-stone-800/80 light:divide-stone-200 text-stone-300 dark:text-stone-300 light:text-stone-700">
                  {order.items.map((it) => (
                    <tr key={it.productId}>
                      <td className="py-2 px-3 text-center font-mono text-amber-500 font-bold">
                        {it.sNo}
                      </td>
                      <td className="py-2 px-3 font-semibold text-white dark:text-white light:text-stone-900">
                        {it.name}
                      </td>
                      <td className="py-2 px-2 text-center">{it.unit}</td>
                      <td className="py-2 px-3 text-right tabular-nums">₹{it.rate}</td>
                      <td className="py-2 px-2 text-center font-bold text-amber-400 tabular-nums">
                        {it.quantity}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-white dark:text-white light:text-stone-900 tabular-nums">
                        ₹{it.lineTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm font-bold pt-3 border-t border-stone-800 dark:border-stone-800 light:border-stone-200">
              <span className="text-stone-400">Order Product Subtotal:</span>
              <span className="font-display text-xl text-amber-400 tabular-nums">
                ₹{order.subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
