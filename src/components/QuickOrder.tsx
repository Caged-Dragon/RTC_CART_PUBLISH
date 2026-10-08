import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

/** Parses "25x4, 97, #12 x 2" → [{sNo:25, qty:4}, {sNo:97, qty:1}, {sNo:12, qty:2}] */
export function parseQuickOrder(text: string): { sNo: number; qty: number; raw: string }[] {
  return text
    .split(/[\n,;]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(raw => {
      const m = raw.match(/^#?\s*(\d{1,4})(?:\s*[x×*:=]\s*(\d{1,3}))?$/i);
      return m ? { sNo: Number(m[1]), qty: Math.min(500, Math.max(1, Number(m[2] || 1))), raw } : { sNo: NaN, qty: 0, raw };
    });
}

export const QuickOrder: React.FC = () => {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);

  const submit = () => {
    const lines = parseQuickOrder(text);
    if (!lines.length) return;
    const unknown: string[] = [];
    let added = 0;
    for (const l of lines) {
      const product = Number.isFinite(l.sNo) ? products.find(p => p.sNo === l.sNo) : undefined;
      if (!product || product.stockStatus === 'OUT_OF_STOCK') { unknown.push(l.raw); continue; }
      addToCart(product, l.qty);
      added++;
    }
    if (added) showToast({ type: 'success', title: 'Added to cart', message: `${added} item${added > 1 ? 's' : ''} added from your quick order.` });
    if (unknown.length) showToast({ type: 'warning', title: 'Not found', message: `Could not match: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? '…' : ''}` });
    if (!unknown.length) { setText(''); setOpen(false); } else setText(unknown.join(', '));
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 light:bg-amber-50 p-3">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center gap-2 text-xs font-bold text-amber-400 light:text-amber-800 cursor-pointer">
        <Zap className="w-4 h-4" />
        <span>Quick Order by S.No</span>
        <span className="ml-auto text-[10px] font-medium text-stone-400">{open ? 'Hide' : 'Know your item numbers? Type them in'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <label htmlFor="quick-order" className="block text-[11px] text-stone-400 light:text-stone-600">
            Enter S.No and quantity, separated by commas. Example: <span className="font-mono text-amber-400 light:text-amber-800">25x4, 97x1, 12</span>
          </label>
          <div className="flex gap-2">
            <input id="quick-order" value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }} inputMode="text" placeholder="25x4, 97x1, 12"
              className="flex-1 px-3 py-2 text-xs rounded-lg bg-stone-950 light:bg-white border border-stone-700 light:border-stone-300 text-white light:text-stone-900 placeholder-stone-500 focus:outline-none focus:border-amber-500" />
            <button type="button" onClick={submit} disabled={!text.trim()}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer">Add to cart</button>
          </div>
        </div>
      )}
    </div>
  );
};
