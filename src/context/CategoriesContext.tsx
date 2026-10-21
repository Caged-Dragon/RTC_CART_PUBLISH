import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dbSelect } from '../lib/supabase';

export type CustomerCategory = {
  category_id: string; category_name: string; slug: string; description?: string | null;
  details?: string | null; image_url?: string | null; display_order: number; is_active: boolean;
};
type CategoriesContextValue = { categories: CustomerCategory[]; isLoading: boolean; error: string | null; refreshCategories: () => Promise<void> };
const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshCategories = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const rows = await dbSelect<any>('product_categories', 'select=category_id,category_name,parent_category_id,is_active&is_active=eq.true&order=category_name.asc');
      setCategories(rows.map((row) => ({
        category_id: String(row.category_id), category_name: String(row.category_name || 'Other'), slug: slugify(String(row.category_name || 'other')),
        description: null, details: null, image_url: null, display_order: 0, is_active: Boolean(row.is_active),
      })));
    } catch (cause) {
      console.error('Failed to load live categories from Supabase', cause);
      setError(cause instanceof Error ? cause.message : 'Categories could not be refreshed.');
    } finally { setIsLoading(false); }
  }, []);
  useEffect(() => { void refreshCategories(); }, [refreshCategories]);
  return <CategoriesContext.Provider value={{ categories, isLoading, error, refreshCategories }}>{children}</CategoriesContext.Provider>;
};
export const useCategories = () => { const context = useContext(CategoriesContext); if (!context) throw new Error('useCategories must be used inside CategoriesProvider'); return context; };
