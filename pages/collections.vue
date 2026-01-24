<template>
  <div class="collection-page">
    <!-- Mobile Top Bar -->
    <header class="topbar">
      <NuxtLink to="/" class="brand">
        <span class="brand-mark" aria-hidden="true">🏺</span>
        <span class="brand-text">Ceramic Artistry</span>
      </NuxtLink>

      <div class="topbar-actions">
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
          <span v-if="totalElements !== null" class="count-muted"> / {{ totalElements }}</span>
        </div>
      </div>

      <div class="collections-container" aria-labelledby="collections-heading">
        <button
          v-for="collection in collections"
          :key="collection.id"
          :class="['collection-chip', { active: selectedCollection === collection.id }]"
          type="button"
          @click="selectCollection(collection.id)"
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
          <div v-for="n in pageSize" :key="`sk-${n}`" class="product-card skeleton" aria-hidden="true">
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
        <p class="empty-title">Couldn’t load products.</p>
        <p class="empty-sub">Check if your backend is running and CORS is enabled, then try again.</p>
        <button class="retry-btn" type="button" @click="refresh()">Retry</button>
      </div>

      <div v-else-if="!pending && filteredProducts.length === 0" class="empty-state">
        <p class="empty-title">No products found.</p>
        <p class="empty-sub">Try a different search or collection.</p>
      </div>

      <!-- Infinite scroll footer -->
      <div v-if="!error && loadedProducts.length > 0" class="infinite-footer">
        <div ref="sentinel" class="sentinel" aria-hidden="true"></div>

        <div v-if="pending && loadedProducts.length > 0" class="loading-more" aria-live="polite">
          Loading more…
        </div>

        <!-- Fallback button (in case IntersectionObserver is blocked / for accessibility) -->
        <button
          v-if="canLoadMore && !pending"
          class="pager-btn primary"
          type="button"
          @click="loadMore"
        >
          Load more
        </button>

        <div v-else-if="!canLoadMore && !pending" class="end">
          You’ve reached the end.
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const config = useRuntimeConfig()
const apiBase = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

const route = useRoute()
const router = useRouter()

const selectedCollection = ref('all')
const query = ref('')

const pageSize = ref(10)
const page = ref(0)

const collections = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'plates', name: 'Plates', icon: '🍽️' },
  { id: 'bowls', name: 'Bowls', icon: '🥣' },
  { id: 'vases', name: 'Vases', icon: '🏺' },
  { id: 'mugs', name: 'Mugs', icon: '☕' }
]

const loadedProducts = ref([])
const totalPages = ref(null) // number | null
const totalElements = ref(null) // number | null

const clampInt = (v, fallback) => {
  const n = Number.parseInt(String(v), 10)
  return Number.isFinite(n) ? n : fallback
}

// Sync state from URL query (?page=0&size=10)
watch(
  () => route.query,
  (q) => {
    const nextPage = Math.max(0, clampInt(q.page, 0))
    const nextSize = Math.min(50, Math.max(1, clampInt(q.size, 10)))

    const prevPage = page.value
    const prevSize = pageSize.value

    const changed = nextPage !== prevPage || nextSize !== prevSize
    page.value = nextPage
    pageSize.value = nextSize

    // Decide whether we should replace or append the list:
    // - size change => replace
    // - page decreases or jumps forward by >1 => replace
    // - page increments by exactly 1 => append (Load more)
    if (changed) {
      const isNext = nextPage === prevPage + 1 && nextSize === prevSize
      const isJump = nextPage > prevPage + 1 || nextSize !== prevSize || nextPage < prevPage
      if (isJump && !isNext) {
        loadedProducts.value = []
      }
      // No need to call refresh(): useFetch will refetch automatically when query changes.
    }
  },
  { immediate: true }
)

const { data, pending, error, refresh } = useFetch('/collections', {
  baseURL: apiBase,
  query: computed(() => ({ page: page.value, size: pageSize.value }))
})

