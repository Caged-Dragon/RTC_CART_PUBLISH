import React, { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { dbSelectSWR } from '../lib/supabase';
import { useStore } from '../context/StoreContext';
import { navigateToConfiguredTarget } from '../utils/navigationTarget';
import { setShopIntent } from '../utils/shopNavigation';
import { getWhatsAppHref } from '../utils/contactLinks';
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

const REFERENCE_DESKTOP = '/images/storefront/hero-desktop.jpg';
const REFERENCE_MOBILE = '/images/storefront/hero-mobile.jpg';

export const HomeBanner: React.FC<HomeBannerProps> = ({ onNavigate }) => {
  const { storeInfo } = useStore();
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [index, setIndex] = useState(0);
  const [bannerImageFailed, setBannerImageFailed] = useState(false);
  const [useReferenceMobileArt, setUseReferenceMobileArt] = useState(false);
  const [bannerAspectRatio, setBannerAspectRatio] = useState(() =>
    window.matchMedia('(max-width: 640px)').matches ? '428 / 582' : '16 / 9'
  );

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
    setBannerImageFailed(false);
    setUseReferenceMobileArt(false);
  }, [banners[index]?.id, banners[index]?.image_url, banners[index]?.mobile_image_url]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % banners.length), 6500);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[index];
  const background = bannerImageFailed
    ? REFERENCE_DESKTOP
    : banner?.image_url || '/images/redthunder_hero_crackers_1791297525760.jpg';
  const mobileBackground = bannerImageFailed || useReferenceMobileArt
    ? REFERENCE_MOBILE
    : banner?.mobile_image_url || banner?.image_url || REFERENCE_MOBILE;
  const offerTitle = banner?.offers?.title || 'THIS DIWALI';
  const whatsappHref = getWhatsAppHref(storeInfo.phone);
  const handleShopNow = () => {
    if (banner) {
      navigateToConfiguredTarget(banner.button_url, onNavigate, 'products');
      return;
    }
    setShopIntent({ type: 'all' });
    onNavigate('products');
  };

  return (
    <section data-rtc-component="home_banner" className={`rt-hero ${banner ? 'rt-hero-dynamic' : 'rt-hero-reference'}`}>
      {banner ? (
        <>
          {/* Uploaded banners are complete artwork. Keep their natural ratio: no crop, stretch, or overlaid text. */}
          <div className="rt-hero-composed" style={{ aspectRatio: bannerAspectRatio }}>
            <img className="rt-hero-composed-backdrop" src={background} alt="" aria-hidden="true" decoding="async" />
            <picture className="rt-hero-composed-image">
              <source media="(max-width: 640px)" srcSet={mobileBackground} />
              <img
                src={background}
                alt={banner.alt_text || 'RedThunder Crackers celebration and product banner'}
                fetchPriority="high"
                decoding="async"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  // Size the frame to this exact asset ratio, so the CTA row always follows the whole image
                  // rather than covering or cropping its bottom edge.
                  if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                    setBannerAspectRatio(`${image.naturalWidth} / ${image.naturalHeight}`);
                  }
                  // Avoid using a landscape creative as a phone banner when the database's mobile URL
                  // accidentally points to the same artwork as the desktop image.
                  if (window.matchMedia('(max-width: 640px)').matches && image.naturalWidth > image.naturalHeight * 1.25) {
                    setUseReferenceMobileArt(true);
                  }
                }}
                onError={() => setBannerImageFailed(true)}
              />
            </picture>
            {banners.length > 1 && (
              <div className="rt-hero-dots rt-hero-composed-dots" aria-label="Promotional banners">
                {banners.map((item, itemIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    aria-label={`Show promotion ${itemIndex + 1}`}
                    aria-current={itemIndex === index ? 'true' : undefined}
                    className={itemIndex === index ? 'active' : ''}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="rt-container rt-hero-cta-bar">
            <div className="rt-hero-cta-copy">
              <span className="rt-hero-cta-kicker"><Sparkles aria-hidden="true" /> {offerTitle}</span>
              {banner.headline?.trim() && <strong>{banner.headline.trim()}</strong>}
              {banner.subheadline?.trim() && <p>{banner.subheadline.trim()}</p>}
              {!banner.headline?.trim() && !banner.subheadline?.trim() && <p>Factory-direct crackers from Sivakasi for your celebration.</p>}
            </div>
            <div className="rt-hero-actions">
              <button onClick={handleShopNow} className="rt-btn rt-btn-primary" type="button">
                {banner.button_text?.trim() || 'Shop Now'} <ArrowRight aria-hidden="true" />
              </button>
              <a
                className="rt-btn rt-btn-whatsapp"
                href={whatsappHref || '/contact'}
                target={whatsappHref ? '_blank' : undefined}
                rel={whatsappHref ? 'noreferrer' : undefined}
                onClick={(event) => { if (!whatsappHref) { event.preventDefault(); onNavigate('contact'); } }}
              >
                <MessageCircle aria-hidden="true" /> Order on WhatsApp
              </a>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rt-sr-only"><h1>Celebrate More. Spend Less.</h1><p>Quality Crackers at Factory Direct Prices</p></div>
          <picture className="rt-hero-reference-image">
            <source media="(max-width: 640px)" srcSet={REFERENCE_MOBILE} />
            <img src={REFERENCE_DESKTOP} alt="This Diwali: Celebrate More. Spend Less. Quality crackers at factory direct prices. Shop Now or order on WhatsApp." fetchPriority="high" decoding="async" width={1586} height={570} />
          </picture>
          <div className="rt-hero-reference-hotspots" aria-label="Shopping options">
            <button className="rt-hero-hotspot rt-hero-hotspot-shop" onClick={handleShopNow} aria-label="Shop now">Shop now</button>
            <a className="rt-hero-hotspot rt-hero-hotspot-whatsapp" href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={(event) => { if (!whatsappHref) { event.preventDefault(); onNavigate('contact'); } }} aria-label="Order on WhatsApp">Order on WhatsApp</a>
          </div>
        </>
      )}
    </section>

  );
};