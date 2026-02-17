'use client';

import { useEffect } from 'react';

/**
 * Forces light mode for admin dashboard pages.
 * This ensures all portaled elements (dialogs, dropdowns, etc.) use light theme.
 * Applied synchronously to avoid race conditions with dialog rendering.
 */
export function ForceLightMode() {
  useEffect(() => {
    const html = document.documentElement;

    // Immediately apply light mode - no async fetch to avoid race conditions
    html.classList.remove('dark');
    html.classList.add('light');
    html.style.colorScheme = 'light';

    // Cleanup on unmount - restore dark mode for customer pages
    return () => {
      html.classList.remove('light');
      html.classList.add('dark');
      html.style.colorScheme = 'dark';
    };
  }, []);

  return null;
}
