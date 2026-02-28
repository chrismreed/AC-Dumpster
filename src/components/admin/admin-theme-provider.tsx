'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Wraps admin pages in a nested NextThemesProvider with forcedTheme="light".
 *
 * Key behavior:
 * - Forces the theme to "light" for all admin children
 * - Does NOT write to localStorage (unlike setTheme)
 * - The root provider (defaultTheme="dark") still governs customer pages
 * - When navigating from admin → customer, the root provider restores "dark"
 *
 * This is the official next-themes pattern for per-page theme forcing.
 * See: https://github.com/pacocoursey/next-themes#force-per-page-theme-and-target-body
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme="light"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
