/**
 * Back/forward cache (bfcache) support.
 * - We do NOT use unload or beforeunload (they block bfcache).
 * - On pageshow.persisted we do nothing heavy so the restored page stays fast.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  window.addEventListener('pageshow', (event: PageTransitionEvent) => {
    if (!event.persisted) return
    // Page restored from bfcache — state (useState) is already restored; no extra work needed
  })
})
