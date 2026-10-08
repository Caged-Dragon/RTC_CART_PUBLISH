import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useCategories } from '../context/CategoriesContext';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export const ProductsScreen: React.FC = () => {
  const { products, isLoading } = useProducts();
  const { categories } = useCategories();
  const { totalBoxes, subtotal, setIsCartOpen } = useCart();
  const [search, setSearch] = useState(() => sessionStorage.getItem('rt_product_search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('rt_category_filter') || 'All');
  const [sort, setSort] = useState<'default'|'low'|'high'>('default');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [price, setPrice] = useState<'all'|'u500'|'u1000'|'o1000'>('all');

  useEffect(() => {
    const s = sessionStorage.getItem('rt_product_search'); if (s !== null) { setSearch(s); sessionStorage.removeItem('rt_product_search'); }
    const c = sessionStorage.getItem('rt_category_filter'); if (c !== null) { setSelectedCategory(c); sessionStorage.removeItem('rt_category_filter'); }
  }, []);

  const filtered = useMemo(() => products.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (search.trim() && !(`${p.name} ${p.category} ${p.sNo}`.toLowerCase().includes(search.toLowerCase().trim()))) return false;
    if (price === 'u500' && p.rate >= 500) return false;
    if (price === 'u1000' && (p.rate < 500 || p.rate >= 1000)) return false;
    if (price === 'o1000' && p.rate < 1000) return false;
    return true;
  }).sort((a,b) => sort === 'low' ? a.rate-b.rate : sort === 'high' ? b.rate-a.rate : a.sNo-b.sNo), [products, search, selectedCategory, sort, price]);

  return <div className="min-h-[70vh] bg-[#F8F9FB] py-6 pb-24 sm:py-8 md:pb-10" data-rtc-component="product_listing">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.16em] text-[#E30613]">Product catalogue</p><h1 className="mt-1 font-display text-2xl font-black text-[#101828] sm:text-3xl">All Crackers <span className="text-[#E30613]">with Photos</span></h1><p className="mt-1 text-xs text-[#667085]">Browse factory rates, filter by category and add directly to cart.</p></div>{totalBoxes > 0 && <button onClick={() => setIsCartOpen(true)} className="rounded-xl bg-[#E30613] px-4 py-3 text-xs font-black text-white">View Cart · {totalBoxes} items · ₹{subtotal.toLocaleString('en-IN')}</button>}</div>
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block"><div className="sticky top-28 rounded-2xl border border-[#EAECF0] bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-sm font-black text-[#101828]"><Filter className="h-4 w-4 text-[#E30613]" /> Filters</div><label className="mt-5 block text-[10px] font-black uppercase tracking-[.12em] text-[#667085]">Category</label><div className="mt-2 max-h-[360px] space-y-1 overflow-auto">{['All', ...categories.filter(c=>c.is_active).map(c=>c.category_name)].map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`block w-full rounded-lg px-2.5 py-2 text-left text-[11px] font-bold ${selectedCategory === cat ? 'bg-[#E30613]/8 text-[#E30613]' : 'text-[#475467] hover:bg-[#F8F9FB]'}`}>{cat}</button>)}</div><label className="mt-5 block text-[10px] font-black uppercase tracking-[.12em] text-[#667085]">Price</label><div className="mt-2 grid gap-1">{[['all','Any price'],['u500','Under ₹500'],['u1000','₹500 – ₹1,000'],['o1000','₹1,000+']].map(([id,label]) => <button key={id} onClick={() => setPrice(id as any)} className={`rounded-lg px-2.5 py-2 text-left text-[11px] font-bold ${price===id ? 'bg-[#FFF4E5] text-[#A15C00]' : 'text-[#475467] hover:bg-[#F8F9FB]'}`}>{label}</button>)}</div></div></aside>
        <section>
          <div className="mb-4 rounded-2xl border border-[#EAECF0] bg-white p-3 shadow-sm"><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sparklers, flower pots, rockets..." className="h-11 w-full rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] pl-10 pr-9 text-sm outline-none focus:border-[#E30613] focus:bg-white" />{search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#98A2B3]"><X className="h-4 w-4" /></button>}</div><div className="flex gap-2"><button onClick={() => setDrawerOpen(v=>!v)} className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7EC] px-3 py-2 text-xs font-black text-[#344054] lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button><select value={sort} onChange={e => setSort(e.target.value as any)} className="h-11 rounded-xl border border-[#E4E7EC] bg-white px-3 text-xs font-bold text-[#344054] outline-none"><option value="default">Sort: Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div></div>{drawerOpen && <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#F8F9FB] p-3 lg:hidden"><select value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} className="h-10 rounded-lg border border-[#E4E7EC] bg-white px-2 text-xs font-bold"><option value="All">All categories</option>{categories.filter(c=>c.is_active).map(c=><option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}</select><select value={price} onChange={e=>setPrice(e.target.value as any)} className="h-10 rounded-lg border border-[#E4E7EC] bg-white px-2 text-xs font-bold"><option value="all">Any price</option><option value="u500">Under ₹500</option><option value="u1000">₹500 – ₹1,000</option><option value="o1000">₹1,000+</option></select></div>}</div>
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold text-[#667085]"><span>{isLoading ? 'Loading products…' : `${filtered.length} products`}</span>{selectedCategory !== 'All' && <button onClick={() => setSelectedCategory('All')} className="text-[#E30613]">Clear category</button>}</div>
          {isLoading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-72 animate-pulse rounded-2xl bg-white" />)}</div> : <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{filtered.map(p => <ProductCard key={p.id} product={p} />)}</div>}
          {!isLoading && !filtered.length && <div className="rounded-2xl border border-dashed border-[#D0D5DD] bg-white p-12 text-center"><div className="font-display text-lg font-black text-[#101828]">No products found</div><p className="mt-1 text-xs text-[#667085]">Try a different search or category.</p></div>}
        </section>
      </div>
    </div>
  </div>;
};
