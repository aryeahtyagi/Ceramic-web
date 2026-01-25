<template>
  <div class="orders-page">
    <header class="topbar">
      <NuxtLink to="/purchased" class="back" aria-label="Back">
        ←
      </NuxtLink>
      <div class="topbar-title">My Orders</div>
      <div class="topbar-spacer"></div>
    </header>

    <div class="content">
      <!-- Loading State -->
      <section v-if="pending" class="loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your orders...</p>
      </section>

      <!-- Error State -->
      <section v-else-if="error" class="error">
        <h1 class="error-title">Couldn't load orders</h1>
        <p class="error-sub">
          {{ errorMessage }}
        </p>
        <button class="retry" type="button" @click="loadOrders">Retry</button>
      </section>

      <!-- Empty Orders -->
      <section v-else-if="!orderItems.length" class="empty-orders">
        <div class="empty-icon">📦</div>
        <h2 class="empty-title">No orders yet</h2>
        <p class="empty-sub">Start shopping to see your orders here!</p>
        <NuxtLink to="/collections" class="browse-btn">Browse Collections</NuxtLink>
      </section>

      <!-- Orders List -->
      <section v-else class="orders-list">
        <div
          v-for="order in orderItems"
          :key="order.orderId"
          class="order-item"
        >
          <NuxtLink :to="productUrl(order.product)" class="order-image-link">
            <img
              :src="getProductImage(order.product)"
              :alt="order.product.name"
              class="order-image"
              loading="lazy"
            />
          </NuxtLink>

          <div class="order-content">
            <div class="order-header">
              <div class="order-title-section">
                <NuxtLink :to="productUrl(order.product)" class="order-name">
                  {{ order.product.name }}
                </NuxtLink>
                <p v-if="order.product.description" class="order-description">
                  {{ order.product.description }}
                </p>
              </div>
              <div class="order-price-section">
                <div class="order-pricing">
                  <span v-if="hasDiscount(order.product)" class="order-price-original">
                    ₹{{ formatPrice(order.product.price) }}
                  </span>
                  <span class="order-price" :class="{ 'has-discount': hasDiscount(order.product) }">
                    ₹{{ formatPrice(getFinalPrice(order.product)) }}
                  </span>
                </div>
                <div class="order-quantity-badge">Qty: {{ order.quantity }}</div>
              </div>
            </div>

            <!-- Order Status -->
            <div class="order-status">
              <div class="status-badge confirmed">
                <span class="status-icon">✓</span>
                <span class="status-text">Order Confirmed</span>
              </div>
              <p class="delivery-message">
                Your order will be delivered to you within a few days. Maximum delivery time: 3 days.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { joinURL } from 'ufo'

const auth = useAuth()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

// Redirect to login if not authenticated
if (process.client && !auth.isAuthenticated.value) {
  router.push('/login?redirect=' + encodeURIComponent('/orders'))
}

// Orders data
const ordersData = ref(null)
const pending = ref(false)
const error = ref(null)
const errorMessage = ref('')

// Load orders from API
const loadOrders = async () => {
  if (!auth.isAuthenticated.value || !auth.user.value) {
    error.value = true
    errorMessage.value = 'Please log in to view your orders'
    return
  }

  const user = auth.user.value
  pending.value = true
  error.value = null
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      id: String(user.id),
      username: user.username || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      address: user.address || '',
      pincode: user.pincode || ''
    })

    const url = `${apiBase}/user/orderbook?${params.toString()}`
    const response = await $fetch(url, {
      method: 'POST',
      headers: { accept: '*/*' }
    })

    ordersData.value = response
  } catch (err) {
    console.error('[Orders] Failed to load orders:', err)
    error.value = err
    errorMessage.value = err?.message || 'Failed to load orders. Please try again.'
  } finally {
    pending.value = false
  }
}

// Compute order items with product details
const orderItems = computed(() => {
  if (!ordersData.value?.orderBooks || !ordersData.value?.ceremics) return []
  
  const orderBooks = ordersData.value.orderBooks
  const products = ordersData.value.ceremics
  
  return orderBooks.map(orderBook => {
    const product = products.find(p => p.id === orderBook.productId)
    if (!product) return null
    
    return {
      orderId: orderBook.id,
      productId: orderBook.productId,
      quantity: orderBook.quantity,
      product: product
    }
  }).filter(Boolean)
})

