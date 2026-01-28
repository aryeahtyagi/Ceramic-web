<template>
  <div class="product-page">
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

    <div class="content">
      <section v-if="pending" class="loading">
        <div class="img-skel"></div>
        <div class="line w-70"></div>
        <div class="line w-90"></div>
        <div class="line w-60"></div>
      </section>

      <section v-else-if="error || !product" class="error">
        <h1 class="error-title">Couldn’t load product</h1>
        <p class="error-sub">
          Please check your backend and try again.
        </p>
        <button class="retry" type="button" @click="refresh()">Retry</button>
      </section>

      <section v-else class="product">
        <!-- Product Media -->
        <div class="media">
          <div 
            class="image-swiper"
            tabindex="0"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseEnd"
            @mouseleave="handleMouseEnd"
            @keydown="handleKeyDown"
          >
            <div 
              class="image-container"
              :class="{ dragging: isDragging }"
              :style="{ transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))` }"
            >
              <img
                v-for="(img, idx) in gallery"
                :key="`gallery-${idx}-${img}`"
                class="hero-img"
                :src="img"
                :alt="`${product.name} image ${idx + 1}`"
                :loading="idx === 0 ? 'eager' : 'lazy'"
                :fetchpriority="idx === 0 ? 'high' : undefined"
                decoding="async"
                referrerpolicy="no-referrer"
                crossorigin="anonymous"
              />
            </div>

            <div v-if="gallery.length > 1" class="image-nav">
              <button
                v-if="currentImageIndex > 0"
                type="button"
                class="nav-btn nav-prev"
                @click="goToPrevious"
                aria-label="Previous image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                v-if="currentImageIndex < gallery.length - 1"
                type="button"
                class="nav-btn nav-next"
                @click="goToNext"
                aria-label="Next image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div v-if="gallery.length > 1" class="image-indicators">
              <button
                v-for="(img, idx) in gallery"
                :key="`indicator-${idx}`"
                type="button"
                class="indicator"
                :class="{ active: idx === currentImageIndex }"
                @click="goToImage(idx)"
                :aria-label="`Go to image ${idx + 1}`"
              />
            </div>

            <div v-if="discountPercent" class="discount-badge">{{ discountPercent }}% OFF</div>
            
            <button 
              type="button" 
              class="zoom-btn"
              @click="openZoomModal"
              aria-label="Zoom image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="info">
          <div class="product-header">
            <span class="handmade-tag">HANDMADE</span>
          </div>

          <h1 class="product-name">{{ product.name }}</h1>

          <div class="rating-section">
            <div class="stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= starRating }">★</span>
            </div>
            <span v-if="reviewsCount > 0" class="reviews-text">
              {{ averageRating }}/5 ({{ reviewsCount }} review{{ reviewsCount !== 1 ? 's' : '' }})
            </span>
            <span v-else class="reviews-text">No reviews yet</span>
          </div>

          <div class="price-section">
            <span class="price">{{ formatPrice(offerPrice || product.price) }}</span>
            <span v-if="discountPercent" class="original-price">{{ formatPrice(product.price) }}</span>
            <span v-if="selectedQuantity > 1" class="qty-total">
              for {{ selectedQuantity }} pcs · {{ formatPrice(totalSelectedPrice) }}
            </span>
          </div>

          <!-- Quantity Selection -->
          <div class="quantity-section">
            <label class="quantity-label">QUANTITY</label>
            <div class="quantity-controls">
              <button class="qty-btn" type="button" @click="selectedQuantity = Math.max(1, selectedQuantity - 1)" aria-label="Decrease">
                −
              </button>
              <span class="qty-value">{{ selectedQuantity }}</span>
              <button class="qty-btn" type="button" @click="selectedQuantity++" aria-label="Increase">
                +
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="add-to-cart-btn" type="button" @click="addCurrentToCart">
              ADD TO CART
            </button>
            <button class="buy-now-btn" type="button" @click="handleBuyNow">
              BUY IT NOW
            </button>
          </div>

          <!-- Shipping Info -->
          <div class="shipping-info">
            <p>Dispatches within 3-4 business days. Cash on delivery available.</p>
          </div>

          <!-- Product Description -->
          <div v-if="product.description || product.about" class="description-section">
            <h2 class="section-title">Description</h2>
            <p class="description-text">{{ product.description || product.about }}</p>
          </div>

          <!-- Features/Benefits -->
          <div v-if="lovePoints.length > 0" class="features-section">
            <h2 class="section-title">Features</h2>
            <ul class="features-list">
              <li v-for="point in lovePoints" :key="point.id || point.value" class="feature-item">
                {{ point.value }}
              </li>
            </ul>
          </div>

          <!-- Expandable Sections -->
          <div class="expandable-sections">
            <div 
              v-if="specifications.length"
              class="expandable-section"
              :class="{ expanded: expandedSections.material }"
            >
              <button 
                class="section-header"
                type="button"
                @click="toggleSection('material')"
              >
                <span>MATERIAL & SPECIFICATIONS</span>
                <span class="toggle-icon">{{ expandedSections.material ? '−' : '+' }}</span>
              </button>
              <div v-if="expandedSections.material" class="section-content">
                <table class="specifications-table">
                  <tbody>
                    <tr
                      v-for="spec in specifications"
                      :key="spec.id"
                      class="spec-row"
                    >
                      <td class="spec-label">{{ spec.label }}</td>
                      <td class="spec-value">{{ spec.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="expandable-section" :class="{ expanded: expandedSections.shipping }">
              <button 
                class="section-header"
                type="button"
                @click="toggleSection('shipping')"
              >
                <span>SHIPPING & RETURNS</span>
                <span class="toggle-icon">{{ expandedSections.shipping ? '−' : '+' }}</span>
              </button>
              <div v-if="expandedSections.shipping" class="section-content">
                <p>Dispatches within 3-4 business days. Cash on delivery available. Easy returns within 7 days of delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Zoom Modal -->
      <Transition name="zoom-modal">
        <div v-if="showZoomModal" class="zoom-modal-overlay" @click="closeZoomModal">
          <div class="zoom-modal-content" @click.stop>
            <button class="zoom-close-btn" type="button" @click="closeZoomModal" aria-label="Close zoom">
              ×
            </button>
            <div 
              class="zoom-image-container"
              @mousedown="startPan"
              @mousemove="handlePan"
              @mouseup="endPan"
              @mouseleave="endPan"
              @wheel.prevent="handleWheelZoom"
            >
              <img
                :src="gallery[currentImageIndex]"
                :alt="product.name"
                class="zoom-image"
                :style="{ 
                  transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
                  transition: zoomLevel <= 1 ? 'transform 0.3s' : 'none'
                }"
              />
            </div>
            <div class="zoom-controls">
              <button class="zoom-control-btn" type="button" @click="zoomIn" aria-label="Zoom in">+</button>
              <button class="zoom-control-btn" type="button" @click="zoomOut" aria-label="Zoom out">−</button>
              <button class="zoom-control-btn" type="button" @click="resetZoom" aria-label="Reset zoom">Reset</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div v-if="toast" class="toast" role="status" aria-live="polite">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { joinURL } from 'ufo'

const route = useRoute()
const requestURL = useRequestURL()
const config = useRuntimeConfig()
const apiBase = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

const slug = computed(() => String(route.params.slug || ''))
const id = computed(() => {
  const m = slug.value.match(/-(\d+)$/)
  return m ? m[1] : null
})

const { data, pending, error, refresh } = useFetch(() => `/collections/${id.value}`, {
  baseURL: apiBase,
  immediate: computed(() => Boolean(id.value))
})

const raw = computed(() => (data.value && typeof data.value === 'object' ? data.value : null))

const normalize = (v) =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const mapTypeToCategory = (typeValue) => {
  const t = normalize(typeValue)
  if (!t) return null
  if (t.includes('plate')) return 'plates'
  if (t.includes('bowl')) return 'bowls'
  if (t.includes('mug') || t.includes('cup')) return 'mugs'
  if (t.includes('vase')) return 'vases'
  return null
}

const extractCategoryFromDetails = (product) => {
  const details = Array.isArray(product?.productDetails) ? product.productDetails : []
  const typeRow = details.find((d) => normalize(d?.dimension?.name) === 'type')
  return mapTypeToCategory(typeRow?.value)
}

const placeholderForCategory = (category) => {
  if (category === 'vases') return '/images/ceramic-vase.svg'
  if (category === 'mugs') return '/images/ceramic-mug.svg'
  if (category === 'bowls') return '/images/ceramic-bowl.svg'
  return '/images/ceramic-plate.svg'
}

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
  const catalog = images.find((x) => x?.catalogImage)
  if (catalog?.imageUrl) return resolveImageUrl(catalog.imageUrl)
  if (images[0]?.imageUrl) return resolveImageUrl(images[0].imageUrl)
  return ''
}

