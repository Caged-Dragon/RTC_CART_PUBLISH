import React, { useEffect, useState } from 'react';
import { X, Smartphone, Info } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const standalone = media.matches || (navigator as any).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIos(isIosDevice);
    let nativePromptAvailable = false;
    let timer: number | undefined;

    // Let Chrome/browser show its native install UI. Deliberately do not call
    // cancel the native event and do not hold it for a later prompt; this avoids
    // suppressing the browser banner and triggering the related console message.
    const handler = () => {
      nativePromptAvailable = true;
      if (timer !== undefined) window.clearTimeout(timer);
      setVisible(false);
    };
    const installedHandler = () => { setInstalled(true); setVisible(false); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    // Browsers that do not expose beforeinstallprompt get manual install steps.
    timer = window.setTimeout(() => {
      if (nativePromptAvailable) return;
      setMessage(isIosDevice ? 'Tap Share → Add to Home Screen.' : 'Use your browser menu to install the app.');
      setVisible(true);
    }, 900);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  if (!visible || installed) return null;

  const showInstructions = () => {
    setMessage(ios
      ? 'Tap the browser Share button, then choose “Add to Home Screen”.'
      : 'Open your browser menu ⋮ and choose “Install RT Crackers” or “Add to Home screen”.');
  };

  return (
    <div className="pwa-install-popup" role="dialog" aria-label="Install RT Crackers app" aria-live="polite">
      <div className="pwa-install-icon"><Smartphone className="w-5 h-5" /></div>
      <div className="min-w-0">
        <strong>Install RT Crackers App</strong>
        <p>{message}</p>
      </div>
      <button className="pwa-install-action" onClick={showInstructions} type="button" aria-label="Show installation instructions">
        <Info className="w-4 h-4" />How to install
      </button>
      <button className="pwa-install-close" onClick={() => setVisible(false)} aria-label="Close install message" type="button"><X className="w-4 h-4" /></button>
    </div>
  );
};
