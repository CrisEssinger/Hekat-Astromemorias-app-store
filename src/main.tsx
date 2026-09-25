import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Portal Hekat: Carregando sistema...");

console.log("Portal Hekat: Localizado elemento root.");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Portal Hekat: Elemento 'root' não encontrado!");
} else {
  console.log("Portal Hekat: Iniciando renderização...");
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("Portal Hekat: Renderização chamada.");
}

// Registrar Service Worker para notificações em segundo plano e cache PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Portal Hekat: Registro de ServiceWorker amortecido:', err);
    });
  });
}
