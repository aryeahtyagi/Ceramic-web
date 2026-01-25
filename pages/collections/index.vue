<template>
  <div class="collection-page">
    <!-- Mobile Top Bar -->
    <header class="topbar">
      <NuxtLink to="/" class="brand">
        <span class="brand-mark" aria-hidden="true">🏺</span>
        <span class="brand-text">Ceramic Artistry</span>
      </NuxtLink>

      <div class="topbar-actions">
        <NuxtLink to="/cart" class="cart-link" aria-label="Shopping cart">
          🛒
          <span v-if="cart.totalQty.value" class="cart-badge" aria-label="Cart items">{{ cart.totalQty.value }}</span>
        </NuxtLink>
        <button class="icon-btn" type="button" aria-label="Scroll to top" @click="scrollToTop">
          ↑
        </button>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">Collections</h1>
        <p class="hero-subtitle">Pick a collection, search, and start browsing.</p>
      </div>
    </section>

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
          :disabled="typesPending"
        >
          <span class="chip-ic" aria-hidden="true">{{ collection.icon }}</span>
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
              <span class="badge">{{ collectionName(product.collection) }}</span>
              <span v-if="product.discountPercent" class="discount-badge">{{ product.discountPercent }}% OFF</span>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-description">{{ product.description }}</p>

              <div class="product-footer">
                <span class="product-price">{{ formatPrice(product.price) }}</span>
                <span class="view-pill" aria-hidden="true">View</span>
              </div>
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
import { ref, computed, watch, watchEffect } from 'vue'
import { joinURL } from 'ufo'

const config = useRuntimeConfig()
const apiBase = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

const route = useRoute()
const router = useRouter()
const requestURL = useRequestURL()
const cart = useCart()

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
      
      // Use lowercase for URL id, keep original for API
      const id = value.toLowerCase()
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

// Reorder collections: "All" always first, then selected one, then others
const collections = computed(() => {
  const selected = selectedCollection.value
  const base = collectionsBase.value
  if (selected === 'all') return base
  
  const allItem = base.find(c => c.id === 'all')
  const selectedItem = base.find(c => c.id === selected)
  const others = base.filter(c => c.id !== selected && c.id !== 'all')
  
  return selectedItem && allItem
    ? [allItem, selectedItem, ...others]
    : base
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
  scrollToTop()
}

const handleCollectionClick = (collectionId) => {
  console.log('[Collections] Button clicked! Collection ID:', collectionId)
  console.log('[Collections] Current route:', route.path)
  selectCollection(collectionId)
}

const collectionName = (collectionId) => {
  const c = collectionsBase.value.find(x => x.id === collectionId)
  return c?.name ?? 'Collection'
}

const formatPrice = (price) => {
  const n = Number(price || 0)
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `₹${n}`
  }
}

