import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple store for toasts
interface Toast extends ToastOptions {
  id: string;
}

let listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function addToast(options: ToastOptions) {
  const id = Math.random().toString(36).slice(2);
  toasts.push({ ...options, id });
  notify();
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 3000);
}

export function useToasts() {
  return {
    toasts,
    subscribe: (listener: (toasts: Toast[]) => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    addToast(options);
  }, []);

  return { toast };
}
