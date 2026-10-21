import React, { useEffect, useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CheckCircle2,
  Flame,
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
  { icon: MessageCircle, title: 'Direct Support', text: 'Phone, WhatsApp & email' },
  { icon: ShieldCheck, title: 'Product Information', text: 'Browse catalogue details and contact sales directly' },
  { icon: Headphones, title: 'Customer Support', text: 'Quick assistance' },
];

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNavigate, onSelectProduct }) => {
  const { storeInfo } = useStore();
  const whatsappHref = getWhatsAppHref(storeInfo.phone);
  const { products, isLoading: productsLoading, error: productsError, refreshProducts } = useProducts();
  const { picks: homepagePicks, isLoading: picksLoading } = useHomepagePicks();
  const { categories, isLoading: categoriesLoading, error: categoriesError, refreshCategories } = useCategories();
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

  const browseProducts = () => {
    setShopIntent({ type: 'all' });
    onNavigate('products');
  };

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.rt-home');
    if (!root) return;
    const sections = Array.from(root.children).filter((element): element is HTMLElement =>
      element instanceof HTMLElement && element.tagName.toLowerCase() === 'section'
    );
    sections.forEach((section) => section.classList.add('rt-home-reveal'));
    // Never leave sections hidden in older browsers or when the visitor requests reduced motion.
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sections.forEach((section) => section.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.06, rootMargin: '-24px 0px -24px 0px' });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

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
            <div className="rt-section-empty-note" role="status">
              <p>{categoriesError || 'Categories will appear here when active category records are available.'}</p>
              {categoriesError && <button type="button" onClick={() => { void refreshCategories(); }}>Retry categories <ArrowRight aria-hidden="true" /></button>}
            </div>
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
              <div className="rt-home-bestseller-scroller" role="region" aria-label="Swipe through best sellers" tabIndex={0}>
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
              </div>
              <div className="rt-home-bestseller-footer">
                <span>Looking for something specific? The full best-seller page includes search, category filters, and price sorting.</span>
                <button onClick={() => onNavigate('bestsellers')}>See all best sellers <ArrowRight aria-hidden="true" /></button>
              </div>
            </>
          ) : (
            <div className="rt-best-empty" role="status">
              <div><strong>{productsError ? 'The catalogue could not be refreshed.' : 'Best sellers are being prepared.'}</strong><p>{productsError || 'Popular products will appear here as the live catalogue publishes best-seller flags or curated customer picks.'}</p></div>
              {productsError ? <button type="button" onClick={() => { void refreshProducts(); }}>Retry catalogue <ArrowRight aria-hidden="true" /></button> : <button onClick={() => onNavigate('bestsellers')}>Open Best Sellers <ArrowRight aria-hidden="true" /></button>}
            </div>
          )}
        </div>
      </section>

      <ComboPacksSection onNavigate={onNavigate} />

      <LiveOffersSection onNavigate={onNavigate} />

      <section className="rt-section rt-how-section" aria-labelledby="how-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Simple & transparent</span><h2 id="how-heading">How to Enquire</h2></div>
            {totalBoxes > 0 && <div className="rt-cart-summary-inline"><ShoppingCart aria-hidden="true" /> {totalBoxes} items · ₹{subtotal.toLocaleString('en-IN')}</div>}
          </div>
          <div className="rt-how-grid">
            {[
              { icon: Search, step: '01', title: 'Select Products', text: 'Browse the catalogue and choose your crackers.' },
              { icon: ShoppingCart, step: '02', title: 'Build a Shortlist', text: 'Keep a local product reference list while browsing; it does not reserve products.' },
              { icon: CheckCircle2, step: '03', title: 'Contact Sales', text: 'Ask about stock, location, transport and lawful offline terms.' },
              { icon: Truck, step: '04', title: 'Permitted Fulfilment', text: 'Any permitted offline transaction is agreed directly with the licensed business.' },
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

      <section className="rt-service-strip" aria-label="Service shortcuts">
        <div className="rt-container rt-service-grid">
          <button type="button" onClick={() => onNavigate('transport')} aria-label="Open delivery and transport information"><PackageCheck aria-hidden="true" /><strong>Delivery Information</strong><small>Review destination and policy details</small></button>
          <button type="button" onClick={() => onNavigate('cart')} aria-label="Open product enquiry shortlist"><WalletCards aria-hidden="true" /><strong>Sales Enquiry</strong><small>Review catalogue shortlist and contact support</small></button>
          <button type="button" onClick={browseProducts} aria-label="Browse products for product information"><ShieldCheck aria-hidden="true" /><strong>Product Information</strong><small>Refer to catalogue details</small></button>
          <button type="button" onClick={() => onNavigate('whatsapp')} aria-label="Open WhatsApp sales support"><MessageCircle aria-hidden="true" /><strong>WhatsApp Support</strong><small>Prepare a message for assistance</small></button>
          <button type="button" onClick={browseProducts} aria-label="Browse the full product range"><Box aria-hidden="true" /><strong>Wide Range</strong><small>Browse active catalogue items</small></button>
        </div>
      </section>

      <section className="rt-home-directory-section rt-section rt-section-white" aria-labelledby="home-directory-heading">
        <div className="rt-container">
          <div className="rt-section-heading">
            <div><span className="rt-kicker">Everything in one place</span><h2 id="home-directory-heading">Explore All Website Sections</h2></div>
            <span className="rt-heading-note">Direct links to catalogue, existing account records, support and store information.</span>
          </div>
          <div className="rt-home-directory-grid">
            {[
              { screen: 'products', title: 'All Products', text: 'Search the live catalogue and filter by price, category and stock.' },
              { screen: 'categories', title: 'Categories', text: 'Browse crackers by product type.' },
              { screen: 'bestsellers', title: 'Best Sellers', text: 'Explore customer picks and popular products.' },
              { screen: 'table', title: 'Price List', text: 'View the current catalogue rates.' },
              { screen: 'combos', title: 'Combo Packs', text: 'Compare curated celebration bundles.' },
              { screen: 'gift-boxes', title: 'Gift Boxes', text: 'Browse festive gifting options.' },
              { screen: 'cart', title: 'Product Shortlist', text: 'Review selected products and reference subtotal; no order is submitted.' },
              { screen: 'myorders', title: 'Historical Orders', text: 'Review existing order records only; new online orders are not accepted.' },
              { screen: 'tracker', title: 'Track Existing Order', text: 'Check status of previously recorded orders.' },
              { screen: 'whatsapp', title: 'Contact Sales', text: 'Open general WhatsApp, phone and email support.' },
              { screen: 'mail', title: 'Email Sales', text: 'Contact sales with general product questions.' },
              { screen: 'auth', title: 'Sign In / Account', text: 'Access your customer account.' },
              { screen: 'transport', title: 'Transport & Freight', text: 'Review delivery and freight information.' },
              { screen: 'safety', title: 'Safety Guide', text: 'Read fireworks handling and supervision guidance.' },
              { screen: 'reviews', title: 'Customer Reviews', text: 'Read and submit customer feedback.' },
              { screen: 'about', title: 'About RT Crackers', text: 'Learn about our factory-direct catalogue.' },
              { screen: 'contact', title: 'Contact & Support', text: 'Get help with general product information.' },
            ].map((item) => (
              <button
                type="button"
                className="rt-home-directory-card"
                key={item.screen}
                onClick={() => {
                  if (item.screen === 'products') setShopIntent({ type: 'all' });
                  onNavigate(item.screen as ScreenId);
                }}
              >
                <span><strong>{item.title}</strong><small>{item.text}</small></span>
                <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rt-final-cta">
        <div className="rt-container rt-final-cta-inner">
          <div>
            <span>Ready to plan your celebration?</span>
            <h2>Browse the RedThunder catalogue and curated collections.</h2>
          </div>
          <div className="rt-hero-actions">
            <button onClick={browseProducts} className="rt-btn rt-btn-primary">Browse Catalogue <ArrowRight aria-hidden="true" /></button>
            <a className="rt-btn rt-btn-whatsapp" href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={(event) => { if (!whatsappHref) { event.preventDefault(); onNavigate('contact'); } }}><MessageCircle aria-hidden="true" /> WhatsApp Us</a>
          </div>
        </div>
      </section>
    </div>
  );
};
