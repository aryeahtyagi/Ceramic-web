<template>
  <div class="shared-page">
    <header class="shared-topbar">
      <NuxtLink to="/" class="brand-logo">
        <span class="logo-text">SVRVE</span>
        <span class="logo-dot">•</span>
      </NuxtLink>
    </header>

    <div class="shared-content">
      <div v-if="pending" class="shared-status">Loading…</div>

      <div v-else-if="error || !design" class="shared-status">
        <p class="shared-status-text">This design couldn't be found — the link may be broken or the design removed.</p>
        <NuxtLink to="/design" class="shared-cta">Design Your Own Plate</NuxtLink>
      </div>

      <template v-else>
        <div class="shared-plate-wrap">
          <img :src="design.thumbnail" :alt="design.name" class="shared-plate-img" />
        </div>
        <h1 class="shared-design-name">{{ design.name }}</h1>
        <p class="shared-tagline">Designed to impress, made to use — a custom ceramic plate made on SVRVE.</p>
        <NuxtLink to="/design" class="shared-cta">Design Your Own Plate</NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const siteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')

const { data: design, pending, error } = await useFetch(`${apiBase}/designs/${route.params.id}/share`)

useHead(() => {
  const name = design.value?.name || 'Custom Plate Design'
  const image = design.value?.thumbnail || ''
  const pageUrl = `${siteUrl}/shared/${route.params.id}`
  return {
    title: `${name} - SVRVE Ceramics`,
    meta: [
      { name: 'robots', content: 'noindex, follow' },
      { name: 'description', content: `A custom ceramic plate design made on SVRVE: "${name}".` },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: name },
      { property: 'og:description', content: 'A custom ceramic plate design made on SVRVE.' },
      { property: 'og:image', content: image },
      { property: 'og:url', content: pageUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: name },
      { name: 'twitter:image', content: image }
    ],
    link: [{ rel: 'canonical', href: pageUrl }]
  }
})
</script>

<style scoped>
.shared-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.shared-topbar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #333;
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: 0.05em;
}

.logo-text {
  font-family: sans-serif;
}

.logo-dot {
  font-size: 0.75rem;
  color: #333;
}

.shared-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px 60px;
}

.shared-status {
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.shared-status-text {
  margin: 0 0 20px;
  font-size: 0.9375rem;
}

.shared-plate-wrap {
  width: min(80vw, 420px);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  margin-bottom: 28px;
}

.shared-plate-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.shared-design-name {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.shared-tagline {
  margin: 0 0 28px;
  color: #666;
  font-size: 0.9375rem;
  max-width: 420px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.shared-cta {
  display: inline-block;
  background: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
  padding: 14px 32px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.shared-cta:hover {
  background: #000;
}
</style>
