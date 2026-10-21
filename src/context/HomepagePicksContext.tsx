import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useProducts, type DbProduct } from './ProductsContext';

export interface HomepagePick {
  id: number; productId: string; displayOrder: number; badgeText: string; customerLabel: string;
  customerReason: string; customerScore: number | null; ratingStars: number | null; ratingCount: number; product: DbProduct;
}
interface HomepagePicksContextValue { picks: HomepagePick[]; isLoading: boolean; refreshPicks: () => Promise<void>; }
const HomepagePicksContext = createContext<HomepagePicksContextValue | undefined>(undefined);

/** The shared production schema has no homepage_customer_picks table. Use only real popularity/featured flags. */
export const HomepagePicksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { products, isLoading: productsLoading } = useProducts();
  const [picks, setPicks] = useState<HomepagePick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPicks = useCallback(async () => {
    if (productsLoading) return;
    const next = products.filter((product) => product.isBestseller || product.isFeatured).slice(0, 12).map((product, index) => ({
      id: product.id, productId: product.dbId, displayOrder: index,
      badgeText: product.isBestseller ? 'Popular catalogue item' : 'Featured catalogue item',
      customerLabel: 'Catalogue highlight',
      customerReason: 'Marked as a popular or featured item in the connected product catalogue.',
      customerScore: null, ratingStars: null, ratingCount: 0, product,
    } satisfies HomepagePick));
    setPicks(next); setIsLoading(false);
  }, [products, productsLoading]);
  useEffect(() => { void refreshPicks(); }, [refreshPicks]);
  return <HomepagePicksContext.Provider value={{ picks, isLoading, refreshPicks }}>{children}</HomepagePicksContext.Provider>;
};
export const useHomepagePicks = () => { const context = useContext(HomepagePicksContext); if (!context) throw new Error('useHomepagePicks must be used within HomepagePicksProvider'); return context; };
