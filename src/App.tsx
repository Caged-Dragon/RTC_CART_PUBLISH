import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { CartProvider, useCart } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { HomepagePicksProvider } from './context/HomepagePicksContext';
import { ComboPacksProvider, useComboPacks } from './context/ComboPacksContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar, ScreenId } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { InvoiceModal } from './components/InvoiceModal';
import { SafetyModal } from './components/SafetyModal';
import { Footer } from './components/Footer';

// Customer Screens
import { IntroScreen } from './screens/IntroScreen';
const ProductsScreen = lazy(() => import('./screens/ProductsScreen').then(m => ({ default: m.ProductsScreen })));
const CategoriesScreen = lazy(() => import('./screens/CategoriesScreen').then(m => ({ default: m.CategoriesScreen })));
const TableScreen = lazy(() => import('./screens/TableScreen').then(m => ({ default: m.TableScreen })));
const CartPageScreen = lazy(() => import('./screens/CartPageScreen').then(m => ({ default: m.CartPageScreen })));
const MyOrdersScreen = lazy(() => import('./screens/MyOrdersScreen').then(m => ({ default: m.MyOrdersScreen })));
const TrackerScreen = lazy(() => import('./screens/TrackerScreen').then(m => ({ default: m.TrackerScreen })));
const WhatsAppMessagingScreen = lazy(() => import('./screens/WhatsAppMessagingScreen').then(m => ({ default: m.WhatsAppMessagingScreen })));
const MailingOptionScreen = lazy(() => import('./screens/MailingOptionScreen').then(m => ({ default: m.MailingOptionScreen })));
const AuthScreen = lazy(() => import('./screens/AuthScreen').then(m => ({ default: m.AuthScreen })));
const GiftBoxesShowcase = lazy(() => import('./components/GiftBoxesShowcase').then(m => ({ default: m.GiftBoxesShowcase })));
const TransportScreen = lazy(() => import('./screens/TransportScreen').then(m => ({ default: m.TransportScreen })));
const SafetyScreen = lazy(() => import('./screens/SafetyScreen').then(m => ({ default: m.SafetyScreen })));
const CustomerReviewsFeedback = lazy(() => import('./components/CustomerReviewsFeedback').then(m => ({ default: m.CustomerReviewsFeedback })));
const AboutScreen = lazy(() => import('./screens/AboutScreen').then(m => ({ default: m.AboutScreen })));
const ContactScreen = lazy(() => import('./screens/ContactScreen').then(m => ({ default: m.ContactScreen })));
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { CategoriesProvider } from './context/CategoriesContext';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CagedDragonAd } from './components/CagedDragonAd';
import { ComboPacksSection } from './components/ComboPacksSection';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { useProducts } from './context/ProductsContext';
import { BestSellersScreen } from './screens/BestSellersScreen';
import type { Product } from './data/products';
import { useToast } from './context/ToastContext';


const SCREEN_PATHS: Record<ScreenId, string> = {
  intro: '/', products: '/products', categories: '/categories', bestsellers: '/best-sellers', table: '/price-list', cart: '/cart', myorders: '/my-orders', tracker: '/track-order',
  whatsapp: '/whatsapp-order', mail: '/email-bill', auth: '/login', combos: '/combos', 'gift-boxes': '/gift-boxes', transport: '/transport',
  safety: '/safety', reviews: '/reviews', about: '/about', contact: '/contact',
};
const SCREEN_TITLES: Record<ScreenId, string> = {
  intro: 'Sivakasi Crackers Catalogue 2026 | RedThunder Crackers',
  products: 'All Crackers with Photos & Rates | RT Crackers', categories: 'Shop by Category | RT Crackers', bestsellers: 'Popular Catalogue Highlights | RT Crackers', table: '2026 Price List | RT Crackers', cart: 'Product Enquiry List | RT Crackers',
  myorders: 'My Orders | RT Crackers', tracker: 'Track Your Order | RT Crackers', whatsapp: 'Contact Sales | RT Crackers',
  mail: 'Contact Sales by Email | RT Crackers', auth: 'Sign In | RT Crackers', combos: 'Combo Packs | RT Crackers', 'gift-boxes': 'Gift Boxes | RT Crackers',
  transport: 'Transport & Freight | RT Crackers', safety: 'Cracker Safety Guide | RT Crackers', reviews: 'Customer Reviews | RT Crackers', about: 'About RT Crackers | Sivakasi Factory Direct', contact: 'Contact RT Crackers | WhatsApp & Support',
};
function screenFromPath(pathname: string): ScreenId {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (/^\/product\/\d+$/.test(clean)) return 'products';
  const hit = (Object.keys(SCREEN_PATHS) as ScreenId[]).find(k => SCREEN_PATHS[k] === clean);
  return hit ?? 'intro';
}


