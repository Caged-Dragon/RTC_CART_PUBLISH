import React from 'react';
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import type { ScreenId } from '../components/Navbar';
import { useStore } from '../context/StoreContext';

export const ContactScreen: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  const { storeInfo, merchant } = useStore();
  const wa = `https://wa.me/${storeInfo.phone}`;
  return (
    <section className="rt-info-page" data-rtc-component="contact_page">
      <div className="rt-container">
        <div className="rt-contact-head">
          <div><span className="rt-kicker">Contact & Support</span><h1>Need help placing your order?</h1><p>Reach the RedThunder team through WhatsApp, phone or email. Store contact details are read from the existing company profile.</p></div>
          <div className={`rt-status-pill ${merchant.isBookingOpen ? 'open' : 'closed'}`}><Clock3 /> {merchant.isBookingOpen ? 'Season booking open' : 'Season booking closed'}</div>
        </div>

        <div className="rt-contact-grid">
          <a className="rt-contact-card whatsapp" href={wa} target="_blank" rel="noreferrer"><MessageCircle /><span>WhatsApp</span><strong>{storeInfo.phoneDisplay}</strong><small>Order & support</small></a>
          <a className="rt-contact-card" href={`tel:${storeInfo.phone}`}><Phone /><span>Phone</span><strong>{storeInfo.phoneDisplay}</strong><small>Customer support</small></a>
          <a className="rt-contact-card" href="mailto:sales@rtcrackers.com"><Mail /><span>Email</span><strong>sales@rtcrackers.com</strong><small>Send us your query</small></a>
          <div className="rt-contact-card"><MapPin /><span>Store / Dispatch</span><strong>{storeInfo.address}</strong><small>{storeInfo.city}, {storeInfo.state} {storeInfo.pincode}</small></div>
        </div>

        <div className="rt-contact-lower">
          <div className="rt-info-story"><div><span className="rt-kicker">Before you order</span><h2>Stock, freight and dispatch are confirmed with you.</h2></div><p>{merchant.dispatchPolicy}. For the fastest assistance, send your product names or order details on WhatsApp.</p></div>
          <div className="rt-contact-actions"><a className="rt-btn rt-btn-whatsapp" href={wa} target="_blank" rel="noreferrer"><MessageCircle /> Chat on WhatsApp</a><button className="rt-btn rt-btn-outline" onClick={() => onNavigate('safety')}><ShieldCheck /> Safety Guide</button></div>
        </div>
      </div>
    </section>
  );
};
