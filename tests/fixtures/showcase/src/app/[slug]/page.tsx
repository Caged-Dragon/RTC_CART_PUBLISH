import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageBySlug, getPublishedPages, getProducts } from "@/lib/cms";
import { CART_URL, inr } from "@/lib/utils";

export const revalidate = 300;
const SITE = "https://rtcrackers.com";

export async function generateStaticParams() {
  const pages = await getPublishedPages();
  return pages.filter((page) => !page.is_homepage && page.slug !== "home").map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Page not found | RedThunder Crackers", robots: { index: false, follow: false } };
  const title = page.seo?.meta_title || page.page_title || `${page.page_name} | RedThunder Crackers`;
  const description = page.seo?.meta_description || page.page_description || `Read ${page.page_name} information from RedThunder Crackers, Rajukanna Fireworks, Sivakasi.`;
  const canonical = page.seo?.canonical_url || `${SITE}/${page.slug}`;
  const keywords = String(page.seo?.keywords || "RedThunder Crackers, Makka & Wheat, Sivakasi, Rajukanna Fireworks").split(",").map((item) => item.trim()).filter(Boolean);
  const index = page.seo?.robots_index ?? true;
  const follow = page.seo?.robots_follow ?? true;
  return {
    title: { absolute: title }, description, keywords,
    alternates: { canonical },
    robots: { index, follow, googleBot: { index, follow, "max-image-preview": "large", "max-snippet": -1 } },
    openGraph: { type: "article", siteName: "RedThunder Crackers", locale: "en_IN", url: canonical, title: page.seo?.og_title || title, description: page.seo?.og_description || description, images: [{ url: "https://hhbpyxhtksgbkaigeutl.supabase.co/storage/v1/object/public/website-media/banners/rtcrackers%20bannar.jpeg", alt: "RedThunder Crackers catalogue banner", width: 1200, height: 900 }] },
    twitter: { card: "summary_large_image", title: page.seo?.og_title || title, description: page.seo?.og_description || description, images: ["https://hhbpyxhtksgbkaigeutl.supabase.co/storage/v1/object/public/website-media/banners/rtcrackers%20bannar.jpeg"] },
  };
}

const humanize = (key: string) => key.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
function safeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  // Prevent stale CMS copy from describing online fireworks ordering or the old ₹2,000 threshold.
  if (/minimum order value.{0,60}(?:₹?\s?2,?000|rs\.?\s?2,?000)/i.test(text)) return null;
  if (/order now on whatsapp|send the product name and quantity on whatsapp|cash on delivery is available|place your cash on delivery order/i.test(text)) return null;
  if (/ordering is handled through whatsapp business/i.test(text)) return "For product information, contact the business directly. This website is a catalogue and enquiry channel only; it does not accept online fireworks orders or payments.";
  if (/https?:\/\//i.test(text) && !/https?:\/\/wa\.me\//i.test(text)) return null;
  return text;
}
function ContentValue({ value, depth = 0 }: { value: any; depth?: number }) {
  if (depth > 5 || value == null || typeof value === "boolean") return null;
  if (typeof value === "string" || typeof value === "number") {
    const text = safeText(String(value));
    return text ? <p className="mt-2 max-w-4xl text-sm leading-7 text-stone-700">{text}</p> : null;
  }
  if (Array.isArray(value)) {
    const entries = value.filter((item) => item != null && item !== "");
    if (!entries.length) return null;
    if (entries.every((item) => typeof item === "string" || typeof item === "number")) {
      const safeEntries = entries.map((item) => safeText(String(item))).filter((item): item is string => Boolean(item));
      return safeEntries.length ? <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7 text-stone-700">{safeEntries.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : null;
    }
    return <div className="mt-4 grid gap-4">{entries.map((item, index) => <div key={index} className="rounded-xl border border-amber-100 bg-white p-4"><ContentValue value={item} depth={depth + 1} /></div>)}</div>;
  }
  if (typeof value === "object") {
    const pairs = Object.entries(value as Record<string, any>).filter(([key]) => !/references|whatsapp_url|ordering_channel|whatsapp_number|phone_number|customer_score|rating_count|rating_stars/i.test(key));
    return <div className="space-y-3">{pairs.map(([key, child]) => {
      if (child == null || child === "" || typeof child === "boolean") return null;
      const label = humanize(key);
      const heading = /^(title|heading|question|q|name)$/i.test(key) && typeof child === "string" ? safeText(child) : null;
      if (heading) return <h3 key={key} className="mt-5 text-base font-bold text-stone-900">{heading}</h3>;
      return <div key={key} className="mt-2"><span className="text-xs font-bold uppercase tracking-wide text-red-800">{label}</span><ContentValue value={child} depth={depth + 1} /></div>;
    })}</div>;
  }
  return null;
}

