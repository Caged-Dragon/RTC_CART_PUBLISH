import React, { useState } from 'react';
import {
  ShoppingBag,
  MessageCircle,
  Menu,
  X,
  Sparkles,
  FileSpreadsheet,
  Grid,
  Sun,
  Moon,
  Truck,
  PackageCheck,
  Gift,
  Mail,
  User,
  Package,
  Home,
  Star,
  ChevronDown,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export type ScreenId =
  | 'intro'
  | 'products'
  | 'table'
  | 'cart'
  | 'myorders'
  | 'tracker'
  | 'whatsapp'
  | 'mail'
  | 'auth'
  | 'gift-boxes'
  | 'transport'
  | 'safety'
  | 'reviews';

interface NavbarProps {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  onOpenSafety: () => void;
}

type NavItem = { id: ScreenId; label: string; icon: React.ReactNode };

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, setCurrentScreen }) => {
  const { storeInfo: STORE_INFO } = useStore();
  const { totalBoxes, subtotal } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryNav: NavItem[] = [
    { id: 'intro', label: 'Home', icon: <Home className="h-3.5 w-3.5" /> },
    { id: 'products', label: 'Products', icon: <Grid className="h-3.5 w-3.5 text-amber-500" /> },
    { id: 'table', label: 'Price Sheet', icon: <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" /> },
    { id: 'gift-boxes', label: 'Gift Boxes', icon: <Gift className="h-3.5 w-3.5 text-red-500" /> },
    { id: 'tracker', label: 'Track Order', icon: <PackageCheck className="h-3.5 w-3.5 text-emerald-500" /> },
  ];

  const compactNav: NavItem[] = [
    primaryNav[0],
    primaryNav[1],
    primaryNav[2],
  ];

  const moreNav: NavItem[] = [
    { id: 'gift-boxes', label: 'Gift Boxes', icon: <Gift className="h-4 w-4 text-red-500" /> },
    { id: 'myorders', label: 'Dashboard', icon: <Package className="h-4 w-4 text-emerald-500" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> },
    { id: 'tracker', label: 'Track Order', icon: <PackageCheck className="h-4 w-4 text-emerald-500" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="h-4 w-4 text-green-500" /> },
    { id: 'mail', label: 'Email Bill', icon: <Mail className="h-4 w-4 text-rose-500" /> },
    { id: 'transport', label: 'Delivery', icon: <Truck className="h-4 w-4 text-blue-500" /> },
  ];

  const handleNavClick = (screen: ScreenId) => {
    setCurrentScreen(screen);
    setMobileMenuOpen(false);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navButtonClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
      active
        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
        : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-900'
    }`;

  return (
    <header data-rtc-component="navbar" className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 text-stone-900 shadow-sm backdrop-blur-md dark:border-stone-800 dark:bg-stone-950/95 dark:text-stone-100">
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="flex min-h-16 items-center gap-3 py-2 sm:min-h-[72px] sm:py-2.5">
          {/* Brand */}
          <button
            onClick={() => handleNavClick('intro')}
            className="flex min-w-0 shrink-0 items-center gap-2.5 text-left cursor-pointer focus:outline-none sm:gap-3"
            aria-label="Go to RedThunder home"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gradient-to-tr from-amber-600 via-red-600 to-rose-600 text-white shadow-lg sm:h-10 sm:w-10">
              {STORE_INFO.logoUrl ? (
                <img src={STORE_INFO.logoUrl} alt={STORE_INFO.name} className="h-full w-full bg-white object-contain" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="block truncate font-display text-lg font-black leading-none tracking-tight text-stone-900 dark:text-white sm:text-xl">
                RED<span className="text-red-500">THUNDER</span>
              </span>
              <span className="mt-1 hidden truncate text-[9px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400 sm:block sm:text-[10px]">
                Sivakasi • 2026 Price List
              </span>
            </div>
          </button>

          {/* Full desktop navigation: only when there is enough room */}
          <nav className="ml-auto hidden items-center gap-0.5 2xl:flex" aria-label="Primary navigation">
            {primaryNav.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={navButtonClass(currentScreen === item.id)}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            <div className="relative">
              <button
                onClick={() => setMoreOpen((open) => !open)}
                className={navButtonClass(moreNav.some((item) => item.id === currentScreen))}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                <span>More</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xl dark:border-stone-800 dark:bg-stone-900" role="menu">
                  {moreNav.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                        currentScreen === item.id
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                      }`}
                      role="menuitem"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Compact desktop navigation for laptop widths */}
          <nav className="ml-auto hidden items-center gap-0.5 xl:flex 2xl:hidden" aria-label="Compact navigation">
            {compactNav.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={navButtonClass(currentScreen === item.id)}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setMoreOpen((open) => !open)}
                className={navButtonClass(moreNav.some((item) => item.id === currentScreen))}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                <span>More</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-2xl dark:border-stone-800 dark:bg-stone-900" role="menu">
                  {moreNav.map((item) => (
                    <button key={item.id} onClick={() => handleNavClick(item.id)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800" role="menuitem">
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 xl:ml-3">
            <button
              onClick={() => handleNavClick('auth')}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer sm:h-10 sm:w-auto sm:px-2.5 ${
                currentScreen === 'auth'
                  ? 'border-amber-500 bg-amber-600/20 text-amber-800 dark:text-amber-400'
                  : 'border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300'
              }`}
              title={isAuthenticated ? `Signed in as ${user?.name}` : 'Sign In / Account'}
            >
              <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="ml-1.5 hidden text-xs font-semibold xl:inline">
                {isAuthenticated ? user?.name?.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-700 transition-colors cursor-pointer dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300 sm:h-10 sm:w-10"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-amber-700" />}
            </button>

            <button
              onClick={() => handleNavClick('cart')}
              className="relative flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 px-3 text-white shadow-md shadow-red-950/40 transition-all cursor-pointer active:scale-95 sm:h-10 sm:px-3.5"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden text-xs font-bold sm:inline">Cart</span>
              {totalBoxes > 0 && <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-black tabular-nums text-stone-950">{totalBoxes}</span>}
            </button>

            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-stone-700 cursor-pointer dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 lg:hidden sm:h-10 sm:w-10"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-200 bg-white px-3 pb-4 pt-3 shadow-xl dark:border-stone-800 dark:bg-stone-950 lg:hidden">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-1 sm:grid-cols-2">
            {[...primaryNav, ...moreNav.filter((item) => !primaryNav.some((primary) => primary.id === item.id))].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold transition-colors ${
                  currentScreen === item.id
                    ? 'bg-amber-600 text-white'
                    : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mx-auto mt-3 flex w-full max-w-[1440px] flex-col gap-2 border-t border-stone-200 pt-3 dark:border-stone-800 sm:flex-row">
            <button
              onClick={() => handleNavClick('cart')}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500/15 px-3 text-xs font-bold text-amber-800 dark:text-amber-400"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Cart: {totalBoxes} items · ₹{subtotal.toLocaleString('en-IN')}</span>
            </button>
            <a
              href={`https://wa.me/${STORE_INFO.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp: {STORE_INFO.phoneDisplay}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
