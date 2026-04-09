import { createContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ToastContext.module.css';

export const ToastContext = createContext(null);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  const ICONS = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className={styles.container}>
          {toasts.map(t => (
            <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
              <span className={styles.icon}>{ICONS[t.type]}</span>
              <span className={styles.message}>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
