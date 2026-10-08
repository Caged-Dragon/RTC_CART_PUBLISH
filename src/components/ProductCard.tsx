import React from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '../data/products';
import { useCart } from '../context/CartContext';

interface ProductCardProps { product: Product & { mrpRate?: number }; }

const imageFor = (product: Product) => {
  if (product.imageUrl) return product.imageUrl;
  const s = product.category.toLowerCase();
  if (s.includes('spark')) return '/images/redthunder_sparklers_1791297554442.jpg';
  if (s.includes('flower') || s.includes('fountain') || s.includes('sand')) return '/images/redthunder_pots_fountains_1791299034674.jpg';
  if (s.includes('rocket') || s.includes('shot') || s.includes('fancy')) return '/images/redthunder_sky_rockets_1791303603553.jpg';
  if (s.includes('gift')) return '/images/redthunder_gift_boxes_1791297541022.jpg';
  if (s.includes('chakkar')) return '/images/redthunder_peacock_chakkars_1791301133347.jpg';
  if (s.includes('sound') || s.includes('bomb') || s.includes('wala')) return '/images/redthunder_sound_crackers_1791301117609.jpg';
  return '/images/redthunder_hero_crackers_1791297525760.jpg';
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { getItemQuantity, addToCart, updateQuantity } = useCart();
  const qty = getItemQuantity(product.id);
  const soldOut = product.stockStatus === 'OUT_OF_STOCK';
  const mrp = product.mrpRate && product.mrpRate > product.rate ? product.mrpRate : undefined;
  const discount = mrp ? Math.round((1 - product.rate / mrp) * 100) : undefined;
  return <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-[0_8px_24px_rgba(16,24,40,.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(16,24,40,.10)]" data-rtc-component="product_card">
    <div className="relative aspect-[1.15] overflow-hidden bg-[#F8F9FB]"><img loading="lazy" decoding="async" src={imageFor(product)} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />{discount && <span className="absolute left-2 top-2 rounded-full bg-[#11B35A] px-2 py-1 text-[9px] font-black text-white">{discount}% OFF</span>}{soldOut && <span className="absolute right-2 top-2 rounded-full bg-[#101828]/85 px-2 py-1 text-[9px] font-black text-white">SOLD OUT</span>}</div>
    <div className="flex flex-1 flex-col p-3 sm:p-3.5"><div className="mb-1 flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase tracking-[.12em] text-[#98A2B3]">{product.category}</span><span className="text-[9px] font-bold text-[#98A2B3]">{product.unit}</span></div><h3 className="line-clamp-2 min-h-10 text-[12px] font-extrabold leading-snug text-[#101828]">{product.name}</h3><p className="mt-1 min-h-8 line-clamp-2 text-[10px] leading-relaxed text-[#667085]">{product.description}</p><div className="mt-3 flex items-end gap-2"><strong className="font-display text-xl font-black text-[#E30613]">₹{product.rate.toLocaleString('en-IN')}</strong>{mrp && <del className="text-[10px] font-bold text-[#98A2B3]">₹{mrp.toLocaleString('en-IN')}</del>}</div><div className="mt-auto pt-3">{qty > 0 ? <div className="flex items-center gap-2"><div className="flex flex-1 items-center justify-between rounded-xl border border-[#E30613]/20 bg-[#FFF7F7] p-1"><button onClick={() => updateQuantity(product.id, qty - 1)} className="grid h-8 w-8 place-items-center rounded-lg text-[#E30613]" aria-label={`Decrease quantity for ${product.name}`}><Minus className="h-4 w-4" /></button><span className="text-xs font-black text-[#101828]">{qty}</span><button onClick={() => addToCart(product,1)} className="grid h-8 w-8 place-items-center rounded-lg text-[#E30613]" aria-label={`Increase quantity for ${product.name}`}><Plus className="h-4 w-4" /></button></div><div className="text-right"><div className="text-[9px] text-[#98A2B3]">In cart</div><div className="text-[11px] font-black text-[#101828]">₹{(qty * product.rate).toLocaleString('en-IN')}</div></div></div> : <button disabled={soldOut} onClick={() => addToCart(product,1)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E30613] py-2.5 text-[10px] font-black text-white hover:bg-[#c50511] disabled:cursor-not-allowed disabled:bg-[#98A2B3]"><ShoppingCart className="h-4 w-4" /> ADD TO CART</button>}</div></div>
  </article>;
};
