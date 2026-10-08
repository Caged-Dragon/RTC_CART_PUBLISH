import React from 'react';
import { Grid2X2, Home, MessageCircle, Search, ShoppingCart } from 'lucide-react';
import type { ScreenId } from './Navbar';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { setShopIntent } from '../utils/shopNavigation';

interface Props { currentScreen: ScreenId; setCurrentScreen: (screen: ScreenId) => void; }

export const MobileBottomNav: React.FC<Props> = ({ currentScreen, setCurrentScreen }) => {
  const { totalBoxes } = useCart();
  const { storeInfo } = useStore();
  const goShop = (mode?: string) => {
    setCurrentScreen('products');
    if (mode === 'category') setShopIntent({ type: 'category', value: 'All' });
    if (mode === 'search') setShopIntent({ type: 'search', value: '' });
  };
  return (
    <nav className="rt-mobile-bottom-nav" aria-label="Mobile navigation">
      <button className={currentScreen === 'intro' ? 'active' : ''} onClick={() => setCurrentScreen('intro')}><Home /><span>Home</span></button>
      <button className={currentScreen === 'products' ? 'active' : ''} onClick={() => goShop('search')}><Search /><span>Search</span></button>
      <button onClick={() => goShop('category')}><Grid2X2 /><span>Categories</span></button>
      <button className={currentScreen === 'cart' ? 'active' : ''} onClick={() => setCurrentScreen('cart')}><span className="rt-mobile-cart-icon"><ShoppingCart />{totalBoxes > 0 && <b>{totalBoxes}</b>}</span><span>Cart</span></button>
      <a href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer"><MessageCircle /><span>WhatsApp</span></a>
    </nav>
  );
};
