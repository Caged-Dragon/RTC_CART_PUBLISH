import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { dbSelectSWR } from '../lib/supabase';
import { useStore } from '../context/StoreContext';
import { navigateToConfiguredTarget } from '../utils/navigationTarget';
import type { ScreenId } from './Navbar';

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
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  offers?: { title?: string | null; is_active?: boolean; starts_at?: string | null; ends_at?: string | null };
}

interface HomeBannerProps { onNavigate: (screen: ScreenId) => void; }

export const HomeBanner: React.FC<HomeBannerProps> = ({ onNavigate }) => {
  const { storeInfo } = useStore();
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    const now = Date.now();
    dbSelectSWR<BannerRow>('offer_banners', 'select=*,offers!inner(title,is_active,starts_at,ends_at)&is_active=eq.true&offers.is_active=eq.true&order=display_order.asc', (rows) => {
      if (!active) return;
      const available = rows.filter((item) => {
        const start = item.starts_at ? Date.parse(item.starts_at) : NaN;
        const end = item.ends_at ? Date.parse(item.ends_at) : NaN;
        const offerStart = item.offers?.starts_at ? Date.parse(item.offers.starts_at) : NaN;
        const offerEnd = item.offers?.ends_at ? Date.parse(item.offers.ends_at) : NaN;
        return (!Number.isFinite(start) || start <= now) && (!Number.isFinite(end) || end >= now)
          && (!Number.isFinite(offerStart) || offerStart <= now) && (!Number.isFinite(offerEnd) || offerEnd >= now);
      });
      setBanners(available);
    }).catch(() => { if (active) setBanners([]); });
    return () => { active = false; };
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
  const hasCustomHeadline = Boolean(banner?.headline?.trim());
  const handleShopNow = () => navigateToConfiguredTarget(banner?.button_url, onNavigate, 'products');

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
          <h1 data-rtc-component="hero_heading">{hasCustomHeadline ? headline : <><span className="rt-hero-highlight-gold">Celebrate More.</span><br /><span>Spend Less.</span></>}</h1>
          <p data-rtc-component="hero_paragraph">{subheadline}</p>

          <div className="rt-hero-actions">
            <button onClick={handleShopNow} className="rt-btn rt-btn-primary">{banner?.button_text?.trim() || 'Shop Now'} <ArrowRight /></button>
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
