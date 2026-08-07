import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; }

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(to => to.id !== id)), 4000);
  }, []);

  const dismiss = (id: string) => setToasts(t => t.filter(to => to.id !== id));

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card animate-[slideIn_0.2s_ease-out] min-w-[280px] max-w-[400px]"
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />}
            {t.type === 'error' && <AlertCircle size={18} className="text-brand-red-500 shrink-0" />}
            {t.type === 'info' && <Info size={18} className="text-ink-500 shrink-0" />}
            <span className="flex-1 text-sm font-medium text-ink-800">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700"><X size={16} /></button>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn{from{transform:translateX(16px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
