"use client"

import { useEffect } from 'react';

export function UnregisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          console.log('Unregistering existing service workers...');
          for (const registration of registrations) {
            registration.unregister().then((unregistered) => {
              if (unregistered) {
                console.log('Service worker unregistered successfully:', registration.scope);
              } else {
                console.warn('Failed to unregister service worker:', registration.scope);
              }
            });
          }
          // After unregistering, reload the page to ensure the new code is used.
          window.location.reload();
        }
      }).catch((error) => {
        console.error('Error during service worker unregistration:', error);
      });
    }
  }, []);

  return null; // This component does not render anything.
}
