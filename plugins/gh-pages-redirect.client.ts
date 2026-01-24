export default defineNuxtPlugin(() => {
  const route = useRoute()
  const router = useRouter()

  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect) {
    // route.query is already decoded by vue-router, but keep this safe.
    const target = decodeURIComponent(redirect)
    // Replace so we don't keep ?redirect= in history
    router.replace(target).catch(() => {})
  }
})

