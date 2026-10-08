import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Gift, Package, ShoppingBag, Sparkles } from 'lucide-react';
import type { ScreenId } from './Navbar';
import { useComboPacks, type ComboPack } from '../context/ComboPacksContext';
import { useCart } from '../context/CartContext';
import { getExactProductImage } from '../utils/productImages';

interface ComboPacksSectionProps {
  onNavigate?: (screen: ScreenId) => void;
  standalone?: boolean;
}

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

function comboCartSets(combo: ComboPack, getItemQuantity: (id: number) => number) {
  if (!combo.items.length) return 0;
  return Math.min(...combo.items.map((item) => Math.floor(getItemQuantity(item.product.id) / item.quantity)));
}

export const ComboPacksSection: React.FC<ComboPacksSectionProps> = ({ onNavigate, standalone = false }) => {
  const { combos, isLoading } = useComboPacks();
  const { addToCart, getItemQuantity } = useCart();
  const [selectedCombo, setSelectedCombo] = useState<ComboPack | null>(null);

  const addCombo = (combo: ComboPack) => {
    combo.items.forEach((item) => addToCart(item.product, item.quantity));
  };

  return (
    <section
      className={`rt-combo-packs ${standalone ? 'rt-combo-packs-page' : ''}`}
      aria-labelledby={standalone ? 'combo-page-heading' : 'combo-packs-heading'}
      data-rtc-component="combo_packs"
    >
      <div className="rt-container">
        <div className="rt-combo-packs-head">
          <div>
            <span className="rt-kicker"><Sparkles size={14} /> Database-managed combo catalogue</span>
            <h2 id={standalone ? 'combo-page-heading' : 'combo-packs-heading'}>
              {standalone ? 'Combo Packs' : 'Popular Combo Boxes'}
            </h2>
            <p>
              Each pack is managed in Supabase with its own product list, quantities and presentation details. Prices are calculated from the current live product rates.
            </p>
          </div>
          <div className="rt-combo-pack-count" aria-live="polite"><Gift size={18} /> {combos.length} live combos</div>
        </div>

        {isLoading && combos.length === 0 ? (
          <div className="rt-combo-grid" aria-busy="true" aria-label="Loading combo packs">
            {Array.from({ length: 8 }).map((_, index) => <div className="rt-combo-pack-card rt-combo-skeleton" key={index} />)}
          </div>
        ) : combos.length ? (
          <div className="rt-combo-grid">
            {combos.map((combo) => {
              const setsInCart = comboCartSets(combo, getItemQuantity);
              const previewItems = combo.items.slice(0, 4);
              const heroProduct = previewItems[0]?.product;
              const image = combo.imageUrl || (heroProduct ? getExactProductImage(heroProduct) : undefined);
              const itemWord = combo.totalUnits === 1 ? 'unit' : 'units';
              const availabilityNote = combo.isAvailable ? 'Ready to add' : `${combo.unavailableItems.length} item${combo.unavailableItems.length === 1 ? '' : 's'} unavailable`;

              return (
                <article className="rt-combo-pack-card" key={combo.id}>
                  <button
                    className="rt-combo-pack-media"
                    onClick={() => setSelectedCombo(combo)}
                    aria-label={`View ${combo.name}`}
                  >
                    {image ? <img src={image} alt={combo.name} loading="lazy" decoding="async" /> : <div className="rt-combo-image-placeholder"><Package /></div>}
                    <span className="rt-combo-pack-budget">{combo.budgetTier || 'FAMILY'}</span>
                    {combo.badgeText && <span className="rt-combo-pack-items">{combo.badgeText}</span>}
                  </button>

                  <div className="rt-combo-pack-body">
                    <div className="rt-combo-pack-meta">
                      <span>{combo.comboCode} · {combo.distinctProducts} products · {combo.totalUnits} {itemWord}</span>
                      <strong>{money(combo.calculatedPrice)}</strong>
                    </div>
                    <h3>{combo.name}</h3>
                    {combo.tagline && <div className="rt-combo-tagline">{combo.tagline}</div>}
                    <p>{combo.description || 'A curated celebration pack made from live catalogue products.'}</p>

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
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rt-empty-state">
            <Gift size={30} />
            <h3>No combos are currently published.</h3>
            <p>Create or activate combo records in the Supabase <code>combo_packs</code> table and add their product lines in <code>combo_pack_items</code>.</p>
            {onNavigate && <button onClick={() => onNavigate('products')}>Browse all products</button>}
          </div>
        )}


        {selectedCombo && (
          <div className="rt-combo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedCombo(null); }}>
            <div className="rt-combo-modal" role="dialog" aria-modal="true" aria-labelledby="combo-modal-title">
              <div className="rt-combo-modal-head">
                <div><span className="rt-kicker">{selectedCombo.comboCode} · {selectedCombo.badgeText || 'Curated Combo'}</span><h3 id="combo-modal-title">{selectedCombo.name}</h3><p>{selectedCombo.description}</p></div>
                <button className="rt-combo-modal-close" onClick={() => setSelectedCombo(null)} aria-label="Close combo details">×</button>
              </div>
              <div className="rt-combo-modal-summary"><strong>{money(selectedCombo.calculatedPrice)}</strong><span>{selectedCombo.distinctProducts} products · {selectedCombo.totalUnits} total units</span><span>Live catalogue pricing</span></div>
              <div className="rt-combo-detail-list">
                {selectedCombo.items.map((item) => <div className={`rt-combo-detail-row ${item.product.stockStatus === 'OUT_OF_STOCK' ? 'is-unavailable' : ''}`} key={item.itemId}><img src={getExactProductImage(item.product)} alt="" /><div><strong>{item.quantity}× {item.product.name}</strong><span>{item.itemLabel || item.product.category} · {item.product.unit}</span>{item.itemNote && <small>{item.itemNote}</small>}</div><b>{money(item.product.rate * item.quantity)}</b></div>)}
              </div>
              <div className="rt-combo-modal-actions"><button className="rt-btn rt-btn-outline" onClick={() => setSelectedCombo(null)}>Continue browsing</button><button className="rt-btn rt-btn-primary" disabled={!selectedCombo.isAvailable} onClick={() => { addCombo(selectedCombo); setSelectedCombo(null); }}>{selectedCombo.isAvailable ? 'Add this combo to cart' : 'Combo temporarily unavailable'} <ShoppingBag size={16} /></button></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
