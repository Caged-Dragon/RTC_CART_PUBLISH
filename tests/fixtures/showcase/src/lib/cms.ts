import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { CART_URL } from "./utils";

/** Both public sites use the same production Supabase project and its normalized schema. */
const REVALIDATE = Math.max(15, Number(process.env.CMS_REVALIDATE_SECONDS ?? 60));
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hhbpyxhtksgbkaigeutl.supabase.co").replace(/\/$/, "");
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-publishable-key";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: REVALIDATE } }) },
});

async function run<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await p;
    if (error) { console.error("[cms] Supabase query failed:", error.message); return fallback; }
    return data ?? fallback;
  } catch (error) { console.error("[cms] Supabase request failed:", error); return fallback; }
}

export type Settings = Record<string, string>;
export type Theme = {
  key: string;
  light: Record<string, string>;
  dark: Record<string, string>;
  fonts: { heading?: string; body?: string };
  components?: Record<string, Record<string, string>>;
};
export type Banner = {
  title: string; subtitle: string | null; alt_text: string | null; image_url: string;
  mobile_image_url: string | null; link_url: string | null; position: string; display_order: number;
};
export type ComboPack = {
  id: string; combo_code: string; name: string; short_title: string | null; slug: string;
  description: string | null; tagline: string | null; image_url: string | null; budget_tier: string | null;
  pricing_mode: string; manual_price: number | null; current_price: number; item_count: number; badge_text: string | null;
};
export type Category = {
  category_id: string; category_name: string; slug: string; description: string | null;
  image_url: string | null; details?: string | null; alt_text?: string | null;
};
export type Product = {
  product_id: string; product_code: string | null; product_name: string; selling_price: number; mrp: number;
  category_id: string; category_name: string; category_slug: string; pack_type_name: string | null;
  price_year: number; image_url: string | null; alt_text: string | null; is_bestseller?: boolean; is_featured?: boolean;
};
export type Media = { url: string; alt: string; ratio: string | null };
export type Section = { page_id: number; key: string; name: string; type: string; content: Record<string, any> };
export type SeoPage = {
  page_id: number; slug: string; page_name: string; page_title: string; page_description: string;
  status: string; visibility: string; is_homepage: boolean; sort_order: number;
  seo?: { meta_title?: string; meta_description?: string; keywords?: string; canonical_url?: string;
    robots_index?: boolean; robots_follow?: boolean; og_title?: string; og_description?: string; structured_data?: any } | null;
  sections: Section[];
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const asObject = (v: unknown): Record<string, any> => {
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return {}; } }
  return v && typeof v === "object" ? v as Record<string, any> : {};
};
const asText = (v: unknown) => typeof v === "string" ? v.trim() : "";
const formatName = (v: string) => v.replace(/\s+/g, " ").trim();

const getPublicSettingsRows = cache(async (): Promise<Record<string, any>> => {
  const rows = await run<any[]>(sb.from("web_settings").select("setting_key,setting_group,setting_value,is_public").eq("is_public", true), []);
  return Object.fromEntries(rows.map((row) => [asText(row.setting_key), row.setting_value]));
});

