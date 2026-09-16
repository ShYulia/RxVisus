import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline caching is a web/PWA concern only. The Capacitor native app already ships its assets
// inside the APK — registering a service worker inside its WebView would add nothing and risks
// masking a fresh app update behind stale cached content instead. Dynamic import also keeps the
// registration/workbox glue out of the native bundle's eagerly-evaluated code entirely.
if (!Capacitor.isNativePlatform()) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}