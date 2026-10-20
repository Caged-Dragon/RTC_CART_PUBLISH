import React, { useMemo, useState } from 'react';
import { ArrowRight, Grid2X2, Search, Sparkles } from 'lucide-react';
import type { ScreenId } from '../components/Navbar';
import { useCategories } from '../context/CategoriesContext';
import { useProducts } from '../context/ProductsContext';
import { getExactProductImage } from '../utils/productImages';
import { getCategoryFallbackImage, normalizeCategoryName } from '../utils/categoryArtwork';
import { setShopIntent } from '../utils/shopNavigation';

interface CategoriesScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ onNavigate }) => {
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { products, isLoading: productsLoading } = useProducts();
  const [search, setSearch] = useState('');

  const categoryCards = useMemo(() => {
    return categories
    .filter((category) => category.is_active)
    .map((category) => {
      const categoryKey = normalizeCategoryName(category.category_name);
      const matchingProducts = products.filter((product) => normalizeCategoryName(product.category) === categoryKey);
      const imageProduct = matchingProducts.find((product) => product.imageUrl?.trim()) || matchingProducts[0];
      const categoryImage = category.image_url?.trim() || '';
      const productImage = imageProduct?.imageUrl?.trim() || '';
      const categoryFallback = getCategoryFallbackImage(category.category_name);
      const exactProductFallback = imageProduct ? getExactProductImage(imageProduct) : '';
      const image = categoryImage || productImage || categoryFallback || exactProductFallback;
      const fallbackImage = categoryImage ? (productImage || categoryFallback || exactProductFallback) : productImage ? (categoryFallback || exactProductFallback) : exactProductFallback;
      return { ...category, image, fallbackImage, productCount: matchingProducts.length };
    })
    .filter((category) => normalizeCategoryName(category.category_name).includes(normalizeCategoryName(search)));
  }, [categories, products, search]);

  const openCategory = (categoryName: string) => {
    setShopIntent({ type: 'category', value: categoryName });
    onNavigate('products');
  };

  const isLoading = categoriesLoading || productsLoading;

  return (
    <section className="rt-categories-page" aria-labelledby="categories-page-heading">
      <div className="rt-container">
        <div className="rt-categories-hero">
          <div className="rt-categories-hero-copy">
            <span className="rt-kicker"><Grid2X2 aria-hidden="true" /> Find your favourites</span>
            <h1 id="categories-page-heading">Shop by category</h1>
            <p>Explore the full catalogue by product type. Choose a category to see matching products, current rates and availability.</p>
            <div className="rt-categories-stat-row" aria-live="polite">
              <span><strong>{categories.filter((item) => item.is_active).length}</strong> active categories</span>
              <span><strong>{products.length}</strong> products in the catalogue</span>
            </div>
          </div>
          <div className="rt-categories-search-wrap">
            <label htmlFor="category-page-search">Find a category</label>
            <div className="rt-categories-search">
              <Search aria-hidden="true" />
              <input id="category-page-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sparklers, flower pots…" autoComplete="off" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear category search">Clear</button>}
            </div>
          </div>
        </div>

        <div className="rt-categories-results-heading">
          <div>
            <h2>All categories</h2>
            <p>{search ? `${categoryCards.length} matching ${categoryCards.length === 1 ? 'category' : 'categories'}` : 'Select a category to filter the shop.'}</p>
          </div>
          <button className="rt-btn rt-btn-outline" onClick={() => { setShopIntent({ type: 'all' }); onNavigate('products'); }}>
            Shop all products <ArrowRight aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <div className="rt-category-page-grid" role="status" aria-label="Loading categories">
            {Array.from({ length: 8 }, (_, index) => <div className="rt-skeleton rt-category-skeleton" key={index} />)}
          </div>
        ) : categoryCards.length ? (
          <div className="rt-category-page-grid">
            {categoryCards.map((category) => (
              <button key={category.category_id} className="rt-category-card rt-category-page-card" onClick={() => openCategory(category.category_name)}>
                <div className={`rt-category-image ${category.image ? '' : 'is-placeholder'}`}>
                  <Sparkles className="rt-category-fallback-icon" aria-hidden="true" />
                  {category.image && <img src={category.image} alt="" loading="lazy" decoding="async" onError={(event) => { const fallback = category.fallbackImage; if (fallback && fallback !== category.image && !event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback; else event.currentTarget.hidden = true; }} />}
                </div>
                <div className="rt-category-page-card-body">
                  <strong>{category.category_name.replace(/Colourful|Colourfull/g, 'Colour')}</strong>
                  <span className="rt-category-count">{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</span>
                  <span className="rt-category-page-open">View products <ArrowRight aria-hidden="true" /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rt-empty-state rt-category-empty">
            <Grid2X2 aria-hidden="true" />
            <h2>No categories found</h2>
            <p>{search ? 'Try a different category name.' : 'Active categories will appear here when they are available.'}</p>
            {search && <button onClick={() => setSearch('')}>Clear search</button>}
          </div>
        )}
      </div>
    </section>
  );
};