export const getCompany = cache(async () => {
  const [sites, aboutRows, contactRows, mediaRows] = await Promise.all([
    run<any[]>(sb.from("app_sites").select("site_name,domain,config,is_active").eq("domain", "rtcrackers.com").eq("is_active", true).limit(1), []),
    run<any[]>(sb.from("web_page_sections").select("content").eq("page_id", 1).eq("section_key", "about_us").eq("is_enabled", true).eq("visibility", "public").limit(1), []),
    run<any[]>(sb.from("web_page_sections").select("content").eq("page_id", 6).eq("section_key", "price_list_contact").eq("is_enabled", true).eq("visibility", "public").limit(1), []),
    run<any[]>(sb.from("web_media").select("media_url,media_name,alt_text").eq("is_public", true).eq("is_active", true).in("media_id", [1, 2]), []),
  ]);
  const about = asObject(aboutRows[0]?.content);
  const address = asObject(contactRows[0]?.content);
  const logo = mediaRows.find((row) => /logo/i.test(asText(row.media_name)));
  const banner = mediaRows.find((row) => /banner/i.test(asText(row.media_name)));
  const site = sites[0] || {};
  return {
    company_name: asText(site.site_name) || "RedThunder Crackers",
    legal_name: "Rajukanna Fireworks",
    tagline: "Makka & Wheat brand — Sivakasi, established 1995",
    description: asText(about.intro) || "The public catalogue for RedThunder Crackers and the Makka & Wheat brand from Rajukanna Fireworks, Sivakasi.",
    aim: asText(about.brand_information), vision: asText(about.vision), mission: asText(about.mission),
    physical_address: asText(address.address) || "D No. 4/2017/A, Pothigai Nagar, Kila Thiruthangal",
    city: asText(address.city) || "Sivakasi", district: "Virudhunagar", state: asText(address.state) || "Tamil Nadu",
    postal_code: asText(address.postal_code) || "626189", country: asText(address.country) || "India",
    logo_url: asText(logo?.media_url), favicon_url: asText(logo?.media_url),
    website_url: "https://rtcrackers.com", email: "sales@rtcrackers.com", support_email: "support@rtcrackers.com",
    mobile: "+91 8124100501", alternate_mobile: "+91 7358737658", whatsapp_number: "+91 8124100501",
    google_maps_url: "", landline: "", policies: {}, seo_details: {}, social_links: {}, contact_details: {}, business_hours: {},
    extra_details: { highlights: Array.isArray(about.highlights) ? about.highlights : [], banner_url: asText(banner?.media_url) },
    is_active: true,
  };
});

export const getMerchant = cache(async () => {
  const settings = await getPublicSettingsRows();
  return {
    factory_name: "Rajukanna Fireworks", active_catalog_year: 2026,
    factory_godown_address: "D No. 4/2017/A, Pothigai Nagar, Kila Thiruthangal, Sivakasi - 626189", pincode: "626189",
    whatsapp_booking_number: "8124100501", support_phone: "7358737658", merchant_upi_id: null,
    minimum_order_value: 3000, is_season_booking_open: false,
    dispatch_policy_text: asText(settings.portfolio_payment_notice) || "This website is a catalogue and enquiry channel only; it does not accept online fireworks orders or payments.",
  };
});

