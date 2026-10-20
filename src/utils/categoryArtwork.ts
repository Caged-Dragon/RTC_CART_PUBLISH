/** Local category artwork fallbacks used only when database image URLs are absent. */
const categoryFallbackImages: Array<{ terms: string[]; src: string }> = [
  { terms: ['sparkler'], src: '/images/storefront/cat-sparklers.jpg' },
  { terms: ['flower pot', 'flowerpot', 'fountain'], src: '/images/storefront/cat-flower-pots.jpg' },
  { terms: ['rocket'], src: '/images/storefront/cat-rockets.jpg' },
  { terms: ['sound', 'garland', 'wala', 'bomb'], src: '/images/storefront/cat-sound-crackers.jpg' },
  { terms: ['chakkar', 'wheel'], src: '/images/storefront/cat-chakkars.jpg' },
  { terms: ['colour sand', 'color sand', 'sand pot', 'colourful pots'], src: '/images/storefront/cat-colour-sand-pots.jpg' },
  { terms: ['kid', 'novelty'], src: '/images/storefront/cat-kids-special.jpg' },
  { terms: ['gift box', 'gift set', 'gift'], src: '/images/storefront/cat-gift-boxes.jpg' },
  { terms: ['fancy', 'aerial', 'shot'], src: '/images/storefront/cat-fancy-varieties.jpg' },
];

export function getCategoryFallbackImage(name: string): string {
  const normalized = name.toLocaleLowerCase().replace(/[^a-z0-9 ]/g, ' ');
  return categoryFallbackImages.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.src || '';
}

export const normalizeCategoryName = (name: unknown): string => String(name ?? '').trim().toLocaleLowerCase();