const product = computed(() => {
  const p = raw.value
  if (!p) return null
  const name = p?.name || 'Ceramic Product'
  const category = extractCategoryFromDetails(p) || 'plates'
  return {
    id: p?.id,
    name,
    description: p?.description || '',
    about: p?.about || '',
    price: Number(p?.price || 0),
    category,
    discounts: p?.discounts || null,
    benefits: Array.isArray(p?.benefits) ? p.benefits : [],
    lovePoints: Array.isArray(p?.productLovePoints) ? p.productLovePoints : [],
    productDetails: Array.isArray(p?.productDetails) ? p.productDetails : [],
    images: Array.isArray(p?.images) ? p.images : [],
    hero: pickBackendImage(p)
  }
})

const gallery = computed(() => {
  const p = product.value
  if (!p) return []
  const list = []

  if (p.hero) list.push(p.hero)

  for (const img of p.images) {
    const u = resolveImageUrl(img?.imageUrl)
    if (u) list.push(u)
  }

  // de-dupe
  return Array.from(new Set(list))
})

const heroImage = ref('/images/ceramic-plate.svg')
const currentImageIndex = ref(0)

watchEffect(() => {
  const p = product.value
  if (!p) return
  const firstImage = gallery.value[0] || placeholderForCategory(p.category)
  heroImage.value = firstImage
  currentImageIndex.value = 0
})

