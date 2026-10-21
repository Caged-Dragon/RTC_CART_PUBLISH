import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { DbProduct } from './ProductsContext';

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
  const [combos, setCombos] = useState<ComboPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCombos = useCallback(async () => {
    // The verified live schema has no combo-pack table or published combo records.
    // Keep the UI honest instead of querying a nonexistent legacy relation or showing samples.
    setCombos([]);
    setIsLoading(false);
  }, []);

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