export const getProducts = cache(async (limit = 200): Promise<Product[]> => {
  const [products, priceRows, categories, packs, images, legacyFlags] = await Promise.all([
    run<any[]>(sb.from("products").select("product_id,source_serial_no,product_name,category_id,pack_type_id,is_active,display_order,keywords").eq("is_active", true).order("display_order", { ascending: true }).order("source_serial_no", { ascending: true }).limit(Math.max(1, Math.min(limit, 1000))), []),
    run<any[]>(sb.from("product_prices").select("product_id,price_year,price_amount,currency_code,is_current").eq("is_current", true).order("price_year", { ascending: false }), []),
    run<any[]>(sb.from("product_categories").select("category_id,category_name,is_active").eq("is_active", true), []),
    run<any[]>(sb.from("product_pack_types").select("pack_type_id,pack_type_name"), []),
    run<any[]>(sb.from("product_images").select("product_id,image_url,alt_text,is_primary,is_active,display_order").eq("is_active", true).order("is_primary", { ascending: false }).order("display_order", { ascending: true }), []),
    run<any[]>(sb.from("rt_cart_products").select("s_no,name,popular,featured,is_active"), []),
  ]);
  const categoryById = new Map(categories.map((row) => [String(row.category_id), asText(row.category_name) || "Products"]));
  const packById = new Map(packs.map((row) => [String(row.pack_type_id), asText(row.pack_type_name)]));
  const priceByProduct = new Map<string, { amount: number; year: number }>();
  for (const row of priceRows) {
    const id = String(row.product_id);
    const old = priceByProduct.get(id);
    const year = Number(row.price_year) || 0;
    if (!old || year > old.year) priceByProduct.set(id, { amount: Number(row.price_amount) || 0, year });
  }
  const imageByProduct = new Map<string, any>();
  for (const row of images) if (!imageByProduct.has(String(row.product_id))) imageByProduct.set(String(row.product_id), row);
  const flagsBySerial = new Map<number, any>();
  for (const row of legacyFlags) if (row.is_active !== false) flagsBySerial.set(Number(row.s_no), row);

  return products.map((p) => {
    const id = String(p.product_id);
    const serial = Number(p.source_serial_no) || 0;
    const name = asText(p.product_name) || `Product ${serial || id}`;
    const category = categoryById.get(String(p.category_id)) || "Products";
    const flags = flagsBySerial.get(serial);
    // Old RT cart flags are used only when the names still match; never pair a stale row to another product.
    const validFlags = flags && formatName(asText(flags.name)).toLowerCase() === formatName(name).toLowerCase() ? flags : null;
    const price = priceByProduct.get(id);
    const image = imageByProduct.get(id);
    const keywords = Array.isArray(p.keywords) ? p.keywords.filter((x: unknown) => typeof x === "string") : [];
    return {
      product_id: id,
      product_code: serial ? String(serial) : id,
      product_name: name,
      selling_price: price?.amount ?? 0,
      mrp: price?.amount ?? 0,
      category_id: String(p.category_id ?? ""),
      category_name: category,
      category_slug: slugify(category),
      pack_type_name: packById.get(String(p.pack_type_id)) || null,
      price_year: price?.year || 2026,
      image_url: asText(image?.image_url) || null,
      alt_text: asText(image?.alt_text) || `${name} — Makka & Wheat brand catalogue, Sivakasi`,
      is_bestseller: Boolean(validFlags?.popular),
      is_featured: Boolean(validFlags?.featured),
      keywords,
    } as Product;
  }).filter((p) => p.selling_price > 0);
});

export const getProductCount = cache(async (): Promise<number> => {
  try {
    const { count, error } = await sb.from("products").select("product_id", { count: "exact", head: true }).eq("is_active", true);
    if (error) { console.error("[cms] Product count query failed:", error.message); return 0; }
    return count ?? 0;
  } catch (error) { console.error("[cms] Product count request failed:", error); return 0; }
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const rows = await run<any[]>(sb.from("product_categories").select("category_id,category_name,parent_category_id,is_active").eq("is_active", true).order("category_name", { ascending: true }), []);
  return rows.map((r) => ({
    category_id: String(r.category_id ?? ""), category_name: asText(r.category_name) || "Products",
    slug: slugify(asText(r.category_name) || "products"), description: null, image_url: null,
    ...(r.parent_category_id ? { details: "A category in the RedThunder Crackers catalogue." } : {}),
    alt_text: `${asText(r.category_name)} — RedThunder Crackers catalogue`,
  }));
});

