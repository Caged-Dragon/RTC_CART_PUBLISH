import React, { useState } from 'react';
import { Code2, X } from 'lucide-react';

export const CagedDragonAd: React.FC = () => {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <aside className="caged-dragon-ad" aria-label="Website development credit">
      <button type="button" className="caged-dragon-close" onClick={() => setOpen(false)} aria-label="Close Caged Dragon advertisement"><X className="w-3.5 h-3.5" /></button>
      <div className="caged-dragon-mark"><Code2 className="w-4 h-4" /></div>
      <div>
        <span className="caged-dragon-kicker">Website crafted by</span>
        <strong>Caged Dragon</strong>
        <small>Web development &amp; digital solutions</small>
      </div>
    </aside>
  );
};
