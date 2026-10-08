import React from 'react';
import { Facebook, Instagram, MessageCircle, ShieldCheck, Youtube } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ScreenId } from './Navbar';

interface FooterProps {
  onOpenSafety: () => void;
  onNavigate?: (screen: ScreenId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSafety, onNavigate }) => {
  const { storeInfo } = useStore();
  const go = (screen: ScreenId) => onNavigate?.(screen);

  return (
    <footer data-rtc-component="footer" className="rt-footer">
      <div className="rt-container">
        <div className="rt-footer-grid">
          <div className="rt-footer-brand">
            <div className="rt-footer-logo">RED<span>THUNDER</span></div>
            <div className="rt-footer-sub">CRACKERS</div>
            <p>{storeInfo.tagline}. Factory-direct crackers from Sivakasi for family celebrations, gifting and festive events.</p>
            <div className="rt-footer-proof"><ShieldCheck /> Genuine Sivakasi Factory Direct Stock</div>
            <div className="rt-socials" aria-label="Social media">
              <a href="#instagram" aria-label="Instagram"><Instagram /></a>
              <a href="#facebook" aria-label="Facebook"><Facebook /></a>
              <a href="#youtube" aria-label="YouTube"><Youtube /></a>
              <a href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle /></a>
            </div>
          </div>

          <div>
            <h3>Quick Links</h3>
            <button onClick={() => go('intro')}>Home</button>
            <button onClick={() => go('products')}>Shop</button>
            <button onClick={() => go('combos')}>Combos</button>
            <button onClick={() => go('gift-boxes')}>Gift Boxes</button>
            <button onClick={() => go('table')}>Price List</button>
            <button onClick={() => go('myorders')}>My Orders</button>
          </div>

          <div>
            <h3>Customer Support</h3>
            <a href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={`tel:${storeInfo.phone}`}>Phone</a>
            <button onClick={() => go('mail')}>Email Bill</button>
            <button onClick={() => go('tracker')}>Track Order</button>
            <button onClick={onOpenSafety}>Safety Guide</button>
          </div>

          <div>
            <h3>Information</h3>
            <button onClick={() => go('transport')}>Shipping Policy</button>
            <button onClick={() => go('transport')}>Cancellation Policy</button>
            <button onClick={() => go('transport')}>Refund Policy</button>
            <button onClick={() => go('safety')}>Safety & Terms</button>
            <button onClick={() => go('about')}>About RedThunder</button>
          </div>
        </div>

        <div className="rt-footer-bottom">
          <span>© {new Date().getFullYear()} {storeInfo.name}. All rights reserved.</span>
          <span>{storeInfo.address}, {storeInfo.city}, {storeInfo.state} - {storeInfo.pincode}</span>
        </div>
      </div>
    </footer>
  );
};
