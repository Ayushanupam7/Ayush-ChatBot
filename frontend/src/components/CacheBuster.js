import { useEffect } from 'react';

const CacheBuster = () => {
  useEffect(() => {
    // Adding timestamp query param prevents browser from caching the meta.json fetch
    fetch(`/meta.json?t=${new Date().getTime()}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((meta) => {
        const latestVersion = meta.version;
        const currentVersion = localStorage.getItem('appVersion');

        // If local storage has no version or version is outdated
        if (currentVersion !== latestVersion) {
          console.log(`New version detected! Upgrading from ${currentVersion || 'None'} to ${latestVersion}. Clearing cache...`);
          
          // Clear service worker caches if applicable
          if ('caches' in window) {
            caches.keys().then((names) => {
              for (let name of names) {
                caches.delete(name);
              }
            });
          }

          // Save the new version
          localStorage.setItem('appVersion', latestVersion);

          // Force a hard reload to download latest assets
          setTimeout(() => {
            window.location.reload(true);
          }, 300);
        }
      })
      .catch((error) => console.error('Cache buster check failed:', error));
  }, []);

  return null; // Component does not render anything
};

export default CacheBuster;
