import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import cagedDragonLogo from '../assets/cageddragon_logo.webp';

const DISMISS_KEY = 'rt_caged_dragon_ad_dismissed_v1';

interface CagedDragonAdProps {
  visible?: boolean;
}

/**
 * Compact, frontend-owned studio credit. It intentionally disappears on the
 * Cart screen (controlled by App.tsx) so checkout remains unobstructed.
 */
export const CagedDragonAd: React.FC<CagedDragonAdProps> = ({ visible = true }) => {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!open) return;
    try { sessionStorage.removeItem(DISMISS_KEY); } catch { /* storage may be unavailable */ }
  }, [open]);

  if (!visible || !open) return null;

  const dismiss = () => {
    setOpen(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* storage may be unavailable */ }
  };

  return (
    <aside className="caged-dragon-ad" aria-label="Website crafted by Caged Dragon">
      <img
        src={cagedDragonLogo}
        alt="Caged Dragon — Unleash Possibilities"
        className="caged-dragon-logo"
        loading="eager"
        decoding="async"
      />
      <div className="caged-dragon-copy">
        <span>Website crafted by</span>
        <strong>Caged Dragon</strong>
      </div>
      <button
        type="button"
        className="caged-dragon-close"
        onClick={dismiss}
        aria-label="Close Caged Dragon credit"
      >
        <X className="w-3 h-3" />
      </button>
    </aside>
  );
};
