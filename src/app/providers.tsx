'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Fix stale localStorage from previous ForceLightMode bug.
 * The old implementation wrote "light" to localStorage via setTheme(),
 * which caused customer-facing pages to appear in light mode.
 * This one-time cleanup ensures "dark" is restored.
 */
function useFixStaleTheme() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light') {
        localStorage.setItem('theme', 'dark');
      }
    }
  }, []);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useFixStaleTheme();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
