<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">{{ products.length }} total</p>
      </div>
      <NuxtLink to="/admin/products/new" class="new-btn">+ New product</NuxtLink>
    </header>

    <div class="filters">
      <input v-model="search" type="text" class="search-input" placeholder="Search by name…" />
    </div>

    <p v-if="loadError" class="load-error">{{ loadError }}</p>
    <p v-else-if="loading" class="loading-text">Loading…</p>

    <div v-else class="product-grid">
      <NuxtLink
        v-for="p in filteredProducts"
        :key="p.id"
        :to="`/admin/products/${p.id}`"
        class="product-card"
      >
        <div class="product-thumb">
          <img v-if="catalogImageUrl(p)" :src="catalogImageUrl(p)" :alt="p.name" loading="lazy" />
          <div v-else class="product-thumb-empty">No image</div>
        </div>
        <div class="product-card-body">
          <h2 class="product-name">{{ p.name }}</h2>
          <p class="product-price">₹{{ Number(p.price || 0).toLocaleString('en-IN') }}</p>
        </div>
      </NuxtLink>

      <p v-if="!filteredProducts.length" class="empty-text">No products match your search.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })
useHead({ title: 'Products', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const { isAuthorized } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const products = ref([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.value.filter((p) => !q || (p.name || '').toLowerCase().includes(q))
})

function catalogImageUrl(p) {
  const img = (p.images || []).find((i) => i.catalogImage) || (p.images || [])[0]
  return img?.imageUrl || ''
}

async function loadProducts() {
  loading.value = true
  loadError.value = ''
  try {
    // Public endpoint (also used by the storefront) — no admin key required to read.
    products.value = await $fetch(`${apiBase}/collections`)
  } catch {
    loadError.value = 'Failed to load products.'
  } finally {
    loading.value = false
  }
}

watch(isAuthorized, (v) => {
  if (v) loadProducts()
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
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  max-width: 320px;
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

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s, transform 0.15s;
}

.product-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.product-thumb {
  aspect-ratio: 1;
  background: #f1eee9;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-thumb-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  color: var(--text-muted, #3f4f5f);
}

.product-card-body {
  padding: 0.85rem 1rem;
}

.product-name {
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
}

.product-price {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
}
</style>
