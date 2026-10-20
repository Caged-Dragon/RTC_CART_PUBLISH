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
import { getWhatsAppHref } from '../utils/contactLinks';
import exactCompanyLogoFallback from '../assets/logo.jpeg';

export type ScreenId =
  | 'intro'
  | 'products'
  | 'categories'
  | 'bestsellers'
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
  const whatsappHref = getWhatsAppHref(storeInfo.phone);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [query, setQuery] = useState('');

  const primaryNav: NavLink[] = useMemo(
    () => [
      { id: 'intro', label: 'Home' },
      { id: 'products', label: 'Shop' },
      { id: 'categories', label: 'Categories' },
      { id: 'combos', label: 'Combos' },
      { id: 'bestsellers', label: 'Best Sellers' },
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

  const showBestSellers = () => handleNav('bestsellers');


  return (
    <header data-rtc-component="navbar" className="rt-navbar">
      <div className="rt-nav-top">
        <div className="rt-container rt-nav-top-inner">
          <button className="rt-brand" onClick={() => handleNav('intro')} aria-label="RedThunder Crackers home">
            <span className="rt-brand-mark">
              <img
                src={storeInfo.logoUrl || exactCompanyLogoFallback}
                alt={storeInfo.name || 'RedThunder Crackers'}
                decoding="async"
                onError={(event) => {
                  const image = event.currentTarget;
                  // This fallback is byte-for-byte identical to the current public logo object in Supabase Storage.
                  // Never replace the database logo based on its aspect ratio or crop/edit the source image.
                  if (image.dataset.localFallback !== 'true') {
                    image.dataset.localFallback = 'true';
                    image.src = exactCompanyLogoFallback;
                  }
                }}
              />
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
            <a className="rt-nav-whatsapp" href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={(event) => { if (!whatsappHref) { event.preventDefault(); handleNav('contact'); } }}>
              <MessageCircle />
              <span><strong>WhatsApp</strong><small>Order & Support</small></span>
            </a>
            <button className="rt-nav-account" onClick={() => handleNav('auth')} aria-label="Open account">
              <UserRound />
              <span><strong>{isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Login'}</strong><small>My Account</small></span>
            </button>
            <button
              className={`rt-my-orders-btn ${currentScreen === 'myorders' ? 'active' : ''}`}
              onClick={() => handleNav('myorders')}
              aria-label="Open My Orders"
              aria-current={currentScreen === 'myorders' ? 'page' : undefined}
              title="View your order history"
            >
              <PackageSearch aria-hidden="true" />
              <span className="rt-my-orders-label">My Orders</span>
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
            {primaryNav.map((item) => {
              const isCategory = item.label === 'Categories';
              const isBest = item.label === 'Best Sellers';
              const active = isCategory ? (categoriesOpen || currentScreen === 'categories') : currentScreen === item.id;
              return (
                <div className={`rt-nav-item-wrap ${isCategory ? 'rt-nav-category-wrap' : ''}`} key={item.label}>
                  {isCategory ? (
                    <>
                      <button
                        className={`rt-nav-link ${active ? 'active' : ''}`}
                        onClick={() => handleNav('categories')}
                        aria-current={currentScreen === 'categories' ? 'page' : undefined}
                      >
                        Categories
                      </button>
                      <button
                        type="button"
                        className={`rt-nav-link rt-nav-category-toggle ${categoriesOpen ? 'active' : ''}`}
                        onClick={() => setCategoriesOpen((value) => !value)}
                        aria-label={categoriesOpen ? 'Close quick category menu' : 'Open quick category menu'}
                        aria-expanded={categoriesOpen}
                      >
                        <ChevronDown aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <button
                      className={`rt-nav-link ${active ? 'active' : ''}`}
                      onClick={() => {
                        if (isBest) showBestSellers();
                        else {
                          handleNav(item.id);
                          if (item.label === 'Shop') setShopIntent({ type: 'all' });
                        }
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                  {isCategory && categoriesOpen && (
                    <div className="rt-category-menu" role="menu">
                      <button className="rt-category-menu-more" onClick={() => handleNav('categories')} role="menuitem">Browse all categories <span aria-hidden="true">→</span></button>
                      <button onClick={() => selectCategory('All')} role="menuitem">All Crackers</button>
                      {categories.filter((c) => c.is_active).slice(0, 10).map((category) => (
                        <button key={category.category_id} onClick={() => selectCategory(category.category_name)} role="menuitem">
                          {category.category_name}
                        </button>
                      ))}
                      {categories.filter((category) => category.is_active).length > 10 && <button className="rt-category-menu-more" onClick={() => handleNav('categories')} role="menuitem">View full category directory</button>}
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
              <button onClick={() => { handleNav('products'); setShopIntent({ type: 'all' }); }}><Grid2X2 /> Shop</button>
              <button onClick={() => handleNav('categories')}><Grid2X2 /> Categories</button>
              <button onClick={showBestSellers}><Gift /> Best Sellers</button>
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
              <a href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={(event) => { if (!whatsappHref) { event.preventDefault(); handleNav('contact'); } }}><MessageCircle /> WhatsApp Support</a>
              <button onClick={toggleTheme}>{theme === 'dark' ? <Sun /> : <Moon />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
