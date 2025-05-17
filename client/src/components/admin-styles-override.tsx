import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function AdminStylesOverride() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');

  useEffect(() => {
    if (isAdminPage) {
      // Function to find and remove any gold/yellow bar
      const removeGoldBar = () => {
        // Look for any div with gold/yellowish background color
        const elements = document.querySelectorAll('div');
        
        elements.forEach(element => {
          // Check for specific gold bar element
          if (
            // The gold bar shown in screenshot is likely a div with full width
            element.offsetWidth >= window.innerWidth * 0.95 && 
            element.offsetHeight <= 50 && // Not too tall
            window.getComputedStyle(element).backgroundColor.includes('rgb(')
          ) {
            const style = window.getComputedStyle(element);
            const bgColor = style.backgroundColor;
            
            // Parse RGB values from background color
            const rgb = bgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10);
              const g = parseInt(rgb[1], 10);
              const b = parseInt(rgb[2], 10);
              
              // Check if the color is in the yellow/gold range
              if (r > 180 && g > 150 && b < 100) {
                // This is likely our gold bar - hide it
                element.style.display = 'none';
              }
            }
          }
        });
      };

      // Run initially and set up a small delay for any dynamically added elements
      removeGoldBar();
      const timer = setTimeout(removeGoldBar, 500);
      
      // Clean up timer
      return () => clearTimeout(timer);
    }
  }, [isAdminPage, location]);

  return null; // This component doesn't render anything
}