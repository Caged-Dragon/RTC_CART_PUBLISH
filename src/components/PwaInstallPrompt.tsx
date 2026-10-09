import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Info } from 'lucide-react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

export const PwaInstallPrompt: React.FC = () => {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const standalone = media.matches || (navigator as any).standalone === true;
    if (standalone) { setInstalled(true); return; }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIos(isIos);

    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setMessage('Install the store for faster repeat ordering.');
      setVisible(true);
    };
    const installedHandler = () => { setInstalled(true); setInstallEvent(null); setVisible(false); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    // Keep a helpful install prompt visible even when the browser does not expose
    // beforeinstallprompt. The action is deliberately enabled and explains the
    // browser-specific install path rather than presenting a dead/disabled button.
    const timer = window.setTimeout(() => {
      setMessage(isIos ? 'Tap Share → Add to Home Screen.' : 'Use your browser menu to install the app.');
      setVisible(true);
    }, 900);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible || installed) return null;

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
      if (choice.outcome === 'accepted') setVisible(false);
      setInstallEvent(null);
      return;
    }
    setMessage(ios ? 'Tap the browser Share button, then choose “Add to Home Screen”.' : 'Open your browser menu ⋮ and choose “Install RT Crackers” or “Add to Home screen”.');
  };

  return (
    <div className="pwa-install-popup" role="dialog" aria-label="Install RT Crackers app" aria-live="polite">
      <div className="pwa-install-icon"><Smartphone className="w-5 h-5" /></div>
      <div className="min-w-0">
        <strong>Install RT Crackers App</strong>
        <p>{message}</p>
      </div>
      <button className="pwa-install-action" onClick={install} type="button" aria-label={installEvent ? 'Install RT Crackers app' : 'Show installation instructions'}>
        {installEvent ? <><Download className="w-4 h-4" />Install</> : <><Info className="w-4 h-4" />{ios ? 'How to install' : 'Install'}</>}
      </button>
      <button className="pwa-install-close" onClick={() => setVisible(false)} aria-label="Close install message" type="button"><X className="w-4 h-4" /></button>
    </div>
  );
};
