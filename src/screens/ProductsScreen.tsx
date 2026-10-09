import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Leaf, Package, Search, SlidersHorizontal, Sparkles, Star, Tag, X, Zap } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { QuickOrder } from '../components/QuickOrder';
import type { Product } from '../data/products';
import { useCategories } from '../context/CategoriesContext';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { ProductDetailScreen } from './ProductDetailScreen';
import { consumeShopIntent } from '../utils/shopNavigation';

const PRICE_BANDS = [
  { id: 'all', label: 'Any price', min: 0, max: Infinity },
  { id: 'u100', label: 'Under ₹100', min: 0, max: 100 },
  { id: 'u250', label: '₹100–₹250', min: 100, max: 250 },
  { id: 'u500', label: '₹250–₹500', min: 250, max: 500 },
  { id: 'u1000', label: '₹500–₹1,000', min: 500, max: 1000 },
  { id: 'u2000', label: '₹1,000–₹2,000', min: 1000, max: 2000 },
  { id: 'o2000', label: '₹2,000+', min: 2000, max: Infinity },
] as const;
type PriceBand = (typeof PRICE_BANDS)[number]['id'];
type Availability = 'all' | 'in' | 'low';
type PackType = 'all' | 'Box' | 'Pkt' | 'Tube';
type PieceBand = 'all' | '1-10' | '11-25' | '26-50' | '51+';
type SmartTag = 'all' | 'value' | 'premium' | 'gift' | 'sparkle' | 'sound' | 'aerial' | 'ground' | 'fountain' | 'kids';

const SMART_TAGS: { id: SmartTag; label: string }[] = [
  { id: 'all', label: 'All products' }, { id: 'value', label: 'Best value' }, { id: 'premium', label: 'Premium' },
  { id: 'gift', label: 'Gift boxes' }, { id: 'sparkle', label: 'Sparklers' }, { id: 'sound', label: 'Sound crackers' },
  { id: 'aerial', label: 'Rockets & aerial' }, { id: 'ground', label: 'Ground fun' }, { id: 'fountain', label: 'Fountains' }, { id: 'kids', label: 'Kids special' },
];

const normalize = (value: unknown) => String(value || '').toLowerCase();
const matchesTag = (product: Product, tag: SmartTag) => {
  const text = `${normalize(product.name)} ${normalize(product.category)} ${normalize(product.description)}`;
  if (tag === 'all') return true;
  if (tag === 'value') return product.rate <= 250;
  if (tag === 'premium') return product.rate >= 1000;
  if (tag === 'gift') return text.includes('gift') || text.includes('combo') || text.includes('pack');
  if (tag === 'sparkle') return text.includes('sparkler');
  if (tag === 'sound') return text.includes('sound') || text.includes('bomb') || text.includes('lakshmi') || text.includes('cracker');
  if (tag === 'aerial') return text.includes('rocket') || text.includes('aerial') || text.includes('shot') || text.includes('sky');
  if (tag === 'ground') return text.includes('chakkar') || text.includes('ground') || text.includes('wheel');
  if (tag === 'fountain') return text.includes('fountain') || text.includes('flower pot') || text.includes('sandpot');
  if (tag === 'kids') return text.includes('kids') || text.includes('snake') || text.includes('novelty');
  return true;
};