// Helper functions
const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const productUrl = (product) => {
  const slug = slugify(product.name)
  return `/product/${slug}-${product.id}`
}

const formatPrice = (price) => {
  return Number(price || 0).toLocaleString('en-IN')
}

const hasDiscount = (product) => {
  return product?.discounts?.enable && product?.discounts?.discount > 0
}

const getFinalPrice = (product) => {
  if (!hasDiscount(product)) return product.price
  const discount = product.discounts.discount || 0
  return Math.round(product.price * (100 - discount) / 100)
}

const getProductImage = (product) => {
  // Try catalog image first, then first image, then fallback
  if (product.images && product.images.length > 0) {
    const catalogImg = product.images.find(img => img.catalogImage)
    if (catalogImg?.imageUrl) return catalogImg.imageUrl
    
    if (product.images[0]?.imageUrl) return product.images[0].imageUrl
  }
  
  // Try main image
  if (product.image?.value) {
    // Block third-party cookies
    if (product.image.value.includes('img.icons8.com')) {
      return '/images/ceramic-plate.svg'
    }
    return product.image.value
  }
  
  // Fallback to placeholder based on type
  const type = product.productDetails?.find(d => d.dimension?.name === 'Type')?.value?.toLowerCase() || 'plate'
  if (type.includes('mug')) return '/images/ceramic-mug.svg'
  if (type.includes('bowl')) return '/images/ceramic-bowl.svg'
  if (type.includes('vase')) return '/images/ceramic-vase.svg'
  return '/images/ceramic-plate.svg'
}

// Load orders on mount
onMounted(() => {
  if (auth.isAuthenticated.value) {
    loadOrders()
  }
})

// Watch for auth changes
watch(() => auth.isAuthenticated.value, (isAuth) => {
  if (isAuth) {
    loadOrders()
  } else {
    ordersData.value = null
  }
})

// SEO - Make page non-indexable
useHead({
  title: 'My Orders - Ceramic Artistry',
  meta: [
    {
      name: 'description',
      content: 'View and track your order history.'
    },
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background: #fafafa;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back {
  font-size: 1.5rem;
  color: #333;
  text-decoration: none;
  line-height: 1;
  padding: 0.25rem;
  transition: color 0.2s;
}

.back:hover {
  color: #d32f2f;
}

.topbar-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
}

.topbar-spacer {
  width: 2.5rem;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 4rem 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border: 3px solid #e5e5e5;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 0.9375rem;
}

/* Error State */
.error {
  text-align: center;
  padding: 4rem 1rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.error-sub {
  color: #666;
  margin-bottom: 1.5rem;
}

.retry {
  background: #333;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.retry:hover {
  background: #555;
}

/* Empty Orders */
.empty-orders {
  text-align: center;
  padding: 4rem 1rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-sub {
  color: #666;
  margin-bottom: 2rem;
}

.browse-btn {
  display: inline-block;
  background: #333;
  color: #fff;
  text-decoration: none;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  transition: background 0.2s;
}

.browse-btn:hover {
  background: #555;
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  background: #fff;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  gap: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: box-shadow 0.2s, transform 0.2s;
}

.order-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .order-item {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
}

.order-image-link {
  position: relative;
  flex-shrink: 0;
  width: 140px;
  height: 140px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  display: block;
}

@media (max-width: 640px) {
  .order-image-link {
    width: 100%;
    height: 240px;
    align-self: center;
  }
}

.order-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.order-image-link:hover .order-image {
  transform: scale(1.05);
}

.order-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.order-title-section {
  flex: 1;
  min-width: 200px;
}

.order-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  text-decoration: none;
  line-height: 1.3;
  display: block;
  margin-bottom: 0.375rem;
  transition: color 0.2s;
}

.order-name:hover {
  color: #d32f2f;
}

.order-description {
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.order-price-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.order-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.order-price-original {
  font-size: 0.875rem;
  color: #999;
  text-decoration: line-through;
  font-weight: 500;
}

.order-price {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}

.order-price.has-discount {
  color: #d32f2f;
}

.order-quantity-badge {
  font-size: 0.8125rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-weight: 500;
}

/* Order Status */
.order-status {
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.status-badge.confirmed {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.status-icon {
  font-size: 1rem;
  font-weight: 700;
}

.status-text {
  font-weight: 600;
}

.delivery-message {
  font-size: 0.9375rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
  padding-left: 0.5rem;
}
</style>
