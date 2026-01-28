export default defineNuxtPlugin(() => {
  // Only run this plugin if we're actually on GitHub Pages (check for base path)
  // or if we're in development. Skip in production on custom domain.
  const config = useRuntimeConfig()
  const route = useRoute()
  const router = useRouter()

  // Only process redirect if we're on the root path with a redirect query param
  // This prevents interfering with normal navigation
  if (route.path === '/' || route.path === '') {
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect) {
      // route.query is already decoded by vue-router, but keep this safe.
      const target = decodeURIComponent(redirect)
      // Only redirect if target is different from current path
      if (target && target !== route.path) {
        // Replace so we don't keep ?redirect= in history
        router.replace(target).catch(() => {})
      }
    }
  }
})

