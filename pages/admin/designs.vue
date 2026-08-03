<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1 class="dash-title">Designs</h1>
      <p v-if="loadError" class="load-error">{{ loadError }}</p>
    </header>

    <div class="filters">
      <label class="filter-field filter-field--grow">
        <span>Search</span>
        <input v-model="search" type="text" placeholder="Search by design name or username" />
      </label>
      <div class="featured-counter" :class="{ full: featuredCount >= MAX_FEATURED }">
        Featured: {{ featuredCount }} / {{ MAX_FEATURED }}
      </div>
      <button type="button" class="apply-btn" :disabled="loading" @click="loadDesigns">Refresh</button>
    </div>

    <div v-if="loading" class="designs-status">Loading…</div>
    <div v-else-if="!filteredDesigns.length" class="designs-status">No designs found.</div>
    <div v-else class="designs-grid">
      <div v-for="d in filteredDesigns" :key="d.id" class="design-card" :class="{ featured: d.featured }">
        <img :src="d.thumbnail" class="design-card-thumb" alt="" />
        <div class="design-card-body">
          <div class="design-card-name">{{ d.name || 'Untitled Design' }}</div>
          <div class="design-card-meta">by {{ d.username || `User #${d.userId}` }}</div>
          <div class="design-card-meta">Added {{ formatDate(d.createdAt) }}</div>
        </div>
        <button
          type="button"
          class="feature-btn"
          :class="{ active: d.featured }"
          :disabled="togglingId === d.id || (!d.featured && featuredCount >= MAX_FEATURED)"
          @click="toggleFeatured(d)"
        >
          {{ d.featured ? '★ Featured' : '☆ Feature' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })

useHead({
  title: 'Designs',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const { isAuthorized, authHeaders, logout: adminLogout } = useAdminAuth()

const MAX_FEATURED = 10
const designs = ref([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const togglingId = ref(null)

const featuredCount = computed(() => designs.value.filter((d) => d.featured).length)

const filteredDesigns = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return designs.value
  return designs.value.filter((d) => [d.name, d.username].some((f) => String(f || '').toLowerCase().includes(q)))
})

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

async function loadDesigns() {
  loading.value = true
  loadError.value = ''
  try {
    designs.value = await $fetch(`${apiBase}/admin/designs`, { headers: authHeaders() })
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    if (status === 401) {
      // Key was valid at layout-level verification but got rejected here (e.g. rotated server-side) — re-gate.
      adminLogout()
    } else {
      loadError.value = 'Failed to load designs.'
    }
  } finally {
    loading.value = false
  }
}

async function toggleFeatured(design) {
  const next = !design.featured
  togglingId.value = design.id
  try {
    await $fetch(`${apiBase}/admin/designs/${design.id}/featured`, {
      method: 'PUT',
      headers: authHeaders(),
      params: { featured: next }
    })
    design.featured = next
  } catch {
    loadError.value = 'Could not update featured status. Please try again.'
  } finally {
    togglingId.value = null
  }
}

watch(
  isAuthorized,
  (v) => {
    if (v) loadDesigns()
  },
  { immediate: true }
)
</script>

<style scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.dash-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.load-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.85rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-muted, #3f4f5f);
}

.filter-field--grow {
  flex: 1;
  min-width: 220px;
}

.filter-field input {
  padding: 0.5rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
}

.featured-counter {
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  background: #f1eee9;
  color: var(--text-muted, #3f4f5f);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.featured-counter.full {
  background: #fef2f2;
  color: #dc2626;
}

.apply-btn {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.apply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.designs-status {
  text-align: center;
  color: var(--text-muted, #3f4f5f);
  padding: 3rem 0;
}

.designs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.design-card {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 2px solid transparent;
}

.design-card.featured {
  border-color: #f5c518;
}

.design-card-thumb {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  background: #f5f5f5;
  align-self: center;
  max-width: 140px;
}

.design-card-body {
  text-align: center;
}

.design-card-name {
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.design-card-meta {
  font-size: 0.75rem;
  color: var(--text-muted, #3f4f5f);
}

.feature-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: var(--text-muted, #3f4f5f);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.feature-btn.active {
  background: #fff8e1;
  border-color: #f5c518;
  color: #8a6d00;
}

.feature-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
