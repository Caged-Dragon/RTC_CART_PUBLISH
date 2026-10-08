import type { Product } from './products';

/**
 * Database-driven combo/gift-box detection.
 * The storefront does not create or hardcode combo packs. Existing products are
 * surfaced as combo packs when their live database category/name identifies them
 * as a Gift Box / Combo record.
 */
export const COMBO_CATEGORY_PATTERNS = [
  'gift box',
  'gift boxes',
  'combo',
  'combos',
  'combo pack',
  'combo packs',
  'combo box',
  'combo boxes',
  'family pack',
  'family packs',
] as const;

export const isComboProduct = (product: Product): boolean => {
  const haystack = `${product.category} ${product.name}`.toLowerCase();
  return COMBO_CATEGORY_PATTERNS.some((pattern) => haystack.includes(pattern));
};

export type LiveCombo = Product & {
  comboBudgetLabel: string;
  comboItemLabel: string;
};

const budgetLabel = (rate: number) => {
  if (rate <= 500) return 'Starter';
  if (rate <= 1000) return 'Family';
  if (rate <= 2000) return 'Premium';
  if (rate <= 5000) return 'Grand';
  return 'Royal';
};

export const getLiveComboPacks = (products: Product[]): LiveCombo[] =>
  products
    .filter(isComboProduct)
    .filter((product) => product.stockStatus !== 'OUT_OF_STOCK')
    .sort((a, b) => {
      if (Boolean(b.featured) !== Boolean(a.featured)) return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (Boolean(b.popular) !== Boolean(a.popular)) return Number(Boolean(b.popular)) - Number(Boolean(a.popular));
      return a.rate - b.rate;
    })
    .map((product) => ({
      ...product,
      comboBudgetLabel: budgetLabel(product.rate),
      comboItemLabel: product.pieces || product.unit,
    }));