// Update heroImage when currentImageIndex changes
watch(currentImageIndex, (idx) => {
  if (gallery.value[idx]) {
    heroImage.value = gallery.value[idx]
  }
})

// Swipe handling
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragOffset = ref(0)

const minSwipeDistance = 50

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const deltaX = currentX - touchStartX.value
  const deltaY = currentY - touchStartY.value
  
  // Only allow horizontal swipe if it's more horizontal than vertical
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    dragOffset.value = deltaX
  }
}

const handleTouchEnd = (e) => {
  if (!isDragging.value) return
  
  touchEndX.value = e.changedTouches[0].clientX
  touchEndY.value = e.changedTouches[0].clientY
  
  const deltaX = touchEndX.value - touchStartX.value
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(touchEndY.value - touchStartY.value)
  
  // Only process swipe if it's more horizontal than vertical
  if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
    if (deltaX > 0) {
      goToPrevious()
    } else {
      goToNext()
    }
  }
  
  isDragging.value = false
  dragOffset.value = 0
}

const handleMouseDown = (e) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  touchStartX.value = e.clientX
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStartX.value
  dragOffset.value = deltaX
}

const handleMouseEnd = () => {
  if (!isDragging.value) return
  
  const absDeltaX = Math.abs(dragOffset.value)
  if (absDeltaX > minSwipeDistance) {
    if (dragOffset.value > 0) {
      goToPrevious()
    } else {
      goToNext()
    }
  }
  
  isDragging.value = false
  dragOffset.value = 0
}

const goToImage = (index) => {
  if (index >= 0 && index < gallery.value.length) {
    currentImageIndex.value = index
  }
}

const goToNext = () => {
  if (currentImageIndex.value < gallery.value.length - 1) {
    currentImageIndex.value++
  }
}

const goToPrevious = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const handleKeyDown = (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goToPrevious()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goToNext()
  }
}

// --- Auth & Cart ---
const auth = useAuth()
const cart = useCart()
const router = useRouter()

// --- Menu ---
const menuOpen = ref(false)

const productQty = computed(() => {
  const p = product.value
  if (!p?.id) return 0
  return cart.getQty(Number(p.id))
})

const toast = ref('')
let toastTimer = null

const showToast = (msg) => {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 1800)
}

const checkAuth = () => {
  if (!auth.isAuthenticated.value) {
    const currentPath = route.fullPath
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
    return false
  }
  return true
}

const selectedQuantity = ref(1)

const addCurrentToCart = async () => {
  if (!checkAuth()) return

  const p = product.value
  if (!p?.id) return
  
  const success = await cart.addItem(
    {
      id: Number(p.id),
      name: p.name,
      price: Number(p.price || 0),
      image: gallery.value[currentImageIndex.value] || heroImage.value,
      slug: String(route.params.slug || '')
    },
    selectedQuantity.value
  )
  
  if (success) {
    showToast('Added to cart')
  } else {
    showToast('Failed to update cart. Please try again.')
  }
}

