import React, { FormEvent, useMemo, useState } from 'react';
import {
  ChevronDown,
  Grid2X2,
  Home,
  Menu,
  MessageCircle,
  Search,
  ShoppingCart,
  UserRound,
  X,
  Moon,
  Sun,
  ShieldCheck,
  Gift,
  PackageSearch,
  PhoneCall,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useCategories } from '../context/CategoriesContext';
import { setShopIntent } from '../utils/shopNavigation';
import logoImage from '../assets/logo.jpeg';

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
  | 'combos'
  | 'gift-boxes'
  | 'transport'
  | 'safety'
  | 'reviews'
  | 'about'
  | 'contact';

interface NavbarProps {
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;
  onOpenSafety: () => void;
}

type NavLink = { id: ScreenId; label: string };

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, setCurrentScreen, onOpenSafety }) => {
  const { storeInfo } = useStore();
  const { totalBoxes } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { categories } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState('');

  const primaryNav: NavLink[] = useMemo(
    () => [
      { id: 'intro', label: 'Home' },
      { id: 'products', label: 'Shop' },
      { id: 'combos', label: 'Combos' },
      { id: 'products', label: 'Best Sellers' },
      { id: 'about', label: 'About Us' },
      { id: 'safety', label: 'Safety' },
      { id: 'contact', label: 'Contact' },
    ],
    []
  );

  const handleNav = (screen: ScreenId, options?: { closeMenu?: boolean }) => {
    setCurrentScreen(screen);
    if (options?.closeMenu !== false) setMenuOpen(false);
    setCategoriesOpen(false);
  };

  const submitSearch = (event?: FormEvent) => {
    event?.preventDefault();
    handleNav('products');
    const value = query.trim();
    setShopIntent({ type: 'search', value });
    const url = new URL(window.location.href);
    url.pathname = '/products';
    if (value) url.searchParams.set('q', value); else url.searchParams.delete('q');
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  };

  const selectCategory = (categoryName: string) => {
    handleNav('products');
    setShopIntent({ type: 'category', value: categoryName });
  };


  return (
    <header data-rtc-component="navbar" className="rt-navbar">
      <div className="rt-nav-top">
        <div className="rt-container rt-nav-top-inner">
          <button className="rt-brand" onClick={() => handleNav('intro')} aria-label="RedThunder Crackers home">
            <span className="rt-brand-mark">
              {storeInfo.logoUrl ? (
                <img src={storeInfo.logoUrl} alt={storeInfo.name} />
              ) : (
                <img src={logoImage} alt="RedThunder Crackers" />
              )}
            </span>
            <span className="rt-brand-copy">
              <strong>RED<span>THUNDER</span></strong>
              <small>CRACKERS</small>
            </span>
          </button>

          <form className="rt-nav-search" onSubmit={submitSearch} role="search">
            <Search aria-hidden="true" />
            <input
              aria-label="Search crackers, flower pots, rockets"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sparklers, flower pots, rockets..."
            />
            <button type="submit" aria-label="Search">
              <Search aria-hidden="true" />
            </button>
          </form>

          <div className="rt-nav-actions">
            <a className="rt-nav-whatsapp" href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer">
              <MessageCircle />
              <span><strong>WhatsApp</strong><small>Order & Support</small></span>
            </a>
            <button className="rt-nav-account" onClick={() => handleNav('auth')} aria-label="Open account">
              <UserRound />
              <span><strong>{isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Login'}</strong><small>My Account</small></span>
            </button>
            <button className="rt-cart-btn" onClick={() => handleNav('cart')} aria-label={`Open cart, ${totalBoxes} items`}>
              <ShoppingCart />
              {totalBoxes > 0 && <b>{totalBoxes}</b>}
              <span className="rt-cart-label">Cart</span>
            </button>
            <button className="rt-mobile-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <div className="rt-nav-bottom">
        <div className="rt-container rt-nav-bottom-inner">
          <nav className="rt-primary-nav" aria-label="Main navigation">
            {primaryNav.map((item, index) => {
              const isCategory = index === 1;
              const isBest = index === 3;
              const active = isBest ? false : currentScreen === item.id;
              return (
                <div className="rt-nav-item-wrap" key={`${item.label}-${index}`}>
                  <button
                    className={`rt-nav-link ${active ? 'active' : ''}`}
                    onClick={() => {
                      if (isCategory) setCategoriesOpen((v) => !v);
                      else if (isBest) {
                        handleNav('products');
                        setShopIntent({ type: 'best-sellers' });
                      } else handleNav(item.id);
                    }}
                    aria-expanded={isCategory ? categoriesOpen : undefined}
                  >
                    {item.label}
                    {isCategory && <ChevronDown />}
                  </button>
                  {isCategory && categoriesOpen && (
                    <div className="rt-category-menu" role="menu">
                      <button onClick={() => selectCategory('All')} role="menuitem">All Crackers</button>
                      {categories.filter((c) => c.is_active).slice(0, 10).map((category) => (
                        <button key={category.category_id} onClick={() => selectCategory(category.category_name)} role="menuitem">
                          {category.category_name}
                        </button>
                      ))}
                      {categories.length > 10 && <button className="rt-category-menu-more" onClick={() => handleNav('products')}>View all categories</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="rt-nav-meta">
            <button onClick={() => handleNav('table')}><Grid2X2 /> Price List</button>
            <button onClick={onOpenSafety}><ShieldCheck /> Safety Guide</button>
            <a href={`tel:${storeInfo.phone}`}><PhoneCall /> {storeInfo.phoneDisplay}</a>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="rt-mobile-menu">
          <div className="rt-container">
            <form className="rt-mobile-search" onSubmit={submitSearch} role="search">
              <Search aria-hidden="true" />
              <input aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search crackers..." />
              <button type="submit">Search</button>
            </form>
            <div className="rt-mobile-grid">
              <button onClick={() => handleNav('intro')}><Home /> Home</button>
              <button onClick={() => handleNav('products')}><Grid2X2 /> Shop</button>
              <button onClick={() => handleNav('combos')}><Gift /> Combos</button>
              <button onClick={() => handleNav('gift-boxes')}><Gift /> Gift Boxes</button>
              <button onClick={() => handleNav('cart')}><ShoppingCart /> Cart {totalBoxes > 0 && <b>{totalBoxes}</b>}</button>
              <button onClick={() => handleNav('myorders')}><PackageSearch /> My Orders</button>
              <button onClick={() => handleNav('tracker')}><PackageSearch /> Track Order</button>
              <button onClick={() => handleNav('about')}><ShieldCheck /> About Us</button>
              <button onClick={() => handleNav('contact')}><PhoneCall /> Contact</button>
              <button onClick={() => handleNav('table')}><Grid2X2 /> Price List</button>
              <button onClick={() => handleNav('whatsapp')}><MessageCircle /> WhatsApp Order</button>
              <button onClick={() => handleNav('mail')}><PhoneCall /> Email Bill</button>
              <button onClick={() => handleNav('transport')}><PackageSearch /> Transport</button>
              <button onClick={() => handleNav('reviews')}><ShieldCheck /> Reviews</button>
              <button onClick={() => { onOpenSafety(); setMenuOpen(false); }}><ShieldCheck /> Safety</button>
            </div>
            <div className="rt-mobile-menu-footer">
              <a href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp Support</a>
              <button onClick={toggleTheme}>{theme === 'dark' ? <Sun /> : <Moon />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
