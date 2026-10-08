import React from 'react';
import { Facebook, Instagram, Mail, MessageCircle, Phone, ShieldCheck, Youtube } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ScreenId } from './Navbar';

interface FooterProps { onOpenSafety: () => void; }

export const Footer: React.FC<FooterProps> = ({ onOpenSafety }) => {
  const { storeInfo } = useStore();
  const year = new Date().getFullYear();
  return <footer className="bg-[#101828] text-white pb-16 md:pb-0">
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 border-b border-white/10 pb-8 md:grid-cols-4">
        <div className="md:col-span-1"><div className="font-display text-2xl font-black">RED<span className="text-[#E30613]">THUNDER</span></div><div className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-white/45">CRACKERS • SIVAKASI</div><p className="mt-4 max-w-sm text-xs leading-relaxed text-white/65">Quality crackers for family celebrations, kids & festive moments. Factory-direct sourcing from Sivakasi with easy ordering.</p><div className="mt-4 flex items-center gap-2 text-[#FFB000]"><ShieldCheck className="h-4 w-4" /><span className="text-[10px] font-black">Genuine Sivakasi Factory Direct Stock</span></div><div className="mt-5 flex gap-2"><a href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/8 hover:bg-white/15" aria-label="Instagram"><Instagram className="h-4 w-4" /></a><a href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/8 hover:bg-white/15" aria-label="Facebook"><Facebook className="h-4 w-4" /></a><a href="#" className="grid h-9 w-9 place-items-center rounded-full bg-white/8 hover:bg-white/15" aria-label="YouTube"><Youtube className="h-4 w-4" /></a></div></div>
        <div><h3 className="text-xs font-black uppercase tracking-[.14em] text-white/90">Quick Links</h3><div className="mt-4 grid gap-2 text-xs text-white/60"><span>Home</span><span>Shop</span><span>Categories</span><span>Combos</span><span>Best Sellers</span></div></div>
        <div><h3 className="text-xs font-black uppercase tracking-[.14em] text-white/90">Customer Support</h3><div className="mt-4 grid gap-3 text-xs text-white/60"><a href={`https://wa.me/${storeInfo.phone}`} className="flex items-center gap-2 hover:text-white"><MessageCircle className="h-4 w-4 text-[#11B35A]" />WhatsApp</a><a href={`tel:${storeInfo.phone}`} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4 text-[#FFB000]" />{storeInfo.phoneDisplay}</a><a href="mailto:sales@rtcrackers.com" className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4 text-[#F97066]" />Email</a></div></div>
        <div><h3 className="text-xs font-black uppercase tracking-[.14em] text-white/90">Information</h3><div className="mt-4 grid gap-2 text-xs text-white/60"><span>Shipping Policy</span><span>Cancellation Policy</span><span>Refund Policy</span><span>Terms & Conditions</span><button onClick={onOpenSafety} className="text-left hover:text-white">Safety Information</button></div></div>
      </div>
      <div className="flex flex-col gap-2 pt-5 text-[10px] text-white/45 sm:flex-row sm:items-center sm:justify-between"><p>© {year} {storeInfo.name}. All rights reserved.</p><p>Designed for a safer & brighter celebration.</p></div>
    </div>
  </footer>;
};
