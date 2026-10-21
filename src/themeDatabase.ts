import { dbSelect } from './lib/supabase';

export type ThemePage = {
  website_key: string;
  page_key: string;
  page_name: string;
  is_active: boolean;
  mode?: 'light' | 'dark' | 'system';
  background_color: string; surface_color: string; surface_elevated_color: string; section_color: string;
  header_color: string; footer_color: string; text_color: string; muted_text_color: string; heading_color: string;
  primary_color: string; primary_dark_color: string; secondary_color: string; accent_color: string; link_color: string;
  button_background_color: string; button_text_color: string; border_color: string; border_strong_color: string;
  input_background_color: string; input_border_color: string; card_shadow_color: string; hero_background_color: string;
  banner_background_color: string; nav_background_color: string; nav_text_color: string;
  font_heading: string; font_body: string; radius_small: string; radius_medium: string; radius_large: string;
  component_tokens?: unknown; custom_css?: unknown;
  [key: string]: unknown;
};

const FALLBACK: ThemePage = {
  website_key: 'cart', page_key: 'home', page_name: 'Customer Home', is_active: true, mode: 'light',
  background_color: '#f8f9fb', surface_color: '#ffffff', surface_elevated_color: '#ffffff', section_color: '#fff4f4',
  header_color: '#ffffff', footer_color: '#101828', text_color: '#101828', muted_text_color: '#667085', heading_color: '#101828',
  primary_color: '#E30613', primary_dark_color: '#BA0711', secondary_color: '#FFB000', accent_color: '#FFB000', link_color: '#BA0711',
  button_background_color: '#E30613', button_text_color: '#ffffff', border_color: '#eaecf0', border_strong_color: '#d0d5dd',
  input_background_color: '#ffffff', input_border_color: '#d0d5dd', card_shadow_color: 'rgba(16,24,40,.08)',
  hero_background_color: '#3b0610', banner_background_color: '#fff4f4', nav_background_color: '#ffffff', nav_text_color: '#101828',
  font_heading: 'Outfit, ui-sans-serif, system-ui, sans-serif', font_body: 'Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif',
  radius_small: '10px', radius_medium: '16px', radius_large: '24px',
};

const safeText = (value: unknown, fallback = '') => typeof value === 'string' && value.length < 500 && !/[<>]/.test(value) ? value : fallback;

function themeFromDatabase(row: any, page: string): ThemePage {
  const colors = row?.colors && typeof row.colors === 'object' ? row.colors : {};
  const light = colors.light && typeof colors.light === 'object' ? colors.light : {};
  const dark = colors.dark && typeof colors.dark === 'object' ? colors.dark : {};
  const typography = row?.typography && typeof row.typography === 'object' ? row.typography : {};
  const value = (source: Record<string, any>, key: string, fallback: string) => safeText(source[key], fallback);
  return {
    ...FALLBACK,
    website_key: 'cart', page_key: page, page_name: safeText(row?.theme_name, 'RT Crackers Canonical Brand Theme'), is_active: true, mode: 'light',
    background_color: value(light, 'background', FALLBACK.background_color),
    surface_color: value(light, 'surface', FALLBACK.surface_color),
    surface_elevated_color: value(light, 'surface', FALLBACK.surface_elevated_color),
    section_color: value(light, 'surface_variant', FALLBACK.section_color),
    header_color: value(light, 'surface', FALLBACK.header_color), footer_color: value(dark, 'background', FALLBACK.footer_color),
    text_color: value(light, 'text', FALLBACK.text_color), muted_text_color: value(light, 'text_muted', FALLBACK.muted_text_color),
    heading_color: value(light, 'text', FALLBACK.heading_color), primary_color: value(light, 'primary', FALLBACK.primary_color),
    primary_dark_color: value(light, 'primary_dark', FALLBACK.primary_dark_color), secondary_color: value(light, 'brand_blue', FALLBACK.secondary_color),
    accent_color: value(light, 'accent', FALLBACK.accent_color), link_color: value(light, 'primary_dark', FALLBACK.link_color),
    button_background_color: value(light, 'primary', FALLBACK.button_background_color), button_text_color: '#ffffff',
    border_color: value(light, 'border', FALLBACK.border_color), border_strong_color: value(light, 'border', FALLBACK.border_strong_color),
    input_background_color: value(light, 'surface', FALLBACK.input_background_color), input_border_color: value(light, 'border', FALLBACK.input_border_color),
    card_shadow_color: 'rgba(16,24,40,.08)', hero_background_color: value(dark, 'background', FALLBACK.hero_background_color),
    banner_background_color: value(light, 'surface_variant', FALLBACK.banner_background_color),
    nav_background_color: value(light, 'surface', FALLBACK.nav_background_color), nav_text_color: value(light, 'text', FALLBACK.nav_text_color),
    font_heading: value(typography, 'font_family_heading', value(typography, 'font_family_primary', FALLBACK.font_heading)),
    font_body: value(typography, 'font_family_body', value(typography, 'font_family_primary', FALLBACK.font_body)),
    component_tokens: null, custom_css: null,
  };
}

