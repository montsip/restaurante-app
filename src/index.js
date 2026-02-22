import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar el service worker para soporte PWA y modo offline.
// Solo activo en producción (npm run build), no en desarrollo (npm start).
serviceWorkerRegistration.register({
  onSuccess: () => console.log('App lista para uso offline'),
  onUpdate: () => console.log('Nueva version disponible — recarga para actualizar'),
});

reportWebVitals();
