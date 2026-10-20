import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Gift, Package, ShoppingBag, Sparkles, X } from 'lucide-react';
import type { ScreenId } from './Navbar';
import { useComboPacks, type ComboPack } from '../context/ComboPacksContext';
import { useCart } from '../context/CartContext';
import { getExactProductImage } from '../utils/productImages';
import { ProductImage } from './ProductImage';

interface ComboPacksSectionProps {
  onNavigate?: (screen: ScreenId) => void;
  standalone?: boolean;
}

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

const getReferenceComboImage = (comboName: string, budgetTier?: string | null) => {
  const words = `${comboName} ${budgetTier || ''}`.toLocaleLowerCase();
  if (words.includes('mega')) return '/images/storefront/combo-mega.jpg';
  if (words.includes('grand')) return '/images/storefront/combo-grand.jpg';
  if (words.includes('premium')) return '/images/storefront/combo-premium.jpg';
  if (words.includes('family') || words.includes('starter')) return '/images/storefront/combo-family.jpg';
  return '';
};

function comboCartSets(combo: ComboPack, getItemQuantity: (id: number) => number) {
  if (!combo.items.length) return 0;
  return Math.min(...combo.items.map((item) => Math.floor(getItemQuantity(item.product.id) / item.quantity)));
}

export const ComboPacksSection: React.FC<ComboPacksSectionProps> = ({ onNavigate, standalone = false }) => {
  const { combos, featuredCombos, isLoading } = useComboPacks();
  const { addToCart, getItemQuantity } = useCart();
  const [selectedCombo, setSelectedCombo] = useState<ComboPack | null>(null);
  const [budgetTier, setBudgetTier] = useState(() => (new URLSearchParams(window.location.search).get('budget_tier') || '').toUpperCase());
  const visibleCombos = useMemo(() => {
    const catalogue = standalone ? combos : (featuredCombos.length ? featuredCombos : combos);
    const source = standalone && budgetTier ? catalogue.filter((combo) => combo.budgetTier === budgetTier) : catalogue;
    return standalone ? source : source.slice(0, 4);
  }, [budgetTier, combos, featuredCombos, standalone]);

  React.useEffect(() => {
    const applyTier = (event: Event) => setBudgetTier(String((event as CustomEvent<string>).detail || '').toUpperCase());
    const syncFromUrl = () => setBudgetTier((new URLSearchParams(window.location.search).get('budget_tier') || '').toUpperCase());
    window.addEventListener('rt-combo-budget-tier', applyTier);
    window.addEventListener('popstate', syncFromUrl);
    return () => { window.removeEventListener('rt-combo-budget-tier', applyTier); window.removeEventListener('popstate', syncFromUrl); };
  }, []);

  const clearBudgetTier = () => {
    setBudgetTier('');
    const url = new URL(window.location.href);
    url.searchParams.delete('budget_tier');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const addCombo = (combo: ComboPack) => {
    combo.items.forEach((item) => addToCart(item.product, item.quantity));
  };

  return (
    <section
      className={`rt-combo-packs ${standalone ? 'rt-combo-packs-page' : 'rt-combo-home'} `}
      aria-labelledby={standalone ? 'combo-page-heading' : 'combo-packs-heading'}
      data-rtc-component="combo_packs"
    >
      <div className="rt-container">
        <div className="rt-combo-packs-head">
          <div>
            <span className="rt-kicker"><Sparkles size={14} /> {standalone ? 'Database-managed combo catalogue' : 'Curated for a bigger celebration'}</span>
            <h2 id={standalone ? 'combo-page-heading' : 'combo-packs-heading'}>
              {standalone ? 'RedThunder Combos' : 'RedThunder Combos'}
            </h2>
            <p>
              {standalone
                ? 'Published combo packs, included products and pricing are loaded from the existing live catalogue.'
                : 'Explore ready-made collections using live catalogue items and database-managed pricing.'}
            </p>
          </div>
          {standalone ? (
            <div className="rt-combo-pack-count" aria-live="polite"><Gift size={18} /> {visibleCombos.length} {budgetTier ? `${budgetTier.toLowerCase()} ` : ''}combo{visibleCombos.length === 1 ? '' : 's'}</div>
          ) : (
            <button className="rt-section-link" onClick={() => onNavigate?.('combos')}>View All Combos <ArrowRight aria-hidden="true" /></button>
          )}
        </div>

        {standalone && budgetTier && (
          <div className="rt-combo-filter-note">
            <span>Filtered by budget tier: <strong>{budgetTier}</strong></span>
            <button onClick={clearBudgetTier}><X size={14} aria-hidden="true" /> Clear filter</button>
          </div>
        )}

        {isLoading && combos.length === 0 ? (
          <div className="rt-combo-grid" aria-busy="true" aria-label="Loading combo packs">
            {Array.from({ length: standalone ? 8 : 4 }).map((_, index) => <div className="rt-combo-pack-card rt-combo-skeleton" key={index} />)}
          </div>
        ) : visibleCombos.length ? (
          <div className="rt-combo-grid">
            {visibleCombos.map((combo) => {
              const setsInCart = comboCartSets(combo, getItemQuantity);
              const previewItems = combo.items.slice(0, 4);
              const heroProduct = previewItems[0]?.product;
              const image = combo.imageUrl?.trim() || heroProduct?.imageUrl?.trim() || getReferenceComboImage(combo.name, combo.budgetTier) || (heroProduct ? getExactProductImage({ ...heroProduct, imageUrl: undefined }) : undefined);
              const itemWord = combo.totalUnits === 1 ? 'unit' : 'units';
              const availabilityNote = combo.isAvailable ? 'Ready to add' : `${combo.unavailableItems.length} item${combo.unavailableItems.length === 1 ? '' : 's'} unavailable`;

              return (
                <article className={`rt-combo-pack-card ${standalone ? '' : 'rt-combo-home-card'}`} key={combo.id}>
                  <button
                    className="rt-combo-pack-media"
                    onClick={() => setSelectedCombo(combo)}
                    aria-label={`View ${combo.name}`}
                  >
                    {image ? <img src={image} alt={combo.name} loading="lazy" decoding="async" onError={(event) => { const fallback = heroProduct ? getExactProductImage({ ...heroProduct, imageUrl: undefined }) : getReferenceComboImage(combo.name, combo.budgetTier); if (fallback && !event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback; else event.currentTarget.hidden = true; }} /> : <div className="rt-combo-image-placeholder"><Package /></div>}
                    {combo.budgetTier && <span className="rt-combo-pack-budget">{combo.budgetTier}</span>}
                    {combo.badgeText && <span className="rt-combo-pack-items">{combo.badgeText}</span>}
                  </button>

                  <div className="rt-combo-pack-body">
                    <div className="rt-combo-pack-meta">
                      <span>{standalone ? `${combo.distinctProducts} products · ${combo.totalUnits} ${itemWord}` : `${combo.distinctProducts} products included`}</span>
                      <strong>{money(combo.calculatedPrice)}</strong>
                    </div>
                    <h3>{combo.name}</h3>
                    {combo.tagline && <div className="rt-combo-tagline">{combo.tagline}</div>}
                    <p>{combo.description || (standalone ? 'A curated celebration pack made from live catalogue products.' : 'A curated collection from the live product catalogue.')}</p>

                    {standalone && (
                      <>
                        <div className="rt-combo-pack-list" aria-label={`${combo.name} included products`}>
                          {previewItems.map((item) => (
                            <span key={item.itemId}>
                              <CheckCircle2 size={13} />
                              <strong>{item.quantity}×</strong> {item.itemLabel || item.product.name}
                            </span>
                          ))}
                          {combo.items.length > previewItems.length && <small>+ {combo.items.length - previewItems.length} more products in this combo</small>}
                        </div>

                        <div className="rt-combo-pack-action">
                          <button
                            className="rt-btn rt-btn-primary rt-combo-add"
                            onClick={() => addCombo(combo)}
                            disabled={!combo.isAvailable}
                            title={!combo.isAvailable ? 'This combo is temporarily unavailable because one or more included products are out of stock.' : undefined}
                          >
                            <ShoppingBag size={16} /> {setsInCart ? `${setsInCart} in cart · Add one` : 'Add Combo'}
                          </button>
                          <button className="rt-combo-view" onClick={() => setSelectedCombo(combo)}>View details <ArrowRight size={14} /></button>
                        </div>
                        <span className={`rt-combo-cart-note ${combo.isAvailable ? 'is-available' : 'is-unavailable'}`} role="status">{availabilityNote}{setsInCart > 0 ? ' · Complete set represented in cart' : ''}</span>
                      </>
                    )}

                    {!standalone && (
                      <button className="rt-combo-home-view" onClick={() => setSelectedCombo(combo)}>View Combo <ArrowRight size={14} aria-hidden="true" /></button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rt-empty-state rt-combo-empty-state">
            <Gift size={30} />
            <h3>{budgetTier ? 'No combos are published in this tier yet.' : 'No combos are currently published.'}</h3>
            <p>{budgetTier ? 'Choose another budget collection or view every published combo.' : 'Published combo packs will appear here when available in the existing catalogue.'}</p>
            {standalone && budgetTier ? (
              <button onClick={clearBudgetTier}>View all combos</button>
            ) : onNavigate && (
              <button onClick={() => onNavigate('products')}>Browse all products</button>
            )}
          </div>
        )}


        {selectedCombo && (
          <div className="rt-combo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedCombo(null); }}>
            <div className="rt-combo-modal" role="dialog" aria-modal="true" aria-labelledby="combo-modal-title">
              <div className="rt-combo-modal-head">
                <div><span className="rt-kicker">{selectedCombo.comboCode} · {selectedCombo.badgeText || 'Curated Combo'}</span><h3 id="combo-modal-title">{selectedCombo.name}</h3><p>{selectedCombo.description}</p></div>
                <button className="rt-combo-modal-close" onClick={() => setSelectedCombo(null)} aria-label="Close combo details">×</button>
              </div>
              <div className="rt-combo-modal-summary"><strong>{money(selectedCombo.calculatedPrice)}</strong><span>{selectedCombo.distinctProducts} products · {selectedCombo.totalUnits} total units</span><span>{selectedCombo.pricingMode === 'MANUAL' ? 'Database-managed manual price' : 'Calculated from live product rates'}</span></div>
              <div className="rt-combo-detail-list">
                {selectedCombo.items.map((item) => <div className={`rt-combo-detail-row ${item.product.stockStatus === 'OUT_OF_STOCK' ? 'is-unavailable' : ''}`} key={item.itemId}><ProductImage product={item.product} alt="" /><div><strong>{item.quantity}× {item.product.name}</strong><span>{item.itemLabel || item.product.category} · {item.product.unit}</span>{item.itemNote && <small>{item.itemNote}</small>}</div><b>{money(item.product.rate * item.quantity)}</b></div>)}
              </div>
              <div className="rt-combo-modal-actions"><button className="rt-btn rt-btn-outline" onClick={() => setSelectedCombo(null)}>Continue browsing</button><button className="rt-btn rt-btn-primary" disabled={!selectedCombo.isAvailable} onClick={() => { addCombo(selectedCombo); setSelectedCombo(null); }}>{selectedCombo.isAvailable ? 'Add this combo to cart' : 'Combo temporarily unavailable'} <ShoppingBag size={16} /></button></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
