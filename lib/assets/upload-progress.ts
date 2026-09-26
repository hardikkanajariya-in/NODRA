type Listener = (percent: number) => void;

const values = new Map<string, number>();
const listeners = new Map<string, Set<Listener>>();

export function publishUploadProgress(id: string, percent: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const prev = values.get(id) ?? 0;
  const next = Math.max(prev, clamped);
  values.set(id, next);
  listeners.get(id)?.forEach((fn) => fn(next));
}

export function readUploadProgress(id: string): number {
  return values.get(id) ?? 0;
}

export function subscribeUploadProgress(id: string, fn: Listener): () => void {
  let set = listeners.get(id);
  if (!set) {
    set = new Set();
    listeners.set(id, set);
  }
  set.add(fn);
  fn(values.get(id) ?? 0);
  return () => {
    set?.delete(fn);
    if (set && set.size === 0) listeners.delete(id);
  };
}

export function clearUploadProgress(id: string) {
  values.delete(id);
  listeners.delete(id);
}
