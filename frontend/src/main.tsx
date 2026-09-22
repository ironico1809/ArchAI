import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { sincronizarColaOffline } from './services/api'
import './index.css'

// CU-09 · Modelado Móvil Offline (PWA):
// registra el Service Worker y reenvía operaciones encoladas cuando hay conexión.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Fuerza la comprobación de actualización del service worker en cada carga
      registration.update().catch(() => {});
    }).catch(() => {
      console.warn('No se pudo registrar el Service Worker (modo offline no disponible).');
    });
  });
}

window.addEventListener('online', () => {
  sincronizarColaOffline().then((n) => {
    if (n > 0) console.info(`ArchAI: ${n} operaciones offline sincronizadas.`);
  }).catch(() => {});
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)