'use client';

import { useEffect } from 'react';

/**
 * Forces light mode for admin dashboard pages.
 *
 * This component works in tandem with the nested NextThemesProvider
 * (forcedTheme="light") in the admin layout. The provider handles the
 * class="light" on <html> and does NOT persist to localStorage.
 *
 * This component only handles the color-scheme CSS property, which
 * affects native browser elements (scrollbars, form controls, etc.).
 */
export function ForceLightMode() {
  useEffect(() => {
    document.documentElement.style.colorScheme = 'light';

    return () => {
      // Restore dark color-scheme when leaving admin pages
      document.documentElement.style.colorScheme = 'dark';
    };
  }, []);

  return null;
}
