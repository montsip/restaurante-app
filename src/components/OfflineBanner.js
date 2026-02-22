import React, { useState, useEffect } from 'react';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { getQueue } from '../utils/offlineQueue';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick(t => t + 1);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    const interval = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      clearInterval(interval);
    };
  }, []);

  const queueSize = getQueue().length;

  if (isOnline && queueSize === 0) return null;

  const baseStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 999,
    color: 'white',
    textAlign: 'center',
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.01em',
  };

  if (!isOnline) {
    return (
      <div role="status" aria-live="polite" style={{ ...baseStyle, background: '#dc2626' }}>
        Sin conexion{queueSize > 0 ? ` · ${queueSize} accion${queueSize !== 1 ? 'es' : ''} en cola` : ''}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" style={{ ...baseStyle, background: '#d97706' }}>
      Sincronizando {queueSize} accion{queueSize !== 1 ? 'es' : ''}...
    </div>
  );
}
