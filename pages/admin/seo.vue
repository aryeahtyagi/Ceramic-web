<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1 class="dash-title">Page SEO</h1>
    </header>

    <div class="seo-layout">
      <nav class="page-list">
        <button
          v-for="p in staticPages"
          :key="p.key"
          type="button"
          class="page-list-item"
          :class="{ active: p.key === selectedKey }"
          @click="selectedKey = p.key"
        >
          <span class="page-list-label">{{ p.label }}</span>
          <span class="page-list-path">{{ p.path }}</span>
        </button>
      </nav>

      <section class="seo-panel">
        <h2 class="seo-panel-title">{{ selectedPage.label }}</h2>
        <p class="seo-panel-hint">
          Leave a field blank to keep using the site's default for it — only what you fill in overrides
          what's shown to Google and on social previews.
        </p>
        <AdminPageSeoForm
          :key="selectedPage.key"
          :page-key="selectedPage.key"
          :default-title="selectedPage.defaultTitle"
          :default-description="selectedPage.defaultDescription"
          :default-canonical="selectedPage.defaultCanonical"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })

useHead({
  title: 'Page SEO',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || '').replace(/\/$/, '')

// Add an entry here for each standalone page that should get admin-managed SEO.
const staticPages = [
  {
    key: 'design',
    label: 'Design Your Own Plate',
    path: '/design',
    defaultTitle: 'Design Your Own Plate - SVRVE Ceramics',
    defaultDescription:
      'Create a one-of-a-kind ceramic plate. Add your own text, choose a font and color, and place it exactly where you want.',
    defaultCanonical: `${siteUrl}/design`
  }
]

const selectedKey = ref(staticPages[0].key)
const selectedPage = computed(() => staticPages.find((p) => p.key === selectedKey.value) || staticPages[0])
</script>

<style scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.dash-header {
  margin-bottom: 1.5rem;
}

.dash-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.seo-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.page-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #fff;
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.page-list-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  text-align: left;
  background: none;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
}

.page-list-item:hover {
  background: #f3f0ec;
}

.page-list-item.active {
  background: #f3f0ec;
  border-color: var(--primary-color, #8B4513);
}

.page-list-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.page-list-path {
  font-size: 0.75rem;
  color: var(--text-muted, #3f4f5f);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.seo-panel {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.seo-panel-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.seo-panel-hint {
  margin: 0 0 1.25rem;
  font-size: 0.82rem;
  color: var(--text-muted, #3f4f5f);
  line-height: 1.5;
}

@media (max-width: 700px) {
  .seo-layout {
    grid-template-columns: 1fr;
  }

  .page-list {
    flex-direction: row;
    overflow-x: auto;
  }
}
</style>
