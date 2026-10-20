import React, { useEffect, useState } from 'react';
import { X, Smartphone, Info } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('');
  const [nativePromptAvailable, setNativePromptAvailable] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const standalone = media.matches || (navigator as any).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIos(isIos);

    // Do not cancel beforeinstallprompt. If it is not prevented, the browser can show its
    // native install UI and there is no deferred event to accidentally leave unprompted.
    const nativePromptHandler = () => {
      setNativePromptAvailable(true);
      setVisible(false);
    };
    const installedHandler = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener('beforeinstallprompt', nativePromptHandler);
    window.addEventListener('appinstalled', installedHandler);

    // Only show manual instructions on platforms where the native install prompt is absent.
    const timer = window.setTimeout(() => {
      if (isIos) {
        setMessage('Tap Share, then choose “Add to Home Screen”.');
        setVisible(true);
      } else if (!nativePromptAvailable) {
        setMessage('Open your browser menu and choose “Install RT Crackers” or “Add to Home screen”.');
        setVisible(true);
      }
    }, 1600);

    return () => {
      window.removeEventListener('beforeinstallprompt', nativePromptHandler);
      window.removeEventListener('appinstalled', installedHandler);
      window.clearTimeout(timer);
    };
  }, [nativePromptAvailable]);

  if (!visible || installed || nativePromptAvailable) return null;

  return (
    <div className="pwa-install-popup" role="status" aria-label="Install RT Crackers app" aria-live="polite">
      <div className="pwa-install-icon"><Smartphone className="w-5 h-5" /></div>
      <div className="min-w-0">
        <strong>Install RT Crackers App</strong>
        <p>{message}</p>
      </div>
      <span className="pwa-install-action" aria-hidden="true"><Info className="w-4 h-4" />{ios ? 'How to install' : 'Install'}</span>
      <button className="pwa-install-close" onClick={() => setVisible(false)} aria-label="Dismiss installation instructions" type="button"><X className="w-4 h-4" /></button>
    </div>
  );
};
