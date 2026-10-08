import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { dbSelect } from '../lib/supabase';
import { useStore } from '../context/StoreContext';

interface BannerRow {
  id: string;
  image_url: string;
  mobile_image_url?: string | null;
  alt_text?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  display_order: number;
  offers?: { title?: string | null };
}

interface HomeBannerProps { onNavigate: (screen: any) => void; }

function navigateFromBanner(onNavigate: HomeBannerProps['onNavigate'], url?: string | null) {
  const target = url?.trim();
  if (!target) return;
  if (/^https?:\/\//i.test(target)) {
    window.open(target, '_blank', 'noopener,noreferrer');
    return;
  }
  const clean = target.replace(/^\//, '').split('?')[0];
  const allowed = ['products', 'table', 'cart', 'myorders', 'tracker', 'whatsapp', 'mail', 'auth', 'gift-boxes', 'transport', 'safety', 'reviews'];
  if (allowed.includes(clean)) onNavigate(clean);
}

export const HomeBanner: React.FC<HomeBannerProps> = ({ onNavigate }) => {
  const { storeInfo } = useStore();
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Keep the existing Supabase integration/query untouched.
    dbSelect<BannerRow>('offer_banners', 'select=*,offers!inner(title)&is_active=eq.true&order=display_order.asc')
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (index >= banners.length) setIndex(0);
  }, [banners.length, index]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[index];
  const background = banner?.image_url || '/images/redthunder_hero_crackers_1791297525760.jpg';
  const mobileBackground = banner?.mobile_image_url || banner?.image_url || background;
  const headline = useMemo(() => banner?.headline?.trim() || 'Celebrate More. Spend Less.', [banner?.headline]);
  const subheadline = useMemo(() => banner?.subheadline?.trim() || 'Quality Crackers at Factory Direct Prices', [banner?.subheadline]);
  const offerTitle = banner?.offers?.title || 'THIS DIWALI';

  return (
    <section data-rtc-component="home_banner" className="rt-hero">
      <picture className="rt-hero-image">
        <source media="(max-width: 640px)" srcSet={mobileBackground} />
        <img src={background} alt={banner?.alt_text || 'RedThunder Crackers Diwali celebration'} fetchPriority="high" decoding="async" />
      </picture>
      <div className="rt-hero-sheen" aria-hidden="true" />
      <div className="rt-container rt-hero-inner">
        <div className="rt-hero-content">
          <span className="rt-hero-kicker"><Sparkles /> {offerTitle}</span>
          <h1 data-rtc-component="hero_heading">{headline}</h1>
          <p data-rtc-component="hero_paragraph">{subheadline}</p>

          <div className="rt-hero-actions">
            <button onClick={() => onNavigate('products')} className="rt-btn rt-btn-primary">Shop Now <ArrowRight /></button>
            <a className="rt-btn rt-btn-whatsapp" href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer"><MessageCircle /> Order on WhatsApp</a>
          </div>

          <div className="rt-hero-features" aria-label="Store benefits">
            <span><ShieldCheck /> Direct from Sivakasi</span>
            <span><Sparkles /> Factory pricing</span>
            <span><MessageCircle /> Quick WhatsApp ordering</span>
          </div>
        </div>
        <div className="rt-hero-badge" aria-hidden="true">
          <span>DIRECT FROM</span>
          <strong>SIVAKASI</strong>
          <small>Quality • Value • Fast Dispatch</small>
        </div>
      </div>

      {banners.length > 1 && (
        <div className="rt-hero-dots" aria-label="Promotional banners">
          {banners.map((item, itemIndex) => (
            <button key={item.id} onClick={() => setIndex(itemIndex)} aria-label={`Show promotion ${itemIndex + 1}`} className={itemIndex === index ? 'active' : ''} />
          ))}
        </div>
      )}
    </section>
  );
};
