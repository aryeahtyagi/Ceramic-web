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
          :class="['collection-chip', { active: selectedCollection === collection.id }]"
          type="button"
          @click="() => handleCollectionClick(collection.id)"
        >
          <span class="chip-label">{{ collection.name }}</span>
        </button>
      </div>
    </section>

    <!-- Products List -->
    <section class="products-section">
      <h2 class="products-title">Products</h2>
      <div class="products-container">
        <template v-if="pending && loadedProducts.length === 0">
          <div v-for="n in 6" :key="`sk-${n}`" class="product-card skeleton" aria-hidden="true">
            <div class="product-image">
              <div class="skeleton-block"></div>
            </div>
            <div class="product-info">
              <div class="skeleton-line w-80"></div>
              <div class="skeleton-line w-95"></div>
              <div class="skeleton-line w-60"></div>
              <div class="product-footer">
                <div class="skeleton-line w-40"></div>
                <div class="skeleton-pill"></div>
              </div>
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
              <div class="product-price">Rs. {{ formatPrice(product.price) }}</div>
            </div>
          </NuxtLink>
        </template>
      </div>

      <!-- Empty State -->
      <div v-if="!pending && error" class="empty-state" role="alert">
        <p class="empty-title">Couldn't load products.</p>
        <p class="empty-sub">Check if your backend is running and CORS is enabled, then try again.</p>
        <button class="retry-btn" type="button" @click="refresh()">Retry</button>
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

const config = useRuntimeConfig()
const apiBase = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

// Debug: Log API base on client side
if (process.client) {
  console.log('🔧 API Base URL:', apiBase.value)
}

const route = useRoute()
const router = useRouter()
const cart = useCart()

// --- Menu ---
const menuOpen = ref(false)

const selectedCollection = computed(() => {
  // For /collections (without type), always show 'all'
  return 'all'
})
const query = ref('')

