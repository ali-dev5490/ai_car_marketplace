import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Keep old HashRouter bookmarks working: /#/browse → /browse
if (window.location.hash.startsWith('#/')) {
  const next = window.location.hash.slice(1) + window.location.search;
  window.history.replaceState(null, '', next);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
