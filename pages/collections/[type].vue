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
        <h1 class="hero-title">{{ collectionTitle }}</h1>
        <p class="hero-subtitle">{{ collectionSubtitle }}</p>
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
          :class="['collection-chip', { active: currentType === collection.id }]"
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
                @error="handleImageError($event, product)"
              />
              <div v-if="product.discountPercent" class="discount-badge">
                {{ product.discountPercent }}% OFF
              </div>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p v-if="product.description" class="product-description">{{ product.description }}</p>
              <div class="product-footer">
                <div class="product-price">{{ formatPrice(product.price) }}</div>
                <div v-if="product.collection" class="product-badge">{{ collectionName(product.collection) }}</div>
              </div>
            </div>
          </NuxtLink>
        </template>
      </div>


      <div v-if="error && loadedProducts.length === 0" class="error-state">
        <p class="error-text">Failed to load products</p>
        <button class="retry-btn" type="button" @click="refresh()">Retry</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch, watchEffect, onMounted } from 'vue'
import { joinURL } from 'ufo'

const route = useRoute()
const router = useRouter()
const requestURL = useRequestURL()
const config = useRuntimeConfig()
const cart = useCart()
const apiBase = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

// Log on mount to verify this component is being used
onMounted(() => {
  console.log('[Collections Type] ===== COMPONENT MOUNTED =====')
  console.log('[Collections Type] Route path:', route.path)
  console.log('[Collections Type] Route params:', route.params)
  console.log('[Collections Type] Route name:', route.name)
})

const currentType = computed(() => {
  // Get the type from route params - in Nuxt dynamic routes, params.type should contain the segment
  // If route is /collections (without type), params.type will be undefined
  const typeParam = route.params.type
  const path = route.path
  
  // Debug logging
  console.log('[Collections Type] currentType computed - Route params:', route.params, 'Type param:', typeParam, 'Type:', typeof typeParam, 'Full path:', path, 'Route name:', route.name)
  
  // If we're on /collections (no type param), return 'all'
  if (!typeParam || path === '/collections' || path === '/collections/') {
    console.log('[Collections Type] No type param or on /collections, returning "all"')
    return 'all'
  }
  
  // Handle array case (shouldn't happen but be safe)
  if (Array.isArray(typeParam)) {
    const first = typeParam[0]
    if (!first) return 'all'
    const result = String(first).toLowerCase()
    console.log('[Collections Type] Array type param, returning:', result)
    return result
  }
  
  const typeStr = String(typeParam).toLowerCase().trim()
  console.log('[Collections Type] Type string:', typeStr)
  
  // Validate it's a valid collection type (check against fetched types)
  // The type will be validated when we try to find it in collectionsBase
  // For now, return the lowercase type string
  return typeStr
})

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
  const selected = currentType.value
  const base = collectionsBase.value
  if (selected === 'all') return base
  
  const allItem = base.find(c => c.id === 'all')
  const selectedItem = base.find(c => c.id === selected)
  const others = base.filter(c => c.id !== selected && c.id !== 'all')
  
  return selectedItem && allItem
    ? [allItem, selectedItem, ...others]
    : base
})

const collectionTitle = computed(() => {
  if (currentType.value === 'all') return 'Collections'
  const c = collectionsBase.value.find(x => x.id === currentType.value)
  return c ? `${c.name} Collection` : 'Collections'
})

const collectionSubtitle = computed(() => {
  if (currentType.value === 'all') return 'Pick a collection, search, and start browsing.'
  return `Browse our handcrafted ${currentType.value} collection`
})

// SEO meta tags
useHead({
  title: computed(() => {
    if (currentType.value === 'all') return 'Ceramic Collections - Handcrafted Ceramics'
    const c = collectionsBase.value.find(x => x.id === currentType.value)
    return c ? `${c.name} Collection - Handcrafted Ceramic ${c.name}` : 'Ceramic Collections'
  }),
  meta: [
    {
      name: 'description',
      content: computed(() => {
        if (currentType.value === 'all') {
          return 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs.'
        }
        const c = collectionsBase.value.find(x => x.id === currentType.value)
        return c
          ? `Browse our collection of handcrafted ceramic ${c.name.toLowerCase()}. Each piece is carefully crafted by skilled artisans.`
          : 'Discover beautiful handcrafted ceramic products.'
      })
    }
  ]
})

