import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dbSelect } from '../lib/supabase';
import { useProducts, type DbProduct } from './ProductsContext';

export interface HomepagePick {
  id: number;
  productId: string;
  displayOrder: number;
  badgeText: string;
  customerLabel: string;
  customerReason: string;
  customerScore: number | null;
  ratingStars: number | null;
  ratingCount: number;
  product: DbProduct;
}

interface HomepagePicksContextValue {
  picks: HomepagePick[];
  isLoading: boolean;
  refreshPicks: () => Promise<void>;
}

const HomepagePicksContext = createContext<HomepagePicksContextValue | undefined>(undefined);

export const HomepagePicksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { products } = useProducts();
  const [picks, setPicks] = useState<HomepagePick[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPicks = useCallback(async () => {
    if (!products.length) return;
    setIsLoading(true);
    try {
      const rows = await dbSelect<any>(
        'homepage_customer_picks',
        'select=id,product_id,display_order,badge_text,customer_label,customer_reason,customer_score,rating_stars,rating_count&website_key=eq.cart&is_active=eq.true&order=display_order.asc,id.asc',
      );
      const byDbId = new Map(products.map((product) => [product.dbId, product]));
      const byCode = new Map(products.map((product) => [String(product.id), product]));
      setPicks(
        rows
          .map((row) => {
            const product = byDbId.get(row.product_id) || byCode.get(String(row.product_code));
            if (!product || product.stockStatus === 'OUT_OF_STOCK') return null;
            return {
              id: Number(row.id),
              productId: String(row.product_id),
              displayOrder: Number(row.display_order || 0),
              badgeText: row.badge_text || 'Customer Pick',
              customerLabel: row.customer_label || 'Customer Favourite',
              customerReason: row.customer_reason || 'A carefully selected customer-focused choice.',
              customerScore: row.customer_score == null ? null : Number(row.customer_score),
              ratingStars: row.rating_stars == null ? null : Number(row.rating_stars),
              ratingCount: Number(row.rating_count || 0),
              product,
            } satisfies HomepagePick;
          })
          .filter(Boolean) as HomepagePick[],
      );
    } catch (error) {
      console.error('Homepage customer picks load failed', error);
      setPicks([]);
    } finally {
      setIsLoading(false);
    }
  }, [products]);

  useEffect(() => { void refreshPicks(); }, [refreshPicks]);

  return <HomepagePicksContext.Provider value={{ picks, isLoading, refreshPicks }}>{children}</HomepagePicksContext.Provider>;
};

export const useHomepagePicks = () => {
  const context = useContext(HomepagePicksContext);
  if (!context) throw new Error('useHomepagePicks must be used within HomepagePicksProvider');
  return context;
};
