<template>
  <main id="main-content">
    <slot />
  </main>
  <SupportFab />
</template>

<script setup>
// Hreflang + self-referencing canonical for every page — reactive so it updates on navigation
const route = useRoute()
const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || 'https://svrve.com').replace(/\/$/, '')

// Private/transactional pages that shouldn't appear in search results
const NOINDEX_PATHS = ['/cart', '/orders', '/purchased']

useHead(() => {
  // Path only (no query string / trailing slash) so tracking params don't create duplicate URLs
  const path = (route.path || '/').replace(/^\/+|\/+$/g, '')
  const pageUrl = path ? `${siteUrl}/${path}` : siteUrl + '/'
  return {
    link: [
      // Low priority: pages that set their own canonical (product, blog, collections…) override this
      { rel: 'canonical', href: pageUrl, tagPriority: 'low' },
      { rel: 'alternate', hreflang: 'en-IN', href: pageUrl },
      { rel: 'alternate', hreflang: 'x-default', href: pageUrl }
    ],
    meta: NOINDEX_PATHS.includes(`/${path}`) ? [{ name: 'robots', content: 'noindex, follow' }] : []
  }
})
</script>