const handleBuyNow = async () => {
  await addCurrentToCart()
  if (cart.totalQty.value > 0) {
    router.push('/cart')
  }
}

const handleQtyChange = async (action) => {
  if (!checkAuth()) return

  const p = product.value
  if (!p?.id) return

  let success = false
  if (action === 'inc') {
    success = await cart.inc(Number(p.id), 1)
  } else if (action === 'dec') {
    success = await cart.dec(Number(p.id), 1)
  }
  
  if (!success) {
    showToast('Failed to update cart. Please try again.')
  }
}

const showCartToast = () => {
  const n = cart.totalQty.value
  if (!n) {
    showToast('Cart is empty')
    return
  }
  showToast(`${n} item${n === 1 ? '' : 's'} in cart`)
}

const discountPercent = computed(() => {
  const d = product.value?.discounts
  if (!d?.enable) return null
  const n = Number(d?.discount || 0)
  return n > 0 ? n : null
})

const categoryLabel = computed(() => {
  const c = product.value?.category
  if (c === 'plates') return 'Plates'
  if (c === 'bowls') return 'Bowls'
  if (c === 'mugs') return 'Mugs'
  if (c === 'vases') return 'Vases'
  return null
})

const benefits = computed(() => product.value?.benefits || [])
const lovePoints = computed(() => product.value?.lovePoints || [])

const detailsRows = computed(() => {
  const rows = []
  const details = product.value?.productDetails || []
  for (const d of details) {
    const key = d?.dimension?.name
    if (!key || normalize(key) === 'type') continue
    const unit = d?.dimension?.unit || ''
    const val = d?.value ?? ''
    const value = unit ? `${val} ${unit}` : String(val)
    rows.push({ key, value })
  }
  return rows
})

// Reviews
const reviewsCount = computed(() => {
  const p = product.value
  if (p?.reviewsMetaData?.reviews) {
    return Number(p.reviewsMetaData.reviews) || 0
  }
  return Array.isArray(p?.reviews) ? p.reviews.length : 0
})

const averageRating = computed(() => {
  const p = product.value
  if (p?.reviewsMetaData?.rating) {
    const rating = Number(p.reviewsMetaData.rating)
    return rating > 0 ? rating.toFixed(1) : '0.0'
  }
  const reviews = p?.reviews
  if (Array.isArray(reviews) && reviews.length > 0) {
    const ratings = reviews.map(r => Number(r.rating || 0)).filter(r => r > 0)
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      return avg.toFixed(1)
    }
  }
  return '0.0'
})

const starRating = computed(() => {
  const rating = Number(averageRating.value)
  return Math.round(rating)
})

// Material & Specifications
const specifications = computed(() => {
  const p = product.value
  if (!p) return []
  const details = Array.isArray(p.productDetails) ? p.productDetails : []

  return details
    .map((d) => {
      const label = d?.dimension?.name
      const value = d?.value
      if (!label || !value) return null
      return {
        id: d.id || `${label}-${value}`,
        label,
        value
      }
    })
    .filter(Boolean)
})

// Expandable sections
const expandedSections = ref({
  material: false,
  shipping: false
})

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// Zoom modal
const showZoomModal = ref(false)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)

const openZoomModal = () => {
  showZoomModal.value = true
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
  if (process.client) {
    document.body.style.overflow = 'hidden'
  }
}

const closeZoomModal = () => {
  showZoomModal.value = false
  resetZoom()
  if (process.client) {
    document.body.style.overflow = ''
  }
}

const zoomIn = () => {
  zoomLevel.value = Math.min(5, zoomLevel.value + 0.5)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.5)
  if (zoomLevel.value <= 1) {
    panX.value = 0
    panY.value = 0
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const handleWheelZoom = (e) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.5, Math.min(5, zoomLevel.value + delta))
  zoomLevel.value = newZoom
  if (newZoom <= 1) {
    panX.value = 0
    panY.value = 0
  }
}

const startPan = (e) => {
  if (zoomLevel.value <= 1) return
  isPanning.value = true
  panStartX.value = e.clientX - panX.value
  panStartY.value = e.clientY - panY.value
}