export async function loadThemePage(website: string, page: string): Promise<ThemePage> {
  if (website !== 'cart') return { ...FALLBACK, page_key: page };
  try {
    const rows = await dbSelect<any>('web_themes', 'select=theme_key,theme_name,colors,typography,is_active,is_default&is_active=eq.true&is_default=eq.true&limit=1');
    return rows[0] ? themeFromDatabase(rows[0], page) : { ...FALLBACK, page_key: page };
  } catch (error) {
    console.warn('Could not load the shared database theme; using the documented brand fallback.', error);
    return { ...FALLBACK, page_key: page };
  }
}

export async function loadThemePageSWR(website: string, page: string, apply: (theme: ThemePage) => void): Promise<void> {
  apply({ ...FALLBACK, page_key: page });
  const loaded = await loadThemePage(website, page);
  apply(loaded);
}

export function applyThemeVars(theme: ThemePage) {
  const root = document.documentElement;
  const map: Record<string, string> = {
    '--rtc-background': theme.background_color, '--rtc-surface': theme.surface_color, '--rtc-surface-elevated': theme.surface_elevated_color,
    '--rtc-section': theme.section_color, '--rtc-header': theme.header_color, '--rtc-footer': theme.footer_color,
    '--rtc-text': theme.text_color, '--rtc-muted': theme.muted_text_color, '--rtc-heading': theme.heading_color,
    '--rtc-primary': theme.primary_color, '--rtc-primary-dark': theme.primary_dark_color, '--rtc-secondary': theme.secondary_color,
    '--rtc-accent': theme.accent_color, '--rtc-link': theme.link_color, '--rtc-button': theme.button_background_color,
    '--rtc-button-text': theme.button_text_color, '--rtc-border': theme.border_color, '--rtc-border-strong': theme.border_strong_color,
    '--rtc-input': theme.input_background_color, '--rtc-input-border': theme.input_border_color, '--rtc-hero': theme.hero_background_color,
    '--rtc-banner': theme.banner_background_color, '--rtc-nav': theme.nav_background_color, '--rtc-nav-text': theme.nav_text_color,
    '--rtc-radius-sm': theme.radius_small, '--rtc-radius-md': theme.radius_medium, '--rtc-radius-lg': theme.radius_large,
  };
  Object.entries(map).forEach(([key, value]) => { if (value) root.style.setProperty(key, value); });
  root.style.setProperty('--rtc-font-heading', safeText(theme.font_heading, FALLBACK.font_heading));
  root.style.setProperty('--rtc-font-body', safeText(theme.font_body, FALLBACK.font_body));
  root.dataset.rtcWebsite = 'cart';
  root.dataset.rtcPage = theme.page_key || '';
  root.dataset.rtcThemeMode = theme.mode || 'light';
}

type ComponentStyleRow = Record<string, unknown> & { component_key?: string };

/**
 * Applies only component tokens already present in the loaded theme object.
 * The shared production schema uses web_themes; no unsupported per-page theme table is queried.
 */
export function applyComponentStyles(theme: ThemePage) {
  const root = document.documentElement;
  document.getElementById('rtc-component-theme')?.remove();
  document.querySelectorAll('[data-rtc-component-theme]').forEach((node) => node.removeAttribute('data-rtc-component-theme'));

  const cssProps = ['font_family','font_size','font_weight','line_height','letter_spacing','text_color','background_color','border_color','border_width','border_radius','box_shadow','padding','margin','width','max_width','text_align'] as const;
  const propMap: Record<string, string> = {
    font_family: 'font-family', font_size: 'font-size', font_weight: 'font-weight', line_height: 'line-height',
    letter_spacing: 'letter-spacing', text_color: 'color', background_color: 'background-color', border_color: 'border-color',
    border_width: 'border-width', border_radius: 'border-radius', box_shadow: 'box-shadow', padding: 'padding', margin: 'margin',
    width: 'width', max_width: 'max-width', text_align: 'text-align',
  };

  const rows: ComponentStyleRow[] = [];
  const tokens = theme.component_tokens;
  if (tokens && typeof tokens === 'object' && !Array.isArray(tokens)) {
    for (const [component_key, value] of Object.entries(tokens as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) rows.push({ component_key, ...(value as Record<string, unknown>) });
    }
  }

  const custom = theme.custom_css;
  if (custom && typeof custom === 'object' && !Array.isArray(custom)) {
    for (const [component_key, value] of Object.entries(custom as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) rows.push({ component_key, ...(value as Record<string, unknown>) });
    }
  }

  if (!rows.length) return;
  const rules: string[] = [];
  for (const row of rows) {
    const key = String(row.component_key || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!key) continue;
    const declarations = cssProps.flatMap((prop) => {
      const value = safeText(row[prop]);
      return value ? [`${propMap[prop]}:${value}`] : [];
    });
    if (!declarations.length) continue;
    rules.push(`[data-rtc-component="${key}"]{${declarations.join(';')}}`);
    root.setAttribute('data-rtc-component-theme', '1');
  }
  if (rules.length) {
    const style = document.createElement('style');
    style.id = 'rtc-component-theme';
    style.textContent = rules.join('');
    document.head.appendChild(style);
  }
}
