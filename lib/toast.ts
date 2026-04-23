export type ToastType = 'error' | 'success' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toast: ToastItem) => void;

let listeners: Listener[] = [];
let counter = 0;

export const toast = {
  error: (message: string) => emit('error', message),
  success: (message: string) => emit('success', message),
  info: (message: string) => emit('info', message),
};

function emit(type: ToastType, message: string) {
  const item: ToastItem = { id: String(++counter), type, message };
  listeners.forEach((fn) => fn(item));
}

export function subscribeToToasts(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