const query = ref('')

// Map frontend collection type (lowercase URL) to backend API format (original case from API)
const mapTypeToApiType = (type) => {
  if (type === 'all') return null
  
  // Find the collection in collectionsBase that matches the type
  const base = collectionsBase.value
  const collection = base.find(c => c.id === type)
  
  if (collection && collection.apiValue) {
    return collection.apiValue // Use the original API value (e.g., "Plates", "Mugs")
  }
  
  // Fallback: if types haven't loaded yet, try to capitalize first letter
  // This handles the case where the route changes before types are loaded
  if (type && type.length > 0) {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }
  
  return type
}

// Determine API endpoint based on current type
const apiEndpoint = computed(() => {
  const type = currentType.value
  if (type === 'all') {
    return '/collections'
  }
  const apiType = mapTypeToApiType(type)
  if (apiType) {
    const endpoint = `/collections/type/${apiType}`
    if (process.client) {
      console.log('[Collections Type] API Endpoint:', endpoint, 'for type:', type, 'apiType:', apiType)
    }
    return endpoint
  }
  return '/collections'
})

// Use $fetch directly with a watch to ensure API is called when route changes
const data = ref(null)
const pending = ref(false)
const error = ref(null)

const fetchData = async () => {
  // Wait for types to load if they're still pending
  if (typesPending.value) {
    console.log('[Collections Type] Waiting for types to load...')
    // Wait a bit for types to load
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Calculate endpoint directly from route param to ensure it's correct
  const typeParam = route.params.type
  const type = currentType.value
  const apiType = mapTypeToApiType(type)
  
  let endpoint = '/collections'
  if (type && type !== 'all' && apiType) {
    endpoint = `/collections/type/${apiType}`
  }
  
  const fullUrl = `${apiBase.value}${endpoint}`
  console.log('[Collections Type] fetchData called:')
  console.log('  - Route param:', typeParam)
  console.log('  - Current type:', type)
  console.log('  - API type:', apiType)
  console.log('  - Endpoint:', endpoint)
  console.log('  - Full URL:', fullUrl)
  console.log('  - Collections base:', collectionsBase.value)
  
  pending.value = true
  error.value = null
  
  try {
    const response = await $fetch(endpoint, {
      baseURL: apiBase.value
    })
    console.log('[Collections Type] API response received:', response)
    data.value = response
  } catch (err) {
    console.error('[Collections Type] API error:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Watch route params and fetch data when it changes
watch(() => route.path, async (newPath, oldPath) => {
  console.log('[Collections Type] ===== ROUTE PATH WATCH TRIGGERED =====')
  console.log('[Collections Type] Old path:', oldPath)
  console.log('[Collections Type] New path:', newPath)
  console.log('[Collections Type] Route params:', route.params)
  console.log('[Collections Type] Route name:', route.name)
  console.log('[Collections Type] Current type computed:', currentType.value)
  
  // Always fetch when route changes or on initial load
  if (newPath !== oldPath || !oldPath) {
    query.value = ''
    await fetchData()
  }
}, { immediate: true, flush: 'post' })

// Also watch route params directly
watch(() => route.params.type, async (newType, oldType) => {
  console.log('[Collections Type] Route param type changed:', oldType, '->', newType)
  if (newType !== oldType) {
    query.value = ''
    await fetchData()
  }
}, { immediate: false })

// Watch for types data to be loaded and refetch if needed
watch(() => typesData.value, async (newTypes, oldTypes) => {
  if (newTypes && Array.isArray(newTypes) && newTypes.length > 0 && !oldTypes) {
    console.log('[Collections Type] Types loaded, refetching data...')
    await fetchData()
  }
}, { immediate: false })

// Also watch currentType for UI updates
watch(currentType, (newType, oldType) => {
  console.log('[Collections Type] currentType changed:', oldType, '->', newType)
  if (newType !== oldType) {
    query.value = ''
  }
}, { immediate: false })

const refresh = () => {
  console.log('[Collections Type] refresh() called')
  fetchData()
}

const apiItems = computed(() => {
  const v = data.value
  // API now returns a direct array (no pagination wrapper)
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

// Products are loaded directly from API (no pagination)
const loadedProducts = computed(() => products.value)
const totalElements = computed(() => loadedProducts.value.length)

const filteredProducts = computed(() => {
  const q = query.value.trim().toLowerCase()
  let list = loadedProducts.value

  // No need to filter by type - backend API already returns filtered results
  // Just filter by search query if present

  if (!q) return list
  return list.filter(p => {
    const hay = `${p.name} ${p.description}`.toLowerCase()
    return hay.includes(q)
  })
})

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

const handleImageError = (event, product) => {
  const img = event.target
  const category = product.collection || 'plates'
  img.src = placeholderForCategory(category)
}

// Reset search and refresh API when collection type changes
watch(currentType, (newType, oldType) => {
  console.log('[Collections Type] currentType changed:', oldType, '->', newType)
  if (newType !== oldType) {
    query.value = ''
    // Force refresh to reload products for the new type
    console.log('[Collections Type] Calling refresh()')
    refresh()
  }
}, { immediate: false })

// Also watch route params directly to ensure API is called
watch(() => route.params.type, (newType, oldType) => {
  console.log('[Collections Type] Route param changed:', oldType, '->', newType, 'Full path:', route.path)
  if (newType !== oldType) {
    query.value = ''
    console.log('[Collections Type] Calling refresh() because route param changed')
    refresh()
  }
}, { immediate: true })

const handleCollectionClick = (collectionId) => {
  console.log('[Collections Type] Clicked:', collectionId, 'Current type:', currentType.value, 'Current route:', route.path)
  try {
    const targetPath = collectionId === 'all' ? '/collections' : `/collections/${collectionId}`
    console.log('[Collections Type] Navigating to:', targetPath)
    router.push(targetPath).then(() => {
      console.log('[Collections Type] Navigation successful')
      if (process.client) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }).catch(err => {
      console.error('[Collections Type] Navigation error:', err)
    })
  } catch (error) {
    console.error('[Collections Type] Error in handleCollectionClick:', error)
  }
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
// Only includes products for the current collection type
const collectionJsonLd = computed(() => {
  const collectionName = currentType.value === 'all' 
    ? 'All Collections' 
    : collectionsBase.value.find(c => c.id === currentType.value)?.name || 'Collection'
  
  const description = currentType.value === 'all'
    ? 'Discover our complete collection of handcrafted ceramic products including plates, bowls, mugs, and vases.'
    : `Browse our handcrafted ceramic ${collectionName.toLowerCase()} collection. Each piece is carefully crafted by skilled artisans.`

  // Filter products to ensure only the current collection type is included
  // The API should already filter, but this adds an extra safeguard
  let productsForSchema = loadedProducts.value
  if (currentType.value !== 'all') {
    // Double-check: filter by collection type to ensure schema only includes matching products
    productsForSchema = loadedProducts.value.filter(p => {
      const productCollection = p.collection?.toLowerCase() || ''
      return productCollection === currentType.value.toLowerCase()
    })
  }

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
      numberOfItems: productsForSchema.length,
      itemListElement: productsForSchema.map((p, index) => {
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

.icon-btn:active {
  transform: scale(0.96);
}

/* Hero */
.hero {
  padding: 16px 14px 10px;
  background: radial-gradient(1200px 280px at 20% 0%, rgba(244, 164, 96, 0.28), transparent 55%),
    radial-gradient(1000px 260px at 100% 0%, rgba(139, 69, 19, 0.18), transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(250, 250, 250, 0));
}

.hero-inner {
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-size: 1.6rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 6px 0 6px;
}

.hero-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Sticky controls */
.controls {
  background: rgba(250, 250, 250, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 14px 10px;
  position: sticky;
  top: 56px;
  z-index: 130;
  backdrop-filter: blur(12px);
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.search {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  height: 44px;
  padding: 0 40px 0 40px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.search-ic {
  position: absolute;
  left: 14px;
  font-size: 1.05rem;
  opacity: 0.75;
}

.search-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
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

.count-muted {
  color: var(--text-muted-2);
  font-weight: 800;
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
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}

.product-description {
  font-size: 0.82rem;
  color: var(--text-muted-2);
  margin: 0 0 10px;
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

.product-badge {
  font-size: 0.75rem;
  font-weight: 900;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(44, 62, 80, 0.85);
}

.error-state {
  text-align: center;
  padding: 3rem 1rem;
}

.error-text {
  color: var(--text-muted);
  margin-bottom: 14px;
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

.load-more-trigger {
  height: 1px;
  margin: 20px 0;
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
