<template>
  <div class="page">
    <header class="page-header">
      <NuxtLink to="/admin/products" class="back-link">&larr; Products</NuxtLink>
      <div class="title-row">
        <h1 class="page-title">Edit product</h1>
        <a v-if="product" :href="storefrontUrl" target="_blank" rel="noopener" class="view-link">View on site &#8599;</a>
      </div>
    </header>

    <p v-if="savedFlash" class="saved-flash">Saved.</p>
    <p v-if="loadError" class="load-error">{{ loadError }}</p>
    <p v-else-if="loading" class="loading-text">Loading…</p>

    <template v-else-if="product">
      <AdminProductForm :initial-data="product" @saved="handleProductSaved" />

      <section class="block">
        <h2 class="block-title">Images</h2>
        <AdminProductImageManager :product-id="product.id" />
      </section>

      <section class="block">
        <h2 class="block-title">SEO</h2>
        <AdminProductSeoForm :product-id="product.id" :product="product" />
      </section>

      <section class="block">
        <h2 class="block-title">Reviews</h2>
        <AdminProductReviews :product-id="product.id" />
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })
useHead({ title: 'Edit product', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const { isAuthorized } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const siteUrl = String(config.public.siteUrl || 'https://svrve.com').replace(/\/$/, '')
const route = useRoute()

const product = ref(null)
const loading = ref(false)
const loadError = ref('')
const savedFlash = ref(false)

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Matches pages/collections/index.vue's productUrl() exactly.
const storefrontUrl = computed(() =>
  product.value ? `${siteUrl}/product/${slugify(product.value.name)}-${product.value.id}` : ''
)

async function loadProduct() {
  loading.value = true
  loadError.value = ''
  try {
    product.value = await $fetch(`${apiBase}/collections/${route.params.id}`)
  } catch {
    loadError.value = 'Failed to load this product — it may not exist.'
  } finally {
    loading.value = false
  }
}

function handleProductSaved(saved) {
  product.value = { ...product.value, ...saved }
  savedFlash.value = true
  setTimeout(() => { savedFlash.value = false }, 2000)
}

watch(isAuthorized, (v) => {
  if (v) loadProduct()
}, { immediate: true })
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  margin-bottom: -0.5rem;
}

.back-link {
  font-size: 0.8rem;
  color: var(--text-muted, #3f4f5f);
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.view-link {
  font-size: 0.85rem;
  color: var(--primary-color, #8B4513);
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}

.saved-flash {
  margin: 0;
  padding: 0.6rem 1rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.load-error {
  color: #dc2626;
  font-size: 0.9rem;
}

.loading-text {
  color: var(--text-muted, #3f4f5f);
  font-size: 0.9rem;
}

.block {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.block-title {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 700;
}

.page :deep(.product-form) {
  max-width: none;
}
</style>
