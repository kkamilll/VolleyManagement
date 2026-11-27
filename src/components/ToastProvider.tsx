'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Standalone global dispatcher so toast can be called outside React hooks if needed
let globalToastHandler: ((item: ToastItem) => void) | null = null;

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalToastHandler) {
      globalToastHandler({ id: Math.random().toString(36).slice(2), type: 'success', title: title || 'Sukces', message, duration });
    }
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalToastHandler) {
      globalToastHandler({ id: Math.random().toString(36).slice(2), type: 'error', title: title || 'Wystąpił błąd', message, duration });
    }
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalToastHandler) {
      globalToastHandler({ id: Math.random().toString(36).slice(2), type: 'warning', title: title || 'Uwaga', message, duration });
    }
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalToastHandler) {
      globalToastHandler({ id: Math.random().toString(36).slice(2), type: 'info', title: title || 'Informacja', message, duration });
    }
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((item: ToastItem) => {
    setToasts(prev => {
      // Limit to 4 toasts max to avoid screen clutter
      const next = [item, ...prev].slice(0, 4);
      return next;
    });

    const duration = item.duration ?? (item.type === 'error' ? 5000 : 3500);
    setTimeout(() => {
      removeToast(item.id);
    }, duration);
  }, [removeToast]);

  const showToast = useCallback(({ type = 'info', title, message, duration }: { type?: ToastType; title?: string; message: string; duration?: number }) => {
    const id = Math.random().toString(36).slice(2);
    addToast({ id, type, title, message, duration });
  }, [addToast]);

  const success = useCallback((message: string, title?: string, duration?: number) => {
    showToast({ type: 'success', title: title || 'Sukces', message, duration });
  }, [showToast]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    showToast({ type: 'error', title: title || 'Wystąpił błąd', message, duration });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    showToast({ type: 'warning', title: title || 'Uwaga', message, duration });
  }, [showToast]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    showToast({ type: 'info', title: title || 'Informacja', message, duration });
  }, [showToast]);

  // Connect global handler
  useEffect(() => {
    globalToastHandler = addToast;
    return () => {
      globalToastHandler = null;
    };
  }, [addToast]);

  // Intelligent interceptor for native browser window.alert
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalAlert = window.alert;

    window.alert = (message?: any) => {
      const msg = String(message || '');
      const lower = msg.toLowerCase();

      // Detect error keywords
      if (
        lower.includes('błąd') ||
        lower.includes('error') ||
        lower.includes('nie udało się') ||
        lower.includes('niepoprawn') ||
        lower.includes('odrzucon') ||
        lower.includes('wymagane') ||
        lower.includes('zaloguj się')
      ) {
        error(msg);
      }
      // Detect success keywords
      else if (
        lower.includes('sukces') ||
        lower.includes('pomyślnie') ||
        lower.includes('zapisano') ||
        lower.includes('dodano') ||
        lower.includes('usunięto') ||
        lower.includes('zaimportowano') ||
        lower.includes('zaktualizowano') ||
        lower.includes('wysłano') ||
        lower.includes('przekazan')
      ) {
        success(msg);
      }
      // Detect warning keywords
      else if (
        lower.includes('uwaga') ||
        lower.includes('ostrzeżen') ||
        lower.includes('pamiętaj') ||
        lower.includes('wklej') ||
        lower.includes('wybierz')
      ) {
        warning(msg);
      }
      // Default info
      else {
        info(msg);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [success, error, warning, info]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}

      {/* Floating Toasts Viewport - Fixed at top on mobile, top-right on desktop */}
      <div
        aria-live="polite"
        className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:top-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-md w-full"
      >
        {toasts.map(toastItem => {
          const isSuccess = toastItem.type === 'success';
          const isError = toastItem.type === 'error';
          const isWarning = toastItem.type === 'warning';

          return (
            <div
              key={toastItem.id}
              role="status"
              className={`pointer-events-auto w-full p-3.5 sm:p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-start gap-3 select-none ${
                isSuccess
                  ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
                  : isError
                  ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-500/10'
                  : isWarning
                  ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/10'
                  : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-500/10'
              }`}
            >
              {/* Icon badge */}
              <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : isError
                  ? 'bg-rose-600 text-white'
                  : isWarning
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-sky-600 text-white'
              }`}>
                {isSuccess && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                {isError && <AlertCircle className="w-4 h-4 stroke-[2.5]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 stroke-[2.5]" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 stroke-[2.5]" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-1">
                {toastItem.title && (
                  <h5 className="text-xs font-black uppercase tracking-wider mb-0.5 leading-snug">
                    {toastItem.title}
                  </h5>
                )}
                <p className="text-xs font-medium leading-relaxed break-words">
                  {toastItem.message}
                </p>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => removeToast(toastItem.id)}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center transition shrink-0 -mr-1 -mt-1 cursor-pointer"
                title="Zamknij"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
