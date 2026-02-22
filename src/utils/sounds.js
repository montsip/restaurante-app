const ctx = () => new (window.AudioContext || window.webkitAudioContext)();

const beep = (audioCtx, freq, start, duration) => {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
  osc.start(audioCtx.currentTime + start);
  osc.stop(audioCtx.currentTime + start + duration);
};

// Cocina / Barra: doble ding ascendente (nueva orden)
export const playNewOrder = () => {
  try {
    const ac = ctx();
    beep(ac, 880, 0, 0.15);
    beep(ac, 1100, 0.2, 0.2);
  } catch (_) {}
};

// Mesero: chime descendente (platillo listo)
export const playItemReady = () => {
  try {
    const ac = ctx();
    beep(ac, 1320, 0, 0.15);
    beep(ac, 1100, 0.18, 0.15);
    beep(ac, 880, 0.36, 0.25);
  } catch (_) {}
};

// Cajero: alerta triple ascendente (cuenta solicitada)
export const playBillRequested = () => {
  try {
    const ac = ctx();
    beep(ac, 660, 0, 0.12);
    beep(ac, 880, 0.15, 0.12);
    beep(ac, 1100, 0.3, 0.18);
  } catch (_) {}
};