export const getBanners = cache(async (): Promise<Banner[]> => {
  const now = new Date().toISOString();
  const rows = await run<any[]>(sb.from("web_banners")
    .select("banner_id,title,subtitle,button_text,button_url,sort_order,is_active,start_at,end_at,image:web_media!web_banners_image_media_id_fkey(media_url,alt_text,is_active,is_public),mobile:web_media!web_banners_mobile_image_media_id_fkey(media_url,alt_text,is_active,is_public)")
    .eq("is_active", true).or(`start_at.is.null,start_at.lte.${now}`).or(`end_at.is.null,end_at.gt.${now}`).order("sort_order", { ascending: true }), []);
  const normalized = rows.flatMap((r) => {
    const image = Array.isArray(r.image) ? r.image[0] : r.image;
    const mobile = Array.isArray(r.mobile) ? r.mobile[0] : r.mobile;
    if (!image?.media_url || image.is_active === false || image.is_public === false) return [];
    return [{ title: asText(r.title) || "Makka & Wheat Brand Catalogue", subtitle: asText(r.subtitle) || "Product information from Rajukanna Fireworks, Sivakasi.", alt_text: asText(image.alt_text) || asText(r.title) || "RedThunder Crackers catalogue banner", image_url: asText(image.media_url), mobile_image_url: asText(mobile?.media_url) || null, link_url: asText(r.button_url) || null, position: "H", display_order: Number(r.sort_order) || 0 } as Banner];
  });
  if (normalized.length) return normalized;
  // The current production banner is stored in web_media; web_banners is currently empty.
  const media = await run<any[]>(sb.from("web_media").select("media_url,media_name,alt_text").eq("media_id", 2).eq("is_public", true).eq("is_active", true).limit(1), []);
  if (!media[0]?.media_url) return [];
  return [{ title: "Makka & Wheat Brand Catalogue", subtitle: "RedThunder Crackers — Rajukanna Fireworks, Sivakasi", alt_text: asText(media[0].alt_text) || "RedThunder Crackers advertising banner", image_url: asText(media[0].media_url), mobile_image_url: null, link_url: null, position: "H", display_order: 0 }];
});

/** No combo-pack table or published combo records exist in the verified production schema. */
export const getComboPacks = cache(async (): Promise<ComboPack[]> => []);

export const getSettings = cache(async (): Promise<Settings> => {
  const [company, merchant, productCount, categories, banners, publicSettings, prices] = await Promise.all([
    getCompany(), getMerchant(), getProductCount(), getCategories(), getBanners(), getPublicSettingsRows(),
    run<any[]>(sb.from("product_prices").select("price_year").eq("is_current", true).order("price_year", { ascending: false }).limit(1), []),
  ]);
  const extra = asObject(company.extra_details);
  const settings: Settings = {};
  Object.assign(settings, {
    "site.name": "RedThunder Crackers", "site.legal_name": "Rajukanna Fireworks", "site.factory_name": "Rajukanna Fireworks",
    "site.tagline": company.tagline, "site.description": "Makka & Wheat brand catalogue from Rajukanna Fireworks, Sivakasi, established 1995. General product information and enquiries only; online fireworks orders are not accepted.",
    "site.aim": company.aim, "site.vision": company.vision, "site.mission": company.mission,
    "site.brand_name": "Makka & Wheat", "site.parent_business": "Rajukanna Fireworks", "site.established_claim": "1995",
    "site.why_choose_us": JSON.stringify(Array.isArray(extra.highlights) ? extra.highlights : []),
    "site.domain": "rtcrackers.com", "site.logo_url": company.logo_url, "site.favicon_url": company.favicon_url,
    "site.phone": "+91 8124100501", "site.whatsapp_number": "+91 8124100501", "site.mobile": "+91 8124100501",
    "site.alternate_mobile": "+91 7358737658", "site.support_phone": "+91 7358737658", "site.landline": "",
    "site.phone_country_code": "91", "site.address": company.physical_address, "site.address_line_2": "Kila Thiruthangal",
    "site.landmark": "Pothigai Nagar", "site.factory_address": company.physical_address, "site.city": company.city,
    "site.district": company.district, "site.state": company.state, "site.postal_code": company.postal_code, "site.factory_pincode": company.postal_code,
    "site.country": "India", "site.sales_email": "sales@rtcrackers.com", "site.support_email": "support@rtcrackers.com",
    "site.website_url": "https://rtcrackers.com", "site.maps_url": "", "site.gst_number": "", "site.pan_number": "",
    "site.business_registration_number": "", "site.business_hours": "{}", "site.contact_details": "{}", "site.ordering_url": "https://wa.me/918124100501",
    "site.cart_url": CART_URL, "site.banner_url": banners[0]?.image_url ?? "", "site.banner_mobile_url": banners[0]?.mobile_image_url ?? "",
    "site.banner_alt": banners[0]?.alt_text ?? "RedThunder Crackers catalogue banner", "site.banner_link_url": banners[0]?.link_url ?? "",
    "site.social_links": "{}", "merchant.minimum_order_value": "3000", "merchant.season_booking_open": "false",
    "merchant.dispatch_policy": "Catalogue and enquiry only. This website does not accept online fireworks orders or payments.",
    "seo.title": "Sivakasi Crackers Catalogue 2026 | RedThunder Crackers — Makka & Wheat Brand",
    "seo.description": "Explore the 2026 RedThunder Crackers catalogue from Rajukanna Fireworks, Sivakasi. Contact +91 8124100501 for product enquiries; online fireworks orders are not accepted.",
    "seo.canonical_base": "https://rtcrackers.com", "seo.og_image": banners[0]?.image_url || company.logo_url,
    active_theme: "rt_crackers_canonical", "catalog.year": String(Number(prices[0]?.price_year) || 2026),
    "catalog.minimum_order_value": "3000", "catalog.season_booking_open": "false", "catalog.product_count": String(productCount),
    "catalog.category_count": String(categories.length), "catalog.banner_count": String(banners.length), "social.links": "{}",
    "policy.shipping": "Delivery availability, transport and payment terms must be confirmed directly with the licensed business.",
    "policy.raw": JSON.stringify({ online_payment_enabled: publicSettings.portfolio_online_payment_enabled === true ? true : false, returns_enabled: publicSettings.portfolio_returns_enabled === true }),
  });
  return settings;
});

