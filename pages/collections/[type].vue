<template>
  <div class="collection-page">
    <!-- Top Banner -->
    <div class="top-banner">
      <p class="banner-text">Designed to impress, Made to use</p>
    </div>

    <!-- Header -->
    <header class="topbar">
      <button class="menu-btn" type="button" aria-label="Menu" @click="menuOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
      <NuxtLink to="/" class="brand-logo">
        <span class="logo-text">SVRVE</span>
        <span class="logo-dot">•</span>
      </NuxtLink>
      <div class="topbar-actions">
        <button class="cart-btn" type="button" @click="router.push('/cart')" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span v-if="cart.totalQty.value" class="cart-badge" aria-label="Cart items">{{ cart.totalQty.value }}</span>
        </button>
        <AccountDropdown />
      </div>
    </header>

    <!-- Hamburger Menu -->
    <HamburgerMenu :is-open="menuOpen" @close="menuOpen = false" />

    <!-- Sticky Controls (search + chips) -->
    <section class="controls">
      <h2 id="collections-heading" class="sr-only">Collections</h2>
      <div class="search-row">
        <div class="search">
          <span class="search-ic" aria-hidden="true">⌕</span>
          <input
            v-model="query"
            class="search-input"
            type="search"
            autocomplete="off"
            inputmode="search"
            placeholder="Search plates, mugs, vases…"
            aria-label="Search products"
          />
          <button v-if="query" class="clear-btn" type="button" aria-label="Clear search" @click="query = ''">
            ×
          </button>
        </div>
        <div class="count">
          {{ filteredProducts.length }} item<span v-if="filteredProducts.length !== 1">s</span>
        </div>
      </div>

      <div class="collections-container" aria-labelledby="collections-heading">
        <button
          v-for="collection in collections"
          :key="collection.id"
          :class="['collection-chip', { active: currentType === collection.id }]"
          type="button"
          @click="() => handleCollectionClick(collection.id)"
          :disabled="typesPending"
        >
          <span class="chip-label">{{ collection.name }}</span>
        </button>
      </div>
    </section>

    <!-- Products List -->
    <section class="products-section">
      <div class="products-container">
        <template v-if="pending && loadedProducts.length === 0">
          <div v-for="n in 6" :key="`sk-${n}`" class="product-card skeleton" aria-hidden="true">
            <div class="product-image">
              <div class="skeleton-block"></div>
            </div>
            <div class="product-info">
              <div class="skeleton-line w-80"></div>
              <div class="skeleton-line w-60"></div>
            </div>
          </div>
        </template>

        <template v-else>
          <NuxtLink
            v-for="(product, idx) in filteredProducts"
            :key="product.id"
            class="product-card"
            :to="productUrl(product)"
            :aria-label="`View ${product.name}`"
          >
            <div class="product-image">
              <img
                class="product-img"
                :src="product.image"
                :alt="product.name"
                :loading="idx < 2 ? 'eager' : 'lazy'"
                decoding="async"
                :fetchpriority="idx === 0 ? 'high' : 'auto'"
                referrerpolicy="no-referrer"
                crossorigin="anonymous"
              />
              <span v-if="product.discountPercent" class="discount-badge">{{ product.discountPercent }}% OFF</span>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <span class="product-price">{{ formatPrice(product.price) }}</span>
            </div>
          </NuxtLink>
        </template>
      </div>

      <div v-if="error && loadedProducts.length === 0" class="error-state">
        <p class="error-text">Couldn't load products.</p>
        <button class="retry-btn" type="button" @click="refresh">Retry</button>
      </div>

      <div v-else-if="!pending && filteredProducts.length === 0" class="empty-state">
        <p class="empty-title">No products found.</p>
        <p class="empty-sub">Try a different search or collection.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { joinURL } from 'ufo'

const route = useRoute()
const router = useRouter()
const requestURL = useRequestURL()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const siteUrl = String(config.public.siteUrl || 'https://svrve.com').replace(/\/$/, '')
const cart = useCart()

// --- Menu ---
const menuOpen = ref(false)
const query = ref('')

// Get current type from route
const currentType = computed(() => {
  const typeParam = route.params.type
  if (!typeParam || route.path === '/collections' || route.path === '/collections/') return 'all'
  return String(typeParam).toLowerCase()
})

