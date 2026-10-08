import React, { useMemo } from 'react';
import { ArrowRight, Gift, Sparkles } from 'lucide-react';
import type { ScreenId } from './Navbar';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';
import { getExactProductImage } from '../utils/productImages';
import { setShopIntent } from '../utils/shopNavigation';

interface GiftBoxesShowcaseProps {
  isStandaloneScreen?: boolean;
  onNavigate?: (screen: ScreenId) => void;
}

export const GiftBoxesShowcase: React.FC<GiftBoxesShowcaseProps> = ({ isStandaloneScreen = false, onNavigate }) => {
  const { products, isLoading } = useProducts();
  const { addToCart } = useCart();
  const giftBoxes = useMemo(() => products
    .filter((product) => product.stockStatus !== 'OUT_OF_STOCK')
    .filter((product) => product.category.toLowerCase().includes('gift box'))
    .sort((a, b) => a.rate - b.rate), [products]);

  return (
    <section className={`rt-gift-boxes-page ${isStandaloneScreen ? 'is-standalone' : ''}`} aria-labelledby="gift-boxes-heading">
      <div className="rt-container">
        <header className="rt-combo-packs-head">
          <div>
            <span className="rt-kicker"><Gift size={14} /> Live Gift Box catalogue</span>
            <h1 id="gift-boxes-heading">Gift Boxes & Family Packs</h1>
            <p>These are the existing Gift Box products from your live catalogue. For curated multi-product combos, visit the dedicated Combo Packs catalogue.</p>
          </div>
          {onNavigate && <button className="rt-btn rt-btn-outline" onClick={() => onNavigate('combos')}><Sparkles size={16} /> Explore Combo Packs</button>}
        </header>

        {isLoading ? (
          <div className="rt-product-grid">
            {Array.from({ length: 8 }).map((_, index) => <div className="rt-skeleton rt-product-skeleton" key={index} />)}
          </div>
        ) : giftBoxes.length ? (
          <div className="rt-gift-grid">
            {giftBoxes.map((product) => (
              <article className="rt-combo-card" key={product.id}>
                <div className="rt-combo-image-wrap"><img src={getExactProductImage(product)} alt={product.name} loading="lazy" decoding="async" /><span className="rt-combo-popular">{product.popular ? 'Popular' : 'Gift Box'}</span></div>
                <div className="rt-combo-body">
                  <span className="rt-combo-kicker">{product.pieces || product.unit}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description || 'Ready-made family celebration gift box from the live catalogue.'}</p>
                  <div className="rt-combo-footer">
                    <div><span>Factory Rate</span><strong>₹{Math.round(product.rate).toLocaleString('en-IN')}</strong></div>
                    <div className="rt-gift-actions">
                      <button type="button" className="rt-gift-shop-btn" onClick={() => {
                        setShopIntent({ type: 'search', value: product.name });
                        onNavigate?.('products');
                      }} aria-label={`Shop ${product.name}`}>Shop <ArrowRight size={14} /></button>
                      <button type="button" className="rt-gift-add-btn" onClick={() => addToCart(product, 1)} aria-label={`Add ${product.name} to cart`}>Add</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rt-empty-state"><Gift size={30} /><h2>No Gift Boxes currently available</h2><p>The Gift Boxes category is empty in the live product catalogue.</p></div>
        )}
      </div>
    </section>
  );
};

export default GiftBoxesShowcase;