const handlePan = (e) => {
  if (!isPanning.value || zoomLevel.value <= 1) return
  panX.value = e.clientX - panStartX.value
  panY.value = e.clientY - panStartY.value
}

const endPan = () => {
  isPanning.value = false
}

const formatPrice = (price) => {
  const n = Number(price || 0)
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `₹${n}`
  }
}

const safeImg = (u) => {
  const s = resolveImageUrl(u)
  return s || ''
}

// --- JSON-LD (client-side; SSR is off) ---
const appBase = computed(() => String(config.app?.baseURL || '/'))
// Prefer configured public site URL for SEO so we always emit https://svrve.com links in production
const siteOrigin = computed(() => {
  const cfg = String(config.public.siteUrl || '').trim()
  if (cfg) {
    return cfg.replace(/\/$/, '')
  }
  // Fallback to current origin (useful in dev)
  return requestURL.origin
})

const canonicalPath = computed(() => String(route.path || '/'))
const canonicalUrl = computed(() => {
  const path = canonicalPath.value.replace(/^\//, '')
  return joinURL(siteOrigin.value, appBase.value, path)
})

const absUrl = (u) => {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  // Public assets should respect Nuxt baseURL on GitHub Pages
  const path = s.replace(/^\//, '')
  return joinURL(siteOrigin.value, appBase.value, path)
}

const priceValidUntil = computed(() => {
  // "Two months from now" rolling window, formatted YYYY-MM-DD (recommended by Google).
  const d = new Date()
  d.setMonth(d.getMonth() + 2)
  // Ensure valid ISO date even across month boundaries
  return d.toISOString().slice(0, 10)
})

const offerPrice = computed(() => {
  const p = product.value
  if (!p) return null
  const list = Number(p.price || 0)
  const d = discountPercent.value
  if (!d) return list
  const sale = Math.round((list * (100 - d)) / 100)
  return sale
})

const totalSelectedPrice = computed(() => {
  const p = product.value
  if (!p) return 0
  const unit = offerPrice.value ?? Number(p.price || 0)
  return unit * Math.max(1, Number(selectedQuantity.value || 1))
})

const additionalPropsLd = computed(() => {
  const rows = detailsRows.value || []
  return rows.map((r) => ({
    '@type': 'PropertyValue',
    name: r.key,
    value: r.value
  }))
})

const breadcrumbsLd = computed(() => {
  const home = joinURL(siteOrigin.value, appBase.value)
  const collections = joinURL(siteOrigin.value, appBase.value, 'collections')
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: collections },
      { '@type': 'ListItem', position: 3, name: product.value?.name || 'Product', item: canonicalUrl.value }
    ]
  }
})

const productJsonLd = computed(() => {
  const p = product.value
  if (!p) return null

  const desc = p.description || p.about || 'Handcrafted ceramic product.'
  const imgs = (gallery.value.length ? gallery.value : [placeholderForCategory(p.category)]).map(absUrl).filter(Boolean)
  const sku = String(p.id ?? '')

  const offer = {
    '@type': 'Offer',
    url: canonicalUrl.value,
    priceCurrency: 'INR',
    // Google expects Offer.price as a string
    price: String(offerPrice.value ?? Number(p.price || 0)),
    priceValidUntil: priceValidUntil.value,
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'Ceramic Artistry' }
  }

  const graph = [
    breadcrumbsLd.value,
    {
      '@type': 'Product',
      '@id': `${canonicalUrl.value}#product`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl.value },
      name: p.name,
      description: desc,
      ...(imgs.length ? { image: imgs } : {}),
      ...(sku ? { sku } : {}),
      ...(categoryLabel.value ? { category: categoryLabel.value } : {}),
      brand: { '@type': 'Brand', name: 'Ceramic Artistry' },
      offers: offer,
      ...(additionalPropsLd.value.length ? { additionalProperty: additionalPropsLd.value } : {})
    }
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  }
})

// Basic client-side meta (SSR is off, but still useful for share previews in-app)
watchEffect(() => {
  const p = product.value
  if (!p) return
  useHead({
    // Temporary hardcoded SEO title/description (can be replaced by API-driven values later)
    title: 'Forest Green Ceramic Dinner Set (12 Pieces) | SVRVE',
    link: canonicalUrl.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
    meta: [
      {
        name: 'description',
        content:
          'Buy premium forest green ceramic dinner set (12 pieces). Microwave-safe, dishwasher-safe stoneware collection from SVRVE.'
      },
      { property: 'og:title', content: 'Forest Green Ceramic Dinner Set (12 Pieces) | SVRVE' },
      {
        property: 'og:description',
        content:
          'Buy premium forest green ceramic dinner set (12 pieces). Microwave-safe, dishwasher-safe stoneware collection from SVRVE.'
      },
      ...(heroImage.value ? [{ property: 'og:image', content: absUrl(heroImage.value) }] : [])
    ]
  })
})

