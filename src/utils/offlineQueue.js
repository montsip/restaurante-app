const QUEUE_KEY = 'restaurante_offline_queue';

export function getQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueue(action) {
  const queue = getQueue();
  const entry = { ...action, id: Date.now(), timestamp: Date.now() };
  queue.push(entry);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[offlineQueue] localStorage write failed', e);
  }
  return entry;
}

export function dequeue(id) {
  const queue = getQueue().filter(a => a.id !== id);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function clearQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {}
}
