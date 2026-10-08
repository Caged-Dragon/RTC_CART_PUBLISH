import React, { useEffect, useState } from 'react';
import { BadgePercent, ArrowRight } from 'lucide-react';
import { dbSelect } from '../lib/supabase';

export const LiveOffersSection: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([]);
  useEffect(() => {
    // Existing Supabase offer query intentionally preserved.
    dbSelect<any>('offers', 'select=*,offer_banners(*)&is_active=eq.true&order=display_order.asc,priority.desc')
      .then(setOffers)
      .catch(() => setOffers([]));
  }, []);
  if (!offers.length) return null;

  return (
    <section className="rt-offers-wrap" aria-label="Current offers">
      <div className="rt-container">
        <div className="rt-offers-head"><div><span className="rt-kicker">Live deals</span><h2>Current Offers</h2></div><BadgePercent /></div>
        <div className="rt-offers-grid">
          {offers.slice(0, 3).map((offer) => {
            const banner = (offer.offer_banners || []).find((item: any) => item.is_active);
            return (
              <article className="rt-offer-card" key={offer.id}>
                {banner?.image_url && <img loading="lazy" decoding="async" src={banner.image_url} alt={banner.alt_text || offer.title || 'Offer'} />}
                <div className="rt-offer-copy">
                  <span>{offer.short_title || 'Limited-time deal'}</span>
                  <h3>{offer.title}</h3>
                  {offer.description && <p>{offer.description}</p>}
                  {offer.minimum_order_value != null && <strong>Minimum order ₹{Number(offer.minimum_order_value).toLocaleString('en-IN')}</strong>}
                </div>
                <ArrowRight className="rt-offer-arrow" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
