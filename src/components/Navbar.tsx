import React, { FormEvent, useState } from 'react';
import { Menu, X, Search, ShoppingCart, UserRound, MessageCircle, ChevronDown, Home, Grid2X2, Layers3, ShieldCheck, Info, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
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

const navItems: { id: ScreenId; label: string }[] = [
  { id: 'intro', label: 'Home' },
  { id: 'products', label: 'Shop' },
  { id: 'gift-boxes', label: 'Combos' },
  { id: 'table', label: 'Best Sellers' },
  { id: 'myorders', label: 'About Us' },
  { id: 'safety', label: 'Safety' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, setCurrentScreen }) => {
  const { storeInfo } = useStore();
  const { totalBoxes, subtotal } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const navigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    setMenuOpen(false);
  };

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('rt_product_search', search.trim());
    navigate('products');
  };

  const whatsappHref = `https://wa.me/${storeInfo.phone}`;

  return (
    <>
      <header data-rtc-component="navbar" className="sticky top-0 z-50 border-b border-[#eadfe0] bg-white/95 backdrop-blur-xl shadow-[0_6px_24px_rgba(16,24,40,.06)]">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-5 lg:px-8">
          <div className="flex min-h-[68px] items-center gap-3 sm:min-h-[76px]">
            <button onClick={() => navigate('intro')} className="flex shrink-0 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613] rounded-xl" aria-label="RedThunder Crackers home">
              <div className="h-11 w-11 overflow-hidden rounded-xl bg-white sm:h-12 sm:w-12">
                {storeInfo.logoUrl ? <img src={storeInfo.logoUrl} alt={storeInfo.name} className="h-full w-full object-contain" /> : <Sparkles className="m-3 h-6 w-6 text-[#E30613]" />}
              </div>
              <div className="hidden sm:block">
                <div className="font-display text-[19px] font-black tracking-tight text-[#101828]">RED<span className="text-[#E30613]">THUNDER</span></div>
                <div className="text-[9px] font-bold uppercase tracking-[.19em] text-[#667085]">CRACKERS • SIVAKASI</div>
              </div>
            </button>

            <form onSubmit={submitSearch} className="mx-auto hidden min-w-0 flex-1 md:block md:max-w-[510px]">
              <label className="relative block">
                <span className="sr-only">Search products</span>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sparklers, flower pots, rockets..." className="h-11 w-full rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] pl-10 pr-4 text-sm text-[#101828] placeholder:text-[#98A2B3] outline-none transition focus:border-[#E30613] focus:bg-white focus:ring-4 focus:ring-[#E30613]/10" />
              </label>
            </form>

            <div className="ml-auto hidden items-center gap-2 lg:flex">
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#11B35A] px-3 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#0ea652] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#11B35A]">
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
              <button onClick={() => navigate('auth')} className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7EC] px-3 py-2.5 text-xs font-bold text-[#344054] hover:bg-[#F8F9FB]" aria-label="My account">
                <UserRound className="h-4 w-4" />
                <span>{isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Login'}</span>
              </button>
              <button onClick={() => navigate('cart')} className="relative inline-flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-[#101828] hover:bg-[#F8F9FB]" aria-label={`Cart with ${totalBoxes} items`}>
                <ShoppingCart className="h-5 w-5" />
                {totalBoxes > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#E30613] px-1 text-[10px] font-black text-white">{totalBoxes}</span>}
                <span className="hidden xl:block text-xs font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <button onClick={() => navigate('cart')} className="relative grid h-10 w-10 place-items-center rounded-xl text-[#101828]" aria-label="Open cart">
                <ShoppingCart className="h-5 w-5" />
                {totalBoxes > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#E30613] px-1 text-[9px] font-black text-white">{totalBoxes}</span>}
              </button>
              <button onClick={() => setMenuOpen(v => !v)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#E4E7EC] text-[#101828]" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <nav className="hidden items-center gap-7 border-t border-[#F2F4F7] py-0 md:flex" aria-label="Primary navigation">
            {navItems.map(item => (
              <button key={item.id} onClick={() => navigate(item.id)} className={`relative py-3.5 text-[12px] font-extrabold transition ${currentScreen === item.id ? 'text-[#E30613]' : 'text-[#344054] hover:text-[#E30613]'}`}>
                {item.label}
                {currentScreen === item.id && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#E30613]" />}
              </button>
            ))}
            <button onClick={() => navigate('products')} className="ml-auto inline-flex items-center gap-1 text-[12px] font-extrabold text-[#344054] hover:text-[#E30613]">Categories <ChevronDown className="h-3.5 w-3.5" /></button>
            <button onClick={() => navigate('transport')} className="text-[12px] font-extrabold text-[#344054] hover:text-[#E30613]">Contact</button>
          </nav>
        </div>

        {menuOpen && (
          <div className="border-t border-[#EAECF0] bg-white px-4 py-4 md:hidden">
            <form onSubmit={submitSearch} className="mb-3">
              <label className="relative block"><span className="sr-only">Search products</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search crackers..." className="h-11 w-full rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] pl-10 pr-3 text-sm outline-none focus:border-[#E30613]" /></label>
            </form>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(item => <button key={item.id} onClick={() => navigate(item.id)} className="rounded-xl bg-[#F8F9FB] px-3 py-3 text-left text-xs font-extrabold text-[#344054]">{item.label}</button>)}
              <button onClick={() => navigate('auth')} className="rounded-xl bg-[#F8F9FB] px-3 py-3 text-left text-xs font-extrabold text-[#344054]">{isAuthenticated ? 'My Account' : 'Login'}</button>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-xl bg-[#EAF8F0] px-3 py-3 text-xs font-extrabold text-[#087443]">Order on WhatsApp</a>
            </div>
          </div>
        )}
      </header>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E4E7EC] bg-white/95 px-2 pb-[calc(.35rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(16,24,40,.10)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {[
            { id: 'intro' as ScreenId, label: 'Home', icon: Home },
            { id: 'products' as ScreenId, label: 'Search', icon: Search },
            { id: 'products' as ScreenId, label: 'Categories', icon: Grid2X2 },
            { id: 'cart' as ScreenId, label: 'Cart', icon: ShoppingCart },
          ].map((item, i) => <button key={`${item.label}-${i}`} onClick={() => navigate(item.id)} className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-bold ${currentScreen === item.id && i !== 1 && i !== 2 ? 'text-[#E30613]' : 'text-[#667085]'}`}>
            <item.icon className="h-4 w-4" />{item.label}{item.label === 'Cart' && totalBoxes > 0 && <span className="absolute right-2 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#E30613] px-1 text-[8px] text-white">{totalBoxes}</span>}
          </button>)}
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] font-bold text-[#0A8F4D]"><MessageCircle className="h-4 w-4" />WhatsApp</a>
        </div>
      </div>
    </>
  );
};
