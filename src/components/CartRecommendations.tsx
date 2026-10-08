import React, { useMemo } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import { getExactProductImage } from '../utils/productImages';
import type { Product } from '../data/products';

interface CartRecommendationsProps {
  onNavigate?: () => void;
}

export const CartRecommendations: React.FC<CartRecommendationsProps> = ({ onNavigate }) => {
  const { products } = useProducts();
  const { cart, addToCart } = useCart();

  const recommendations = useMemo(() => {
    const cartIds = new Set(cart.map((item) => item.product.id));
    const cartCategories = new Set(cart.map((item) => item.product.category.toLowerCase()));
    const subtotal = cart.reduce((sum, item) => sum + item.product.rate * item.quantity, 0);
    const ceiling = Math.max(750, subtotal * 0.35);

    return products
      .filter((product) => !cartIds.has(product.id) && product.stockStatus !== 'OUT_OF_STOCK')
      .map((product) => {
        let score = 0;
        if (cartCategories.has(product.category.toLowerCase())) score += 5;
        if (product.isBestseller || product.popular) score += 4;
        if (product.isFeatured || product.featured) score += 2;
        if (product.rate <= ceiling) score += 2;
        if ((product.availableQuantity ?? 0) > 0) score += 1;
        return { product, score };
      })
      .sort((a, b) => b.score - a.score || a.product.rate - b.product.rate)
      .slice(0, 4)
      .map(({ product }) => product);
  }, [cart, products]);

  if (!recommendations.length) return null;

  return (
    <section className="rt-cart-recommendations" aria-labelledby="cart-recommendations-heading" data-rtc-component="cart_recommendations">
      <div className="rt-cart-recommendation-head">
        <div>
          <span className="rt-kicker"><Sparkles size={14} /> Build a better celebration</span>
          <h2 id="cart-recommendations-heading">Complete your order</h2>
        </div>
        {onNavigate && <button onClick={onNavigate}>View catalogue</button>}
      </div>
      <div className="rt-cart-recommendation-grid">
        {recommendations.map((product: Product) => (
          <article className="rt-cart-recommendation-card" key={product.id}>
            <img src={getExactProductImage(product)} alt="" loading="lazy" decoding="async" />
            <div className="rt-cart-recommendation-body">
              <span>{product.category}</span>
              <h3>{product.name}</h3>
              <div><strong>₹{product.rate.toLocaleString('en-IN')}</strong><small>{product.unit}</small></div>
              <button onClick={() => addToCart(product, 1)} aria-label={`Add ${product.name} to cart`}><Plus size={15} /> Add</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