// Helper: get API type string from raw types response and route type param
function getApiTypeFromTypes(typesData, typeParam) {
  if (!typeParam || typeParam === 'all') return null
  const arr = Array.isArray(typesData) ? typesData : []
  const normalizedParam = String(typeParam).toLowerCase().replace(/[-\s]+/g, ' ')
  const found = arr.find(item => {
    const value = String(item?.value || '').trim()
    const id = value.toLowerCase().replace(/\s+/g, '-')
    const idNorm = id.replace(/-/g, ' ')
    return idNorm === normalizedParam || id === normalizedParam.replace(/ /g, '-')
  })
  if (found && found.value) return String(found.value).toLowerCase().replace(/\s+/g, '-')
  if (normalizedParam.includes('mug')) return 'mugs'
  if (normalizedParam.includes('vase')) return 'vases'
  if (normalizedParam.includes('bowl')) return 'bowls'
  if (normalizedParam.includes('plate')) return 'plates'
  return null
}

// Server-side fetch: collection types
const { data: typesData, pending: typesPending } = await useFetch('/collections/type', {
  baseURL: apiBase,
  key: 'collections-type'
})

// Map type value to icon
const getTypeIcon = (typeName) => {
  const name = String(typeName || '').toLowerCase()
  if (name.includes('plate')) return '🍽️'
  if (name.includes('bowl')) return '🥣'
  if (name.includes('vase')) return '🏺'
  if (name.includes('mug')) return '☕'
  return '✨'
}

// Transform API response to collection format
const collectionsBase = computed(() => {
  const base = [{ id: 'all', name: 'All', icon: '✨', apiValue: null }]
  
  if (typesData.value && Array.isArray(typesData.value)) {
    const types = typesData.value.map(item => {
      const value = String(item?.value || '').trim()
      if (!value) return null
      
      // Use lowercase with hyphens for URL id (better URL compatibility)
      // Keep original for API calls
      const id = value.toLowerCase().replace(/\s+/g, '-')
      return {
        id,
        name: value,
        icon: getTypeIcon(value),
        apiValue: value // Original value from API for API calls
      }
    }).filter(Boolean)
    
    return [...base, ...types]
  }
  
  // Fallback to default if API hasn't loaded yet
  return base
})

// Collections - always return in the same order (no reordering)
const collections = computed(() => {
  return collectionsBase.value
})

// Get API type from collections data (for getApiType used elsewhere)
const getApiType = (type) => {
  if (!type || type === 'all') return null
  const normalizedType = String(type || '').toLowerCase().replace(/[-\s]+/g, ' ')
  const collection = collectionsBase.value.find(c => {
    const normalizedId = String(c.id || '').toLowerCase().replace(/[-\s]+/g, ' ')
    return normalizedId === normalizedType
  })
  if (collection && collection.apiValue) return String(collection.apiValue).trim().toLowerCase().replace(/\s+/g, '-')
  const t = String(type || '').toLowerCase()
  if (t.includes('mug')) return 'mugs'
  if (t.includes('vase')) return 'vases'
  if (t.includes('bowl')) return 'bowls'
  if (t.includes('plate')) return 'plates'
  return null
}

// Server-side fetch: products for current type (runs on server so View Source has full HTML)
const { data: productsData, pending, error, refresh } = await useFetch(() => {
  const apiType = getApiTypeFromTypes(typesData.value, currentType.value)
  return apiType ? `${apiBase}/collections/type/${apiType}` : `${apiBase}/collections`
}, {
  key: computed(() => `collections-type-${currentType.value}`)
})
const loadedProducts = computed(() => (Array.isArray(productsData.value) ? productsData.value : []))

// Clear search when navigating to another collection
watch(() => route.params.type, () => { query.value = '' })

// Helper functions
const normalizeType = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const isBlockedImageHost = (url) => {
  const u = String(url || '').trim()
  if (!u) return false
  if (u.includes('img.icons8.com')) return true
  return false
}

const resolveImageUrl = (url) => {
  const u = String(url || '').trim()
  if (!u) return ''
  if (isBlockedImageHost(u)) return ''
  // Replace localhost URLs with configured API base
  if (u.includes('localhost:9090') || u.includes('localhost:')) {
    try {
      const urlObj = new URL(u)
      const path = urlObj.pathname + urlObj.search
      return `${apiBase}${path}`
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = u.match(/localhost:\d+(\/.*)/)
      if (match) return `${apiBase}${match[1]}`
      return u
    }
  }
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return `${apiBase}${u}`
  return u
}

const pickBackendImage = (p) => {
  const direct = p?.image?.value
  if (direct) return resolveImageUrl(direct)

  const images = Array.isArray(p?.images) ? p.images : []
  const catalog = images.find(x => x?.catalogImage)
  if (catalog?.imageUrl) return resolveImageUrl(catalog.imageUrl)
  if (images[0]?.imageUrl) return resolveImageUrl(images[0].imageUrl)

  return ''
}

