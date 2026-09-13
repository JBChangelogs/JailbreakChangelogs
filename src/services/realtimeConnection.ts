let isConnected = false;

const listeners = new Set<() => void>();

export function getRealtimeConnectionSnapshot(): boolean {
  return isConnected;
}

export function getRealtimeConnectionServerSnapshot(): boolean {
  return false;
}

export function subscribeRealtimeConnection(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setRealtimeConnectionState(connected: boolean): void {
  if (isConnected === connected) return;
  isConnected = connected;
  listeners.forEach((listener) => listener());
}
