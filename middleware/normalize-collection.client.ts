export default defineNuxtRouteMiddleware((to) => {
  // Canonicalize /collections/:type to lowercase version
  if (!to.path.startsWith('/collections/')) return

  const parts = to.path.split('/').filter(Boolean)
  if (parts.length < 2 || parts[0] !== 'collections') return

  const type = parts[1]
  const normalizedType = type.toLowerCase()

  if (type === normalizedType) return

  return navigateTo({
    path: `/collections/${normalizedType}`,
    query: to.query,
    hash: to.hash,
    replace: true
  })
})
