import type { Product } from '../data/products';

export type BestSellerProduct = Product & {
  dbId?: string;
  isBestseller?: boolean;
};

type CuratedPick = {
  displayOrder?: number;
  product: BestSellerProduct;
};

/**
 * Build one consistent best-seller list for the home page and the dedicated page.
 * Curated customer picks appear first; products explicitly marked as best sellers
 * in the live catalogue follow. Duplicate products are removed by catalogue ID.
 */
export function getBestSellerProducts(
  products: BestSellerProduct[],
  curatedPicks: CuratedPick[],
): BestSellerProduct[] {
  const orderedPicks = [...curatedPicks]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((pick) => pick.product);
  const catalogueBestSellers = products
    .filter((product) => product.popular || product.isBestseller)
    .sort((a, b) => Number(!!b.isBestseller || !!b.popular) - Number(!!a.isBestseller || !!a.popular) || a.sNo - b.sNo);

  const unique = new Map<string, BestSellerProduct>();
  [...orderedPicks, ...catalogueBestSellers].forEach((product) => {
    const key = product.dbId || String(product.id);
    if (!unique.has(key)) unique.set(key, product);
  });
  return [...unique.values()];
}

/** Keep the home preview aligned with the reference layout; the full database list remains on /best-sellers. */
export function getHomepageBestSellerCount(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.min(4, Math.floor(total));
}
