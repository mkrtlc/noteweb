import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './marketing.css';
import { trackFeature } from './services/analyticsService';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline support (production only, so dev reloads stay predictable).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Service worker registration failed', err));
  });
}
window.addEventListener('appinstalled', () => trackFeature('app_installed'));