function contentFor(slug: string, page: NonNullable<Awaited<ReturnType<typeof getPageBySlug>>>) {
  const sections = page.sections;
  const selected = (key: string) => sections.find((section) => section.key === key)?.content;
  if (slug === "shipping-delivery") {
    const overview = selected("shipping_overview") || {};
    return <>
      <section className="rounded-2xl border border-amber-100 bg-white p-5 sm:p-7"><h2 className="text-xl font-bold">Delivery coverage and transport</h2>
        <p className="mt-3 leading-7 text-stone-700">The current website information describes door-to-door delivery in Chennai and Kumbakonam. Other Tamil Nadu destinations may be served through a nearby transporter warehouse. Availability, lawful fulfilment and transport charges must be confirmed directly with the business before making arrangements.</p>
        <ContentValue value={{ service_area_note: overview.service_area_note, chennai_kumbakonam_shipping_fee: overview.chennai_kumbakonam_shipping_fee, rest_of_tamil_nadu_shipping: overview.rest_of_tamil_nadu_shipping }} />
      </section>
    </>;
  }
  if (slug === "terms-conditions") {
    return <section className="rounded-2xl border border-amber-100 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-bold">Catalogue and enquiry terms</h2>
      <p className="mt-3 leading-7 text-stone-700">This website publishes product information only. It does not provide online checkout or accept online fireworks orders or payments. Any transaction must be lawful and arranged directly with the properly licensed business, subject to current regulations and separately confirmed product availability, delivery location, transport charges and payment terms.</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-stone-700"><li>The business states a ₹3,000 minimum value for requested Sivakasi godown dispatch where lawful offline fulfilment is available.</li><li>The stated business policy is no cancellation and no return after an order has been verified and dispatched.</li><li>Support: +91 8124100501; sales@rtcrackers.com; support@rtcrackers.com.</li></ul>
    </section>;
  }
  if (slug === "order-verification-no-returns") {
    return <section className="rounded-2xl border border-amber-100 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-bold">Verification and dispatch policy</h2>
      <p className="mt-3 leading-7 text-stone-700">For any legally permitted offline transaction agreed directly with the licensed business, verify product availability, destination, transport charges and payment terms before proceeding. As a stated business policy, cancellations and returns are not accepted once the order is verified and dispatched from the Sivakasi godown.</p>
      <p className="mt-3 leading-7 text-stone-700">This site is catalogue/enquiry only. No online fireworks order or payment is submitted here.</p>
    </section>;
  }
  if (slug === "2026-price-list") {
    return <PriceList />;
  }
  if (slug === "diwali-facts") {
    const article = selected("diwali_facts_article") || {};
    return <section className="rounded-2xl border border-amber-100 bg-white p-5 sm:p-7"><ContentValue value={{ introduction: article.introduction, facts: article.facts }} /></section>;
  }
  return <div className="space-y-5">{sections.map((section) => {
    if (/whatsapp_ordering|payment_dispatch|order_now/i.test(section.key)) return null;
    return <section key={section.key} className="rounded-2xl border border-amber-100 bg-white p-5 sm:p-7"><h2 className="text-xl font-bold">{section.name}</h2><ContentValue value={section.content} /></section>;
  })}</div>;
}

async function PriceList() {
  const products = await getProducts(500);
  const byCategory = new Map<string, typeof products>();
  for (const product of products) byCategory.set(product.category_name, [...(byCategory.get(product.category_name) || []), product]);
  return <section className="space-y-5">
    <p className="max-w-4xl text-sm leading-7 text-stone-700">Browse the currently published catalogue and current database prices. For product information and lawful offline enquiries, contact +91 8124100501. This page does not accept online fireworks orders.</p>
    <div className="rounded-2xl border border-amber-100 bg-white p-4"><strong>{products.length} active products</strong><span className="ml-2 text-sm text-stone-500">across {byCategory.size} categories</span><Link href={`${CART_URL}/products`} className="ml-0 mt-3 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 py-2 font-bold text-white sm:ml-5 sm:mt-0">Browse catalogue ↗</Link></div>
    {[...byCategory.entries()].map(([category, items]) => <div key={category} className="overflow-hidden rounded-2xl border border-amber-100 bg-white"><h2 className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-lg font-bold">{category}</h2><div className="divide-y divide-stone-100">{items.map((product) => <div key={product.product_id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3"><div><h3 className="font-semibold">{product.product_name}</h3><p className="mt-1 text-xs text-stone-500">{product.pack_type_name || "Pack"} · Product no. {product.product_code}</p></div><span className="font-bold tabular-nums">{inr(product.selling_price)}</span></div>)}</div></div>)}
  </section>;
}

export default async function SeoContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page || page.is_homepage || page.slug === "home") notFound();
  const title = page.seo?.meta_title || page.page_title || page.page_name;
  const description = page.seo?.meta_description || page.page_description;
  const data = page.seo?.structured_data || { "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: `${SITE}/${slug}` };
  return <div className="mx-auto min-h-[60vh] w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-stone-500"><Link href="/" className="underline">Home</Link><span className="mx-2">/</span><span>{page.page_name}</span></nav>
    <header className="mb-7 rounded-2xl bg-gradient-to-br from-red-950 to-red-800 p-6 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-300">RedThunder Crackers · Makka &amp; Wheat Brand</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{page.page_name}</h1><p className="mt-3 max-w-3xl leading-7 text-white/85">{description}</p><p className="mt-4 text-sm text-white/75">Rajukanna Fireworks · Sivakasi, Tamil Nadu · Established 1995</p></header>
    {contentFor(slug, page)}
    <section className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-5 sm:p-7"><h2 className="text-lg font-bold">Need product information?</h2><p className="mt-2 text-sm leading-6 text-stone-700">Contact the business directly for catalogue questions and to clarify any lawful offline arrangements.</p><div className="mt-4 flex flex-wrap gap-3"><a className="inline-flex min-h-11 items-center rounded-xl bg-red-700 px-4 py-2 font-bold text-white" href="tel:+918124100501">Call +91 8124100501</a><a className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-white px-4 py-2 font-bold text-red-800" href="mailto:sales@rtcrackers.com">Email sales</a><Link className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-white px-4 py-2 font-bold text-red-800" href={`${CART_URL}/products`}>Open catalogue ↗</Link></div></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  </div>;
}
