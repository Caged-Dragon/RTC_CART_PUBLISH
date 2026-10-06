import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export const PwaInstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (standalone) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream);
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // On browsers that do not expose beforeinstallprompt (including iOS), still
    // show the small top-center installation guide on every fresh page load.
    const timer = window.setTimeout(() => setVisible(true), 700);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
    setVisible(false);
  };

  return (
    <div className="pwa-install-popup" role="dialog" aria-label="Install RT Crackers app">
      <div className="pwa-install-icon"><Smartphone className="w-5 h-5" /></div>
      <div className="min-w-0">
        <strong>Install RT Crackers App</strong>
        <p>{installEvent ? 'Add the customer cart to your home screen for quick ordering.' : ios ? 'Tap Share → Add to Home Screen to install.' : 'Use your browser menu to add RT Crackers to your home screen.'}</p>
      </div>
      {installEvent && <button className="pwa-install-action" onClick={install} type="button"><Download className="w-4 h-4" />Install</button>}
      <button className="pwa-install-close" onClick={() => setVisible(false)} aria-label="Close install message" type="button"><X className="w-4 h-4" /></button>
    </div>
  );
};