const FALLBACK_THEME: Theme = {
  key: "rt_crackers_canonical",
  light: { primary: "#E31B16", primary_dark: "#B90F0B", accent: "#FFCE4B", accent_dark: "#D9A900", background: "#FFF8E8", surface: "#FFFFFF", surface_elevated: "#FFFFFF", surface_variant: "#FFF3CF", text: "#10224B", text_muted: "#53617D", border: "#EAD9AD", border_strong: "#D6C89D" },
  dark: { primary: "#FF4A3F", primary_dark: "#D81B14", accent: "#F6DD60", accent_dark: "#D6B52B", background: "#0C0F14", surface: "#15181D", surface_elevated: "#1C2026", surface_variant: "#3A302D", text: "#FFF8EE", text_muted: "#C5B7B2", border: "#3A302D", border_strong: "#5B4640" },
  fonts: { heading: "system-ui", body: "system-ui" },
};

export const getTheme = cache(async (): Promise<Theme> => {
  const row = await run<any>(sb.from("web_themes").select("theme_key,colors,typography,is_active,is_default").eq("is_active", true).eq("is_default", true).limit(1).maybeSingle(), null);
  if (!row) return FALLBACK_THEME;
  const colors = asObject(row.colors); const typography = asObject(row.typography);
  const light = { ...FALLBACK_THEME.light, ...asObject(colors.light) };
  const dark = { ...FALLBACK_THEME.dark, ...asObject(colors.dark) };
  return { key: asText(row.theme_key) || FALLBACK_THEME.key, light, dark, fonts: { heading: asText(typography.font_family_heading) || asText(typography.font_family_primary) || "system-ui", body: asText(typography.font_family_body) || asText(typography.font_family_primary) || "system-ui" } };
});

