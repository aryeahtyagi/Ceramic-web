export default defineNuxtPlugin(() => {
  // Handle 404.html redirect: restore URL from ?p= query param
  // This runs on the client side when the app loads
  if (process.client) {
    const route = useRoute()
    const router = useRouter()
    
    // Only process on root path with ?p= param
    if ((route.path === '/' || route.path === '') && route.query.p) {
      const originalPath = typeof route.query.p === 'string' 
        ? decodeURIComponent(route.query.p) 
        : null
      
      if (originalPath && originalPath !== route.path) {
        // Restore the original URL using history.replaceState (clean, no redirect chain)
        // This removes ?p= from the address bar immediately
        const url = new URL(originalPath, window.location.origin)
        window.history.replaceState({}, '', url.pathname + url.search + url.hash)
        
        // Navigate to the restored path (Vue Router will handle it)
        router.replace(originalPath).catch(() => {
          // If navigation fails, at least the URL is clean
        })
      }
    }
  }
})

