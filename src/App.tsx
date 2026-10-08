import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { CartProvider, useCart } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
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
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { CategoriesProvider } from './context/CategoriesContext';
import { CagedDragonAd } from './components/CagedDragonAd';


const SCREEN_PATHS: Record<ScreenId, string> = {
  intro: '/', products: '/products', table: '/price-list', cart: '/cart', myorders: '/my-orders', tracker: '/track-order',
  whatsapp: '/whatsapp-order', mail: '/email-bill', auth: '/login', 'gift-boxes': '/gift-boxes', transport: '/transport',
  safety: '/safety', reviews: '/reviews',
};
const SCREEN_TITLES: Record<ScreenId, string> = {
  intro: 'RT Crackers (Makka & Wheat) – Factory-Direct Sivakasi Crackers 2026',
  products: 'All Crackers with Photos & Rates | RT Crackers', table: '2026 Price List | RT Crackers', cart: 'Your Cart | RT Crackers',
  myorders: 'My Orders | RT Crackers', tracker: 'Track Your Order | RT Crackers', whatsapp: 'Order on WhatsApp | RT Crackers',
  mail: 'Email Your Bill | RT Crackers', auth: 'Sign In | RT Crackers', 'gift-boxes': 'Gift Boxes | RT Crackers',
  transport: 'Transport & Freight | RT Crackers', safety: 'Cracker Safety Guide | RT Crackers', reviews: 'Customer Reviews | RT Crackers',
};
function screenFromPath(pathname: string): ScreenId {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const hit = (Object.keys(SCREEN_PATHS) as ScreenId[]).find(k => SCREEN_PATHS[k] === clean);
  return hit ?? 'intro';
}


function StorefrontApp() {
  const { totalBoxes, subtotal, ordersHistory } = useCart();
  
  // Navigation Screen State (can be customer screens or 'seller')
  const [currentScreen, setScreenRaw] = useState<ScreenId>(() => screenFromPath(window.location.pathname));

  // Real URLs: every screen has its own path so links can be shared/bookmarked and the browser
  // Back button works. (vercel.json rewrites unknown paths to index.html.)
  const setCurrentScreen = (screen: ScreenId) => {
    setScreenRaw(screen);
    const path = SCREEN_PATHS[screen];
    if (window.location.pathname !== path) window.history.pushState({ screen }, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    const onPop = () => setScreenRaw(screenFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => { document.title = SCREEN_TITLES[currentScreen]; }, [currentScreen]);
  const [selectedTrackingId, setSelectedTrackingId] = useState('RT-2026-1088');

  useEffect(() => {
    const themePage = currentScreen === 'intro' ? 'home' : currentScreen === 'myorders' ? 'orders' : currentScreen; window.dispatchEvent(new CustomEvent('rt-theme-page', { detail: themePage }));
  }, [currentScreen]);

  // Modals
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#101828] flex flex-col transition-colors">
      <PwaInstallPrompt />
      
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
          <ProductsScreen />
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

        {currentScreen === 'gift-boxes' && (
          <GiftBoxesShowcase isStandaloneScreen={true} />
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
        </Suspense>
      </main>

      {/* Footer */}
      <Footer onOpenSafety={() => setIsSafetyOpen(true)} />

      <CagedDragonAd />

      {/* Floating Bottom Cart Bar (visible in customer mode when items in cart) */}
      {totalBoxes > 0 && currentScreen !== 'cart' && true && (
        <aside
          aria-label="Current Cart Summary"
          className="fixed bottom-0 inset-x-0 z-40 hidden sm:block bg-stone-900/95 dark:bg-stone-900/95 light:bg-white/95 backdrop-blur-md border-t border-amber-600/40 p-3 sm:p-4 shadow-2xl transition-all"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-stone-400 dark:text-stone-400 light:text-stone-600">
                  <span className="text-white dark:text-white light:text-stone-900 font-bold tabular-nums">{totalBoxes}</span> items in cart
                </div>
                <div className="font-display text-lg sm:text-xl font-black text-amber-400 dark:text-amber-400 light:text-amber-700 tabular-nums">
                  ₹{subtotal.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInvoiceOpen(true)}
                className="hidden sm:inline-flex px-3.5 py-2.5 rounded-lg bg-stone-800 dark:bg-stone-800 light:bg-stone-100 hover:bg-stone-700 text-stone-200 dark:text-stone-200 light:text-stone-800 text-xs font-semibold border border-stone-700 dark:border-stone-700 light:border-stone-300 transition-colors cursor-pointer"
              >
                View Bill / PDF
              </button>

              <button
                onClick={() => setCurrentScreen('cart')}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>Open Cart Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
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
              <ToastProvider>
                <CartProvider>
                  <StorefrontApp />
                </CartProvider>
              </ToastProvider>
            </ProductsProvider>
          </CategoriesProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
