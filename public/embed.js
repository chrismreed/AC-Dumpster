/**
 * Alley Cat Dumpsters - Embed Script
 * Auto-resizes iframe to fit content and handles form submissions
 */

(function() {
  'use strict';

  // Find all Alley Cat embed iframes
  const iframes = document.querySelectorAll('iframe[data-alleycat-embed]');

  iframes.forEach(function(iframe) {
    // Set initial styles
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';

    // Set initial height (will be adjusted by messages)
    iframe.style.height = '800px';

    // Listen for messages from the iframe
    window.addEventListener('message', function(event) {
      // Security: In production, you should verify event.origin
      // For now, we'll accept messages from any origin

      if (event.data && event.data.type === 'alleycat-resize') {
        // Update iframe height based on content
        const newHeight = event.data.height;
        if (newHeight && newHeight > 0) {
          iframe.style.height = newHeight + 'px';
        }
      }

      if (event.data && event.data.type === 'alleycat-success') {
        // Form submitted successfully
        console.log('Alley Cat form submitted successfully');

        // Dispatch custom event that website can listen to
        const successEvent = new CustomEvent('alleycatFormSuccess', {
          detail: {
            serviceId: event.data.serviceId,
            submissionId: event.data.submissionId
          }
        });
        window.dispatchEvent(successEvent);

        // If submission ID is provided and parent page is on same domain, redirect to confirmation
        if (event.data.submissionId) {
          try {
            // Try to redirect parent page to confirmation
            const confirmationUrl = `${window.location.origin}/confirmation?id=${event.data.submissionId}&type=service`;
            window.location.href = confirmationUrl;
          } catch (e) {
            // Cross-origin iframe - can't redirect parent
            console.log('Cross-origin embed detected - confirmation redirect handled by iframe');
          }
        }
      }
    });
  });

  // Add a helper function for dynamic iframe creation
  window.AlleyCatEmbed = {
    create: function(serviceId, options) {
      options = options || {};

      const container = options.container || document.body;
      const primaryColor = options.primaryColor || '#f7c948';
      const showHeader = options.showHeader !== false;
      const customLogo = options.logo || '';

      // Build URL with parameters
      let url = `${options.baseUrl || window.location.origin}/embed/service/${serviceId}`;
      const params = new URLSearchParams();

      if (primaryColor) params.append('primaryColor', primaryColor);
      if (!showHeader) params.append('showHeader', 'false');
      if (customLogo) params.append('logo', customLogo);

      if (params.toString()) {
        url += '?' + params.toString();
      }

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.setAttribute('data-alleycat-embed', 'true');
      iframe.style.width = '100%';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.style.height = '800px';

      // Add to container
      if (typeof container === 'string') {
        document.querySelector(container).appendChild(iframe);
      } else {
        container.appendChild(iframe);
      }

      return iframe;
    }
  };
})();
