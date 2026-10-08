import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Copy, FileText, Mail, MapPin, MessageCircle, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import type { PlacedOrder } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { getExactProductImage } from '../utils/productImages';
import { useAuth } from '../context/AuthContext';
import { formatWhatsAppMessage, getWhatsAppUrl, openWhatsAppAfter } from '../utils/whatsapp';
import { useToast } from '../context/ToastContext';
import type { ScreenId } from '../components/Navbar';
import { MinimumOrderBooster } from '../components/MinimumOrderBooster';
import { CartRecommendations } from '../components/CartRecommendations';
import { setShopIntent } from '../utils/shopNavigation';

interface CartPageScreenProps { onNavigate: (screen: ScreenId) => void; onOpenInvoice: () => void; }

export const CartPageScreen: React.FC<CartPageScreenProps> = ({ onNavigate, onOpenInvoice }) => {
  const { storeInfo, merchant } = useStore();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { cart, subtotal, totalBoxes, totalItems, updateQuantity, removeFromCart, clearCart, customerDetails, updateCustomerDetails, placeOrder } = useCart();
  const savings = useMemo(() => cart.reduce((sum, item) => {
    const mrp = Number((item.product as typeof item.product & { mrpRate?: number }).mrpRate || 0);
    return sum + Math.max(0, mrp - item.product.rate) * item.quantity;
  }, 0), [cart]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savedOrder, setSavedOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => { if (cart.length > 0 && savedOrder) setSavedOrder(null); }, [cart.length, savedOrder]);

  const shortfall = Math.max(0, merchant.minimumOrderValue - subtotal);
  const meetsMinimum = shortfall === 0;
  const contactOk = customerDetails.name.trim().length > 1 && /^\d{10}$/.test(customerDetails.phone.replace(/\D/g, '').slice(-10)) && customerDetails.city.trim().length > 0;
  const canOrder = merchant.isBookingOpen && meetsMinimum && cart.length > 0 && contactOk;
  const orderProgress = merchant.minimumOrderValue > 0 ? Math.min(100, (subtotal / merchant.minimumOrderValue) * 100) : 100;
  const readyMessage = !merchant.isBookingOpen
    ? 'Season booking is closed'
    : meetsMinimum && contactOk
      ? 'Your order is ready to confirm'
      : !meetsMinimum
        ? `Add ₹${shortfall.toLocaleString('en-IN')} more to unlock checkout`
        : 'Complete the required delivery details to continue';

  const ensureOrder = async (): Promise<PlacedOrder> => {
    if (savedOrder) return savedOrder;
    if (!merchant.isBookingOpen) throw new Error('Season booking is currently closed. Please contact us on WhatsApp.');
    if (!meetsMinimum) throw new Error(`Minimum order is ₹${merchant.minimumOrderValue.toLocaleString('en-IN')}. Add ₹${shortfall.toLocaleString('en-IN')} more to continue.`);
    if (!contactOk) throw new Error('Please enter your name, a valid 10-digit phone number and your city.');
    const order = await placeOrder();
    setSavedOrder(order);
    showToast({ type: 'order', title: 'Order booked', message: `Order ${order.orderId} saved. Send it on WhatsApp to confirm with our team.` });
    return order;
  };

  const handleWhatsAppSend = async () => {
    if (busy) return;
    setBusy(true);
    try { await openWhatsAppAfter(async () => { const order = await ensureOrder(); return getWhatsAppUrl(order.items, order.customer, order.subtotal, order.orderId, storeInfo); }); }
    catch (error: any) { showToast({ type: 'error', title: 'Could not place order', message: error.message || 'Unable to place order.' }); }
    finally { setBusy(false); }
  };

  const handleCopyText = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const order = await ensureOrder();
      await navigator.clipboard.writeText(formatWhatsAppMessage(order.items, order.customer, order.subtotal, order.orderId, storeInfo));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (error: any) { showToast({ type: 'error', title: 'Could not place order', message: error.message || 'Unable to place order.' }); }
    finally { setBusy(false); }
  };

  if (savedOrder && cart.length === 0) {
    return (
      <div className="rt-cart-page" data-rtc-component="order_success">
        <div className="rt-container rt-success-wrap">
          <div className="rt-success-card">
            <div className="rt-success-icon"><Check /></div>
            <span className="rt-kicker">Booking saved</span>
            <h1>Order booked successfully!</h1>
            <p>Booking <strong>{savedOrder.orderId}</strong> for {savedOrder.totalBoxes} units · ₹{savedOrder.subtotal.toLocaleString('en-IN')} is saved. Send it on WhatsApp so the Sivakasi team can confirm stock and freight.</p>
            {savedOrder.guestTrackingToken && !isAuthenticated && <div className="rt-guest-token">Guest tracking code: <strong>{savedOrder.guestTrackingToken}</strong></div>}
            <div className="rt-success-actions">
              <a className="rt-btn rt-btn-whatsapp" href={getWhatsAppUrl(savedOrder.items, savedOrder.customer, savedOrder.subtotal, savedOrder.orderId, storeInfo)} target="_blank" rel="noreferrer"><MessageCircle /> Send on WhatsApp</a>
              <button className="rt-btn rt-btn-outline" onClick={handleCopyText}>{copied ? <Check /> : <Copy />} {copied ? 'Copied!' : 'Copy Order Text'}</button>
              <button className="rt-btn rt-btn-outline" onClick={() => onNavigate(isAuthenticated ? 'myorders' : 'tracker')}><Truck /> Track Order</button>
              <button className="rt-link-button" onClick={() => { setSavedOrder(null); onNavigate('products'); }}>Continue shopping</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rt-cart-page" data-rtc-component="cart_items">
      <div className="rt-container">
        <div className="rt-shop-header">
          <div><span className="rt-kicker">Order review</span><h1>Your Cart</h1><p>Review your products, enter delivery details and confirm your order.</p></div>
          {cart.length > 0 && <button className="rt-clear-btn" onClick={clearCart}><Trash2 /> Clear cart</button>}
        </div>

        {cart.length === 0 ? (
          <div className="rt-empty-state cart-empty"><ShoppingBag /><h2>Your cart is empty</h2><p>Choose crackers from the live catalogue or open the price list to start building your celebration order.</p><div><button onClick={() => onNavigate('products')}>Browse Products</button><button className="outline" onClick={() => onNavigate('table')}>Open Price List</button></div></div>
        ) : (
          <>
            <div className="rt-cart-progress-strip" role="status" aria-live="polite">
              <div className="rt-cart-progress-copy"><span>Step 1 of 3 · Cart review</span><strong>{readyMessage}</strong></div>
              <div className="rt-cart-progress-steps"><i className="done">1</i><span></span><i className={contactOk && meetsMinimum ? 'done' : ''}>2</i><span></span><i>3</i></div>
            </div>
            <div className="rt-cart-layout">
              <section className="rt-cart-items">
                <div className="rt-cart-value-panel">
                  <div><span>Varieties</span><strong>{totalItems}</strong></div>
                  <div><span>Total units</span><strong>{totalBoxes}</strong></div>
                  <div><span>You save</span><strong>₹{savings.toLocaleString('en-IN')}</strong></div>
                  <div className="grand"><span>Cart value</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
                </div>
                {cart.map(({ product, quantity }) => {
                  const live = product as typeof product & { mrpRate?: number; availableQuantity?: number; stockStatus?: string };
                  const itemSavings = Math.max(0, Number(live.mrpRate || 0) - product.rate) * quantity;
                  return (
                    <article className="rt-cart-item" key={product.id}>
                      <button className="rt-cart-item-image" onClick={() => { setShopIntent({ type: 'search', value: product.name }); onNavigate('products'); }} aria-label={`View ${product.name}`}>
                        <img loading="lazy" src={getExactProductImage(product)} alt="" />
                      </button>
                      <div className="rt-cart-item-main">
                        <span>{product.category}</span>
                        <h2>{product.name}</h2>
                        <p>₹{product.rate.toLocaleString('en-IN')} · {product.unit}{product.pieces ? ` · ${product.pieces}` : ''}</p>
                        {product.stockStatus === 'LOW_STOCK' && <em className="rt-stock-alert">Few units currently available</em>}
                        {itemSavings > 0 && <small className="rt-item-saving">Saving ₹{itemSavings.toLocaleString('en-IN')} on this line</small>}
                      </div>
                      <div className="rt-cart-item-actions">
                        <strong>₹{(product.rate * quantity).toLocaleString('en-IN')}</strong>
                        <div className="rt-qty-control">
                          <button onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={`Decrease ${product.name}`}><Minus /></button>
                          <span aria-live="polite">{quantity}</span>
                          <button onClick={() => updateQuantity(product.id, quantity + 1)} aria-label={`Increase ${product.name}`}><Plus /></button>
                        </div>
                        <button className="rt-remove-btn" onClick={() => removeFromCart(product.id)}><Trash2 /> Remove</button>
                      </div>
                    </article>
                  );
                })}
                <div className="rt-cart-assurance"><ShieldCheck /><div><strong>Live catalogue protection</strong><span>Prices, product names and availability refresh from your live catalogue. Transport charges are confirmed separately before final payment.</span></div></div>
                <CartRecommendations onNavigate={() => onNavigate('products')} />
              </section>

              <aside className="rt-checkout-card">
              <div className="rt-checkout-head"><div><span className="rt-kicker">Checkout</span><h2>Delivery Details</h2></div><MapPin /></div>

              <div className="rt-form-grid">
                <label><span>Full name *</span><input value={customerDetails.name} onChange={(e) => updateCustomerDetails({ name: e.target.value })} placeholder="Your name" /></label>
                <label><span>WhatsApp / phone *</span><input type="tel" value={customerDetails.phone} onChange={(e) => updateCustomerDetails({ phone: e.target.value })} placeholder="10-digit number" /></label>
                <label><span>City / town *</span><input value={customerDetails.city} onChange={(e) => updateCustomerDetails({ city: e.target.value })} placeholder="Chennai, Madurai..." /></label>
                <label><span>Pincode</span><input value={customerDetails.pincode} onChange={(e) => updateCustomerDetails({ pincode: e.target.value })} placeholder="Optional" /></label>
                <label className="full"><span>Email {isAuthenticated ? '' : '(required for guest checkout)'}</span><input type="email" value={customerDetails.email} onChange={(e) => updateCustomerDetails({ email: e.target.value })} placeholder="you@example.com" /></label>
                <label className="full"><span>Address / landmark</span><textarea rows={3} value={customerDetails.address} onChange={(e) => updateCustomerDetails({ address: e.target.value })} placeholder="Door no., street, landmark or transport godown" /></label>
                <label className="full"><span>Transport preference</span><select value={customerDetails.transportPreference} onChange={(e) => updateCustomerDetails({ transportPreference: e.target.value })}><option value="Lorry Transport Parcel Office Pickup (Standard & Economical)">Lorry Transport Parcel Office Pickup</option><option value="Direct Sivakasi Godown / Counter Pickup">Direct Sivakasi Godown / Counter Pickup</option><option value="Home Delivery (Subject to local transport availability)">Home Delivery (subject to availability)</option></select></label>
              </div>

              <div className="rt-coupon-note"><strong>Festive offers</strong><span>Live catalogue prices and active store offers are reflected here automatically. No separate coupon is required.</span></div>

              <div className="rt-checkout-readiness">
                <div className="rt-readiness-head"><span>Minimum order progress</span><strong>{Math.round(orderProgress)}%</strong></div>
                <div className="rt-readiness-track"><i style={{ width: `${orderProgress}%` }} /></div>
                <small>{meetsMinimum ? 'Minimum order reached.' : `₹${shortfall.toLocaleString('en-IN')} more to reach ₹${merchant.minimumOrderValue.toLocaleString('en-IN')}.`}</small>
              </div>
              <div className="rt-order-summary">
                <div><span>Varieties</span><strong>{totalItems}</strong></div>
                <div><span>Total units</span><strong>{totalBoxes}</strong></div>
                {savings > 0 && <div className="saving"><span>Catalogue savings</span><strong>−₹{savings.toLocaleString('en-IN')}</strong></div>}
                <div className="total"><span>Product subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
              </div>

              {!merchant.isBookingOpen && <div className="rt-warning"><AlertCircle /> Season booking is currently closed. Please contact us on WhatsApp for availability.</div>}
              {merchant.isBookingOpen && !meetsMinimum && (
                <div className="rt-minimum-warning"><AlertCircle /><div><strong>Minimum order ₹{merchant.minimumOrderValue.toLocaleString('en-IN')}</strong><span>Add ₹{shortfall.toLocaleString('en-IN')} more to continue.</span><div className="rt-progress"><i style={{ width: `${Math.min(100, merchant.minimumOrderValue ? (subtotal / merchant.minimumOrderValue) * 100 : 100)}%` }} /></div><MinimumOrderBooster shortfall={shortfall} /></div></div>
              )}

              <button className="rt-btn rt-btn-whatsapp rt-full-btn" onClick={handleWhatsAppSend} disabled={!canOrder || busy}><MessageCircle /> {busy ? 'Preparing order…' : 'Send Order on WhatsApp'}</button>
              <div className="rt-checkout-secondary"><button onClick={handleCopyText} disabled={!canOrder || busy}>{copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy Order Text'}</button><button onClick={onOpenInvoice}><FileText /> View / Print Bill</button></div>
              <button className="rt-mail-link" onClick={() => onNavigate('mail')}><Mail /> Send Bill to Email</button>
              <div className="rt-cart-trust-row"><span><ShieldCheck /> Secure booking</span><span><MessageCircle /> WhatsApp support</span><span><Truck /> {storeInfo.city} dispatch</span></div>
              <p className="rt-checkout-note"><Truck /> {merchant.dispatchPolicy}</p>
            </aside>
            </div>
            <div className="rt-mobile-checkout-bar">
              <div><span>{totalBoxes} units</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
              <button onClick={handleWhatsAppSend} disabled={!canOrder || busy}><MessageCircle /> {busy ? 'Preparing…' : 'Confirm Order'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