// Fetch collection types from API
const { data: typesData, pending: typesPending } = useFetch('/collections/type', {
  baseURL: apiBase
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

const { data, pending, error, refresh } = useFetch('/collections', {
  baseURL: apiBase
})

const apiItems = computed(() => {
  const v = data.value
  if (Array.isArray(v)) return v
  return []
})

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

const mapTypeToCategory = (typeValue) => {
  const t = normalizeType(typeValue)
  if (!t) return null
  if (t.includes('plate')) return 'plates'
  if (t.includes('bowl')) return 'bowls'
  if (t.includes('mug') || t.includes('cup')) return 'mugs'
  if (t.includes('vase')) return 'vases'
  return null
}

const extractCategoryFromDetails = (product) => {
  const details = Array.isArray(product?.productDetails) ? product.productDetails : []
  const typeRow = details.find((d) => normalizeType(d?.dimension?.name) === 'type')
  return mapTypeToCategory(typeRow?.value)
}

const inferCategoryFromName = (name) => {
  const n = normalizeType(name)
  if (n.includes('vase')) return 'vases'
  if (n.includes('mug') || n.includes('cup')) return 'mugs'
  if (n.includes('bowl')) return 'bowls'
  if (n.includes('plate') || n.includes('platter') || n.includes('dinner')) return 'plates'
  return null
}

const placeholderForCategory = (category) => {
  if (category === 'vases') return '/images/ceramic-vase.svg'
  if (category === 'mugs') return '/images/ceramic-mug.svg'
  if (category === 'plates') return '/images/ceramic-plate.svg'
  if (category === 'bowls') return '/images/ceramic-bowl.svg'
  return '/images/ceramic-plate.svg'
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
      return `${apiBase.value}${path}`
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = u.match(/localhost:\d+(\/.*)/)
      if (match) return `${apiBase.value}${match[1]}`
      return u
    }
  }
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return `${apiBase.value}${u}`
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

const products = computed(() =>
  apiItems.value.map((p) => {
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

const loadedProducts = computed(() => products.value)

const filteredProducts = computed(() => {
  const q = query.value.trim().toLowerCase()
  let list = loadedProducts.value

  if (!q) return list
  return list.filter(p => {
    const hay = `${p.name} ${p.description}`.toLowerCase()
    return hay.includes(q)
  })
})

const selectCollection = (collectionId) => {
  if (collectionId === 'all') {
    router.push('/collections')
  } else {
    router.push(`/collections/${collectionId}`)
  }
}

const handleCollectionClick = (collectionId) => {
  console.log('[Collections] Button clicked! Collection ID:', collectionId)
  console.log('[Collections] Current route:', route.path)
  selectCollection(collectionId)
}

const collectionName = (collectionId) => {
  const c = collections.find(x => x.id === collectionId)
  return c?.name ?? 'Collection'
}

const formatPrice = (price) => {
  const n = Number(price || 0)
  try {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(n)
  }
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

// SEO and Structured Data
const siteUrl = config.public.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')

// Watch products and generate schema
watch([() => filteredProducts.value], ([products]) => {
  if (!products || products.length === 0) return
  
  const pageTitle = 'Ceramic Collections - Handcrafted Ceramics'
  const pageDescription = 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs.'
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/collections`
  
  // Build CollectionPage schema
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: currentUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          '@id': typeof window !== 'undefined' ? `${window.location.origin}${productUrl(product)}` : `${siteUrl}${productUrl(product)}`,
          name: product.name,
          description: product.description || ''
        }
      }))
    }
  }
  
  // Build individual Product schemas
  const productSchemas = products.map(product => {
    const productImage = resolveImageUrl(product.image)
    const productUrlFull = typeof window !== 'undefined' ? `${window.location.origin}${productUrl(product)}` : `${siteUrl}${productUrl(product)}`
    
    // Get catalog image or first image from raw product data
    const catalogImage = product.raw?.images?.find(img => img.catalogImage) || product.raw?.images?.[0]
    const imageUrl = catalogImage?.imageUrl ? resolveImageUrl(catalogImage.imageUrl) : productImage
    
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || product.raw?.about || '',
      image: imageUrl ? [imageUrl] : undefined,
      url: productUrlFull,
      sku: String(product.id),
      brand: {
        '@type': 'Brand',
        name: 'SVRVE'
      },
      category: 'All Products',
      offers: {
        '@type': 'Offer',
        price: String(product.price),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: productUrlFull
      }
    }
    
    // Add discount information if available
    if (product.discountPercent && product.raw?.discounts) {
      productSchema.offers.priceValidUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days from now
    }
    
    // Remove undefined values
    Object.keys(productSchema).forEach(key => {
      if (productSchema[key] === undefined) {
        delete productSchema[key]
      }
    })
    if (productSchema.offers) {
      Object.keys(productSchema.offers).forEach(key => {
        if (productSchema.offers[key] === undefined) {
          delete productSchema.offers[key]
        }
      })
    }
    
    return productSchema
  })
  
  // Build Organization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SVRVE',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: []
  }
  
  // Build script tags for all schemas
  const scriptTags = [
    {
      type: 'application/ld+json',
      children: JSON.stringify(collectionPageSchema)
    },
    {
      type: 'application/ld+json',
      children: JSON.stringify(organizationSchema)
    }
  ]
  
  // Add individual product schemas
  productSchemas.forEach(schema => {
    scriptTags.push({
      type: 'application/ld+json',
      children: JSON.stringify(schema)
    })
  })
  
  useHead({
    title: pageTitle,
    meta: [
      {
        name: 'description',
        content: pageDescription
      }
    ],
    script: scriptTags
  })
}, { immediate: true })

// Initial SEO
useHead({
  title: 'Ceramic Collections - Handcrafted Ceramics',
  meta: [
    {
      name: 'description',
      content: 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs.'
    }
  ]
})
</script>

<style scoped>
.collection-page {
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-light);
  padding-bottom: 2.25rem;
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
  text-transform: none;
}

.banner-text::first-letter {
  text-transform: capitalize;
}

/* Header */
.topbar {
  position: sticky;
  top: 0;
  z-index: 150;
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
  background: rgba(250, 250, 250, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 14px;
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
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 38px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
  font-size: 0.95rem;
  color: var(--text-dark);
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
  color: rgba(44, 62, 80, 0.85);
  font-size: 1.25rem;
  line-height: 1;
}

.clear-btn:active {
  transform: scale(0.95);
}

.count {
  flex: 0 0 auto;
  font-size: 0.85rem;
  color: var(--text-muted);
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
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  color: #2c2c2c;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.collection-chip.active {
  border-color: #2c2c2c;
  border-width: 2px;
  font-weight: 500;
  background: #fff;
  color: #2c2c2c;
}

.collection-chip:active {
  transform: scale(0.98);
}

/* Products Section */
.products-section {
  padding: 14px;
}

.products-title {
  max-width: 720px;
  margin: 6px auto 12px;
  padding: 0 2px;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
}

.products-container {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-width: 720px;
  margin: 0 auto;
}

.product-card {
  background-color: #fff;
  overflow: hidden;
  transition: transform 0.18s ease;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card:active {
  transform: scale(0.985);
}

.product-image {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, #f6f6f6 0%, #ededed 100%);
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
  font-weight: 700;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  color: #fff;
  background: linear-gradient(135deg, #d32f2f, #f44336);
  z-index: 1;
}

.product-info {
  padding: 12px 0;
}

.product-name {
  font-size: 0.9375rem;
  font-weight: 400;
  color: #2c2c2c;
  margin-bottom: 4px;
  line-height: 1.5;
  letter-spacing: 0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.product-price {
  font-size: 0.9375rem;
  font-weight: 400;
  color: #2c2c2c;
  line-height: 1.5;
  letter-spacing: 0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-title {
  font-size: 1.1rem;
  color: rgba(44, 62, 80, 0.9);
  font-weight: 900;
  margin: 0 0 6px;
}

.empty-sub {
  margin: 0 auto 14px;
  max-width: 34ch;
  font-size: 0.92rem;
  color: var(--text-muted);
}

.retry-btn {
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 900;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.retry-btn:active {
  transform: scale(0.98);
}

/* Skeleton */
.skeleton {
  cursor: default;
}

.skeleton .product-image {
  background: #eee;
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
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  margin: 8px 0;
}

.skeleton-pill {
  width: 58px;
  height: 34px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.w-95 { width: 95%; }
.w-80 { width: 80%; }
.w-60 { width: 60%; }
.w-40 { width: 40%; }

@keyframes shimmer {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}

/* Tablet and larger screens */
@media (min-width: 768px) {
  .products-title {
    max-width: 1100px;
  }

  .products-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-width: 1100px;
    gap: 14px;
  }

  .controls {
    top: 56px;
  }

  .collection-chip:hover {
    transform: translateY(-1px);
  }

  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.09);
  }
}
</style>