function StorefrontApp() {
  const { ordersHistory, totalBoxes, subtotal, setIsCartOpen } = useCart();
  const { products } = useProducts();
  const { combos, isLoading: combosLoading } = useComboPacks();
  const { showToast } = useToast();
  const handoffProcessed = useRef(false);

  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<{ id: string; token?: string } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(() => {
    const match = window.location.pathname.match(/^\/product\/(\d+)$/);
    return match ? Number(match[1]) : null;
  });
  const [selectedProductOrigin, setSelectedProductOrigin] = useState<ScreenId>(() =>
    window.history.state?.productOrigin === 'bestsellers' || window.history.state?.productOrigin === 'intro'
      ? window.history.state.productOrigin
      : 'products'
  );
  // Navigation Screen State (can be customer screens or 'seller')
  const [currentScreen, setScreenRaw] = useState<ScreenId>(() => screenFromPath(window.location.pathname));

  // Real URLs: every screen has its own path so links can be shared/bookmarked and the browser
  // Back button works. (vercel.json rewrites unknown paths to index.html.)
  const setCurrentScreen = (screen: ScreenId) => {
    setScreenRaw(screen);
    setSelectedProductId(null);
    const path = SCREEN_PATHS[screen];
    if (window.location.pathname !== path) window.history.pushState({ screen }, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/product\/(\d+)$/);
      setSelectedProductId(match ? Number(match[1]) : null);
      const origin = window.history.state?.productOrigin;
      setSelectedProductOrigin(origin === 'bestsellers' || origin === 'intro' ? origin : 'products');
      setScreenRaw(screenFromPath(path));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Legacy showcase query parameters are treated as catalogue search hints only; never auto-add items.
  useEffect(() => {
    if (handoffProcessed.current) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const comboId = params.get('combo_id') || params.get('combo');
    const query = params.get('q');
    const category = params.get('category');
    if (!id && !comboId && !query && !category) return;
    if (id && products.length === 0) return;
    if (comboId && combosLoading) return;
    handoffProcessed.current = true;

    if (comboId) {
      const combo = combos.find((item) => item.id === comboId || item.slug === comboId || item.comboCode === comboId);
      window.history.replaceState({}, '', '/combos');
      setScreenRaw('combos');
      showToast({ type: 'info', title: 'Combo catalogue opened', message: combo ? `${combo.shortTitle || combo.name} details are available to review. No order was created.` : 'Review the current combo catalogue. No items were added.' });
      return;
    }

    const search = new URL('/products', window.location.origin);
    if (query) search.searchParams.set('q', query);
    else if (category) search.searchParams.set('category', category);
    else if (id) {
      const found = products.find((item: any) => String(item.id) === id || String(item.dbId || '') === id || String(item.skuCode || '') === id);
      search.searchParams.set('q', found?.name || id);
    }
    window.history.replaceState({}, '', `${search.pathname}${search.search}`);
    setScreenRaw('products');
    showToast({ type: 'info', title: 'Catalogue opened', message: 'This link opens product information only; nothing was added to an order.' });
  }, [products, combos, combosLoading, showToast]);

  useEffect(() => {
    const product = selectedProductId ? products.find((item) => item.id === selectedProductId) : undefined;
    const title = product ? `${product.name} | ${product.category} | RedThunder Crackers` : selectedProductId ? 'Product Details | RedThunder Crackers' : SCREEN_TITLES[currentScreen];
    const descriptions: Record<ScreenId, string> = {
      intro: 'Browse the RedThunder Crackers catalogue from Rajukanna Fireworks, Sivakasi. This website is for product information and does not accept online fireworks orders.',
      products: 'Browse the RedThunder Crackers product catalogue with live rates, categories, product details and a local shortlist. Online fireworks orders are not accepted.',
      categories: 'Browse active RedThunder product categories and open catalogue results filtered by category.',
      bestsellers: 'Explore RedThunder catalogue highlights, search products and compare listed prices.',
      table: 'View the RT Crackers product price list and current catalogue rates.',
      cart: 'Review a local product shortlist and reference subtotal; no online order or payment is submitted.',
      myorders: 'View your RT Crackers orders and order details.', tracker: 'Review status details for existing orders and previously confirmed consignments.',
      whatsapp: 'Open WhatsApp support for general product questions; cart details are not sent.', mail: 'Find the official sales email and contact details for general product questions.',
      auth: 'Sign in to your RT Crackers account to manage your orders and profile.', combos: 'Explore RT Crackers combo packs and curated celebration bundles.',
      'gift-boxes': 'Browse RT Crackers gift boxes for family celebrations and festive occasions.', transport: 'Read RT Crackers delivery, transport and freight information.',
      safety: 'Read important fireworks handling, supervision and safety guidance before use.', reviews: 'Read and submit customer feedback for RT Crackers.',
      about: 'Learn about RT Crackers and our Sivakasi catalogue.', contact: 'Contact RedThunder for catalogue and general support questions.',
    };
    const description = product
      ? `${product.name} (${product.unit}) in the ${product.category} category of the RedThunder Crackers catalogue from Sivakasi. Listed catalogue rate ₹${Number(product.rate).toLocaleString('en-IN')}; confirm current details with the business. No online fireworks orders or payments are accepted.`
      : descriptions[currentScreen];
    const canonicalUrl = new URL(product ? `/product/${product.id}` : SCREEN_PATHS[currentScreen], window.location.origin).href;
    const keywordMap: Record<ScreenId, string> = {
      intro: 'RedThunder Crackers, Sivakasi crackers catalogue 2026, Makka and Wheat brand, Rajukanna Fireworks',
      products: 'Sivakasi crackers catalogue, RedThunder Crackers product list, Makka and Wheat brand catalogue',
      categories: 'Sivakasi crackers categories, RedThunder Crackers catalogue',
      bestsellers: 'RedThunder Crackers popular catalogue highlights, Sivakasi product list',
      table: 'RedThunder Crackers 2026 price list, Sivakasi catalogue rates',
      cart: 'RedThunder product shortlist', myorders: 'RedThunder account order history', tracker: 'RedThunder previous order tracking',
      whatsapp: 'RedThunder Crackers product enquiries, WhatsApp support', mail: 'RedThunder Crackers sales email and support',
      auth: 'RedThunder customer account sign in', combos: 'RedThunder catalogue', 'gift-boxes': 'Makka and Wheat brand catalogue highlights',
      transport: 'Sivakasi crackers transport information, Tamil Nadu delivery policy', safety: 'fireworks safety guide, safe fireworks handling',
      reviews: 'RedThunder Crackers customer feedback', about: 'Rajukanna Fireworks Sivakasi, Makka and Wheat brand', contact: 'RedThunder Crackers contact, Sivakasi support',
    };
    // Only pages that are useful public catalogue/information pages should be indexable.
    // Account, list, tracking, email/WhatsApp, and unverified combo/review surfaces stay noindex.
    const publicIndexableScreens = new Set<ScreenId>(['intro', 'products', 'categories', 'bestsellers', 'table', 'transport', 'safety', 'about', 'contact']);
    const indexable = product ? true : (!selectedProductId && publicIndexableScreens.has(currentScreen));
    const productKeywords = product ? `${product.name}, ${product.category}, Sivakasi crackers catalogue, RedThunder Crackers, Makka and Wheat brand` : keywordMap[currentScreen];
    document.title = title;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = canonicalUrl;
    const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descriptionTag) descriptionTag.content = description;
    const keywordsTag = document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
    if (keywordsTag) keywordsTag.content = productKeywords;
    let robotsTag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robotsTag) { robotsTag = document.createElement('meta'); robotsTag.name = 'robots'; document.head.appendChild(robotsTag); }
    robotsTag.content = indexable ? 'index,follow,max-image-preview:large' : 'noindex,follow';
    let webpageSchema = document.querySelector<HTMLScriptElement>('#rt-prerendered-page-schema, #rt-dynamic-webpage-schema');
    if (!webpageSchema) { webpageSchema = document.createElement('script'); webpageSchema.id = 'rt-dynamic-webpage-schema'; webpageSchema.type = 'application/ld+json'; document.head.appendChild(webpageSchema); }
    webpageSchema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': product ? 'Product' : 'WebPage', name: title, description, url: canonicalUrl, ...(product?.imageUrl ? { image: product.imageUrl } : {}), ...(product ? { sku: String(product.id), brand: { '@type': 'Brand', name: 'Makka & Wheat' }, manufacturer: { '@type': 'Organization', '@id': 'https://rtcrackers.com/#business', name: 'Rajukanna Fireworks' }, category: product.category } : {}), ...(!product ? { about: { '@type': 'Organization', '@id': 'https://rtcrackers.com/#business' } } : {}) });
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = title;
    const ogDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = description;
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonicalUrl;
    const ogType = document.querySelector<HTMLMetaElement>('meta[property="og:type"]');
    if (ogType) ogType.content = product ? 'product' : 'website';
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = title;
    const twitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.content = description;
    const twitterUrl = document.querySelector<HTMLMetaElement>('meta[name="twitter:url"]');
    if (twitterUrl) twitterUrl.content = canonicalUrl;
    const socialImage = product?.imageUrl ? new URL(product.imageUrl, window.location.origin).href : 'https://cart.rtcrackers.com/rt-icon-512.png';
    const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    if (ogImage) ogImage.content = socialImage;
    const twitterImage = document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.content = socialImage;
  }, [currentScreen, selectedProductId, products]);
  useEffect(() => {
    const themePage = currentScreen === 'intro' || currentScreen === 'about' || currentScreen === 'contact' ? 'home' : currentScreen === 'myorders' ? 'orders' : currentScreen === 'mail' ? 'mailing' : currentScreen === 'combos' ? 'gift-boxes' : currentScreen; window.dispatchEvent(new CustomEvent('rt-theme-page', { detail: themePage }));
  }, [currentScreen]);

  const openProductDetails = (product: Product, origin: ScreenId) => {
    setSelectedProductOrigin(origin);
    setSelectedProductId(product.id);
    setScreenRaw('products');
    window.history.pushState({ screen: 'products', productOrigin: origin, productId: product.id }, '', `/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors">
      <PwaInstallPrompt />
      <CagedDragonAd visible={currentScreen !== 'cart'} />
      
      {/* Top Bar with Navigation & Controls */}
      <Navbar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        onOpenSafety={() => setIsSafetyOpen(true)}
      />

      {/* Main Screen Router */}
      <main className="flex-1">
        <Suspense fallback={<div className="py-24 text-center text-xs text-stone-500" role="status" aria-live="polite">Loading…</div>}>
        {/* CUSTOMER STOREFRONT SCREENS */}
        {currentScreen === 'intro' && (
          <IntroScreen onNavigate={setCurrentScreen} onSelectProduct={(product) => openProductDetails(product, 'intro')} />
        )}

        {currentScreen === 'bestsellers' && (
          <BestSellersScreen
            onNavigate={setCurrentScreen}
            onSelectProduct={(product) => openProductDetails(product, 'bestsellers')}
          />
        )}

        {currentScreen === 'categories' && <CategoriesScreen onNavigate={setCurrentScreen} />}

        {currentScreen === 'products' && (
          selectedProductId ? (() => {
            const product = products.find((item) => item.id === selectedProductId);
            const related = product ? products.filter((item) => item.id !== product.id && item.category === product.category) : [];
            return product ? (
              <ProductDetailScreen
                product={product}
                related={related}
                onBack={() => setCurrentScreen(selectedProductOrigin)}
                onSelectRelated={(item) => {
                  setSelectedProductId(item.id);
                  window.history.pushState({ productId: item.id, screen: 'products', productOrigin: selectedProductOrigin }, '', `/product/${item.id}`);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ) : <ProductsScreen />;
          })() : <ProductsScreen />
        )}

        {currentScreen === 'table' && (
          <TableScreen onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'cart' && (
          <CartPageScreen
            onNavigate={setCurrentScreen}
            onOpenInvoice={() => setIsInvoiceOpen(true)}
          />
        )}

        {currentScreen === 'myorders' && (
          <MyOrdersScreen
            onNavigate={setCurrentScreen}
            onOpenInvoice={() => setIsInvoiceOpen(true)}
            onSelectTrackingId={(id, token) => setSelectedTrackingOrder({ id, token })}
          />
        )}

        {currentScreen === 'tracker' && (
          <TrackerScreen
            key={selectedTrackingOrder?.id || 'direct-tracker'}
            initialOrderId={selectedTrackingOrder?.id}
            initialTrackingToken={selectedTrackingOrder?.token}
          />
        )}

        {currentScreen === 'whatsapp' && (
          <WhatsAppMessagingScreen />
        )}

        {currentScreen === 'mail' && (
          <MailingOptionScreen onOpenInvoice={() => setIsInvoiceOpen(true)} />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'combos' && <ComboPacksSection onNavigate={setCurrentScreen} standalone />}

        {currentScreen === 'gift-boxes' && (
          <GiftBoxesShowcase isStandaloneScreen={true} onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'transport' && (
          <TransportScreen />
        )}

        {currentScreen === 'safety' && (
          <SafetyScreen />
        )}

        {currentScreen === 'reviews' && (
          <div className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CustomerReviewsFeedback orders={ordersHistory} />
          </div>
        )}

        {currentScreen === 'about' && <AboutScreen onNavigate={setCurrentScreen} />}

        {currentScreen === 'contact' && <ContactScreen onNavigate={setCurrentScreen} />}
        </Suspense>
      </main>

      {/* Footer */}
      <Footer onOpenSafety={() => setIsSafetyOpen(true)} onNavigate={setCurrentScreen} currentScreen={currentScreen} />

      <MobileBottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />

      {totalBoxes > 0 && currentScreen !== 'cart' && (
        <aside className="rt-mini-cart-bar" aria-label="Current cart summary">
          <div className="rt-mini-cart-inner">
            <div className="rt-mini-cart-icon"><ShoppingBag /></div>
            <div><span>{totalBoxes} units · {subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span><strong>Ready when you are</strong></div>
            <button onClick={() => { setIsCartOpen(true); }} aria-label="Open cart"><span className="desktop-only">Review cart</span><span className="mobile-only">Cart</span><ArrowRight /></button>
          </div>
        </aside>
      )}

      {/* Side Slide-Over Cart Drawer */}
      <CartDrawer
        onOpenCheckout={() => setCurrentScreen('cart')}
        onOpenInvoice={() => setIsInvoiceOpen(true)}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

      {/* Safety Modal */}
      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <CategoriesProvider>
            <ProductsProvider>
              <HomepagePicksProvider>
                <ComboPacksProvider>
                  <ToastProvider>
                    <CartProvider>
                      <StorefrontApp />
                    </CartProvider>
                  </ToastProvider>
                </ComboPacksProvider>
              </HomepagePicksProvider>
            </ProductsProvider>
          </CategoriesProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
