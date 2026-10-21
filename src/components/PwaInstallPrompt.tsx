import React, { useEffect, useState } from 'react';
import { X, Smartphone, Info, Download } from 'lucide-react';

type InstallChoice = { outcome: 'accepted' | 'dismissed'; platform?: string };
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<InstallChoice> };

export const PwaInstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('Install the RT Crackers catalogue for quicker access.');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [prompting, setPrompting] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    if (media.matches || (navigator as any).standalone === true) { setInstalled(true); return; }

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIos(isIos);
    const nativePromptHandler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMessage('Add the catalogue app to your device for quick access to product information and your local shortlist.');
      setVisible(true);
    };
    const installedHandler = () => { setInstalled(true); setVisible(false); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', nativePromptHandler);
    window.addEventListener('appinstalled', installedHandler);

    const timer = window.setTimeout(() => {
      setMessage(isIos
        ? 'Tap Share, then choose “Add to Home Screen”.'
        : 'Open your browser menu and choose “Install RT Crackers” or “Add to Home screen”.');
      setVisible(true);
    }, 1800);

    return () => {
      window.removeEventListener('beforeinstallprompt', nativePromptHandler);
      window.removeEventListener('appinstalled', installedHandler);
      window.clearTimeout(timer);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt || prompting) return;
    setPrompting(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setMessage('Installing RT Crackers…');
      setDeferredPrompt(null);
      if (choice.outcome === 'dismissed') setVisible(false);
    } catch (error) {
      console.error('Native app installation prompt failed', error);
      setMessage('Open your browser menu and choose “Install RT Crackers”.');
      setDeferredPrompt(null);
    } finally { setPrompting(false); }
  };

  if (!visible || installed) return null;

  return (
    <aside className="pwa-install-popup" role="region" aria-label="Install RT Crackers app">
      <div className="pwa-install-icon"><Smartphone className="w-5 h-5" /></div>
      <div className="pwa-install-copy">
        <strong>Install RT Crackers App</strong>
        <p>{message}</p>
      </div>
      {deferredPrompt ? (
        <button className="pwa-install-action" type="button" onClick={install} disabled={prompting}><Download className="w-4 h-4" />{prompting ? 'Opening…' : 'Install app'}</button>
      ) : (
        <span className="pwa-install-action" aria-label="Installation instructions"><Info className="w-4 h-4" />{ios ? 'How to install' : 'Install'}</span>
      )}
      <button className="pwa-install-close" onClick={() => setVisible(false)} aria-label="Dismiss installation panel" type="button"><X className="w-4 h-4" /></button>
    </aside>
  );
};
