import React, { useMemo, useState } from 'react';
import { ArrowRight, Flame, Search, ShieldCheck, SlidersHorizontal, Sparkles, Truck } from 'lucide-react';
import type { ScreenId } from '../components/Navbar';
import { ProductCard } from '../components/ProductCard';
import { useProducts } from '../context/ProductsContext';
import { useHomepagePicks } from '../context/HomepagePicksContext';
import { getBestSellerProducts } from '../utils/bestSellers';
import type { Product } from '../data/products';

interface BestSellersScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectProduct: (product: Product) => void;
}

type SortOrder = 'recommended' | 'price-low' | 'price-high' | 'name';

export const BestSellersScreen: React.FC<BestSellersScreenProps> = ({ onNavigate, onSelectProduct }) => {
  const { products, isLoading: productsLoading } = useProducts();
  const { picks, isLoading: picksLoading } = useHomepagePicks();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortOrder>('recommended');

  const bestSellers = useMemo(() => getBestSellerProducts(products, picks), [products, picks]);
  const categories = useMemo(() => ['All', ...new Set(bestSellers.map((product) => product.category).filter(Boolean))], [bestSellers]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return bestSellers.filter((product) => {
      const matchesCategory = category === 'All' || product.category === category;
      const searchable = `${product.name} ${product.category} ${product.description} ${product.sNo}`.toLocaleLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    }).sort((a, b) => {
      if (sort === 'price-low') return a.rate - b.rate || a.sNo - b.sNo;
      if (sort === 'price-high') return b.rate - a.rate || a.sNo - b.sNo;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return bestSellers.indexOf(a) - bestSellers.indexOf(b);
    });
  }, [bestSellers, category, search, sort]);

  const isLoading = productsLoading || picksLoading;

  return (
    <div className="rt-best-sellers-page">
      <section className="rt-best-sellers-hero">
        <div className="rt-container rt-best-sellers-hero-inner">
          <div className="rt-best-sellers-copy">
            <div className="rt-bestseller-eyebrow"><Flame aria-hidden="true" /> CUSTOMER FAVOURITES</div>
            <h1>Best Sellers,<br /><span>Chosen for the Celebration.</span></h1>
            <p>Explore the most-loved picks from RT Crackers. Compare live catalogue prices, add your favourites to the cart, and plan your celebration in one place.</p>
            <div className="rt-best-sellers-hero-actions">
              <button className="rt-btn rt-btn-primary" onClick={() => document.getElementById('best-seller-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Explore Best Sellers <ArrowRight aria-hidden="true" /></button>
              <button className="rt-btn rt-btn-outline-light" onClick={() => onNavigate('products')}>Browse Full Catalogue</button>
            </div>
            <div className="rt-best-sellers-proof-row">
              <span><ShieldCheck aria-hidden="true" /> Live catalogue pricing</span>
              <span><Truck aria-hidden="true" /> Order & dispatch support</span>
              <span><Sparkles aria-hidden="true" /> Curated customer picks</span>
            </div>
          </div>
          <div className="rt-best-sellers-hero-stat" aria-label={`${bestSellers.length} best seller products`}>
            <span className="rt-best-sellers-stat-icon"><Flame aria-hidden="true" /></span>
            <strong>{isLoading ? '…' : bestSellers.length}</strong>
            <span>Best Seller Picks</span>
            <small>One dedicated page. Every featured favourite.</small>
          </div>
        </div>
      </section>

      <section className="rt-section rt-section-white" id="best-seller-products" aria-labelledby="best-sellers-page-heading">
        <div className="rt-container">
          <div className="rt-section-heading rt-best-sellers-page-heading">
            <div>
              <span className="rt-kicker">The favourites collection</span>
              <h2 id="best-sellers-page-heading">Shop Best Sellers</h2>
              <p>Browse the complete curated and catalogue-marked best-seller collection.</p>
            </div>
            <span className="rt-best-sellers-count">{isLoading ? 'Loading picks…' : `${filteredProducts.length} of ${bestSellers.length} products`}</span>
          </div>

          <div className="rt-best-sellers-toolbar" role="search" aria-label="Filter best sellers">
            <label className="rt-best-sellers-search">
              <Search aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search favourites…" aria-label="Search best sellers" />
            </label>
            <label className="rt-best-sellers-select"><SlidersHorizontal aria-hidden="true" /><span className="sr-only">Filter by category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter best sellers by category">
                {categories.map((item) => <option value={item} key={item}>{item === 'All' ? 'All categories' : item}</option>)}
              </select>
            </label>
            <label className="rt-best-sellers-select"><span className="sr-only">Sort best sellers</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortOrder)} aria-label="Sort best sellers">
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="rt-product-grid rt-best-sellers-grid" aria-busy="true" aria-label="Loading best sellers">
              {Array.from({ length: 8 }, (_, index) => <div className="rt-best-seller-skeleton" key={index} />)}
            </div>
          ) : filteredProducts.length ? (
            <div className="rt-product-grid rt-best-sellers-grid">
              {filteredProducts.map((product) => <ProductCard key={product.dbId || product.id} product={product} onViewDetails={() => onSelectProduct(product)} />)}
            </div>
          ) : (
            <div className="rt-best-sellers-empty" role="status">
              <span><Flame aria-hidden="true" /></span>
              <h3>{bestSellers.length ? 'No matches found' : 'Best sellers are being prepared'}</h3>
              <p>{bestSellers.length ? 'Try another search or category, or reset the filters to see the full collection.' : 'The collection will appear when products are marked as best sellers in the live catalogue or published as customer picks.'}</p>
              {bestSellers.length ? (
                <button className="rt-btn rt-btn-primary" onClick={() => { setSearch(''); setCategory('All'); setSort('recommended'); }}>Clear Filters</button>
              ) : (
                <button className="rt-btn rt-btn-primary" onClick={() => onNavigate('products')}>Browse All Products <ArrowRight aria-hidden="true" /></button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