watchEffect(() => {
  if (!productJsonLd.value) return
  useHead({
    script: [
      {
        key: 'ld-product',
        type: 'application/ld+json',
        children: JSON.stringify(productJsonLd.value)
      }
    ]
  })
})

// Hint the browser to prioritize the hero image (helps LCP)
watchEffect(() => {
  const href = heroImage.value ? absUrl(heroImage.value) : ''
  if (!href) return
  useHead({
    link: [
      {
        key: 'preload-hero',
        rel: 'preload',
        as: 'image',
        href,
        fetchpriority: 'high'
      }
    ]
  })
})
</script>

<style scoped>
.product-page {
  min-height: 100vh;
  background: #fff;
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

.content {
  padding: 14px;
  max-width: 860px;
  margin: 0 auto;
}

.loading .img-skel {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.loading .line {
  height: 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  margin: 10px 0;
}

.w-90 { width: 90%; }
.w-70 { width: 70%; }
.w-60 { width: 60%; }

@keyframes shimmer {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}

.error {
  text-align: center;
  padding: 26px 10px;
}

.error-title {
  font-size: 1.25rem;
  margin: 0 0 8px;
}

.error-sub {
  margin: 0 auto 14px;
  max-width: 38ch;
  color: var(--text-muted);
}

.retry {
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 900;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.product {
  display: grid;
  gap: 14px;
}

.media {
  position: relative;
}

.image-swiper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08);
  background: #eee;
  touch-action: pan-y pinch-zoom;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
}

.image-swiper:focus-visible {
  outline: 3px solid var(--primary-color, #8B4513);
  outline-offset: 2px;
}

.image-container {
  display: flex;
  width: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.image-container.dragging {
  transition: none;
}

.hero-img {
  width: 100%;
  flex-shrink: 0;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  pointer-events: none;
}

.image-nav {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dark, #2c3e50);
  transition: all 0.2s ease;
  z-index: 11;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-50%) scale(1.05);
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.nav-prev {
  left: 12px;
}

.nav-next {
  right: 12px;
}

.image-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 11;
  pointer-events: none;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  pointer-events: all;
  transition: all 0.2s ease;
  padding: 0;
}

.indicator.active {
  background: rgba(255, 255, 255, 1);
  width: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.discount-badge {
  position: absolute;
  right: 12px;
  top: 12px;
  font-size: 0.8rem;
  font-weight: 1000;
  padding: 8px 10px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #1f7a5c, #2aa87d);
  box-shadow: 0 10px 18px rgba(31, 122, 92, 0.22);
}

.thumbs {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}
.thumbs::-webkit-scrollbar { display: none; }

.thumb {
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 14px;
  flex: 0 0 auto;
  cursor: pointer;
  outline: none;
}

.thumb img {
  width: 70px;
  height: 70px;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.thumb.active img {
  border-color: rgba(139, 69, 19, 0.7);
}

.info {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
}

.title {
  margin: 0 0 6px;
  font-size: 1.4rem;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0 0 10px;
  color: var(--text-muted);
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0 6px;
}

.price {
  font-size: 1.35rem;
  font-weight: 1000;
  color: var(--primary-color);
}

.chip {
  font-weight: 900;
  font-size: 0.85rem;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(44, 62, 80, 0.9);
}

.about {
  margin: 10px 0 0;
  color: rgba(44, 62, 80, 0.9);
  line-height: 1.5;
}

.section {
  margin-top: 16px;
}

.h2 {
  font-size: 1.05rem;
  margin: 0 0 10px;
}

.benefits {
  display: grid;
  gap: 10px;
}

.benefit {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.7);
}

.benefit-ic {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.benefit-title {
  font-weight: 900;
}
.benefit-sub {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.bullets {
  margin: 0;
  padding-left: 18px;
  color: rgba(44, 62, 80, 0.9);
}
.bullets li { margin: 8px 0; }

.details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin: 0;
}

.details dt {
  font-weight: 900;
  color: rgba(44, 62, 80, 0.9);
}

.details dd {
  margin: 0;
  color: var(--text-muted);
}

@media (min-width: 768px) {
  .product {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

/* Purchase bar */
.purchase-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 160;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(250, 250, 250, 0.96);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.purchase-price {
  font-weight: 1000;
  font-size: 1.05rem;
  color: var(--text-dark);
}

.purchase-sub {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.add-btn {
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 1000;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.add-btn:active {
  transform: scale(0.98);
}

.qty {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.qty-btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 900;
  color: rgba(44, 62, 80, 0.92);
  background: rgba(0, 0, 0, 0.06);
}

.qty-btn:active {
  transform: scale(0.96);
}

.qty-val {
  width: 30px;
  text-align: center;
  font-weight: 1000;
}

.toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 88px;
  z-index: 170;
  background: rgba(44, 62, 80, 0.92);
  color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 0.9rem;
  max-width: 92vw;
}

/* Product Info Styles */
.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.handmade-tag {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  padding: 4px 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
}

.product-name {
  font-size: 1.5rem;
  font-weight: 400;
  color: #2c2c2c;
  margin: 0 0 16px;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1rem;
  color: #ddd;
}

.star.filled {
  color: #ffc107;
}

.reviews-text {
  font-size: 0.875rem;
  color: #666;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}

.price {
  font-size: 1.5rem;
  font-weight: 400;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.original-price {
  font-size: 1.125rem;
  color: #999;
  text-decoration: line-through;
}

.qty-total {
  font-size: 0.875rem;
  color: #666;
  margin-left: auto;
}

.quantity-section {
  margin-bottom: 24px;
}

.quantity-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 8px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  width: fit-content;
}

.qty-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #fff;
  color: #333;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.qty-btn:hover {
  background: #f5f5f5;
}

.qty-value {
  min-width: 60px;
  text-align: center;
  font-weight: 500;
  font-size: 1rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.add-to-cart-btn,
.buy-now-btn {
  width: 100%;
  padding: 16px;
  border: 1px solid #2c2c2c;
  background: #fff;
  color: #2c2c2c;
  font-size: 0.875rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.buy-now-btn {
  background: #2c2c2c;
  color: #fff;
}

.add-to-cart-btn:hover {
  background: #f5f5f5;
}

.buy-now-btn:hover {
  background: #000;
}

.shipping-info {
  padding: 16px;
  background: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
}

.shipping-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
}

.description-section,
.features-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2c2c2c;
  margin: 0 0 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.description-text {
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.6;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.feature-item:last-child {
  border-bottom: none;
}

.expandable-sections {
  margin-top: 32px;
}

.expandable-section {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.section-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.toggle-icon {
  font-size: 1.5rem;
  font-weight: 300;
  color: #666;
}

.section-content {
  padding-bottom: 16px;
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.6;
}

/* Specifications Table */
.specifications-table {
  margin-top: 12px;
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.spec-row {
  border-bottom: 1px solid #e5e5e5;
  transition: background-color 0.2s ease;
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-row:hover {
  background-color: #f9f9f9;
}

.spec-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9375rem;
  padding: 14px 16px;
  width: 40%;
  vertical-align: top;
  border-right: 1px solid #e5e5e5;
}

.spec-value {
  color: #555;
  font-size: 0.9375rem;
  padding: 14px 16px;
  vertical-align: top;
}

@media (max-width: 640px) {
  .spec-label {
    width: 35%;
    padding: 12px 14px;
    font-size: 0.875rem;
  }

  .spec-value {
    padding: 12px 14px;
    font-size: 0.875rem;
  }
}

/* Zoom Button */
.zoom-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.zoom-btn svg {
  width: 20px;
  height: 20px;
  stroke: #333;
}

/* Zoom Modal */
.zoom-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.zoom-modal-content {
  position: relative;
  width: 100%;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zoom-close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-image-container {
  width: 100%;
  height: 80vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.zoom-image-container:active {
  cursor: grabbing;
}

.zoom-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
}

.zoom-controls {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.zoom-control-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.zoom-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.zoom-modal-enter-active,
.zoom-modal-leave-active {
  transition: opacity 0.3s;
}

.zoom-modal-enter-from,
.zoom-modal-leave-to {
  opacity: 0;
}
</style>

