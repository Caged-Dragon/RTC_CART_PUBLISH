import React, { useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  Headphones,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  WalletCards,
} from 'lucide-react';
import type { ScreenId } from '../components/Navbar';
import { useStore } from '../context/StoreContext';
import { useProducts } from '../context/ProductsContext';
import { useCategories } from '../context/CategoriesContext';
import { setShopIntent } from '../utils/shopNavigation';
import { ProductCard } from '../components/ProductCard';
import { getExactProductImage } from '../utils/productImages';
import { HomeBanner } from '../components/HomeBanner';
import { LiveOffersSection } from '../components/LiveOffersSection';
import { useCart } from '../context/CartContext';
import { useHomepagePicks } from '../context/HomepagePicksContext';

interface IntroScreenProps { onNavigate: (screen: ScreenId) => void; }

const benefits = [
  { icon: BadgeCheck, title: 'Direct from Sivakasi', text: 'Factory-source pricing' },
  { icon: WalletCards, title: 'Best Pricing', text: 'Competitive festive rates' },
  { icon: Box, title: 'Wide Product Range', text: '500+ varieties' },
  { icon: MessageCircle, title: 'Easy Ordering', text: 'Online & WhatsApp' },
  { icon: ShieldCheck, title: 'Safe & Secure', text: 'Secure payment flow' },
  { icon: Headphones, title: 'Customer Support', text: 'Quick assistance' },
];