export const ProductsScreen: React.FC = () => {
  const { products, isLoading } = useProducts();
  const { categories } = useCategories();
  const { totalBoxes, subtotal, setIsCartOpen } = useCart();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [availability, setAvailability] = useState<Availability>('all');
  const [packType, setPackType] = useState<PackType>('all');
  const [pieceBand, setPieceBand] = useState<PieceBand>('all');
  const [smartTag, setSmartTag] = useState<SmartTag>('all');
  const [greenOnly, setGreenOnly] = useState(false);
  const [bestOnly, setBestOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sort, setSort] = useState<'recommended' | 'low' | 'high' | 'name'>('recommended');

  useEffect(() => {
    const setSearchFromEvent = (event: Event) => setSearch((event as CustomEvent<string>).detail || '');
    const setCategoryFromEvent = (event: Event) => { setSelectedCategory((event as CustomEvent<string>).detail || 'All'); setBestOnly(false); };
    const setBudgetFromEvent = (event: Event) => { const budget = (event as CustomEvent<string>).detail as PriceBand; setPriceBand(PRICE_BANDS.some((band) => band.id === budget) ? budget : 'all'); };
    const setBest = () => setBestOnly(true);
    window.addEventListener('rt-search-products', setSearchFromEvent);
    window.addEventListener('rt-select-category', setCategoryFromEvent);
    window.addEventListener('rt-budget-filter', setBudgetFromEvent);
    window.addEventListener('rt-best-sellers', setBest);
    const pending = consumeShopIntent();
    if (pending?.type === 'search') setSearch(pending.value);
    if (pending?.type === 'category') setSelectedCategory(pending.value);
    if (pending?.type === 'budget') setPriceBand(PRICE_BANDS.some((band) => band.id === pending.value) ? pending.value as PriceBand : 'all');
    if (pending?.type === 'best-sellers') setBestOnly(true);
    const syncDetailFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const pathMatch = window.location.pathname.match(/^\/product\/(\d+)$/);
      const id = Number(pathMatch?.[1] || params.get('product'));
      setSelectedProduct(id ? products.find((item) => item.id === id) || null : null);
    };
    window.addEventListener('popstate', syncDetailFromUrl);
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const pathMatch = window.location.pathname.match(/^\/product\/(\d+)$/);
    const productId = Number(pathMatch?.[1] || params.get('product'));
    if (query) setSearch(query);
    if (productId) { const product = products.find((item) => item.id === productId); if (product) setSelectedProduct(product); }
    return () => {
      window.removeEventListener('rt-search-products', setSearchFromEvent); window.removeEventListener('rt-select-category', setCategoryFromEvent);
      window.removeEventListener('rt-budget-filter', setBudgetFromEvent); window.removeEventListener('rt-best-sellers', setBest); window.removeEventListener('popstate', syncDetailFromUrl);
    };
  }, [products]);

  const categoryNames = useMemo(() => ['All', ...categories.filter((c) => c.is_active).map((c) => c.category_name)], [categories]);
  const activeFilterCount = [selectedCategory !== 'All', priceBand !== 'all', availability !== 'all', packType !== 'all', pieceBand !== 'all', smartTag !== 'all', greenOnly, bestOnly, featuredOnly, !!search].filter(Boolean).length;
  const resetFilters = () => { setSearch(''); setSelectedCategory('All'); setPriceBand('all'); setAvailability('all'); setPackType('all'); setPieceBand('all'); setSmartTag('all'); setGreenOnly(false); setBestOnly(false); setFeaturedOnly(false); };

  const filtered = useMemo(() => {
    const band = PRICE_BANDS.find((item) => item.id === priceBand) || PRICE_BANDS[0];
    const q = search.trim().toLowerCase();
    const piecesMatch = (product: Product) => {
      if (pieceBand === 'all') return true;
      const pieces = Number(product.pieces?.match(/\d+/)?.[0] || 0);
      if (!pieces) return false;
      if (pieceBand === '1-10') return pieces <= 10; if (pieceBand === '11-25') return pieces >= 11 && pieces <= 25; if (pieceBand === '26-50') return pieces >= 26 && pieces <= 50; return pieces >= 51;
    };
    return products.filter((product) => {
      const text = `${normalize(product.name)} ${normalize(product.category)} ${normalize(product.description)}`;
      if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
      if (!(product.rate >= band.min && product.rate < band.max + (band.max === Infinity ? 1 : 0))) return false;
      if (availability === 'in' && product.stockStatus === 'OUT_OF_STOCK') return false;
      if (availability === 'low' && product.stockStatus !== 'LOW_STOCK') return false;
      if (packType !== 'all' && product.unit !== packType) return false;
      if (!piecesMatch(product)) return false;
      if (greenOnly && !(product as Product & { isGreenCracker?: boolean }).isGreenCracker) return false;
      if (bestOnly && !(product.popular || (product as Product & { isBestseller?: boolean }).isBestseller)) return false;
      if (featuredOnly && !(product.featured || (product as Product & { isFeatured?: boolean }).isFeatured)) return false;
      if (!matchesTag(product, smartTag)) return false;
      if (q && !text.includes(q) && !String(product.sNo).includes(q)) return false;
      return true;
    }).sort((a, b) => sort === 'low' ? a.rate - b.rate : sort === 'high' ? b.rate - a.rate : sort === 'name' ? a.name.localeCompare(b.name) : Number(!!b.popular || !!b.featured) - Number(!!a.popular || !!a.featured) || a.sNo - b.sNo);
  }, [products, selectedCategory, priceBand, availability, packType, pieceBand, smartTag, greenOnly, bestOnly, featuredOnly, search, sort]);

  const openDetail = (product: Product) => { setSelectedProduct(product); window.history.pushState({ product: product.id }, '', `/product/${product.id}`); };
  const closeDetail = () => { setSelectedProduct(null); window.history.pushState({}, '', '/products'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const FilterControls = () => <>
    <div className="rt-smart-filter-highlight"><Sparkles /><div><strong>Smart shopping filters</strong><small>20+ ways to narrow the catalogue without losing the festive feel.</small></div></div>
    <div className="rt-filter-group"><label>Smart picks</label><div className="rt-filter-chip-grid">{SMART_TAGS.map((tag) => <button key={tag.id} className={smartTag === tag.id ? 'selected' : ''} onClick={() => setSmartTag(tag.id)}>{tag.label}</button>)}</div></div>
    <div className="rt-filter-group"><label>Category</label><div className="rt-filter-option-list">{categoryNames.map((name) => <button key={name} className={selectedCategory === name ? 'selected' : ''} onClick={() => setSelectedCategory(name)}>{name}<span>{name === 'All' ? products.length : products.filter((p) => p.category === name).length}</span></button>)}</div></div>
    <div className="rt-filter-group"><label>Budget</label><div className="rt-filter-chip-grid">{PRICE_BANDS.map((band) => <button key={band.id} className={priceBand === band.id ? 'selected' : ''} onClick={() => setPriceBand(band.id)}>{band.label}</button>)}</div></div>
    <div className="rt-filter-group"><label>Pack format</label><div className="rt-filter-chip-grid">{(['all', 'Box', 'Pkt', 'Tube'] as PackType[]).map((item) => <button key={item} className={packType === item ? 'selected' : ''} onClick={() => setPackType(item)}>{item === 'all' ? 'Any pack' : item}</button>)}</div></div>
    <div className="rt-filter-group"><label>Pieces per pack</label><div className="rt-filter-chip-grid">{([['all','Any quantity'],['1-10','1–10'],['11-25','11–25'],['26-50','26–50'],['51+','51+']] as [PieceBand,string][]).map(([id,label]) => <button key={id} className={pieceBand === id ? 'selected' : ''} onClick={() => setPieceBand(id)}>{label}</button>)}</div></div>
    <div className="rt-filter-group"><label>Availability</label><div className="rt-filter-chip-grid"><button className={availability === 'all' ? 'selected' : ''} onClick={() => setAvailability('all')}>All</button><button className={availability === 'in' ? 'selected' : ''} onClick={() => setAvailability('in')}>In stock</button><button className={availability === 'low' ? 'selected' : ''} onClick={() => setAvailability('low')}>Few left</button></div></div>
    <div className="rt-filter-group"><label>Special qualities</label><div className="rt-filter-chip-grid"><button className={greenOnly ? 'selected' : ''} onClick={() => setGreenOnly(!greenOnly)}><Leaf /> Green crackers</button><button className={featuredOnly ? 'selected' : ''} onClick={() => setFeaturedOnly(!featuredOnly)}><Tag /> Featured</button></div></div>
    <button className="rt-filter-reset" onClick={resetFilters}>Reset all filters</button>
  </>;

  if (selectedProduct) {
    const related = products.filter((product) => product.category === selectedProduct.category && product.id !== selectedProduct.id);
    return <ProductDetailScreen product={selectedProduct} related={related} onBack={closeDetail} onSelectRelated={openDetail} />;
  }

  return <div className="rt-shop-page" data-rtc-component="product_grid">
    <div className="rt-container">
      <div className="rt-shop-header"><div><span className="rt-kicker">RedThunder catalogue</span><h1>Shop all crackers</h1><p>Search 127 live products with smart filters for price, style, pack size, availability and customer intent.</p></div>{totalBoxes > 0 && <button className="rt-cart-pill" onClick={() => setIsCartOpen(true)}>Cart {totalBoxes} · ₹{subtotal.toLocaleString('en-IN')}</button>}</div>
      <QuickOrder />
      <div className="rt-shop-layout">
        <aside className={`rt-filter-sidebar ${filtersOpen ? 'open' : ''}`} aria-label="Product filters"><div className="rt-filter-head"><strong><Filter /> Filters <span>{activeFilterCount}</span></strong><button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button></div><FilterControls /></aside>
        <div className="rt-shop-results">
          <div className="rt-shop-toolbar"><div className="rt-shop-toolbar-search"><Search aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search products in catalogue" placeholder="Search products, categories or product number" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear product search"><X /></button>}</div><div className="rt-result-count"><strong>{filtered.length}</strong> products {activeFilterCount > 0 && <span>· {activeFilterCount} filters</span>}</div><div className="rt-toolbar-actions"><button className="rt-mobile-filter-btn" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /> Filters {activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button><label className="rt-sort"><span>Sort:</span><select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="recommended">Recommended</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option><option value="name">Name A–Z</option></select><ChevronDown /></label></div></div>
          <div className="rt-filter-summary"><span><Zap /> {filtered.length} matching products</span>{activeFilterCount > 0 && <button onClick={resetFilters}>Clear {activeFilterCount} filters <X /></button>}</div>
          {isLoading ? <div className="rt-product-grid">{Array.from({ length: 8 }).map((_, index) => <div className="rt-skeleton rt-product-skeleton" key={index} />)}</div> : filtered.length ? <div className="rt-product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} onViewDetails={() => openDetail(product)} />)}</div> : <div className="rt-empty-state"><Package /><h2>No products found</h2><p>Try a broader smart filter or clear your filters.</p><button onClick={resetFilters}>Reset filters</button></div>}
        </div>
      </div>
    </div>
  </div>;
};
