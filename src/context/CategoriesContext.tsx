import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dbSelect } from '../lib/supabase';

export type CustomerCategory = { category_id: string; category_name: string; slug: string; description?: string | null; details?: string | null; image_url?: string | null; display_order: number; is_active: boolean };
const CategoriesContext = createContext<{categories: CustomerCategory[]; isLoading: boolean; refreshCategories:()=>Promise<void>}|undefined>(undefined);
export const CategoriesProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
  const [categories,setCategories]=useState<CustomerCategory[]>([]); const [isLoading,setIsLoading]=useState(true);
  const refreshCategories=useCallback(async()=>{setIsLoading(true);try{setCategories(await dbSelect<CustomerCategory>('product_categories','select=*&is_active=eq.true&order=display_order.asc,category_name.asc'));}catch(e){console.error('Failed to load categories',e);setCategories([]);}finally{setIsLoading(false);}},[]);
  useEffect(()=>{refreshCategories()},[refreshCategories]); return <CategoriesContext.Provider value={{categories,isLoading,refreshCategories}}>{children}</CategoriesContext.Provider>;
};
export const useCategories=()=>{const c=useContext(CategoriesContext);if(!c)throw new Error('useCategories must be used inside CategoriesProvider');return c;};
