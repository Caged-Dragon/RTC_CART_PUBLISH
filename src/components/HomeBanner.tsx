import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { dbSelect } from '../lib/supabase';
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
  const [useDesktopOnMobile, setUseDesktopOnMobile] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const loadBanners = async () => {
      try {
        // Published banner content is owned by the website CMS tables in this shared project.
        const rows: any[] = await dbSelect<any>(
          'web_banners',
          'select=banner_id,title,subtitle,button_text,button_url,sort_order,is_active,start_at,end_at,image:web_media!web_banners_image_media_id_fkey(media_url,alt_text,is_active,is_public),mobile:web_media!web_banners_mobile_image_media_id_fkey(media_url,alt_text,is_active,is_public)&is_active=eq.true&order=sort_order.asc',
        );
        const now = Date.now();
        const available: BannerRow[] = rows.flatMap((row) => {
          const start = row.start_at ? Date.parse(row.start_at) : NaN;
          const end = row.end_at ? Date.parse(row.end_at) : NaN;
          const image = Array.isArray(row.image) ? row.image[0] : row.image;
          const mobile = Array.isArray(row.mobile) ? row.mobile[0] : row.mobile;
          if (!image?.media_url || image.is_active === false || image.is_public === false) return [];
          if ((Number.isFinite(start) && start > now) || (Number.isFinite(end) && end <= now)) return [];
          return [{
            id: String(row.banner_id), image_url: String(image.media_url), mobile_image_url: mobile?.media_url || null,
            alt_text: image.alt_text || row.title || 'RedThunder Crackers catalogue banner',
            headline: row.title || 'Makka & Wheat Brand Catalogue', subheadline: row.subtitle || 'Rajukanna Fireworks, Sivakasi',
            button_text: row.button_text || 'Browse Catalogue', button_url: row.button_url || null,
            display_order: Number(row.sort_order || 0), is_active: true,
            offers: { title: row.title || 'Makka & Wheat Brand Catalogue', is_active: true },
          } as BannerRow];
        });
        if (active && available.length) { setBanners(available); return; }
        // Production currently has no web_banners rows; use the published CMS banner media record.
        const mediaRows: any[] = await dbSelect<any>(
          'web_media', 'select=media_id,media_name,media_url,alt_text&media_id=eq.2&is_public=eq.true&is_active=eq.true&limit=1',
        );
        if (!active) return;
        const media = mediaRows[0];
        setBanners(media?.media_url ? [{
          id: `media-${media.media_id}`, image_url: media.media_url, mobile_image_url: null,
          alt_text: media.alt_text || 'RedThunder Crackers advertising banner',
          headline: 'Makka & Wheat Brand Catalogue', subheadline: 'Rajukanna Fireworks, Sivakasi',
          button_text: 'Browse Catalogue', button_url: null, display_order: 0, is_active: true,
          offers: { title: 'Makka & Wheat Brand Catalogue', is_active: true },
        }] : []);
      } catch (error) {
        console.error('Could not load the shared website banner from Supabase.', error);
        if (active) setBanners([]);
      }
    };
    void loadBanners();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (index >= banners.length) setIndex(0);
  }, [banners.length, index]);

  useEffect(() => {
    setBannerImageFailed(false);
    setUseDesktopOnMobile(false);
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
  const mobileBackground = bannerImageFailed || useDesktopOnMobile ? background : (banner?.mobile_image_url || background);
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
          {/* The carousel keeps a 4:3 frame; the complete creative stays visible above a softly blurred copy. */}
          <div
            className="rt-hero-composed"
            style={{ aspectRatio: '4 / 3' }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured promotions"
            tabIndex={0}
            onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start === null || banners.length < 2) return;
              const end = event.changedTouches[0]?.clientX;
              const delta = typeof end === 'number' ? end - start : null;
              if (delta !== null && Math.abs(delta) > 45) {
                setIndex((value) => (value + (delta < 0 ? 1 : -1) + banners.length) % banners.length);
              }
            }}
            onKeyDown={(event) => {
              if (banners.length < 2) return;
              if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % banners.length);
              if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + banners.length) % banners.length);
            }}
          >
            <picture className="rt-hero-composed-backdrop" aria-hidden="true">
              <source media="(max-width: 640px)" srcSet={mobileBackground} />
              <img src={background} alt="" decoding="async" />
            </picture>
            <picture className="rt-hero-composed-image">
              <source media="(max-width: 640px)" srcSet={mobileBackground} />
              <img
                src={background}
                alt={banner.alt_text || 'RedThunder Crackers celebration and product banner'}
                fetchPriority="high"
                decoding="async"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  // Portrait/mobile artwork leaves more empty space than a landscape creative in a 4:3 frame.
                  // Switch to the primary banner where that produces the larger fully-visible image.
                  if (window.matchMedia('(max-width: 640px)').matches && image.naturalHeight > 0 && image.naturalWidth / image.naturalHeight < 1.15) {
                    setUseDesktopOnMobile(true);
                  }
                }}
                onError={() => setBannerImageFailed(true)}
              />
            </picture>
            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  className="rt-hero-carousel-arrow rt-hero-carousel-prev"
                  onClick={() => setIndex((value) => (value - 1 + banners.length) % banners.length)}
                  aria-label="Previous promotion"
                >‹</button>
                <button
                  type="button"
                  className="rt-hero-carousel-arrow rt-hero-carousel-next"
                  onClick={() => setIndex((value) => (value + 1) % banners.length)}
                  aria-label="Next promotion"
                >›</button>
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
              </>
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
                {banner.button_text?.trim() && !/(order|buy|checkout|payment|book now)/i.test(banner.button_text) ? banner.button_text.trim() : 'Browse Catalogue'} <ArrowRight aria-hidden="true" />
              </button>
              <a
                className="rt-btn rt-btn-whatsapp"
                href={whatsappHref || '/contact'}
                target={whatsappHref ? '_blank' : undefined}
                rel={whatsappHref ? 'noreferrer' : undefined}
                onClick={(event) => { if (!whatsappHref) { event.preventDefault(); onNavigate('contact'); } }}
              >
                <MessageCircle aria-hidden="true" /> Contact sales on WhatsApp
              </a>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="rt-sr-only"><h1>Celebrate More. Spend Less.</h1><p>Quality Crackers at Factory Direct Prices</p></div>
          <div className="rt-hero-composed rt-hero-reference-frame" style={{ aspectRatio: '4 / 3' }}>
            <picture className="rt-hero-composed-backdrop" aria-hidden="true">
              <img src="/images/redthunder_hero_crackers_1791297525760.jpg" alt="" decoding="async" />
            </picture>
            <picture className="rt-hero-composed-image">
              <img src="/images/redthunder_hero_crackers_1791297525760.jpg" alt="RedThunder fireworks and crackers for Diwali celebrations, sourced directly from Sivakasi." fetchPriority="high" decoding="async" width={1376} height={768} />
            </picture>
          </div>
          <div className="rt-container rt-hero-cta-bar">
            <div className="rt-hero-cta-copy">
              <span className="rt-hero-cta-kicker"><Sparkles aria-hidden="true" /> FACTORY DIRECT FROM SIVAKASI</span>
              <strong>Celebrate More. Spend Less.</strong>
              <p>Quality crackers for family celebrations, gifting and festive events.</p>
            </div>
            <div className="rt-hero-actions">
              <button onClick={handleShopNow} className="rt-btn rt-btn-primary" type="button">Browse Catalogue <ArrowRight aria-hidden="true" /></button>
              <a className="rt-btn rt-btn-whatsapp" href={whatsappHref || '/contact'} target={whatsappHref ? '_blank' : undefined} rel={whatsappHref ? 'noreferrer' : undefined} onClick={(event) => { if (!whatsappHref) { event.preventDefault(); onNavigate('contact'); } }}><MessageCircle aria-hidden="true" /> Contact sales on WhatsApp</a>
            </div>
          </div>
        </>
      )}
    </section>

  );
};