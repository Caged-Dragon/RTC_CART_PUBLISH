import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BadgeCheck, Boxes, CircleDollarSign, Headphones, MessageCircle, PackageCheck, ShieldCheck, ShoppingCart, Sparkles, Truck, Zap } from 'lucide-react';
import { ScreenId } from '../components/Navbar';
import { useStore } from '../context/StoreContext';
import { useCategories } from '../context/CategoriesContext';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { HomeBanner } from '../components/HomeBanner';

interface IntroScreenProps { onNavigate: (screen: ScreenId) => void; }

const fallbackCategoryImage = (name: string) => {
  const s = name.toLowerCase();
  if (s.includes('spark')) return '/images/redthunder_sparklers_1791297554442.jpg';
  if (s.includes('flower') || s.includes('fountain') || s.includes('sand')) return '/images/redthunder_pots_fountains_1791299034674.jpg';
  if (s.includes('rocket') || s.includes('shot') || s.includes('fancy')) return '/images/redthunder_sky_rockets_1791303603553.jpg';
  if (s.includes('chakkar') || s.includes('twink')) return '/images/redthunder_peacock_chakkars_1791301133347.jpg';
  if (s.includes('gift')) return '/images/redthunder_gift_boxes_1791297541022.jpg';
  if (s.includes('kids')) return '/images/redthunder_kids_novelties_1791303636279.jpg';
  if (s.includes('sound') || s.includes('bomb') || s.includes('wala')) return '/images/redthunder_sound_crackers_1791301117609.jpg';
  return '/images/redthunder_hero_crackers_1791297525760.jpg';
};

const trustItems = [
  [BadgeCheck, 'Direct from Sivakasi', 'Factory source'],
  [CircleDollarSign, 'Best Pricing', 'Factory rates'],
  [Boxes, 'Wide Product Range', '500+ varieties'],
  [Zap, 'Easy Ordering', 'Online & WhatsApp'],
  [ShieldCheck, 'Safe & Secure', 'Trusted payments'],
  [Headphones, 'Customer Support', 'Quick assistance'],
] as const;

const orderSteps: { icon: LucideIcon; num: string; title: string; desc: string }[] = [
  { icon: ShoppingCart, num: '01', title: 'Select Products', desc: 'Browse our catalogue' },
  { icon: PackageCheck, num: '02', title: 'Add to Cart', desc: 'Select quantity & add' },
  { icon: BadgeCheck, num: '03', title: 'Confirm Order', desc: 'Review cart & details' },
  { icon: Truck, num: '04', title: 'Delivery / Dispatch', desc: 'We pack and dispatch' },
];

const budgets = [
  ['₹500', 'Celebration', 'For small celebrations'],
  ['₹1,000', 'Family Pack', 'For a small family'],
  ['₹2,000', 'Festival Pack', 'For family & friends'],
  ['₹5,000', 'Grand Celebration', 'For a bigger celebration'],
  ['₹10,000+', 'Mega Celebration', 'For a complete festival shopping'],
];