const placeholderForCategory = (category) => {
  if (category === 'vases') return '/images/ceramic-vase.svg'
  if (category === 'mugs') return '/images/ceramic-mug.svg'
  if (category === 'plates') return '/images/ceramic-plate.svg'
  if (category === 'bowls') return '/images/ceramic-bowl.svg'
  return '/images/ceramic-plate.svg'
}

const extractCategoryFromDetails = (product) => {
  const details = Array.isArray(product?.productDetails) ? product.productDetails : []
  const typeRow = details.find((d) => normalizeType(d?.dimension?.name) === 'type')
  return typeRow?.value ? normalizeType(typeRow.value) : null
}

const inferCategoryFromName = (name) => {
  const n = normalizeType(name)
  if (n.includes('vase')) return 'vases'
  if (n.includes('mug') || n.includes('cup')) return 'mugs'
  if (n.includes('bowl')) return 'bowls'
  if (n.includes('plate') || n.includes('platter') || n.includes('dinner')) return 'plates'
  return null
}

const products = computed(() =>
  loadedProducts.value.map((p) => {
    const name = p?.name || 'Ceramic Product'
    const description = p?.description || p?.about || ''
    const category = extractCategoryFromDetails(p) || inferCategoryFromName(name) || 'plates'
    const backendImage = pickBackendImage(p)
    const discountPercent = p?.discounts?.enable ? Number(p?.discounts?.discount || 0) : 0
    return {
      id: p?.id,
      name,
      description,
      price: Number(p?.price || 0),
      collection: category,
      image: backendImage || placeholderForCategory(category),
      discountPercent: discountPercent > 0 ? discountPercent : null,
      raw: p
    }
  })
)

const filteredProducts = computed(() => {
  const q = query.value.trim().toLowerCase()
  let list = products.value

  if (!q) return list
  return list.filter(p => {
    const hay = `${p.name} ${p.description}`.toLowerCase()
    return hay.includes(q)
  })
})

const handleCollectionClick = (collectionId) => {
  if (collectionId === 'all') {
    router.push('/collections')
  } else {
    router.push(`/collections/${collectionId}`)
  }
}

const collectionName = (collectionId) => {
  const c = collectionsBase.value.find(x => x.id === collectionId)
  return c?.name ?? 'Collection'
}

const formatPrice = (price) => {
  const n = Number(price || 0)
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
  return `Rs. ${formatted}`
}

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const productUrl = (product) => {
  const slug = slugify(product.name)
  return `/product/${slug}-${product.id}`
}

const collectionTitle = computed(() => {
  if (currentType.value === 'all') return 'Collections'
  const c = collectionsBase.value.find(x => x.id === currentType.value)
  return c ? `${c.name} Collection` : 'Collections'
})

// Dynamic SEO with useHead (runs on server so View Source has full meta + schema)
useHead(() => {
  const products = filteredProducts.value
  const type = currentType.value
  const currentCollection = collectionsBase.value.find(x => x.id === type)
  const collectionName = currentCollection?.name || 'All Products'
  const pageTitle = type === 'all' ? 'Ceramic Collections - Handcrafted Ceramics' : `${collectionName} Collection - Handcrafted Ceramic ${collectionName}`
  const pageDescription = type === 'all'
    ? 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs.'
    : `Browse our collection of handcrafted ceramic ${collectionName.toLowerCase()}. Each piece is carefully crafted by skilled artisans.`
  const currentUrl = `${siteUrl}/collections/${type === 'all' ? '' : type}`.replace(/\/$/, '') || `${siteUrl}/collections`

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: currentUrl,
    mainEntity: products.length
      ? {
          '@type': 'ItemList',
          numberOfItems: products.length,
          itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: { '@type': 'Product', '@id': `${siteUrl}${productUrl(product)}`, name: product.name, description: product.description || '' }
          }))
        }
      : undefined
  }
  if (!collectionPageSchema.mainEntity) delete collectionPageSchema.mainEntity

  const productSchemas = products.map(product => {
    const catalogImage = product.raw?.images?.find(img => img.catalogImage) || product.raw?.images?.[0]
    const imageUrl = catalogImage?.imageUrl ? resolveImageUrl(catalogImage.imageUrl) : resolveImageUrl(product.image)
    const productUrlFull = `${siteUrl}${productUrl(product)}`
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || product.raw?.about || '',
      image: imageUrl ? [imageUrl] : undefined,
      url: productUrlFull,
      sku: String(product.id),
      brand: { '@type': 'Brand', name: 'SVRVE' },
      category: collectionName,
      offers: { '@type': 'Offer', price: String(product.price), priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: productUrlFull }
    }
    if (product.discountPercent && product.raw?.discounts) schema.offers.priceValidUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    Object.keys(schema).forEach(k => { if (schema[k] === undefined) delete schema[k] })
    if (schema.offers) Object.keys(schema.offers).forEach(k => { if (schema.offers[k] === undefined) delete schema.offers[k] })
    return schema
  })

  const organizationSchema = { '@context': 'https://schema.org', '@type': 'Organization', name: 'SVRVE', url: siteUrl, logo: `${siteUrl}/logo.png`, sameAs: [] }
  const scriptTags = [
    { type: 'application/ld+json', children: JSON.stringify(collectionPageSchema) },
    { type: 'application/ld+json', children: JSON.stringify(organizationSchema) },
    ...productSchemas.map(ps => ({ type: 'application/ld+json', children: JSON.stringify(ps) }))
  ]
  return {
    title: pageTitle,
    link: [{ rel: 'canonical', href: currentUrl }],
    meta: [{ name: 'description', content: pageDescription }],
    script: scriptTags
  }
})
</script>

