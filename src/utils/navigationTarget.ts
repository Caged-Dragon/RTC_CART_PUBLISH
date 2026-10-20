import type { ScreenId } from '../components/Navbar';
import { setShopIntent } from './shopNavigation';

const screenByPath: Record<string, ScreenId> = {
  '/': 'intro',
  '/home': 'intro',
  '/products': 'products',
  '/shop': 'products',
  '/categories': 'categories',
  '/price-list': 'table',
  '/table': 'table',
  '/cart': 'cart',
  '/my-orders': 'myorders',
  '/track-order': 'tracker',
  '/whatsapp-order': 'whatsapp',
  '/email-bill': 'mail',
  '/login': 'auth',
  '/account': 'auth',
  '/combos': 'combos',
  '/gift-boxes': 'gift-boxes',
  '/transport': 'transport',
  '/delivery': 'transport',
  '/safety': 'safety',
  '/reviews': 'reviews',
  '/about': 'about',
  '/contact': 'contact',
};

function applyQueryToScreen(screen: ScreenId, url: URL) {
  if (screen === 'products') {
    const search = url.searchParams.get('q') || url.searchParams.get('search');
    const category = url.searchParams.get('category');
    const budget = url.searchParams.get('budget');
    if (search) setShopIntent({ type: 'search', value: search });
    else if (category) setShopIntent({ type: 'category', value: category });
    else if (budget) setShopIntent({ type: 'budget', value: budget });
    else setShopIntent({ type: 'all' });
  }
}

/** Safely resolves database-managed CTA destinations to existing app screens or HTTP(S) links. */
export function navigateToConfiguredTarget(
  target: string | null | undefined,
  onNavigate: (screen: ScreenId) => void,
  fallback: ScreenId = 'products',
): boolean {
  const value = target?.trim();
  if (!value) {
    onNavigate(fallback);
    return false;
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const external = new URL(value);
      if (external.protocol !== 'https:' && external.protocol !== 'http:') throw new Error('Unsupported URL protocol');
      const opened = window.open(external.href, '_blank', 'noopener,noreferrer');
      // Preserve the configured destination even when the browser blocks a new tab.
      if (!opened) window.location.assign(external.href);
      return true;
    } catch {
      onNavigate(fallback);
      return false;
    }
  }

  if (value.startsWith('#')) {
    onNavigate('intro');
    window.setTimeout(() => document.getElementById(decodeURIComponent(value.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    return true;
  }

  let url: URL;
  try {
    url = new URL(value.startsWith('/') ? value : `/${value}`, window.location.origin);
  } catch {
    onNavigate(fallback);
    return false;
  }

  const path = url.pathname.replace(/\/+$/, '') || '/';
  const friendlyAlias = path.split('/').filter(Boolean).length === 1 ? `/${path.split('/').filter(Boolean)[0]}` : path;
  const screen = screenByPath[path] || screenByPath[friendlyAlias];
  if (!screen) {
    onNavigate(fallback);
    return false;
  }

  applyQueryToScreen(screen, url);
  onNavigate(screen);

  // App navigation intentionally owns the pathname; merge only configured query/hash state after it runs.
  const current = new URL(window.location.href);
  url.searchParams.forEach((paramValue, key) => current.searchParams.set(key, paramValue));
  current.hash = url.hash;
  if (url.search || url.hash) window.history.replaceState(window.history.state, '', `${current.pathname}${current.search}${current.hash}`);

  if (screen === 'combos' && url.searchParams.get('budget_tier')) {
    const tier = url.searchParams.get('budget_tier')!.toUpperCase();
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('rt-combo-budget-tier', { detail: tier })), 0);
  }
  return true;
}
