import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dbSelect } from '../lib/supabase';
import { useProducts, type DbProduct } from './ProductsContext';

export interface ComboItem {
  itemId: number;
  product: DbProduct;
  quantity: number;
  displayOrder: number;
  itemLabel?: string | null;
  itemNote?: string | null;
}

export interface ComboPack {
  id: string;
  websiteKey: string;
  comboCode: string;
  name: string;
  slug: string;
  shortTitle?: string | null;
  description?: string | null;
  tagline?: string | null;
  imageUrl?: string | null;
  budgetTier?: 'STARTER' | 'FAMILY' | 'FESTIVAL' | 'PREMIUM' | 'GRAND' | null;
  pricingMode: 'LIVE_SUM' | 'MANUAL';
  manualPrice?: number | null;
  badgeText?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  calculatedPrice: number;
  liveItemsTotal: number;
  totalUnits: number;
  distinctProducts: number;
  items: ComboItem[];
  isAvailable: boolean;
  unavailableItems: ComboItem[];
}

interface ComboPacksContextValue {
  combos: ComboPack[];
  featuredCombos: ComboPack[];
  isLoading: boolean;
  refreshCombos: () => Promise<void>;
}

const ComboPacksContext = createContext<ComboPacksContextValue | undefined>(undefined);

export const ComboPacksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { products } = useProducts();
  const productsByDbId = useMemo(() => new Map(products.map((p) => [String(p.dbId), p])), [products]);
  const [combos, setCombos] = useState<ComboPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCombos = useCallback(async () => {
    setIsLoading(true);
    try {
      const rows = await dbSelect<any>(
        'combo_pack_catalogue',
        'select=id,website_key,combo_code,name,slug,short_title,description,tagline,image_url,budget_tier,pricing_mode,manual_price,badge_text,is_active,is_featured,display_order,calculated_price,live_items_total,total_units,distinct_products,items&order=display_order.asc,id.asc',
      );
      const next = rows
        .map((row) => {
          const rawItems: any[] = Array.isArray(row.items) ? row.items : [];
          const items: ComboItem[] = rawItems
            .map((item) => {
              const product = productsByDbId.get(String(item.product_id))
                || products.find((p) => p.id === Number(item.product_code));
              if (!product) return null;
              return {
                itemId: Number(item.item_id),
                product,
                quantity: Math.max(1, Number(item.quantity || 1)),
                displayOrder: Number(item.display_order || 0),
                itemLabel: item.item_label ?? null,
                itemNote: item.item_note ?? null,
              } satisfies ComboItem;
            })
            .filter(Boolean) as ComboItem[];

          const unavailableItems = items.filter((item) => item.product.stockStatus === 'OUT_OF_STOCK');

          return {
            id: String(row.id),
            websiteKey: String(row.website_key || 'cart'),
            comboCode: String(row.combo_code),
            name: String(row.name),
            slug: String(row.slug),
            shortTitle: row.short_title ?? null,
            description: row.description ?? null,
            tagline: row.tagline ?? null,
            imageUrl: row.image_url ?? null,
            budgetTier: row.budget_tier ?? null,
            pricingMode: row.pricing_mode === 'MANUAL' ? 'MANUAL' : 'LIVE_SUM',
            manualPrice: row.manual_price == null ? null : Number(row.manual_price),
            badgeText: row.badge_text ?? null,
            isActive: Boolean(row.is_active),
            isFeatured: Boolean(row.is_featured),
            displayOrder: Number(row.display_order || 0),
            calculatedPrice: Number(row.calculated_price || 0),
            liveItemsTotal: Number(row.live_items_total || 0),
            totalUnits: Number(row.total_units || 0),
            distinctProducts: Number(row.distinct_products || 0),
            items,
            isAvailable: items.length > 0 && unavailableItems.length === 0,
            unavailableItems,
          } satisfies ComboPack;
        })
        .filter((combo) => combo.items.length > 0);

      setCombos(next);
    } catch (error) {
      console.error('Combo catalogue load failed', error);
      setCombos([]);
    } finally {
      setIsLoading(false);
    }
  }, [productsByDbId, products]);

  useEffect(() => { void refreshCombos(); }, [refreshCombos]);

  const featuredCombos = useMemo(() => combos.filter((combo) => combo.isFeatured), [combos]);

  return (
    <ComboPacksContext.Provider value={{ combos, featuredCombos, isLoading, refreshCombos }}>
      {children}
    </ComboPacksContext.Provider>
  );
};

export const useComboPacks = () => {
  const context = useContext(ComboPacksContext);
  if (!context) throw new Error('useComboPacks must be used within ComboPacksProvider');
  return context;
};
