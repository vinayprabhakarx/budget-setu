import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext';
import type { Toast, ToastType } from './ToastContext';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div className="fixed bottom-36 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-8 z-50 pointer-events-none sm:max-w-sm sm:w-full">
        {toasts.map((toast, index) => {
          const revIdx = toasts.length - 1 - index;
          const isHidden = revIdx > 2;
          const scale = 1 - revIdx * 0.05;
          const translateY = -(revIdx * 1); // 1rem
          const zIndex = 50 - revIdx;

          let icon = '✓';
          let progressColor = 'var(--color-success)';
          if (toast.type === 'error') {
            icon = '✕';
            progressColor = 'var(--color-expense)';
          } else if (toast.type === 'warning') {
            icon = '⚠';
            progressColor = 'var(--color-warning)';
          } else if (toast.type === 'info') {
            icon = 'ℹ';
            progressColor = 'var(--color-info)';
          }

          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className={`absolute bottom-0 right-0 toast toast-${toast.type} cursor-pointer flex items-center justify-between gap-4 select-none w-full bg-bg-elevated border border-border p-4 rounded-lg shadow-xl animate-toast-in transition-all duration-400 ease-out overflow-hidden`}
              style={{
                transform: `translateY(${translateY}rem) scale(${scale})`,
                transformOrigin: 'bottom center',
                opacity: isHidden ? 0 : 1,
                pointerEvents: revIdx === 0 ? 'auto' : 'none',
                zIndex
              }}
            >
              <div className="flex items-center gap-3 relative z-10">
                <span className="font-semibold text-text-primary">{icon}</span>
                <span className="text-body-md text-text-primary">{toast.message}</span>
              </div>
              <button
                className="text-text-muted hover:text-text-primary text-body-sm transition-colors relative z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
              >
                ✕
              </button>
              <div 
                className="absolute bottom-0 left-0 h-1 opacity-50"
                style={{ 
                  backgroundColor: progressColor,
                  animation: 'toast-progress 4000ms linear forwards' 
                }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
