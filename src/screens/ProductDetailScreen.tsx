import React from 'react';
import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingCart, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { getExactProductImage } from '../utils/productImages';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailScreenProps {
  product: Product;
  related: Product[];
  onBack: () => void;
  onSelectRelated: (product: Product) => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ product, related, onBack, onSelectRelated }) => {
  const { getItemQuantity, addToCart, updateQuantity, setIsCartOpen } = useCart();
  const quantity = getItemQuantity(product.id);
  const image = getExactProductImage(product);
  const liveProduct = product as Product & { mrpRate?: number };
  const mrpRate = Number(liveProduct.mrpRate || 0);
  const hasDiscount = mrpRate > product.rate;
  const discount = hasDiscount ? Math.round((1 - product.rate / mrpRate) * 100) : 0;

  const openCart = () => {
    if (quantity === 0) addToCart(product, 1);
    setIsCartOpen(true);
  };

  return (
    <div className="rt-detail-page">
      <div className="rt-container">
        <button className="rt-back-link" onClick={onBack} aria-label="Back to all products"><ArrowLeft /> Back to products</button>
        <div className="rt-detail-layout">
          <div className="rt-detail-gallery">
            <div className="rt-detail-main-image"><img width={900} height={900} src={image} alt={product.name} decoding="async" fetchPriority="high" /></div>
            <div className="rt-detail-trust"><span><ShieldCheck /> Genuine factory stock</span><span><Truck /> Sivakasi dispatch</span><span><CheckCircle2 /> Live catalogue price</span></div>
          </div>
          <div className="rt-detail-content">
            <span className="rt-detail-category">{product.category} · {product.unit}</span>
            <h1>{product.name}</h1>
            <p className="rt-detail-description">{product.description}</p>
            {product.pieces && <div className="rt-detail-pack">Pack information: <strong>{product.pieces}</strong></div>}
            <div className="rt-detail-price">
              <strong>₹{product.rate.toLocaleString('en-IN')}</strong>
              {hasDiscount && <><del>₹{mrpRate.toLocaleString('en-IN')}</del><span>{discount}% OFF</span></>}
            </div>
            <div className="rt-detail-order-row">
              {quantity > 0 ? (
                <div className="rt-qty-control large">
                  <button onClick={() => updateQuantity(product.id, quantity - 1)} aria-label="Decrease quantity"><Minus /></button>
                  <span>{quantity}</span>
                  <button onClick={() => addToCart(product, 1)} aria-label="Increase quantity"><Plus /></button>
                </div>
              ) : (
                <button className="rt-btn rt-btn-primary" disabled={product.stockStatus === 'OUT_OF_STOCK'} onClick={() => addToCart(product, 1)} aria-label={`Add ${product.name} to cart`}><ShoppingCart /> Add to Cart</button>
              )}
              <button className="rt-btn rt-btn-outline" disabled={product.stockStatus === 'OUT_OF_STOCK'} onClick={openCart} aria-label={`Buy ${product.name} now`}>Buy Now</button>
            </div>
            <div className="rt-detail-note"><strong>Ordering note</strong><span>Transport charges, availability and final dispatch details are confirmed before payment.</span></div>

            <div className="rt-specs">
              <div><span>Product No.</span><strong>#{product.sNo}</strong></div>
              <div><span>Category</span><strong>{product.category}</strong></div>
              <div><span>Unit</span><strong>{product.unit}</strong></div>
              <div><span>Availability</span><strong>{product.stockStatus === 'OUT_OF_STOCK' ? 'Out of stock' : product.stockStatus === 'LOW_STOCK' ? 'Few left' : 'In stock'}</strong></div>
            </div>
          </div>
        </div>

        <section className="rt-related-section" aria-labelledby="related-heading">
          <div className="rt-section-heading"><div><span className="rt-kicker">Keep browsing</span><h2 id="related-heading">Related Products</h2></div></div>
          <div className="rt-product-grid">{related.slice(0, 4).map((item) => <ProductCard key={item.id} product={item} compact onViewDetails={() => onSelectRelated(item)} />)}</div>
        </section>
      </div>
    </div>
  );
};
