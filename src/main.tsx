import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Remove the obsolete worker that caused invalid offline Response errors on older deployments.
    navigator.serviceWorker.getRegistrations()
      .then(async registrations => {
        await Promise.all(registrations.filter(registration => {
          const workers = [registration.active, registration.waiting, registration.installing].filter(Boolean);
          return workers.some(worker => {
            try { return new URL(worker!.scriptURL).pathname.endsWith('/2sw.js'); }
            catch { return false; }
          });
        }).map(registration => registration.unregister()));
        await navigator.serviceWorker.register('/sw.js');
      })
      .catch(() => {});
  });
}
