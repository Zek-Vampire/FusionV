import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-400/30 text-emerald-300',
  },
  error: {
    icon: XCircle,
    className: 'border-red-400/30 text-red-300',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-400/30 text-amber-300',
  },
  info: {
    icon: Info,
    className: 'border-line text-silver',
  },
};

let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const schedule = useCallback(
    (id, duration) => {
      if (!duration || duration <= 0) return;
      const timer = window.setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 5000 }) => {
      const item = {
        id: `toast-${++toastCounter}`,
        title,
        description,
        variant: VARIANTS[variant] ? variant : 'info',
        duration,
      };
      setToasts((list) => [...list.slice(-3), item]);
      schedule(item.id, item.duration);
      return item.id;
    },
    [schedule],
  );

  const pause = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const resume = useCallback(
    (id) => {
      const item = toasts.find((entry) => entry.id === id);
      if (item) schedule(id, item.duration);
    },
    [toasts, schedule],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document === 'undefined'
        ? null
        : createPortal(
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-end">
              <div aria-live="polite" aria-atomic="false" className="flex w-full max-w-sm flex-col gap-2">
                {toasts.map((item) => {
                  const config = VARIANTS[item.variant];
                  const Icon = config.icon;
                  return (
                    <div
                      key={item.id}
                      role={item.variant === 'error' ? 'alert' : 'status'}
                      onMouseEnter={() => pause(item.id)}
                      onMouseLeave={() => resume(item.id)}
                      className={cn(
                        'animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface/95 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur',
                        config.className,
                      )}
                    >
                      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{item.title}</p>
                        {item.description ? (
                          <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        aria-label="Dismiss notification"
                        onClick={() => dismiss(item.id)}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body,
          )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
