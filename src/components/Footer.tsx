import React from 'react';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ScreenId } from './Navbar';
import { getWhatsAppHref } from '../utils/contactLinks';

interface FooterProps {
  onOpenSafety: () => void;
  onNavigate?: (screen: ScreenId) => void;
  currentScreen?: ScreenId;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSafety, onNavigate, currentScreen }) => {
  const { storeInfo } = useStore();
  const go = (screen: ScreenId) => onNavigate?.(screen);
  const whatsappHref = getWhatsAppHref(storeInfo.phone);
  const handleWhatsAppClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!whatsappHref) { event.preventDefault(); go('contact'); }
  };

  return (
    <footer data-rtc-component="footer" className="rt-footer">
      <div className="rt-container">
        <div className="rt-footer-grid">
          <div className="rt-footer-brand">
            <div className="rt-footer-logo">RED<span>THUNDER</span></div>
            <div className="rt-footer-sub">CRACKERS</div>
            <p>{storeInfo.tagline}. Factory-direct crackers from Sivakasi for family celebrations, gifting and festive events.</p>
            <div className="rt-footer-proof"><ShieldCheck /> Makka &amp; Wheat brand · Sivakasi catalogue</div>
            <div className="rt-socials" aria-label="Contact channels">
              <a href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={handleWhatsAppClick} aria-label="WhatsApp support"><MessageCircle /></a>
            </div>
          </div>

          <div>
            <h3>Quick Links</h3>
            {currentScreen === 'intro' && <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</button>}
            <button onClick={() => go('products')}>Browse products</button>
            <button onClick={() => go('gift-boxes')}>Gift Boxes</button>
            <button onClick={() => go('table')}>Price List</button>
            <button onClick={() => go('myorders')}>Past Orders</button>
          </div>

          <div>
            <h3>Customer Support</h3>
            <a href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={handleWhatsAppClick}>WhatsApp</a>
            <a href="tel:+918124100501">Phone +91 8124100501</a>
            <a href="tel:+917358737658">Secondary +91 7358737658</a>
            <a href="mailto:sales@rtcrackers.com">Sales email</a>
            <a href="mailto:support@rtcrackers.com">Support email</a>
            <button onClick={() => go('mail')}>Contact Sales by Email</button>
            <button onClick={() => go('tracker')}>Track Order</button>
            <button onClick={onOpenSafety}>Safety Guide</button>
          </div>

          <div>
            <h3>Information</h3>
            <a href="https://rtcrackers.com/" target="_blank" rel="noopener noreferrer">Company website ↗</a>
            <button onClick={() => go('transport')}>Shipping Policy</button>
            <button onClick={() => go('safety')}>Order Verification & Policy</button>
            <button onClick={() => go('safety')}>No-Cancellation / No-Return Policy</button>
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
