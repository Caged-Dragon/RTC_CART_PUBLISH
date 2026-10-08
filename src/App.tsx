import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { CartProvider, useCart } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { HomepagePicksProvider } from './context/HomepagePicksContext';
import { ComboPacksProvider } from './context/ComboPacksContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar, ScreenId } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { InvoiceModal } from './components/InvoiceModal';
import { SafetyModal } from './components/SafetyModal';
import { Footer } from './components/Footer';

// Customer Screens
import { IntroScreen } from './screens/IntroScreen';
const ProductsScreen = lazy(() => import('./screens/ProductsScreen').then(m => ({ default: m.ProductsScreen })));
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


const SCREEN_PATHS: Record<ScreenId, string> = {
  intro: '/', products: '/products', table: '/price-list', cart: '/cart', myorders: '/my-orders', tracker: '/track-order',
  whatsapp: '/whatsapp-order', mail: '/email-bill', auth: '/login', combos: '/combos', 'gift-boxes': '/gift-boxes', transport: '/transport',
  safety: '/safety', reviews: '/reviews', about: '/about', contact: '/contact',
};
const SCREEN_TITLES: Record<ScreenId, string> = {
  intro: 'RT Crackers (Makka & Wheat) – Factory-Direct Sivakasi Crackers 2026',
  products: 'All Crackers with Photos & Rates | RT Crackers', table: '2026 Price List | RT Crackers', cart: 'Your Cart | RT Crackers',
  myorders: 'My Orders | RT Crackers', tracker: 'Track Your Order | RT Crackers', whatsapp: 'Order on WhatsApp | RT Crackers',
  mail: 'Email Your Bill | RT Crackers', auth: 'Sign In | RT Crackers', combos: 'Combo Packs | RT Crackers', 'gift-boxes': 'Gift Boxes | RT Crackers',
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

  const [selectedTrackingId, setSelectedTrackingId] = useState('RT-2026-1088');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(() => {
    const match = window.location.pathname.match(/^\/product\/(\d+)$/);
    return match ? Number(match[1]) : null;
  });
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
      setScreenRaw(screenFromPath(path));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => { document.title = selectedProductId ? 'Product Details | RT Crackers' : SCREEN_TITLES[currentScreen]; }, [currentScreen, selectedProductId]);
  useEffect(() => {
    const themePage = currentScreen === 'intro' || currentScreen === 'about' || currentScreen === 'contact' ? 'home' : currentScreen === 'myorders' ? 'orders' : currentScreen === 'mail' ? 'mailing' : currentScreen === 'combos' ? 'gift-boxes' : currentScreen; window.dispatchEvent(new CustomEvent('rt-theme-page', { detail: themePage }));
  }, [currentScreen]);

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
          <IntroScreen onNavigate={setCurrentScreen} />
        )}

        {currentScreen === 'products' && (
          selectedProductId ? (() => {
            const product = products.find((item) => item.id === selectedProductId);
            const related = product ? products.filter((item) => item.id !== product.id && item.category === product.category) : [];
            return product ? (
              <ProductDetailScreen
                product={product}
                related={related}
                onBack={() => setCurrentScreen('products')}
                onSelectRelated={(item) => {
                  setSelectedProductId(item.id);
                  window.history.pushState({ productId: item.id }, '', `/product/${item.id}`);
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
            onSelectTrackingId={(id) => setSelectedTrackingId(id)}
          />
        )}

        {currentScreen === 'tracker' && (
          <TrackerScreen />
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
      <Footer onOpenSafety={() => setIsSafetyOpen(true)} onNavigate={setCurrentScreen} />

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
