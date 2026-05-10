/**
 * Esta aplicación no usa PWA/offline. Este stub evita 404 cuando el navegador
 * sigue pidiendo /sw.js por un Service Worker cacheado de otra versión u otro proyecto.
 * Para limpiar del todo: Chrome → DevTools → Application → Service Workers → Unregister.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
