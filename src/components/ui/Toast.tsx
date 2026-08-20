import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { alertStyles, type AlertVariant } from './Alert';

export interface Toast {
  id: number;
  variant: AlertVariant;
  title: string;
  message?: string;
}

export interface ToastContextType {
  push: (t: Omit<Toast, 'id'>) => void;
  addToast: (title: string, variant?: AlertVariant, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  push: () => {},
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { ...t, id }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4000);
  };
  const addToast = (title: string, variant: AlertVariant = 'info', message?: string) => {
    push({ title, variant, message });
  };
  return (
    <ToastContext.Provider value={{ push, addToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80">
          {toasts.map((t) => {
            const s = alertStyles[t.variant];
            return (
              <div key={t.id} className={cn('flex gap-3 rounded-lg border p-4 shadow-lg bg-white animate-slide-in-right', s.container)}>
                <span className="shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold">{t.title}</p>
                  {t.message && <p className="text-caption mt-0.5 opacity-90">{t.message}</p>}
                </div>
                <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="shrink-0 opacity-60 hover:opacity-100"><X className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
