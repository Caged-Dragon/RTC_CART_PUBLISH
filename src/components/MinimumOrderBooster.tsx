import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';

/** Suggests a few items that would close the gap to the minimum order value. */
export const MinimumOrderBooster: React.FC<{ shortfall: number }> = ({ shortfall }) => {
  const { products } = useProducts();
  const { cart, addToCart } = useCart();

  const picks = useMemo(() => {
    if (shortfall <= 0) return [];
    const inCart = new Set(cart.map(i => i.product.id));
    const pool = products.filter(p => !inCart.has(p.id) && p.stockStatus !== 'OUT_OF_STOCK' && p.rate > 0);
    // 1) a single item that closes the gap at the smallest overshoot, 2) popular/featured small add-ons.
    const closers = pool.filter(p => p.rate >= shortfall).sort((a, b) => a.rate - b.rate).slice(0, 1);
    const smalls = pool
      .filter(p => p.rate < shortfall && p.rate >= Math.min(shortfall / 6, 150))
      .sort((a, b) => Number(!!b.popular) - Number(!!a.popular) || Number(!!b.featured) - Number(!!a.featured) || b.rate - a.rate)
      .slice(0, 3);
    return [...closers, ...smalls];
  }, [products, cart, shortfall]);

  if (!picks.length) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold text-amber-300 light:text-amber-900">Quick adds to reach the minimum:</div>
      <div className="flex flex-wrap gap-1.5">
        {picks.map(p => (
          <button key={p.id} type="button" onClick={() => addToCart(p, 1)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900 light:bg-white border border-amber-500/40 hover:border-amber-400 text-[11px] text-stone-200 light:text-stone-800 cursor-pointer">
            <Plus className="w-3 h-3 text-amber-400" />
            <span className="max-w-[10rem] truncate">{p.name}</span>
            <span className="font-bold tabular-nums">₹{p.rate.toLocaleString('en-IN')}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