const apiItems = computed(() => {
  const v = data.value
  if (Array.isArray(v)) return v
  if (v && Array.isArray(v.content)) return v.content
  if (v && Array.isArray(v.data)) return v.data
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
  // Block known third-party image host that sets cookies (seen in Lighthouse report).
  // You can later replace this with your own image CDN/backend URLs.
  if (u.includes('img.icons8.com')) return true
  return false
}

const mapTypeToCategory = (typeValue) => {
  const t = normalizeType(typeValue)
  if (!t) return null

  // common variants: "Plates", "Plate", "Mugs", "Mug", "Bowls", "Bowl", "Vases", "Vase"
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
  // Prefer p.image.value (CDN URL), otherwise prefer catalogImage from images[], else first imageUrl.
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

// Append or replace loadedProducts when a page arrives
watch(
  () => data.value,
  (v) => {
    if (!v) return

    // Update meta if it's a Spring Page-like response
    if (v && !Array.isArray(v)) {
      if (typeof v.totalPages === 'number') totalPages.value = v.totalPages
      if (typeof v.totalElements === 'number') totalElements.value = v.totalElements
    } else {
      // Unknown meta when API returns a bare array
      totalPages.value = null
      totalElements.value = null
    }

    // Accumulate pages (load more UX)
    const next = products.value
    if (page.value === 0 || loadedProducts.value.length === 0) {
      loadedProducts.value = next
      return
    }

    const existingIds = new Set(loadedProducts.value.map(p => p.id))
    const merged = [...loadedProducts.value]
    for (const p of next) {
      if (!existingIds.has(p.id)) merged.push(p)
    }
    loadedProducts.value = merged
  },
  { immediate: true }
)

const filteredProducts = computed(() => {
  const q = query.value.trim().toLowerCase()

  let list = loadedProducts.value
  if (selectedCollection.value !== 'all') {
    list = list.filter(product => product.collection === selectedCollection.value)
  }

  if (!q) return list
  return list.filter(p => {
    const hay = `${p.name} ${p.description}`.toLowerCase()
    return hay.includes(q)
  })
})

const selectCollection = (collectionId) => {
  selectedCollection.value = collectionId
  scrollToTop()
}

const collectionName = (collectionId) => {
  const c = collections.find(x => x.id === collectionId)
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
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const productUrl = (p) => {
  const base = slugify(p?.name) || 'product'
  const id = p?.id ?? ''
  return `/product/${base}-${id}`
}

const canLoadMore = computed(() => {
  // If API returns totalPages, use it. Otherwise best-effort: if last fetched page filled size, assume more.
  if (totalPages.value !== null) return page.value + 1 < totalPages.value
  return apiItems.value.length === pageSize.value
})

const updateQuery = async (nextPage, nextSize = pageSize.value) => {
  await router.replace({
    query: {
      ...route.query,
      page: String(nextPage),
      size: String(nextSize)
    }
  })
}

// Infinite scroll trigger
const sentinel = ref(null)
const autoLoadLock = ref(false)
let io = null

const maybeAutoLoad = async () => {
  if (autoLoadLock.value) return
  if (pending.value) return
  if (!canLoadMore.value) return

  autoLoadLock.value = true
  try {
    await loadMore()
  } finally {
    // Give the UI a moment; prevents rapid-fire triggers on short lists.
    setTimeout(() => {
      autoLoadLock.value = false
    }, 250)
  }
}

const loadMore = async () => {
  if (!canLoadMore.value || pending.value) return
  await updateQuery(page.value + 1)
}

onMounted(() => {
  if (!process.client) return
  if (!('IntersectionObserver' in window)) return

  io = new IntersectionObserver(
    (entries) => {
      const hit = entries.some((e) => e.isIntersecting)
      if (hit) maybeAutoLoad()
    },
    {
      // start loading before the user hits the exact bottom
      root: null,
      rootMargin: '600px 0px',
      threshold: 0.01
    }
  )

  if (sentinel.value) io.observe(sentinel.value)
})

watch(sentinel, (el, prev) => {
  if (!process.client) return
  if (!io) return
  if (prev) io.unobserve(prev)
  if (el) io.observe(el)
})

watch(canLoadMore, (v) => {
  if (!io) return
  if (!v && sentinel.value) {
    io.unobserve(sentinel.value)
  }
})

onBeforeUnmount(() => {
  if (io) io.disconnect()
  io = null
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

/* Infinite footer */
.infinite-footer {
  max-width: 720px;
  margin: 14px auto 0;
  display: grid;
  gap: 10px;
  align-items: center;
  padding: 0 2px;
}

.sentinel {
  height: 1px;
}

.loading-more,
.end {
  text-align: center;
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--text-muted);
}

.pager-btn {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999px;
  padding: 12px 14px;
  font-weight: 900;
  cursor: pointer;
  color: rgba(44, 62, 80, 0.92);
}

.pager-btn.primary {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.pager-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

  .infinite-footer {
    max-width: 1100px;
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