const budgets = [
  { value: '₹500', title: 'Celebration', text: 'For small celebrations', band: 'u500' },
  { value: '₹1,000', title: 'Family Pack', text: 'For a small family', band: 'u1000' },
  { value: '₹2,000', title: 'Festival Pack', text: 'For family & friends', band: 'u2000' },
  { value: '₹5,000', title: 'Grand Celebration', text: 'For a bigger celebration', band: 'u5000' },
  { value: '₹10,000+', title: 'Mega Celebration', text: 'For a complete festive shopping', band: 'o5000' },
];

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNavigate }) => {
  const { storeInfo } = useStore();
  const { products, isLoading } = useProducts();
  const { categories } = useCategories();
  const { totalBoxes, subtotal } = useCart();
  const { picks: homepagePicks, isLoading: picksLoading } = useHomepagePicks();

  const categoryCards = useMemo(() => {
    return categories.filter((category) => category.is_active).map((category) => {
      const sample = products.find((product) => product.category === category.category_name);
      return { ...category, image: category.image_url || (sample ? getExactProductImage(sample) : '/images/redthunder_hero_crackers_1791297525760.jpg') };
    });
  }, [categories, products]);

  const bestSellers = useMemo(() => {
    if (homepagePicks.length) return homepagePicks.slice(0, 6).map((pick) => pick.product);
    return products.slice().filter((product) => product.stockStatus !== 'OUT_OF_STOCK').sort((a, b) => Number(!!b.popular || !!b.isBestseller) - Number(!!a.popular || !!a.isBestseller) || a.sNo - b.sNo).slice(0, 6);
  }, [homepagePicks, products]);

  const openBudget = (band: string) => {
    onNavigate('products');
    setShopIntent({ type: 'budget', value: band });
  };

  return (
    <div className="rt-home">
      <HomeBanner onNavigate={onNavigate} />
      <LiveOffersSection />

      <section className="rt-trust-strip" aria-label="Store benefits">
        <div className="rt-container rt-trust-scroll">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div className="rt-trust-card" key={title}>
              <span><Icon /></span>
              <div><strong>{title}</strong><small>{text}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="rt-section rt-section-white" aria-labelledby="category-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Shop by</span><h2 id="category-heading">Category</h2></div>
            <button className="rt-section-link" onClick={() => onNavigate('products')}>View All Categories <ArrowRight /></button>
          </div>
          <div className="rt-category-grid">
            {isLoading && !categoryCards.length
              ? Array.from({ length: 8 }).map((_, index) => <div className="rt-skeleton rt-category-skeleton" key={index} />)
              : categoryCards.slice(0, 8).map((category) => (
                <button key={category.category_id} className="rt-category-card" onClick={() => {
                  onNavigate('products');
                  setShopIntent({ type: 'category', value: category.category_name });
                }}>
                  <div className="rt-category-image"><img loading="lazy" src={category.image} alt="" /></div>
                  <strong>{category.category_name.replace(/Colourful|Colourfull/g, 'Colour')}</strong>
                </button>
              ))}
          </div>
        </div>
      </section>

      <section className="rt-section rt-best-section" aria-labelledby="best-heading">
        <div className="rt-container">
          <div className="rt-section-heading rt-dark-heading">
            <div><span className="rt-kicker">Most loved</span><h2 id="best-heading">Best Sellers</h2></div>
            <button className="rt-section-link light" onClick={() => { onNavigate('products'); setShopIntent({ type: 'best-sellers' }); }}>View All <ArrowRight /></button>
          </div>
          <div className="rt-product-grid home-grid">
            {picksLoading && !bestSellers.length ? Array.from({ length: 6 }).map((_, index) => <div className="rt-skeleton rt-product-skeleton" key={index} />) : bestSellers.map((product, index) => { const pick = homepagePicks.find((item) => item.product.id === product.id); return <div className="rt-home-pick-wrap" key={product.id}>{pick && <div className="rt-home-pick-meta"><span>{pick.badgeText}</span><strong>{pick.customerLabel}</strong>{pick.ratingStars != null && pick.ratingCount > 0 ? <small>★ {pick.ratingStars.toFixed(1)} · {pick.ratingCount} reviews</small> : <small>{pick.customerReason}</small>}</div>}<ProductCard product={product} compact /></div>; })}
          </div>
        </div>
      </section>

      <section className="rt-section rt-section-white" aria-labelledby="budget-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Find your fit</span><h2 id="budget-heading">Shop by Budget</h2></div>
            <span className="rt-heading-note">Choose a spend level and build your celebration cart.</span>
          </div>
          <div className="rt-budget-grid">
            {budgets.map((budget) => (
              <button className="rt-budget-card" key={budget.value} onClick={() => openBudget(budget.band)}>
                <span>{budget.value}</span>
                <strong>{budget.title}</strong>
                <small>{budget.text}</small>
                <em>Shop Now <ArrowRight /></em>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rt-section rt-home-combo-teaser" aria-labelledby="combo-teaser-heading"><div className="rt-container rt-home-combo-teaser-inner"><div><span className="rt-kicker">Curated for easy shopping</span><h2 id="combo-teaser-heading">Find your perfect gift box</h2><p>Choose from our live family, premium and celebration packs without crowding your home page.</p></div><button className="rt-btn rt-btn-primary" onClick={() => onNavigate('gift-boxes')}>Explore Gift Boxes <ArrowRight /></button></div></section>

      <section className="rt-section rt-how-section" aria-labelledby="how-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Simple & transparent</span><h2 id="how-heading">How to Order</h2></div>
            {totalBoxes > 0 && <div className="rt-cart-summary-inline"><ShoppingCart /> {totalBoxes} items · ₹{subtotal.toLocaleString('en-IN')}</div>}
          </div>
          <div className="rt-how-grid">
            {[
              { icon: Search, step: '01', title: 'Select Products', text: 'Browse the catalogue and choose your crackers.' },
              { icon: ShoppingCart, step: '02', title: 'Add to Cart', text: 'Set quantities and review your live cart.' },
              { icon: CheckCircle2, step: '03', title: 'Confirm Order', text: 'Enter delivery details and confirm the order.' },
              { icon: Truck, step: '04', title: 'Delivery / Dispatch', text: `We verify stock and arrange dispatch from ${storeInfo.city}.` },
            ].map(({ icon: Icon, step, title, text }, index) => (
              <div className="rt-how-step" key={step}>
                <span className="rt-step-number">{step}</span>
                <div className="rt-step-icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < 3 && <span className="rt-step-line" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rt-service-strip" aria-label="Service assurances">
        <div className="rt-container rt-service-grid">
          <div><PackageCheck /><strong>Delivery Across India*</strong><small>Subject to regulations</small></div>
          <div><WalletCards /><strong>Multiple Payment Options</strong><small>UPI, Cards, Net Banking</small></div>
          <div><ShieldCheck /><strong>Quality Products</strong><small>Trusted brands from Sivakasi</small></div>
          <div><MessageCircle /><strong>WhatsApp Support</strong><small>Quick assistance</small></div>
          <div><Box /><strong>Wide Range</strong><small>500+ varieties</small></div>
        </div>
      </section>

      <section className="rt-final-cta">
        <div className="rt-container rt-final-cta-inner">
          <div>
            <span>Ready to light up the celebration?</span>
            <h2>Shop factory-direct crackers with confidence.</h2>
          </div>
          <div className="rt-hero-actions">
            <button onClick={() => onNavigate('products')} className="rt-btn rt-btn-primary">Shop Now <ArrowRight /></button>
            <a className="rt-btn rt-btn-whatsapp" href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp Us</a>
          </div>
        </div>
      </section>
    </div>
  );
};
