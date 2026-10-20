import React, { useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  Flame,
  Gift,
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
import { useComboPacks } from '../context/ComboPacksContext';
import { setShopIntent } from '../utils/shopNavigation';
import { getExactProductImage } from '../utils/productImages';
import { ProductCard } from '../components/ProductCard';
import { useHomepagePicks } from '../context/HomepagePicksContext';
import { HomeBanner } from '../components/HomeBanner';
import { LiveOffersSection } from '../components/LiveOffersSection';
import { useCart } from '../context/CartContext';
import { ComboPacksSection } from '../components/ComboPacksSection';
import type { Product } from '../data/products';
import { getBestSellerProducts, getHomepageBestSellerCount } from '../utils/bestSellers';
import { getWhatsAppHref } from '../utils/contactLinks';
import { getCategoryFallbackImage, normalizeCategoryName } from '../utils/categoryArtwork';

interface IntroScreenProps { onNavigate: (screen: ScreenId) => void; onSelectProduct: (product: Product) => void; }

const benefits = [
  { icon: BadgeCheck, title: 'Direct from Sivakasi', text: 'Factory-source pricing' },
  { icon: WalletCards, title: 'Competitive Pricing', text: 'Clear catalogue rates' },
  { icon: Box, title: 'Wide Product Range', text: 'Browse the live catalogue' },
  { icon: MessageCircle, title: 'Easy Ordering', text: 'Online & WhatsApp' },
  { icon: ShieldCheck, title: 'Secure Order Flow', text: 'Checkout through the site' },
  { icon: Headphones, title: 'Customer Support', text: 'Quick assistance' },
];

const budgetTierLabels: Record<string, string> = {
  STARTER: 'Starter Collection',
  FAMILY: 'Family Collection',
  FESTIVAL: 'Festival Collection',
  PREMIUM: 'Premium Collection',
  GRAND: 'Grand Collection',
};

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNavigate, onSelectProduct }) => {
  const { storeInfo } = useStore();
  const whatsappHref = getWhatsAppHref(storeInfo.phone);
  const { products, isLoading: productsLoading } = useProducts();
  const { picks: homepagePicks, isLoading: picksLoading } = useHomepagePicks();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { combos, isLoading: combosLoading } = useComboPacks();
  const { totalBoxes, subtotal } = useCart();
  const bestSellerProducts = useMemo(() => getBestSellerProducts(products, homepagePicks), [products, homepagePicks]);
  const homeBestSellerCount = getHomepageBestSellerCount(bestSellerProducts.length);
  const homeBestSellers = useMemo(() => bestSellerProducts.slice(0, homeBestSellerCount), [bestSellerProducts, homeBestSellerCount]);
  const bestSellerPicksByProduct = useMemo(() => new Map(homepagePicks.map((pick) => [pick.product.dbId || String(pick.product.id), pick])), [homepagePicks]);

  const categoryCards = useMemo(() => {
    return categories
      .filter((category) => category.is_active)
      .slice(0, 8)
      .map((category) => {
        const normalizedCategory = normalizeCategoryName(category.category_name);
        const categoryProducts = products.filter((product) => normalizeCategoryName(product.category) === normalizedCategory);
        const sample = categoryProducts.find((product) => product.imageUrl?.trim()) || categoryProducts[0];
        const referenceImage = getCategoryFallbackImage(category.category_name);
        const sampleDatabaseImage = sample?.imageUrl?.trim() || '';
        const sampleImage = sample ? getExactProductImage(sample) : '';
        // The order is data-first: category image URL, then an image URL from a real product
        // in that category, then bundled reference art only when the database has no image.
        const categoryDatabaseImage = category.image_url?.trim() || '';
        const image = categoryDatabaseImage || sampleDatabaseImage || referenceImage || sampleImage;
        const fallbackImage = categoryDatabaseImage ? (sampleDatabaseImage || referenceImage || sampleImage) : sampleDatabaseImage ? (referenceImage || sampleImage) : sampleImage;
        return { ...category, image, fallbackImage, productCount: categoryProducts.length };
      });
  }, [categories, products]);

  const budgetOptions = useMemo(() => {
    const tiers = new Map<string, { prices: number[]; count: number }>();
    combos.forEach((combo) => {
      if (!combo.budgetTier || !Number.isFinite(combo.calculatedPrice) || combo.calculatedPrice <= 0) return;
      const current = tiers.get(combo.budgetTier) || { prices: [], count: 0 };
      current.prices.push(combo.calculatedPrice);
      current.count += 1;
      tiers.set(combo.budgetTier, current);
    });
    const order = ['STARTER', 'FAMILY', 'FESTIVAL', 'PREMIUM', 'GRAND'];
    return [...tiers.entries()]
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([tier, data]) => ({
        tier,
        title: budgetTierLabels[tier] || tier,
        low: Math.min(...data.prices),
        high: Math.max(...data.prices),
        count: data.count,
      }));
  }, [combos]);

  const openBudgetTier = (tier: string) => {
    onNavigate('combos');
    // The combo catalogue owns filtering; notify it after the route transition and preserve a shareable URL.
    const url = new URL(window.location.href);
    url.searchParams.set('budget_tier', tier);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new CustomEvent('rt-combo-budget-tier', { detail: tier }));
  };

  const browseProducts = () => {
    setShopIntent({ type: 'all' });
    onNavigate('products');
  };

  return (
    <div className="rt-home">
      <HomeBanner onNavigate={onNavigate} />

      <section className="rt-trust-strip" aria-label="Store benefits">
        <div className="rt-container rt-trust-scroll">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div className="rt-trust-card" key={title}>
              <span><Icon aria-hidden="true" /></span>
              <div><strong>{title}</strong><small>{text}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="rt-section rt-section-white" aria-labelledby="category-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Shop by</span><h2 id="category-heading">Category</h2></div>
            <button className="rt-section-link" onClick={() => onNavigate('categories')}>View All Categories <ArrowRight aria-hidden="true" /></button>
          </div>
          <div className="rt-category-grid">
            {categoriesLoading && !categoryCards.length
              ? Array.from({ length: 8 }).map((_, index) => <div className="rt-skeleton rt-category-skeleton" key={index} />)
              : categoryCards.map((category) => (
                <button
                  key={category.category_id}
                  className="rt-category-card"
                  onClick={() => {
                    // Persist the filter before switching screens so the shop consumes it on first render.
                    setShopIntent({ type: 'category', value: category.category_name });
                    onNavigate('products');
                  }}
                  aria-label={`Browse ${category.category_name}`}
                >
                  <div className={`rt-category-image ${category.image ? '' : 'is-placeholder'}`}>
                    <Sparkles className="rt-category-fallback-icon" aria-hidden="true" />
                    {category.image && <img loading="lazy" decoding="async" src={category.image} alt={category.category_name} onError={(event) => {
                      const fallback = category.fallbackImage;
                      if (fallback && !event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
                      else event.currentTarget.hidden = true;
                    }} />}
                  </div>
                  <strong>{category.category_name.replace(/Colourful|Colourfull/g, 'Colour')}</strong>
                  <span className="rt-category-count">{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</span>
                </button>
              ))}
          </div>
          {!categoriesLoading && categoryCards.length === 0 && (
            <p className="rt-section-empty-note">Categories will appear here when active category records are available.</p>
          )}
        </div>
      </section>

      <section className="rt-best-section rt-best-data-section" id="best-sellers" aria-labelledby="best-sellers-heading">
        <div className="rt-container">
          <div className="rt-section-heading rt-best-data-heading">
            <div className="rt-best-title-wrap">
              <Flame aria-hidden="true" />
              <div>
                <h2 id="best-sellers-heading">Best Sellers</h2>
                <p>Customer favourites and popular picks from the RT Crackers catalogue.</p>
              </div>
            </div>
            <button className="rt-section-link light" onClick={() => onNavigate('bestsellers')}>View All Best Sellers <ArrowRight aria-hidden="true" /></button>
          </div>
          {(productsLoading || picksLoading) && !bestSellerProducts.length ? (
            <div className="rt-product-grid rt-home-bestseller-grid" aria-busy="true" aria-label="Loading best sellers">
              {Array.from({ length: 4 }, (_, index) => <div className="rt-best-loading-card" key={index} />)}
            </div>
          ) : homeBestSellers.length ? (
            <>
              <div className="rt-home-bestseller-note">
                <Sparkles aria-hidden="true" />
                <span>Featuring {Math.round((homeBestSellers.length / bestSellerProducts.length) * 100)}% of our best-seller collection on the home page.</span>
                <button onClick={() => onNavigate('bestsellers')}>Explore all {bestSellerProducts.length} <ArrowRight aria-hidden="true" /></button>
              </div>
              <div className="rt-product-grid rt-home-bestseller-grid">
                {homeBestSellers.map((product) => {
                  const pick = bestSellerPicksByProduct.get(product.dbId || String(product.id));
                  return (
                    <div className="rt-home-bestseller-card-wrap" key={product.dbId || product.id}>
                      <div className="rt-home-bestseller-card-meta">
                        <span>{pick?.badgeText || 'Customer Favourite'}</span>
                        <small>{pick?.customerLabel || (product.popular ? 'Popular pick' : 'Best seller')}</small>
                      </div>
                      <ProductCard product={product} compact onViewDetails={() => onSelectProduct(product)} />
                    </div>
                  );
                })}
              </div>
              <div className="rt-home-bestseller-footer">
                <span>Looking for something specific? The full best-seller page includes search, category filters, and price sorting.</span>
                <button onClick={() => onNavigate('bestsellers')}>See all best sellers <ArrowRight aria-hidden="true" /></button>
              </div>
            </>
          ) : (
            <div className="rt-best-empty" role="status">
              <div><strong>Best sellers are being prepared.</strong><p>Popular products will appear here as the live catalogue publishes best-seller flags or curated customer picks.</p></div>
              <button onClick={() => onNavigate('bestsellers')}>Open Best Sellers <ArrowRight aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </section>

      <section className="rt-section rt-section-white" aria-labelledby="budget-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Choose a curated collection</span><h2 id="budget-heading">Shop by Budget</h2></div>
            <span className="rt-heading-note">Collections and pricing are sourced from published combo data.</span>
          </div>
          {combosLoading && budgetOptions.length === 0 ? (
            <div className="rt-budget-grid" aria-busy="true" aria-label="Loading budget collections">
              {Array.from({ length: 4 }, (_, index) => <div className="rt-budget-placeholder" key={index} />)}
            </div>
          ) : budgetOptions.length ? (
            <div className="rt-budget-grid">
              {budgetOptions.map((budget) => (
                <button className="rt-budget-card" key={budget.tier} onClick={() => openBudgetTier(budget.tier)}>
                  <span>{budget.low === budget.high ? money(budget.low) : `${money(budget.low)}–${money(budget.high)}`}</span>
                  <strong>{budget.title}</strong>
                  <small>{budget.count} published combo{budget.count === 1 ? '' : 's'}</small>
                  <em>Explore Collection <ArrowRight aria-hidden="true" /></em>
                </button>
              ))}
            </div>
          ) : (
            <div className="rt-budget-empty">
              <Gift aria-hidden="true" />
              <div><strong>Budget collections are not configured yet.</strong><p>Publish combo packs with budget tiers in the existing catalogue to show live collection cards here.</p></div>
              <button className="rt-btn rt-btn-outline" onClick={() => onNavigate('combos')}>Explore Combos <ArrowRight aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </section>

      <ComboPacksSection onNavigate={onNavigate} />

      <LiveOffersSection onNavigate={onNavigate} />

      <section className="rt-section rt-how-section" aria-labelledby="how-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Simple & transparent</span><h2 id="how-heading">How to Order</h2></div>
            {totalBoxes > 0 && <div className="rt-cart-summary-inline"><ShoppingCart aria-hidden="true" /> {totalBoxes} items · ₹{subtotal.toLocaleString('en-IN')}</div>}
          </div>
          <div className="rt-how-grid">
            {[
              { icon: Search, step: '01', title: 'Select Products', text: 'Browse the catalogue and choose your crackers.' },
              { icon: ShoppingCart, step: '02', title: 'Add to Cart', text: 'Set quantities and review your live cart.' },
              { icon: CheckCircle2, step: '03', title: 'Confirm Order', text: 'Enter delivery details and submit your order.' },
              { icon: Truck, step: '04', title: 'Delivery / Dispatch', text: `Orders are reviewed for dispatch from ${storeInfo.city}.` },
            ].map(({ icon: Icon, step, title, text }, index) => (
              <div className="rt-how-step" key={step}>
                <span className="rt-step-number">{step}</span>
                <div className="rt-step-icon"><Icon aria-hidden="true" /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < 3 && <span className="rt-step-line" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rt-service-strip" aria-label="Service information">
        <div className="rt-container rt-service-grid">
          <div><PackageCheck aria-hidden="true" /><strong>Delivery Information</strong><small>Review destination and policy details</small></div>
          <div><WalletCards aria-hidden="true" /><strong>Payment Options</strong><small>Confirmed by the booking team</small></div>
          <div><ShieldCheck aria-hidden="true" /><strong>Product Information</strong><small>Refer to catalogue details</small></div>
          <div><MessageCircle aria-hidden="true" /><strong>WhatsApp Support</strong><small>Quick assistance</small></div>
          <div><Box aria-hidden="true" /><strong>Wide Range</strong><small>Browse active catalogue items</small></div>
        </div>
      </section>

      <section className="rt-final-cta">
        <div className="rt-container rt-final-cta-inner">
          <div>
            <span>Ready to plan your celebration?</span>
            <h2>Browse the RedThunder catalogue and curated collections.</h2>
          </div>
          <div className="rt-hero-actions">
            <button onClick={browseProducts} className="rt-btn rt-btn-primary">Shop Now <ArrowRight aria-hidden="true" /></button>
            <a className="rt-btn rt-btn-whatsapp" href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={(event) => { if (!whatsappHref) { event.preventDefault(); onNavigate('contact'); } }}><MessageCircle aria-hidden="true" /> WhatsApp Us</a>
          </div>
        </div>
      </section>
    </div>
  );
};
