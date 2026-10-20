export type ShopIntent =
  | { type: 'all' }
  | { type: 'search'; value: string }
  | { type: 'category'; value: string }
  | { type: 'budget'; value: string }
  | { type: 'best-sellers' };


/** Build a shareable shop query while preserving unrelated filters/parameters. */
export function buildCategorySearch(search: string, category: string): string {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  if (!category.trim() || category === 'All') params.delete('category');
  else params.set('category', category.trim());
  const query = params.toString();
  return query ? `?${query}` : '';
}

const KEY = 'redthunder_shop_intent_v1';

export function setShopIntent(intent: ShopIntent) {
  try { sessionStorage.setItem(KEY, JSON.stringify(intent)); } catch {}
  if (intent.type === 'all') window.dispatchEvent(new CustomEvent('rt-reset-product-filters'));
  if (intent.type === 'search') window.dispatchEvent(new CustomEvent<string>('rt-search-products', { detail: intent.value }));
  if (intent.type === 'category') window.dispatchEvent(new CustomEvent<string>('rt-select-category', { detail: intent.value }));
  if (intent.type === 'budget') window.dispatchEvent(new CustomEvent<string>('rt-budget-filter', { detail: intent.value }));
  if (intent.type === 'best-sellers') window.dispatchEvent(new CustomEvent('rt-best-sellers'));
}

export function consumeShopIntent(): ShopIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const value = JSON.parse(raw);
    return value && typeof value.type === 'string' ? value as ShopIntent : null;
  } catch { return null; }
}
