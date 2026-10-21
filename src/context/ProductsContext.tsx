import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Product } from '../data/products';
import { dbSelect } from '../lib/supabase';

export type DbProduct = Product & {
  dbId: string;
  skuCode?: string;
  factoryRate?: number;
  mrpRate?: number;
  availableQuantity?: number;
  isBestseller?: boolean;
  isFeatured?: boolean;
  isGreenCracker?: boolean;
};

interface ProductsContextType {
  products: DbProduct[];
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
}
const ProductsContext = createContext<ProductsContextType | undefined>(undefined);
const clean = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const toUnit = (v: unknown): Product['unit'] => {
  const value = clean(v).toLowerCase();
  if (value === 'pkt' || value === 'packet') return 'Pkt';
  if (value === 'tube') return 'Tube';
  return 'Box';
};

/**
 * This reads the same normalized catalogue tables used by rtcrackers.com.
 * The old rt_cart_products table is read only for popular/featured flags and is
 * joined by serial number only when the product names still match.
 */
async function fetchLiveCatalogue(): Promise<DbProduct[]> {
  const optional = async <T,>(table: string, query: string): Promise<T[]> => {
    try { return await dbSelect<T>(table, query); }
    catch (error) { console.warn(`Optional catalogue query failed for ${table}`, error); return []; }
  };
  const [products, prices, categories, packTypes, images, inventory, flags] = await Promise.all([
    dbSelect<any>('products', 'select=product_id,source_serial_no,product_name,category_id,pack_type_id,is_active,display_order,keywords&is_active=eq.true&order=source_serial_no.asc'),
    dbSelect<any>('product_prices', 'select=product_id,price_year,price_amount,is_current&is_current=eq.true&order=price_year.desc'),
    optional<any>('product_categories', 'select=category_id,category_name,is_active&is_active=eq.true'),
    optional<any>('product_pack_types', 'select=pack_type_id,pack_type_name'),
    optional<any>('product_images', 'select=product_id,image_url,alt_text,is_primary,is_active,display_order&is_active=eq.true&order=is_primary.desc,display_order.asc'),
    optional<any>('product_inventory', 'select=product_id,stock_quantity,reserved_quantity,track_inventory'),
    optional<any>('rt_cart_products', 'select=s_no,name,popular,featured,is_active'),
  ]);

  const categoryNames = new Map<string, string>(categories.map((row: any) => [String(row.category_id), clean(row.category_name) || 'Other']));
  const packNames = new Map<string, string>(packTypes.map((row: any) => [String(row.pack_type_id), clean(row.pack_type_name)]));
  const priceByProduct = new Map<string, { price: number; year: number }>();
  for (const row of prices) {
    const id = String(row.product_id); const year = Number(row.price_year) || 0;
    const existing = priceByProduct.get(id);
    if (!existing || year > existing.year) priceByProduct.set(id, { price: Number(row.price_amount) || 0, year });
  }
  const imageByProduct = new Map<string, any>();
  for (const row of images) if (!imageByProduct.has(String(row.product_id))) imageByProduct.set(String(row.product_id), row);
  const inventoryByProduct = new Map<string, any>(inventory.map((row: any) => [String(row.product_id), row]));
  const flagsBySerial = new Map<number, any>(flags.filter((row: any) => row.is_active !== false).map((row: any) => [Number(row.s_no), row]));

  const mapped = products.map((row: any): DbProduct | null => {
    const serial = Number(row.source_serial_no);
    const dbId = String(row.product_id ?? '');
    const name = clean(row.product_name);
    const currentPrice = priceByProduct.get(dbId);
    if (!dbId || !name || !Number.isFinite(serial) || serial <= 0 || !currentPrice || currentPrice.price <= 0) return null;

    const category = categoryNames.get(String(row.category_id)) || 'Other';
    const image = imageByProduct.get(dbId);
    const stock = inventoryByProduct.get(dbId);
    const flag = flagsBySerial.get(serial);
    const flagsMatch = flag && clean(flag.name).toLocaleLowerCase() === name.toLocaleLowerCase();
    let stockStatus: Product['stockStatus'] = 'IN_STOCK';
    if (stock?.track_inventory) {
      const available = Math.max(0, Number(stock.stock_quantity || 0) - Number(stock.reserved_quantity || 0));
      stockStatus = available <= 0 ? 'OUT_OF_STOCK' : available <= 5 ? 'LOW_STOCK' : 'IN_STOCK';
    }
    const keywords = Array.isArray(row.keywords) ? row.keywords.filter((v: unknown) => typeof v === 'string') : [];
    return {
      // Serial number is the UI/cart identity (stable across both sites); dbId is the normalized PK.
      id: serial, sNo: serial, name, category,
      unit: toUnit(packNames.get(String(row.pack_type_id))),
      rate: currentPrice.price,
      description: keywords.length ? `${name} — ${keywords.join(', ')}` : `${name} from the RedThunder Crackers catalogue.`,
      popular: Boolean(flagsMatch && flag.popular), featured: Boolean(flagsMatch && flag.featured),
      pieces: undefined,
      imageUrl: clean(image?.image_url) || undefined,
      stockStatus,
      dbId, skuCode: String(serial), factoryRate: currentPrice.price, mrpRate: currentPrice.price,
      availableQuantity: stock?.track_inventory ? Math.max(0, Number(stock.stock_quantity || 0) - Number(stock.reserved_quantity || 0)) : undefined,
      isBestseller: Boolean(flagsMatch && flag.popular), isFeatured: Boolean(flagsMatch && flag.featured), isGreenCracker: false,
    };
  }).filter((row): row is DbProduct => row !== null);
  if (!mapped.length) throw new Error('No active products with current prices were returned by the shared catalogue tables.');
  return mapped;
}

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProducts = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const next = await fetchLiveCatalogue();
      setProducts(next); setError(null);
    } catch (cause) {
      console.error('Failed to load shared Supabase catalogue', cause);
      setError(cause instanceof Error ? cause.message : 'The live catalogue could not be refreshed. Check the connection and try again.');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void refreshProducts(); }, [refreshProducts]);
  return <ProductsContext.Provider value={{ products, isLoading, error, refreshProducts }}>{children}</ProductsContext.Provider>;
};
export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts must be used within ProductsProvider');
  return context;
};
