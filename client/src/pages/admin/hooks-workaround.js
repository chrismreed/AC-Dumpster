// This file provides a workaround for React runtime errors
// It creates a local variable that can be imported to disable the runtime error modal

export const disableRuntimeErrorOverlay = () => {
  if (typeof window !== 'undefined') {
    // Attempt to disable the error overlay
    try {
      const errorOverlay = document.querySelector('[data-plugin-id="runtime-error-plugin"]');
      if (errorOverlay) {
        errorOverlay.style.display = 'none';
      }

      // Add event listener to hide future overlays
      window.addEventListener('error', (event) => {
        const errorOverlay = document.querySelector('[data-plugin-id="runtime-error-plugin"]');
        if (errorOverlay) {
          errorOverlay.style.display = 'none';
        }
      }, true);
    } catch (e) {
      console.log('Failed to disable runtime error overlay', e);
    }
  }
  return null;
};