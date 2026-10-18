import React, { useEffect, useState } from 'react';
import { BadgePercent, ArrowRight } from 'lucide-react';
import { dbSelectSWR } from '../lib/supabase';
import type { ScreenId } from './Navbar';
import { navigateToConfiguredTarget } from '../utils/navigationTarget';

interface LiveOffersSectionProps { onNavigate: (screen: ScreenId) => void; }

export const LiveOffersSection: React.FC<LiveOffersSectionProps> = ({ onNavigate }) => {
  const [offers, setOffers] = useState<any[]>([]);
  useEffect(() => {
    let active = true;
    const inWindow = (record: any, now: number) => {
      const starts = record?.starts_at ? Date.parse(record.starts_at) : NaN;
      const ends = record?.ends_at ? Date.parse(record.ends_at) : NaN;
      return (!Number.isFinite(starts) || starts <= now) && (!Number.isFinite(ends) || ends >= now);
    };
    dbSelectSWR<any>('offers', 'select=*,offer_banners(*)&is_active=eq.true&order=display_order.asc,priority.desc', (rows) => {
      if (!active) return;
      const now = Date.now();
      setOffers(rows.filter((offer) => inWindow(offer, now)).map((offer) => ({
        ...offer,
        offer_banners: (offer.offer_banners || []).filter((banner: any) => banner.is_active && inWindow(banner, now)),
      })));
    }).catch(() => { if (active) setOffers([]); });
    return () => { active = false; };
  }, []);
  if (!offers.length) return null;

  return (
    <section className="rt-offers-wrap" aria-label="Current offers">
      <div className="rt-container">
        <div className="rt-offers-head"><div><span className="rt-kicker">Live deals</span><h2>Current Offers</h2></div><BadgePercent /></div>
        <div className="rt-offers-grid">
          {offers.slice(0, 3).map((offer) => {
            const banner = (offer.offer_banners || [])[0];
            const target = offer.button_url || banner?.button_url;
            const cta = offer.button_text || banner?.button_text || 'View Offer';
            return (
              <article className="rt-offer-card" key={offer.id}>
                {banner?.image_url && <img loading="lazy" decoding="async" src={banner.image_url} alt={banner.alt_text || offer.title || 'Offer'} />}
                <div className="rt-offer-copy">
                  <span>{offer.short_title || 'Limited-time deal'}</span>
                  <h3>{offer.title}</h3>
                  {offer.description && <p>{offer.description}</p>}
                  {offer.minimum_order_value != null && <strong>Minimum order ₹{Number(offer.minimum_order_value).toLocaleString('en-IN')}</strong>}
                </div>
                <button className="rt-offer-action" onClick={() => navigateToConfiguredTarget(target, onNavigate, 'products')} aria-label={`${cta}: ${offer.title || 'current offer'}`}>{cta} <ArrowRight aria-hidden="true" /></button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