export const IntroScreen: React.FC<IntroScreenProps> = ({ onNavigate }) => {
  const { storeInfo } = useStore();
  const { categories } = useCategories();
  const { products, isLoading } = useProducts();
  const { addToCart, getItemQuantity, updateQuantity } = useCart();

  const bestSellers = useMemo(() => products.filter(p => p.isBestseller || p.popular || p.isFeatured).slice(0, 4), [products]);
  const comboProducts = useMemo(() => products.filter(p => p.category === 'Gift Boxes').slice(0, 4), [products]);
  const homeCategories = useMemo(() => categories.filter(c => c.is_active).slice(0, 8), [categories]);

  const goProducts = (search?: string) => {
    if (search) sessionStorage.setItem('rt_product_search', search);
    onNavigate('products');
  };

  const categoryClick = (name: string) => {
    sessionStorage.setItem('rt_category_filter', name);
    onNavigate('products');
  };

  return (
    <div className="bg-[#F8F9FB] pb-24 md:pb-0">
      <section className="relative overflow-hidden">
        <HomeBanner onNavigate={onNavigate} />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#101828]/10 via-transparent to-[#E30613]/5" />
      </section>

      <section className="border-y border-[#F0D6D8] bg-white">
        <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-6 md:overflow-visible">
            {trustItems.map(([Icon, title, subtitle]) => <article key={title} className="min-w-[210px] rounded-2xl bg-[#FFF7F7] p-3 md:min-w-0">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E30613]/10 text-[#E30613]"><Icon className="h-5 w-5" /></div><div><h3 className="text-[11px] font-extrabold text-[#101828]">{title}</h3><p className="mt-0.5 text-[10px] text-[#667085]">{subtitle}</p></div></div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#E30613]">Browse the range</p><h2 className="mt-1 font-display text-2xl font-black text-[#101828] sm:text-3xl">Shop by <span className="text-[#E30613]">Category</span></h2></div><button onClick={() => goProducts()} className="hidden items-center gap-1 text-xs font-black text-[#E30613] sm:flex">View All <ArrowRight className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {(homeCategories.length ? homeCategories : [{ category_id:'1', category_name:'Sparklers', slug:'sparklers', display_order:1, is_active:true }, { category_id:'2', category_name:'Flower Pots', slug:'flower-pots', display_order:2, is_active:true }, { category_id:'3', category_name:'Rockets', slug:'rockets', display_order:3, is_active:true }, { category_id:'4', category_name:'Ground Chakkar', slug:'ground-chakkar', display_order:4, is_active:true }, { category_id:'5', category_name:'Sound Crackers', slug:'sound-crackers', display_order:5, is_active:true }, { category_id:'6', category_name:'Kids Special', slug:'kids-special', display_order:6, is_active:true }, { category_id:'7', category_name:'Gift Boxes', slug:'gift-boxes', display_order:7, is_active:true }, { category_id:'8', category_name:'Fancy Varieties', slug:'fancy-varieties', display_order:8, is_active:true }] as any[]).map(cat => <button key={cat.category_id} onClick={() => categoryClick(cat.category_name)} className="group overflow-hidden rounded-2xl border border-[#EAECF0] bg-white text-left shadow-[0_6px_18px_rgba(16,24,40,.04)] transition hover:-translate-y-1 hover:border-[#E30613]/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]">
            <div className="aspect-square overflow-hidden bg-[#F8F9FB]"><img loading="lazy" src={cat.image_url || fallbackCategoryImage(cat.category_name)} alt={cat.category_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
            <div className="flex min-h-12 items-center justify-center px-2 py-2"><span className="text-center text-[11px] font-extrabold leading-tight text-[#344054]">{cat.category_name}</span></div>
          </button>)}
        </div>
      </section>

      <section className="bg-[#C6000A] py-1">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2 py-4 text-white"><Sparkles className="h-6 w-6" /><h2 className="font-display text-2xl font-black">Best <span className="text-[#FFB000]">Sellers</span></h2><span className="hidden text-xs font-semibold text-white/75 sm:block">Most loved crackers for your celebrations</span><button onClick={() => goProducts()} className="ml-auto hidden rounded-full bg-white/15 px-4 py-2 text-[11px] font-black sm:block">View All →</button></div></div>
      </section>

      <section className="bg-[#F7F7F8] py-6 sm:py-8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {isLoading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#667085]">Loading best sellers…</div> : <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {bestSellers.map(product => {
              const qty = getItemQuantity(product.id);
              const oldPrice = product.mrpRate && product.mrpRate > product.rate ? product.mrpRate : null;
              const discount = oldPrice ? Math.round((1 - product.rate / oldPrice) * 100) : null;
              return <article key={product.id} className="group rounded-2xl border border-[#EAECF0] bg-white p-2.5 shadow-[0_8px_24px_rgba(16,24,40,.06)] sm:p-3">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F8F9FB]"><img loading="lazy" src={product.imageUrl || fallbackCategoryImage(product.category)} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />{discount && <span className="absolute left-2 top-2 rounded-full bg-[#11B35A] px-2 py-1 text-[9px] font-black text-white">{discount}% OFF</span>}</div>
                <div className="p-1 pt-3"><h3 className="line-clamp-2 min-h-10 text-[12px] font-extrabold leading-tight text-[#101828]">{product.name}</h3><p className="mt-1 text-[10px] text-[#667085]">Pack: {product.pieces || product.unit}</p><div className="mt-2 flex items-end gap-2"><strong className="font-display text-lg font-black text-[#E30613]">₹{product.rate.toLocaleString('en-IN')}</strong>{oldPrice && <del className="text-[10px] font-bold text-[#98A2B3]">₹{oldPrice.toLocaleString('en-IN')}</del>}</div><div className="mt-2 flex items-center justify-between gap-2"><div className="flex items-center rounded-lg border border-[#E4E7EC] bg-[#F8F9FB] p-0.5"><button onClick={() => updateQuantity(product.id, qty - 1)} disabled={qty === 0} className="grid h-7 w-7 place-items-center rounded-md text-[#344054] disabled:opacity-40" aria-label={`Decrease ${product.name}`}><span>−</span></button><span className="w-6 text-center text-[11px] font-black">{qty}</span><button onClick={() => addToCart(product, 1)} className="grid h-7 w-7 place-items-center rounded-md text-[#344054]" aria-label={`Increase ${product.name}`}><span>+</span></button></div><button onClick={() => qty ? onNavigate('cart') : addToCart(product,1)} className="rounded-lg bg-[#E30613] px-3 py-2 text-[10px] font-black text-white hover:bg-[#c50511]">{qty ? 'GO TO CART' : 'ADD'}</button></div></div>
              </article>;
            })}
          </div>}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-9 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#E30613]">Choose your spend</p><h2 className="mt-1 font-display text-2xl font-black text-[#101828]">Shop by <span className="text-[#E30613]">Budget</span></h2></div><CircleDollarSign className="h-7 w-7 text-[#FFB000]" /></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{budgets.map(([price,title,desc], i) => <button key={price} onClick={() => goProducts()} className={`min-h-32 rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${i % 2 ? 'border-[#F6D5D8] bg-[#FFF7F7]' : 'border-[#F3E4BF] bg-[#FFFBEF]'}`}><div className="font-display text-2xl font-black text-[#E30613]">{price}</div><div className="mt-1 text-xs font-extrabold text-[#101828]">{title}</div><p className="mt-1 text-[10px] leading-relaxed text-[#667085]">{desc}</p><span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#E30613] px-2.5 py-1 text-[9px] font-black text-white">SHOP NOW <ArrowRight className="h-3 w-3" /></span></button>)}</div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pb-9 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#E30613]">Ready-made collections</p><h2 className="mt-1 font-display text-2xl font-black text-[#101828]">RedThunder <span className="text-[#E30613]">Combos</span></h2></div><button onClick={() => onNavigate('gift-boxes')} className="inline-flex items-center gap-1 text-xs font-black text-[#E30613]">View All <ArrowRight className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">{(comboProducts.length ? comboProducts : products.filter(p => p.category === 'Gift Boxes').slice(0,4)).map((product, i) => <article key={product.id} className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-[0_8px_24px_rgba(16,24,40,.06)]"><div className="aspect-[1.6] overflow-hidden bg-[#F8F9FB]"><img loading="lazy" src={product.imageUrl || '/images/redthunder_gift_boxes_1791297541022.jpg'} alt={product.name} className="h-full w-full object-cover" /></div><div className="p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-[#101828]">₹{product.rate.toLocaleString('en-IN')} {product.name}</h3><span className="rounded-full bg-[#FFF4E5] px-2 py-1 text-[9px] font-black text-[#A15C00]">{product.pieces || `${i + 1}0+ items`}</span></div><p className="mt-1 text-[11px] text-[#667085] line-clamp-2">{product.description}</p><button onClick={() => { addToCart(product,1); onNavigate('cart'); }} className="mt-3 w-full rounded-xl bg-[#E30613] py-2.5 text-[10px] font-black text-white">VIEW COMBO →</button></div></article>)}</div>
      </section>

      <section className="bg-white border-y border-[#EAECF0] py-9">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center"><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#E30613]">Simple & fast</p><h2 className="mt-1 font-display text-2xl font-black text-[#101828]">How to <span className="text-[#E30613]">Order</span></h2></div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{orderSteps.map(({ icon: Icon, num, title, desc }) => <article key={num} className="relative text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#E30613]/10 text-[#E30613]"><Icon className="h-6 w-6" /></div><div className="mt-2 text-[10px] font-black uppercase tracking-[.16em] text-[#E30613]">Step {num}</div><h3 className="mt-1 text-sm font-black text-[#101828]">{title}</h3><p className="mt-1 text-[11px] text-[#667085]">{desc}</p></article>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[24px] bg-[#101828] p-6 text-white sm:p-8"><div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.14em] text-[#FFB000]"><Sparkles className="h-3.5 w-3.5" /> Direct from Sivakasi</div><h2 className="mt-3 font-display text-2xl font-black sm:text-3xl">Celebrate More. <span className="text-[#FFB000]">Spend Less.</span></h2><p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/70">{storeInfo.tagline}. Shop factory-direct crackers and family collections with easy ordering and responsive support.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => goProducts()} className="rounded-xl bg-[#E30613] px-4 py-3 text-xs font-black text-white">SHOP NOW</button><a href={`https://wa.me/${storeInfo.phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#11B35A] px-4 py-3 text-xs font-black text-white"><MessageCircle className="h-4 w-4" /> ORDER ON WHATSAPP</a></div></div></div>
      </section>
    </div>
  );
};
