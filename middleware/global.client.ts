export default defineNuxtRouteMiddleware((to) => {
  // Normalize collection type URLs to lowercase
  // This ensures /collections/Plates works the same as /collections/plates
  if (to.path.startsWith('/collections/')) {
    const parts = to.path.split('/').filter(Boolean)
    if (parts.length === 2 && parts[0] === 'collections') {
      const type = parts[1]
      // Only redirect if the type has uppercase letters (not already normalized)
      if (type !== type.toLowerCase() && type !== 'all') {
        const normalizedPath = `/collections/${type.toLowerCase()}`
        // Preserve query params and hash
        const query = to.query
        const hash = to.hash
        return navigateTo({
          path: normalizedPath,
          query,
          hash,
          replace: true // Replace in history so back button works correctly
        })
      }
    }
  }
})
