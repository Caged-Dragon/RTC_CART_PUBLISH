export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/** Public catalogue site. Transactional links are intentionally disabled pending legal review. */
export const CART_URL = "https://cart.rtcrackers.com";

/** Open the matching catalogue context on the companion site; this never adds items or submits an order. */
export function cartHandoffUrl(input: { id?: string | number | null; qty?: number; comboId?: string | null; category?: string | null; query?: string | null }) {
  const url = new URL(input.comboId ? `${CART_URL}/combos` : `${CART_URL}/products`);
  const query = input.query || (input.id !== undefined && input.id !== null ? String(input.id) : "");
  if (query.trim()) url.searchParams.set("q", query.trim());
  if (input.category) url.searchParams.set("category", input.category);
  return url.toString();
}

/** Fonts are chosen in the database (theme typography); load them from Google Fonts at runtime. */
export const fontHref = (names: (string | undefined)[]) => {
  const fam = [...new Set(names.filter(Boolean) as string[])];
  return fam.length
    ? `https://fonts.googleapis.com/css2?${fam.map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700;800`).join("&")}&display=swap`
    : null;
};
/** Normalize a CMS-provided site URL before using it as a canonical/SEO origin. */
export function normalizeSiteBase(value?: string) {
  const fallback = "https://rtcrackers.com";
  try {
    const candidate = (value || fallback).trim();
    const parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return fallback;
    return parsed.origin;
  } catch {
    return fallback;
  }
}