const THEME_VARS: Record<string, string[]> = {
  "--primary": ["primary"], "--primary-dark": ["primary_dark"], "--accent": ["accent", "gold"], "--accent-dark": ["accent_dark", "gold_dark"],
  "--background": ["background"], "--surface": ["surface"], "--surface-2": ["surface_elevated", "surface_2"], "--surface-variant": ["surface_variant"],
  "--text": ["text"], "--muted": ["text_muted", "muted"], "--border": ["border"], "--border-strong": ["border_strong"],
};
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/deg]+\)|[a-z]+)$/i;
const SAFE_FONT = /^[\w \-,'"]{1,80}$/;
export function themeCss(theme: Theme): string {
  let css = "";
  const declarations = (colors: Record<string, string>) => Object.entries(THEME_VARS).map(([key, aliases]) => {
    const value = aliases.map((alias) => colors[alias]).find((item) => typeof item === "string" && SAFE_COLOR.test(item.trim()));
    return value ? `${key}:${value.trim()};` : "";
  }).join("");
  const light = declarations(theme.light); const dark = declarations(theme.dark);
  const fonts = [["--font-heading", theme.fonts.heading], ["--font-body", theme.fonts.body]] as const;
  const fontCss = fonts.map(([key, value]) => value && SAFE_FONT.test(value) ? `${key}:\"${value}\",system-ui,sans-serif;` : "").join("");
  if (light || fontCss) css += `html:root{${light}${fontCss}}`;
  if (dark) css += `html[data-theme=\"dark\"]:root{${dark}}`;
  return css;
}

export const getSections = cache(async (): Promise<Section[]> => {
  const rows = await run<any[]>(sb.from("web_page_sections")
    .select("page_id,section_key,section_name,section_type,content,is_enabled,sort_order,visibility")
    .eq("is_enabled", true).eq("visibility", "public").order("page_id", { ascending: true }).order("sort_order", { ascending: true }), []);
  return rows.map((row) => ({ page_id: Number(row.page_id), key: asText(row.section_key), name: asText(row.section_name), type: String(row.section_type || "rich_content"), content: asObject(row.content) }));
});

export const getPublishedPages = cache(async (): Promise<SeoPage[]> => {
  const pages = await run<any[]>(sb.from("web_pages").select("page_id,slug,page_name,page_title,page_description,status,visibility,is_homepage,sort_order").eq("status", "published").eq("visibility", "public").order("sort_order", { ascending: true }), []);
  if (!pages.length) return [];
  const ids = pages.map((page) => Number(page.page_id));
  const [seoRows, sectionRows] = await Promise.all([
    run<any[]>(sb.from("web_seo").select("page_id,meta_title,meta_description,keywords,canonical_url,robots_index,robots_follow,og_title,og_description,structured_data").in("page_id", ids), []),
    run<any[]>(sb.from("web_page_sections").select("page_id,section_key,section_name,section_type,content,is_enabled,sort_order,visibility").in("page_id", ids).eq("is_enabled", true).eq("visibility", "public").order("sort_order", { ascending: true }), []),
  ]);
  const seoByPage = new Map(seoRows.map((row) => [Number(row.page_id), row]));
  const sectionsByPage = new Map<number, Section[]>();
  for (const section of sectionRows) {
    const pageId = Number(section.page_id); const list = sectionsByPage.get(pageId) || [];
    list.push({ page_id: pageId, key: asText(section.section_key), name: asText(section.section_name), type: String(section.section_type || "rich_content"), content: asObject(section.content) });
    sectionsByPage.set(pageId, list);
  }
  return pages.map((page) => ({
    page_id: Number(page.page_id), slug: asText(page.slug), page_name: asText(page.page_name), page_title: asText(page.page_title),
    page_description: asText(page.page_description), status: String(page.status), visibility: String(page.visibility),
    is_homepage: Boolean(page.is_homepage), sort_order: Number(page.sort_order) || 0, seo: seoByPage.get(Number(page.page_id)) || null,
    sections: sectionsByPage.get(Number(page.page_id)) || [],
  }));
});

export const getPageBySlug = cache(async (slug: string): Promise<SeoPage | null> => {
  const pages = await getPublishedPages();
  return pages.find((page) => page.slug === slug) || null;
});

export function whatsappUrl(s: Settings): string | null { return s["site.ordering_url"] || null; }