const scrollToTop = () => {
  if (process.client) window.scrollTo({ top: 0, behavior: 'smooth' })
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

// --- JSON-LD for SEO ---
const appBase = computed(() => String(config.app?.baseURL || '/'))
const origin = computed(() => requestURL.origin)

const canonicalPath = computed(() => String(route.path || '/collections'))
const canonicalUrl = computed(() => {
  const path = canonicalPath.value.replace(/^\//, '')
  return joinURL(origin.value, appBase.value, path)
})

const absUrl = (u) => {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  const path = s.replace(/^\//, '')
  return joinURL(origin.value, appBase.value, path)
}

// Generate CollectionPage and ItemList JSON-LD (simplified - Google best practice)
const collectionJsonLd = computed(() => {
  const collectionName = 'All Collections'
  const description = 'Discover our complete collection of handcrafted ceramic products including plates, bowls, mugs, and vases. Each piece is carefully crafted by skilled artisans.'

  // Calculate offer price for each product
  const getOfferPrice = (p) => {
    const discountPercent = p.discountPercent || 0
    const listPrice = Number(p.price || 0)
    return discountPercent > 0 
      ? Math.round((listPrice * (100 - discountPercent)) / 100)
      : listPrice
  }

  // Base website URL (update with your actual domain)
  const websiteUrl = joinURL(origin.value, appBase.value).replace(/\/$/, '')
  const organizationId = `${websiteUrl}#organization`
  const websiteId = `${websiteUrl}#website`

  const graph = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: 'Ceramic Artistry',
      url: websiteUrl,
      logo: absUrl('/images/ceramic-plate.svg') // Update with your actual logo URL
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: websiteUrl,
      name: 'Ceramic Artistry',
      publisher: {
        '@id': organizationId
      }
    },
    {
      '@type': 'CollectionPage',
      '@id': `${canonicalUrl.value}#webpage`,
      url: canonicalUrl.value,
      name: `${collectionName} - Ceramic Artistry`,
      description,
      mainEntity: {
        '@id': `${canonicalUrl.value}#itemlist`
      }
    },
    {
      '@type': 'ItemList',
      '@id': `${canonicalUrl.value}#itemlist`,
      name: `${collectionName} Products`,
      description,
      numberOfItems: loadedProducts.value.length,
      itemListElement: loadedProducts.value.map((p, index) => {
        const productUrlFull = absUrl(productUrl(p))
        const images = [p.image].filter(Boolean).map(absUrl).filter(Boolean)
        const offerPrice = getOfferPrice(p)
        
        // Simplified product info (Google best practice for collection pages)
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            '@id': productUrlFull,
            name: p.name,
            url: productUrlFull,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': productUrlFull
            },
            ...(images.length ? { image: images[0] } : {}),
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: String(offerPrice),
              availability: 'https://schema.org/InStock'
            }
          }
        }
      })
    }
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  }
})

// Inject JSON-LD into head
watchEffect(() => {
  if (!collectionJsonLd.value || loadedProducts.value.length === 0) return
  
  useHead({
    script: [
      {
        key: 'ld-collection',
        type: 'application/ld+json',
        children: JSON.stringify(collectionJsonLd.value)
      }
    ],
    link: [
      {
        key: 'canonical-collection',
        rel: 'canonical',
        href: canonicalUrl.value
      }
    ]
  })
})
</script>

<style scoped>
.collection-page {
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-light);
  padding-bottom: 2.25rem;
}

/* Top bar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 140;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: rgba(250, 250, 250, 0.92);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-dark);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.14), rgba(210, 105, 30, 0.14));
}

.brand-text {
  font-size: 1rem;
}

.topbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cart-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-dark);
  border-radius: 12px;
  font-size: 1.25rem;
  text-decoration: none;
  transition: background 0.2s;
}

.cart-link:hover {
  background: rgba(255, 255, 255, 1);
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

.icon-btn {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-dark);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
}

/* Hero */
.hero {
  padding: 20px 14px 16px;
  text-align: center;
}

.hero-inner {
  max-width: 720px;
  margin: 0 auto;
}

.hero-title {
  font-size: 1.85rem;
  font-weight: 1000;
  color: var(--text-dark);
  margin: 0 0 8px;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
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
  gap: 8px;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
  color: rgba(44, 62, 80, 0.92);
  padding: 10px 12px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.collection-chip.active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  box-shadow: 0 10px 18px rgba(139, 69, 19, 0.22);
}

.collection-chip:active {
  transform: scale(0.98);
}

.chip-ic {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
}

.collection-chip.active .chip-ic {
  background: rgba(255, 255, 255, 0.18);
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
  background-color: var(--bg-white);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.07);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card:active {
  transform: scale(0.985);
}

.product-image {
  width: 100%;
  aspect-ratio: 4 / 5;
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

.badge {
  position: absolute;
  left: 10px;
  top: 10px;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: rgba(44, 62, 80, 0.85);
  backdrop-filter: blur(10px);
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
  padding: 12px 12px 12px;
}

.product-name {
  font-size: 0.98rem;
  font-weight: 900;
  color: var(--text-dark);
  margin-bottom: 6px;
  letter-spacing: -0.01em;
}

.product-description {
  font-size: 0.82rem;
  color: var(--text-muted-2);
  margin-bottom: 10px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.product-price {
  font-size: 1.05rem;
  font-weight: 1000;
  color: var(--primary-color);
}

.view-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 900;
  white-space: nowrap;
  color: rgba(44, 62, 80, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
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
