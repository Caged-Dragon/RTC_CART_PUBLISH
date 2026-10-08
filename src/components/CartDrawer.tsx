import React from 'react';
import { ArrowRight, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { useStore } from '../context/StoreContext';
import { getExactProductImage } from '../utils/productImages';
import { CartRecommendations } from './CartRecommendations';

interface CartDrawerProps { onOpenCheckout: () => void; onOpenInvoice: () => void; }

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout, onOpenInvoice }) => {
  const { storeInfo, merchant } = useStore();
  const { products } = useProducts();
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, totalItems, totalBoxes, subtotal } = useCart();
  if (!isCartOpen) return null;
  const savings = cart.reduce((sum, item) => { const mrp = Number((item.product as any).mrpRate || 0); return sum + Math.max(0, mrp - item.product.rate) * item.quantity; }, 0);
  const minimumProgress = merchant.minimumOrderValue > 0 ? Math.min(100, (subtotal / merchant.minimumOrderValue) * 100) : 100;

  return (
    <div className="rt-drawer-shell">
      <button className="rt-drawer-backdrop" aria-label="Close cart" onClick={() => setIsCartOpen(false)} />
      <aside className="rt-cart-drawer" aria-label="Shopping cart">
        <div className="rt-drawer-head"><div><span className="rt-kicker">Your cart</span><h2><ShoppingBag /> {totalBoxes} units</h2><small>{totalItems} varieties · ₹{subtotal.toLocaleString('en-IN')}</small></div><button onClick={() => setIsCartOpen(false)} aria-label="Close cart"><X /></button></div>
        <div className="rt-drawer-body">
          {!cart.length ? (
            <div className="rt-drawer-empty"><ShoppingBag /><h3>Your cart is empty</h3><p>Add crackers from the catalogue and your selections will appear here.</p><button onClick={() => setIsCartOpen(false)}>Continue Shopping</button></div>
          ) : (
            <>
              <div className="rt-drawer-list-head"><strong>Selected items</strong><button onClick={clearCart}><Trash2 /> Clear all</button></div>
              <div className="rt-drawer-progress"><div><span>{subtotal >= merchant.minimumOrderValue ? 'Minimum order reached' : `₹${Math.max(0, merchant.minimumOrderValue - subtotal).toLocaleString('en-IN')} to minimum order`}</span><strong>{Math.round(minimumProgress)}%</strong></div><i><b style={{width:`${minimumProgress}%`}} /></i></div>
              {cart.map(({ product, quantity }) => (
                <article key={product.id} className="rt-drawer-item">
                  <img loading="lazy" src={getExactProductImage(product)} alt="" />
                  <div><span>{product.category}</span><h3>{product.name}</h3><small>₹{product.rate.toLocaleString('en-IN')} × {quantity}</small></div>
                  <div className="rt-drawer-item-actions"><strong>₹{(product.rate * quantity).toLocaleString('en-IN')}</strong><div className="rt-qty-control"><button onClick={() => updateQuantity(product.id, quantity - 1)} aria-label="Decrease"><Minus /></button><span>{quantity}</span><button onClick={() => updateQuantity(product.id, quantity + 1)} aria-label="Increase"><Plus /></button></div><button className="rt-remove-btn" onClick={() => removeFromCart(product.id)} aria-label="Remove item"><Trash2 /></button></div>
                </article>
              ))}
              <CartRecommendations />
            </>
          )}
        </div>
        {!!cart.length && <div className="rt-drawer-footer"><div className="rt-drawer-value-grid"><div><span>Units</span><strong>{totalBoxes}</strong></div><div><span>Varieties</span><strong>{totalItems}</strong></div>{savings > 0 && <div><span>You save</span><strong>₹{savings.toLocaleString('en-IN')}</strong></div>}</div><div className="rt-drawer-total"><span>Subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div><button className="rt-btn rt-btn-whatsapp rt-full-btn" onClick={onOpenCheckout}>Checkout / WhatsApp Order <ArrowRight /></button><button className="rt-drawer-secondary" onClick={onOpenInvoice}>View / Print Bill</button><a href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer"><MessageCircle /> Need help? Chat on WhatsApp</a></div>}
      </aside>
    </div>
  );
};
