<template>
  <main id="main-content">
    <slot />
  </main>
</template>

<script setup>
// Hreflang for every page (en-IN) — reactive so it updates on navigation
const route = useRoute()
const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || 'https://svrve.com').replace(/\/$/, '')

useHead(() => {
  const path = (route.path || '/').replace(/^\//, '') || ''
  const pageUrl = path ? `${siteUrl}/${path}` : siteUrl + '/'
  return {
    link: [
      { rel: 'alternate', hreflang: 'en-IN', href: pageUrl },
      { rel: 'alternate', hreflang: 'x-default', href: pageUrl }
    ]
  }
})
</script>

