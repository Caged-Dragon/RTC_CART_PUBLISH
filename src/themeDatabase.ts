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

export async function loadThemePage(website: string, page: string): Promise<ThemePage> {
  if (website !== 'cart') return FALLBACK;
  try {
    const rows = await dbSelect<ThemePage>(
      'theme_page_settings',
      `select=*&website_key=eq.cart&page_key=eq.${encodeURIComponent(page)}&is_active=eq.true&limit=1`,
    );
    const row = rows[0];
    return row ? { ...FALLBACK, ...row, website_key: 'cart', page_key: page } : { ...FALLBACK, page_key: page };
  } catch {
    return { ...FALLBACK, page_key: page };
  }
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
 * Reads component-level style tokens from fields already available on theme_page_settings.
 * This intentionally does NOT query or create a second table, so the shared Supabase schema
 * remains untouched and each site's styles stay isolated by website_key = 'cart'.
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
