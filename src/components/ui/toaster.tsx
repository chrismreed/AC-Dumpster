'use client';

import { useEffect, useState } from 'react';
import { useToasts } from '@/hooks/use-toast';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);
  const { subscribe } = useToasts();

  useEffect(() => {
    const unsubscribe = subscribe(setCurrentToasts);
    return unsubscribe;
  }, [subscribe]);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm animate-in fade-in slide-in-from-bottom-4 ${
            toast.variant === 'destructive'
              ? 'bg-red-500 text-white'
              : 'bg-gray-900 text-white'
          }`}
        >
          <p className="font-medium">{toast.title}</p>
          {toast.description && (
            <p className="text-sm opacity-90 mt-1">{toast.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
