<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Blog posts</h1>
        <p class="page-subtitle">{{ posts.length }} total</p>
      </div>
      <div class="header-actions">
        <NuxtLink to="/admin/blog/upload-image" class="ghost-link">Upload image</NuxtLink>
        <NuxtLink to="/admin/blog/new" class="new-btn">+ New post</NuxtLink>
      </div>
    </header>

    <div class="filters">
      <input v-model="search" type="text" class="search-input" placeholder="Search by title…" />
      <select v-model="statusFilter" class="status-select">
        <option value="">All statuses</option>
        <option value="draft">draft</option>
        <option value="published">published</option>
        <option value="archived">archived</option>
      </select>
    </div>

    <p v-if="loadError" class="load-error">{{ loadError }}</p>
    <p v-else-if="loading" class="loading-text">Loading…</p>

    <div v-else class="post-grid">
      <NuxtLink
        v-for="post in filteredPosts"
        :key="post.id"
        :to="`/admin/blog/${post.id}`"
        class="post-card"
      >
        <div class="post-card-top">
          <span class="status-badge" :class="`status-badge--${post.status}`">{{ post.status }}</span>
          <span v-if="post.category" class="post-category">{{ post.category }}</span>
        </div>
        <h2 class="post-title">{{ post.title }}</h2>
        <p class="post-meta">Updated {{ formatDate(post.updatedAt) }}</p>
      </NuxtLink>

      <p v-if="!filteredPosts.length" class="empty-text">No posts match your filters.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })
useHead({ title: 'Blog posts', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const { isAuthorized } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const posts = ref([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const statusFilter = ref('')

const filteredPosts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return posts.value
    .filter((p) => !statusFilter.value || p.status === statusFilter.value)
    .filter((p) => !q || (p.title || '').toLowerCase().includes(q))
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
})

function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

async function loadPosts() {
  loading.value = true
  loadError.value = ''
  try {
    // Public endpoint (also used by the storefront) — no admin key required to read.
    posts.value = await $fetch(`${apiBase}/blogs`)
  } catch {
    loadError.value = 'Failed to load blog posts.'
  } finally {
    loading.value = false
  }
}

watch(isAuthorized, (v) => {
  if (v) loadPosts()
}, { immediate: true })
</script>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.page-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ghost-link {
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
  text-decoration: none;
  padding: 0.55rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.ghost-link:hover {
  background: #f3f0ec;
}

.new-btn {
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
}

.filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.6rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
}

.status-select {
  padding: 0.6rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
}

.load-error {
  color: #dc2626;
  font-size: 0.9rem;
}

.loading-text,
.empty-text {
  color: var(--text-muted, #3f4f5f);
  font-size: 0.9rem;
  padding: 2rem 0;
  text-align: center;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.post-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: box-shadow 0.15s, transform 0.15s;
}

.post-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.post-card-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #f1eee9;
  color: var(--text-muted, #3f4f5f);
}

.status-badge--published {
  background: #dcfce7;
  color: #166534;
}

.status-badge--draft {
  background: #fef3c7;
  color: #92400e;
}

.status-badge--archived {
  background: #e5e7eb;
  color: #4b5563;
}

.post-category {
  font-size: 0.75rem;
  color: var(--text-muted, #3f4f5f);
}

.post-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
}

.post-meta {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted, #3f4f5f);
}
</style>
