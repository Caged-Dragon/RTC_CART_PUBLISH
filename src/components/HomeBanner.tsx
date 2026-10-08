import React, { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
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

export const HomeBanner: React.FC<HomeBannerProps> = ({ onNavigate }) => {
  const { storeInfo } = useStore();
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [index, setIndex] = useState(0);
  useEffect(() => { dbSelect<BannerRow>('offer_banners', 'select=*,offers!inner(title)&is_active=eq.true&order=display_order.asc').then(setBanners).catch(() => setBanners([])); }, []);
  useEffect(() => { if (banners.length < 2) return; const timer = window.setInterval(() => setIndex(i => (i + 1) % banners.length), 6000); return () => window.clearInterval(timer); }, [banners.length]);

  const current = banners[index];
  const image = current?.image_url || '/images/redthunder_hero_crackers_1791297525760.jpg';
  const headline = current?.headline || 'Celebrate More. Spend Less.';
  const subheadline = current?.subheadline || 'Quality Crackers at Factory Direct Prices';

  const openTarget = (url?: string) => {
    const clean = url?.trim();
    if (!clean) { onNavigate('products'); return; }
    if (/^https?:\/\//i.test(clean)) { window.open(clean, '_blank', 'noopener,noreferrer'); return; }
    const path = clean.replace(/^\//, '');
    onNavigate(path);
  };

  return <section data-rtc-component="home_banner" className="relative isolate overflow-hidden bg-[#101828]">
    <picture className="absolute inset-0 -z-20 block"><>{current?.mobile_image_url && <source media="(max-width: 640px)" srcSet={current.mobile_image_url} />}</><img src={image} alt={current?.alt_text || headline} className="h-full w-full object-cover object-center" /></picture>
    <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(4,7,12,.90)_0%,rgba(4,7,12,.68)_38%,rgba(4,7,12,.18)_75%,rgba(4,7,12,.24)_100%)]" />
    <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#101828] to-transparent" />
    <div className="mx-auto flex min-h-[390px] max-w-[1440px] items-center px-4 py-12 sm:min-h-[500px] sm:px-6 lg:min-h-[560px] lg:px-8">
      <div className="max-w-[700px] text-white">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.18em] text-[#FFCF66] backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5" /> This Diwali • Direct from Sivakasi</div>
        <h1 data-rtc-component="hero_heading" className="font-display text-4xl font-black leading-[.97] tracking-tight sm:text-6xl lg:text-7xl">{headline.split('Spend Less.')[0]}<span className="text-[#E30613]">{headline.includes('Spend Less.') ? 'Spend Less.' : ''}</span></h1>
        <p data-rtc-component="hero_paragraph" className="mt-5 max-w-xl text-sm font-semibold leading-relaxed text-white/85 sm:text-lg">{subheadline}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button onClick={() => openTarget(current?.button_url)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E30613] px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-black/20 hover:bg-[#c50511]">{current?.button_text || 'SHOP NOW'} <ArrowRight className="h-4 w-4" /></button>
          <a href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#11B35A] px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-black/20 hover:bg-[#0e9d4e]"><MessageCircle className="h-4 w-4" /> ORDER ON WHATSAPP</a>
        </div>
        <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold text-white/80 sm:text-xs"><span>▣ Wide Range</span><span>● Family Collections</span><span>✦ Kids Specials</span><span>✓ Fancy Varieties</span></div>
        {banners.length > 1 && <div className="mt-7 flex gap-1.5" aria-label="Home banners">{banners.map((b,i) => <button key={b.id} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i===index ? 'w-9 bg-[#FFB000]' : 'w-4 bg-white/35'}`} aria-label={`Show banner ${i+1}`} />)}</div>}
      </div>
      <div className="ml-auto hidden max-w-[290px] shrink-0 rounded-full border border-[#FFB000]/50 bg-[#FFB000]/12 p-4 text-center text-white backdrop-blur-md xl:block"><div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#FFB000]/30 bg-[#FFB000]/15 text-[#FFCF66]">DIRECT<br/>FROM<br/>SIVAKASI</div></div>
    </div>
  </section>;
};
