'use client';

import { useEffect, useState } from 'react';
import { cn } from '../lib/cn';
import { subscribeToToasts, type ToastItem } from '../lib/toast';

const DURATION_MS = 4500;

const ICONS: Record<ToastItem['type'], string> = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
};

const STYLES: Record<ToastItem['type'], string> = {
  error: 'bg-error-container text-on-error-container',
  success: 'bg-surface-container-high text-on-surface',
  info: 'bg-inverse-surface text-inverse-on-surface',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg max-w-sm w-full pointer-events-auto',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        STYLES[item.type],
      )}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
        {ICONS[item.type]}
      </span>
      <p className="text-sm font-medium leading-snug flex-1">{item.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToToasts((item) => {
      setToasts((prev) => [...prev, item]);
    });
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}
