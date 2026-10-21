import React from 'react';
import { Clock3, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import type { ScreenId } from '../components/Navbar';
import { useStore } from '../context/StoreContext';
import { SupportForm } from '../components/SupportForm';
import { getWhatsAppHref } from '../utils/contactLinks';

export const ContactScreen: React.FC<{ onNavigate: (screen: ScreenId) => void }> = ({ onNavigate }) => {
  const { storeInfo, merchant } = useStore();
  const wa = getWhatsAppHref(storeInfo.phone);
  return (
    <section className="rt-info-page" data-rtc-component="contact_page">
      <div className="rt-container">
        <div className="rt-contact-head">
          <div><span className="rt-kicker">Contact & Support</span><h1>Need product information?</h1><p>Reach the RedThunder team through WhatsApp, phone or email. The primary order desk is +91 8124100501; secondary support is +91 7358737658.</p></div>
          <div className={`rt-status-pill ${merchant.isBookingOpen ? 'open' : 'closed'}`}><Clock3 /> Product information: contact sales</div>
        </div>

        <div className="rt-contact-grid">
          <a className="rt-contact-card whatsapp" href={wa || undefined} target={wa ? '_blank' : undefined} rel={wa ? 'noreferrer' : undefined} aria-disabled={!wa} onClick={(event) => { if (!wa) event.preventDefault(); }}><MessageCircle /><span>WhatsApp</span><strong>{storeInfo.phoneDisplay}</strong><small>{wa ? 'General support' : 'WhatsApp number not configured'}</small></a>
          <a className="rt-contact-card" href="tel:+918124100501"><Phone /><span>Primary phone</span><strong>+91 8124100501</strong><small>Sales & product information</small></a>
          <a className="rt-contact-card" href="tel:+917358737658"><Phone /><span>Secondary support</span><strong>+91 7358737658</strong><small>Customer support</small></a>
          <a className="rt-contact-card" href="mailto:sales@rtcrackers.com"><Mail /><span>Sales email</span><strong>sales@rtcrackers.com</strong><small>Send a general product enquiry</small></a>
          <a className="rt-contact-card" href="mailto:support@rtcrackers.com"><Mail /><span>Support email</span><strong>support@rtcrackers.com</strong><small>Customer service</small></a>
          <div className="rt-contact-card"><MapPin /><span>Store / Dispatch</span><strong>{storeInfo.address}</strong><small>{storeInfo.city}, {storeInfo.state} {storeInfo.pincode}</small></div>
        </div>

        <SupportForm />

        <div className="rt-contact-lower">
          <div className="rt-info-story"><div><span className="rt-kicker">Before contacting sales</span><h2>Ask about catalogue details and applicable requirements.</h2></div><p>{merchant.dispatchPolicy}. Use the contact links for general product questions; the website does not accept online orders.</p></div>
          <div className="rt-contact-actions"><a className="rt-btn rt-btn-whatsapp" href={wa || undefined} target={wa ? '_blank' : undefined} rel={wa ? 'noreferrer' : undefined} aria-disabled={!wa} onClick={(event) => { if (!wa) event.preventDefault(); }}><MessageCircle /> Chat on WhatsApp</a><button className="rt-btn rt-btn-outline" onClick={() => onNavigate('safety')}><ShieldCheck /> Safety Guide</button></div>
        </div>
      </div>
    </section>
  );
};