<style scoped>
.collection-page {
  width: 100%;
  min-height: 100vh;
  background-color: #fff;
}

/* Top Banner */
.top-banner {
  background: #fafafa;
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.banner-text {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #666;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  letter-spacing: 0.05em;
}

/* Header */
.topbar {
  position: sticky;
  top: 0;
  z-index: 140;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn svg {
  width: 24px;
  height: 24px;
  stroke: #333;
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

.topbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cart-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-btn svg {
  width: 20px;
  height: 20px;
  stroke: #333;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #d32f2f;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

/* Controls */
.controls {
  position: sticky;
  top: 56px;
  z-index: 130;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 20px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.search {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-ic {
  position: absolute;
  left: 12px;
  font-size: 1.1rem;
  color: #666;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 38px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
  color: #333;
}

.clear-btn {
  position: absolute;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.06);
  color: #333;
  font-size: 1.25rem;
  line-height: 1;
}

.count {
  flex: 0 0 auto;
  font-size: 0.85rem;
  color: #666;
  font-weight: 700;
}

.collections-container {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.collections-container::-webkit-scrollbar {
  display: none;
}

.collection-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  color: #2c2c2c;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  border-radius: 0;
}

.collection-chip:hover {
  border-color: rgba(0, 0, 0, 0.2);
  background: #fafafa;
}

.collection-chip.active {
  color: #2c2c2c;
  border-color: #2c2c2c;
  background: #fff;
  border-width: 2px;
  font-weight: 500;
}

.collection-chip:active {
  transform: scale(0.98);
}

.collection-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Products Section */
.products-section {
  padding: 24px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.products-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.product-card {
  background-color: #fff;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  transition: transform 0.2s ease;
  cursor: pointer;
  border: none;
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card:hover {
  opacity: 0.9;
}

.product-card:active {
  transform: scale(0.98);
}

.product-image {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.discount-badge {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 0.75rem;
  font-weight: 1000;
  padding: 6px 10px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #1f7a5c, #2aa87d);
  box-shadow: 0 10px 18px rgba(31, 122, 92, 0.22);
}

.product-info {
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.product-name {
  font-size: 0.9375rem;
  font-weight: 400;
  color: #2c2c2c;
  margin: 0;
  letter-spacing: 0.01em;
  line-height: 1.5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.product-price {
  font-size: 0.9375rem;
  font-weight: 400;
  color: #2c2c2c;
  letter-spacing: 0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Skeleton */
.skeleton {
  background: #f5f5f5;
}

.skeleton-block {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  margin: 8px 0;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.w-80 { width: 80%; }
.w-60 { width: 60%; }

/* Error/Empty States */
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.error-text,
.empty-title {
  color: #666;
  margin-bottom: 14px;
  font-size: 1rem;
}

.empty-sub {
  color: #999;
  font-size: 0.875rem;
}

.retry-btn {
  border: none;
  border-radius: 0;
  padding: 12px 16px;
  font-weight: 500;
  cursor: pointer;
  color: #fff;
  background: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: 0.875rem;
}

.retry-btn:active {
  transform: scale(0.98);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@media (min-width: 768px) {
  .products-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
</style>
