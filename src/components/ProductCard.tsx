import React from 'react';
import { Minus, Plus, ShoppingCart, Sparkles } from 'lucide-react';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { getExactProductImage } from '../utils/productImages';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  onViewDetails?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false, onViewDetails }) => {
  const { getItemQuantity, addToCart, updateQuantity } = useCart();
  const quantity = getItemQuantity(product.id);
  const soldOut = product.stockStatus === 'OUT_OF_STOCK';
  const liveProduct = product as Product & { mrpRate?: number; availableQuantity?: number; isBestseller?: boolean };
  const mrpRate = Number(liveProduct.mrpRate || 0);
  const hasDiscount = mrpRate > product.rate;
  const discount = hasDiscount ? Math.max(1, Math.round((1 - product.rate / mrpRate) * 100)) : 0;
  const image = getExactProductImage(product);

  return (
    <article data-rtc-component="product_card" className={`rt-product-card ${compact ? 'compact' : ''} ${soldOut ? 'sold-out' : ''}`}>
      <div className="rt-product-media">
        {onViewDetails ? (
          <button className="rt-product-image-button" onClick={onViewDetails} aria-label={`View details for ${product.name}`}>
            <img loading="lazy" decoding="async" width={520} height={520} src={image} alt={product.name} />
          </button>
        ) : (
          <img loading="lazy" decoding="async" width={520} height={520} src={image} alt={product.name} />
        )}
        {(product.popular || liveProduct.isBestseller) && <span className="rt-product-badge"><Sparkles /> Popular</span>}
        {discount > 0 && <span className="rt-discount-badge">{discount}% OFF</span>}
        {soldOut && <span className="rt-stock-badge">Sold out</span>}
      </div>

      <div className="rt-product-body">
        <div className="rt-product-kicker"><span>{product.category}</span><span>{product.unit}</span></div>
        <button className="rt-product-title" onClick={onViewDetails} disabled={!onViewDetails} aria-label={onViewDetails ? `View ${product.name}` : product.name}>{product.name}</button>
        {!compact && <p className="rt-product-description">{product.description}</p>}
        {product.pieces && <small className="rt-product-pack">Pack: {product.pieces}</small>}

        <div className="rt-product-price-row">
          <div className="rt-product-price-block">
            <span className="rt-product-price-label">Factory direct</span>
            <strong>₹{product.rate.toLocaleString('en-IN')}</strong>
            {hasDiscount && <del>₹{mrpRate.toLocaleString('en-IN')}</del>}
          </div>
          {quantity === 0 ? (
            <button className="rt-add-btn" disabled={soldOut} onClick={() => addToCart(product, 1)} aria-label={`Add ${product.name} to cart`}>
              <ShoppingCart /> Add
            </button>
          ) : (
            <div className="rt-qty-control" aria-label={`Quantity controls for ${product.name}`}>
              <button onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={`Decrease ${product.name}`}><Minus /></button>
              <span>{quantity}</span>
              <button onClick={() => addToCart(product, 1)} aria-label={`Increase ${product.name}`}><Plus /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
