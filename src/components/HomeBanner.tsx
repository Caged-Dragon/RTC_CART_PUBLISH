import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { dbSelect } from '../lib/supabase';

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

export const HomeBanner: React.FC<HomeBannerProps> = ({ onNavigate }) => {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    dbSelect<BannerRow>('offer_banners', 'select=*,offers!inner(title)&is_active=eq.true&order=display_order.asc').then(rows => setBanners(rows)).catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % banners.length), 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[index];
  if (!banner) return <FallbackHomeHero onNavigate={onNavigate} />;

  const handleButton = () => {
    const url = banner.button_url?.trim();
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
    const clean = url.replace(/^\//, '');
    if (['products','table','cart','myorders','tracker','whatsapp','mail','auth','gift-boxes','transport','safety','reviews'].includes(clean)) onNavigate(clean);
  };

  return <section data-rtc-component="home_banner" className="relative overflow-hidden bg-stone-950 border-b border-stone-800">
    <picture className="absolute inset-0 block">
      {banner.mobile_image_url && <source media="(max-width: 640px)" srcSet={banner.mobile_image_url} />}
      <img src={banner.image_url} alt={banner.alt_text || banner.headline || banner.offers?.title || 'RedThunder Crackers offer'} className="w-full h-full object-cover object-center" />
    </picture>
    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/25" />
    <div className="relative z-10 min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex items-end">
      <div className="max-w-3xl w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{banner.offers?.title || 'RedThunder Crackers'}</span>
        </div>
        {banner.headline && <h1 data-rtc-component="hero_heading" className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-4 sm:mb-5 max-w-3xl">{banner.headline}</h1>}
        {banner.subheadline && <p data-rtc-component="hero_paragraph" className="text-sm sm:text-lg text-stone-200 leading-relaxed mb-6 sm:mb-8 max-w-2xl">{banner.subheadline}</p>}
        {banner.button_text && <button onClick={handleButton} className="w-full sm:w-auto justify-center px-5 sm:px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 cursor-pointer">{banner.button_text}<ArrowRight className="w-4 h-4"/></button>}
        {banners.length > 1 && <div className="flex items-center gap-2 mt-6" aria-label="Home banners">{banners.map((b,i)=><button key={b.id} onClick={()=>setIndex(i)} aria-label={`Show banner ${i+1}`} className={`h-1.5 rounded-full transition-all ${i===index?'w-8 bg-amber-400':'w-3 bg-white/40'}`}/>)}</div>}
      </div>
    </div>
  </section>;
};

const FallbackHomeHero: React.FC<HomeBannerProps> = ({ onNavigate }) => <section className="relative overflow-hidden bg-stone-950 border-b border-stone-800">
  <div className="absolute inset-0"><img src="/src/assets/images/redthunder_hero_crackers_1791297525760.jpg" alt="RedThunder Fireworks" className="w-full h-full object-cover object-center opacity-30"/><div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/85 to-stone-950/50"/></div>
  <div className="relative z-10 min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex items-end"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-4"><Sparkles className="w-3.5 h-3.5"/>Official 2026 Price List</div><h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-5">Buy Diwali Crackers at <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500">Real Factory Prices</span></h1><p className="text-sm sm:text-lg text-stone-300 max-w-2xl mb-7">Welcome to REDTHUNDER CRACKERS, Sivakasi. No middlemen. Fresh stock and direct factory pricing.</p><button onClick={()=>onNavigate('products')} className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-sm flex items-center gap-2">See All Products<ArrowRight className="w-4 h-4"/></button></div></div>
</section>;
