import React, { useMemo } from 'react';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Phone, MessageCircle, Mail, FileText } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ProductImage } from '../components/ProductImage';
import type { ScreenId } from '../components/Navbar';
import { CartRecommendations } from '../components/CartRecommendations';
import { OrderVerificationFunnel } from '../components/OrderVerificationFunnel';
import { setShopIntent } from '../utils/shopNavigation';

interface CartPageScreenProps { onNavigate: (screen: ScreenId) => void; onOpenInvoice?: () => void; }

export const CartPageScreen: React.FC<CartPageScreenProps> = ({ onNavigate }) => {
  const { cart, subtotal, totalBoxes, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const savings = useMemo(() => cart.reduce((sum, item) => {
    const mrp = Number((item.product as typeof item.product & { mrpRate?: number }).mrpRate || 0);
    return sum + Math.max(0, mrp - item.product.rate) * item.quantity;
  }, 0), [cart]);
  const shortfall = Math.max(0, 3000 - subtotal);

  return <div className="rt-cart-page" data-rtc-component="product_shortlist">
    <div className="rt-container">
      <div className="rt-shop-header">
        <div><span className="rt-kicker">Product shortlist</span><h1>Your Enquiry List</h1><p>Keep a local reference list while browsing. This website does not accept online fireworks orders or payments.</p></div>
        {cart.length > 0 && <button className="rt-clear-btn" onClick={clearCart}><Trash2 /> Clear shortlist</button>}
      </div>
      {cart.length === 0 ? <div className="rt-empty-state cart-empty"><ShoppingBag /><h2>Your shortlist is empty</h2><p>Browse the catalogue and add products to a local list for reference. Nothing is ordered or reserved.</p><div><button onClick={() => onNavigate('products')}>Browse Products</button><button className="outline" onClick={() => onNavigate('table')}>Open Price List</button></div></div> : <>
        <OrderVerificationFunnel compact />
        <div className="rt-cart-layout">
          <section className="rt-cart-items">
            <div className="rt-cart-value-panel">
              <div><span>Varieties</span><strong>{totalItems}</strong></div>
              <div><span>Total units</span><strong>{totalBoxes}</strong></div>
              <div><span>Price difference</span><strong>₹{savings.toLocaleString('en-IN')}</strong></div>
              <div className="grand"><span>Reference subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
            </div>
            {cart.map(({ product, quantity }) => <article className="rt-cart-item" key={product.id}>
              <button className="rt-cart-item-image" onClick={() => { setShopIntent({ type: 'search', value: product.name }); onNavigate('products'); }} aria-label={`View ${product.name}`}>
                <ProductImage product={product} loading="lazy" alt={`${product.name} – Makka & Wheat brand Sivakasi crackers`} />
              </button>
              <div className="rt-cart-item-main"><span>{product.category}</span><h2>{product.name}</h2><p>₹{product.rate.toLocaleString('en-IN')} · {product.unit}{product.pieces ? ` · ${product.pieces}` : ''}</p></div>
              <div className="rt-cart-item-actions"><strong>₹{(product.rate * quantity).toLocaleString('en-IN')}</strong><div className="rt-qty-control"><button onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={`Decrease ${product.name}`}><Minus /></button><span aria-live="polite">{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1)} aria-label={`Increase ${product.name}`}><Plus /></button></div><button className="rt-remove-btn" onClick={() => removeFromCart(product.id)}><Trash2 /> Remove</button></div>
            </article>)}
            <div className="rt-cart-assurance"><ShieldCheck /><div><strong>Catalogue reference only</strong><span>Displayed prices and availability can change. No reservation, order, payment or dispatch request is created by this list.</span></div></div>
            <CartRecommendations onNavigate={() => onNavigate('products')} />
          </section>
          <aside className="rt-checkout-card rt-enquiry-card" aria-label="Contact sales for product information">
            <div className="rt-checkout-head"><div><span className="rt-kicker">Direct support</span><h2>Talk to the Sales Team</h2></div><MessageCircle /></div>
            <p>This website is a catalogue and does not accept online fireworks orders. Contact the licensed business directly for product information and to discuss any lawful offline transaction.</p>
            <div className="rt-cod-trust-card"><strong>Business terms supplied by RedThunder</strong><span>COD-only terms and the ₹3,000 minimum for requested Sivakasi godown dispatch apply only to permitted offline fulfilment arrangements agreed directly. They do not enable an online checkout here.</span></div>
            <div className="rt-cart-value-panel"><div><span>Selected varieties</span><strong>{totalItems}</strong></div><div><span>Total units</span><strong>{totalBoxes}</strong></div><div className="grand"><span>Reference subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div></div>
            <div className="rt-readiness-track" aria-label="Reference subtotal relative to three thousand rupees"><i style={{ width: `${Math.min(100, subtotal / 3000 * 100)}%` }} /></div>
            <p className="rt-checkout-note">{shortfall > 0 ? `Reference subtotal is ₹${shortfall.toLocaleString('en-IN')} below the stated ₹3,000 minimum for requested Sivakasi godown dispatch. Confirm conditions with sales.` : 'Reference subtotal meets the stated ₹3,000 threshold; this is not an order or dispatch confirmation.'}</p>
            <a className="rt-btn rt-btn-whatsapp rt-full-btn" href="https://wa.me/918124100501" target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp +91 8124100501</a>
            <a className="rt-btn rt-btn-outline rt-full-btn" href="tel:+918124100501"><Phone /> Call sales</a>
            <a className="rt-mail-link" href="mailto:sales@rtcrackers.com"><Mail /> Email sales@rtcrackers.com</a>
            <p className="rt-no-cancel-summary">For any lawful offline transaction, clarify all terms directly. No cancellations or returns are permitted once the order is verified and dispatched, as stated by the business.</p>
          </aside>
        </div>
      </>}
    </div>
  </div>;
};
