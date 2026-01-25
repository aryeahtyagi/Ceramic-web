<template>
  <div class="cart-page">
    <header class="topbar">
      <NuxtLink to="/collections" class="back" aria-label="Back to collections">
        ←
      </NuxtLink>
      <div class="topbar-title">Shopping Cart</div>
      <div class="topbar-spacer"></div>
    </header>

    <div class="content">
      <!-- Loading State -->
      <section v-if="pending" class="loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your cart...</p>
      </section>

      <!-- Error State -->
      <section v-else-if="error" class="error">
        <h1 class="error-title">Couldn't load cart</h1>
        <p class="error-sub">
          {{ errorMessage }}
        </p>
        <button class="retry" type="button" @click="loadCart">Retry</button>
      </section>

      <!-- Empty Cart -->
      <section v-else-if="!cartItems.length" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h2 class="empty-title">Your cart is empty</h2>
        <p class="empty-sub">Add some beautiful ceramics to get started!</p>
        <NuxtLink to="/collections" class="browse-btn">Browse Collections</NuxtLink>
      </section>

      <!-- Cart Items -->
      <section v-else class="cart-content">
        <div class="cart-items">
          <div
            v-for="item in cartItems"
            :key="item.cartId"
            class="cart-item"
          >
            <NuxtLink :to="productUrl(item.product)" class="item-image-wrapper">
              <img
                :src="getProductImage(item.product)"
                :alt="item.product.name"
                class="item-image"
                loading="lazy"
              />
              <span v-if="hasDiscount(item.product)" class="discount-badge-overlay">
                {{ item.product.discounts.discount }}% OFF
              </span>
            </NuxtLink>

            <div class="item-content">
              <div class="item-header">
                <div class="item-title-section">
                  <NuxtLink :to="productUrl(item.product)" class="item-name">
                    {{ item.product.name }}
                  </NuxtLink>
                  <p v-if="item.product.description" class="item-description">
                    {{ item.product.description }}
                  </p>
                </div>
                <div class="item-price-section">
                  <div class="item-pricing">
                    <span v-if="hasDiscount(item.product)" class="item-price-original">
                      ₹{{ formatPrice(item.product.price) }}
                    </span>
                    <span class="item-price" :class="{ 'has-discount': hasDiscount(item.product) }">
                      ₹{{ formatPrice(getFinalPrice(item.product)) }}
                    </span>
                  </div>
                  <div class="item-quantity-badge">Qty: {{ item.quantity }}</div>
                </div>
              </div>

              <!-- Benefits Section -->
              <div v-if="getBenefits(item.product).length > 0" class="item-benefits">
                <div class="benefits-list">
                  <div
                    v-for="benefit in getBenefits(item.product)"
                    :key="benefit.id || benefit.value"
                    class="benefit-item"
                  >
                    <img
                      v-if="getSafeImage(benefit.logo)"
                      :src="getSafeImage(benefit.logo)"
                      :alt="benefit.value || 'Benefit'"
                      class="benefit-icon"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                      crossorigin="anonymous"
                    />
                    <span class="benefit-text">{{ benefit.value }}</span>
                  </div>
                </div>
              </div>

              <!-- Reviews Section -->
              <div class="item-reviews">
                <div v-if="hasReviews(item.product)" class="reviews-content">
                  <div class="reviews-summary">
                    <span class="reviews-rating">
                      ⭐ {{ getAverageRating(item.product) }}/5
                    </span>
                    <span class="reviews-count">
                      ({{ getReviewsCount(item.product) }} review{{ getReviewsCount(item.product) !== 1 ? 's' : '' }})
                    </span>
                  </div>
                </div>
                <div v-else class="reviews-empty">
                  <span class="reviews-icon">⭐</span>
                  <span>No reviews yet</span>
                </div>
              </div>

              <div class="item-actions">
                <div class="quantity-controls">
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="updatingItems.has(item.cartId) || item.quantity <= 1"
                    @click="decreaseQuantity(item)"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="updatingItems.has(item.cartId)"
                    @click="increaseQuantity(item)"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  class="remove-btn"
                  :disabled="updatingItems.has(item.cartId)"
                  @click="removeItem(item)"
                  aria-label="Remove item"
                >
                  <span class="remove-icon">🗑️</span>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <h2 class="summary-title">Order Summary</h2>
          
          <div class="summary-row">
            <span class="summary-label">Subtotal</span>
            <span class="summary-value">₹{{ formatPrice(subtotal) }}</span>
          </div>
          
          <div v-if="totalDiscount > 0" class="summary-row discount-row">
            <span class="summary-label">Discount</span>
            <span class="summary-value discount-value">-₹{{ formatPrice(totalDiscount) }}</span>
          </div>
          
          <div class="summary-divider"></div>
          
          <div class="summary-row total-row">
            <span class="summary-label">Total</span>
            <span class="summary-value total-value">₹{{ formatPrice(total) }}</span>
          </div>

          <button
            type="button"
            class="checkout-btn"
            :disabled="checkingOut"
            @click="handleCheckout"
          >
            {{ checkingOut ? 'Processing...' : 'Proceed to Checkout' }}
          </button>
        </div>
      </section>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { joinURL } from 'ufo'

const auth = useAuth()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const cart = useCart()

// Redirect to login if not authenticated
if (process.client && !auth.isAuthenticated.value) {
  router.push('/login?redirect=' + encodeURIComponent('/cart'))
}

// Cart data
const cartData = ref(null)
const pending = ref(false)
const error = ref(null)
const errorMessage = ref('')

// UI state
const updatingItems = ref(new Set())
const checkingOut = ref(false)
const toast = ref('')
let toastTimer = null

// Load cart from API
const loadCart = async () => {
  if (!auth.isAuthenticated.value || !auth.user.value) {
    error.value = true
    errorMessage.value = 'Please log in to view your cart'
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

    const url = `${apiBase}/user/load/cart?${params.toString()}`
    const response = await $fetch(url, {
      method: 'POST',
      headers: { accept: '*/*' }
    })

    cartData.value = response
    
    // Sync local cart state with backend data
    syncLocalCartState(response)
  } catch (err) {
    console.error('[Cart] Failed to load cart:', err)
    error.value = err
    errorMessage.value = err?.message || 'Failed to load cart. Please try again.'
  } finally {
    pending.value = false
  }
}

// Compute cart items with product details
const cartItems = computed(() => {
  if (!cartData.value?.cart || !cartData.value?.ceremics) return []
  
  const cart = cartData.value.cart
  const products = cartData.value.ceremics
  
  return cart.map(cartItem => {
    const product = products.find(p => p.id === cartItem.productId)
    if (!product) return null
    
    return {
      cartId: cartItem.id,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      product: product
    }
  }).filter(Boolean)
})

// Calculate totals
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity)
  }, 0)
})

const totalDiscount = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    if (!hasDiscount(item.product)) return sum
    const discount = item.product.discounts.discount || 0
    const itemTotal = item.product.price * item.quantity
    return sum + (itemTotal * discount / 100)
  }, 0)
})

const total = computed(() => {
  return subtotal.value - totalDiscount.value
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

// Sync local cart state with backend cart data
const syncLocalCartState = (backendData) => {
  if (!backendData?.cart || !backendData?.ceremics) {
    // Clear local cart if backend cart is empty
    cart.items.value = []
    return
  }

  const cartItems = backendData.cart
  const products = backendData.ceremics

  // Map backend cart items to local cart format
  const localItems = cartItems
    .map(cartItem => {
      const product = products.find(p => p.id === cartItem.productId)
      if (!product || cartItem.quantity <= 0) return null

      // Get product image
      let productImage = ''
      if (product.images && product.images.length > 0) {
        const catalogImg = product.images.find(img => img.catalogImage)
        if (catalogImg?.imageUrl) productImage = catalogImg.imageUrl
        else if (product.images[0]?.imageUrl) productImage = product.images[0].imageUrl
      }
      if (!productImage && product.image?.value) {
        productImage = product.image.value
      }

      // Generate product slug
      const slug = slugify(product.name)

      return {
        id: product.id,
        name: product.name || 'Ceramic Product',
        price: Number(product.price || 0),
        qty: cartItem.quantity,
        image: productImage || undefined,
        slug: `/product/${slug}-${product.id}`
      }
    })
    .filter(Boolean)

  // Update local cart state
  cart.items.value = localItems
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

// Benefits helpers
const getBenefits = (product) => {
  if (!product?.benefits || !Array.isArray(product.benefits)) return []
  return product.benefits.filter(b => b && b.value)
}

const getSafeImage = (url) => {
  const u = String(url || '').trim()
  if (!u) return null
  // Block third-party cookies
  if (u.includes('img.icons8.com')) return null
  return u
}

// Reviews helpers
const hasReviews = (product) => {
  const reviews = product?.reviews
  return Array.isArray(reviews) && reviews.length > 0
}

const getReviewsCount = (product) => {
  if (product?.reviewsMetaData?.reviews) {
    return Number(product.reviewsMetaData.reviews) || 0
  }
  const reviews = product?.reviews
  return Array.isArray(reviews) ? reviews.length : 0
}

const getAverageRating = (product) => {
  if (product?.reviewsMetaData?.rating) {
    const rating = Number(product.reviewsMetaData.rating)
    return rating > 0 ? rating.toFixed(1) : '0.0'
  }
  // Calculate from reviews if available
  const reviews = product?.reviews
  if (Array.isArray(reviews) && reviews.length > 0) {
    const ratings = reviews.map(r => Number(r.rating || 0)).filter(r => r > 0)
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      return avg.toFixed(1)
    }
  }
  return '0.0'
}

const getRecentReviews = (product, limit = 2) => {
  const reviews = product?.reviews
  if (!Array.isArray(reviews) || reviews.length === 0) return []
  // Return up to limit reviews, prioritizing those with descriptions
  return reviews
    .filter(r => r && (r.description || r.rating > 0))
    .slice(0, limit)
}

// Quantity management
const syncCartItem = async (productId, quantity) => {
  if (!auth.isAuthenticated.value || !auth.user.value?.id) {
    return false
  }

  try {
    const params = new URLSearchParams({
      id: '0',
      userId: String(auth.user.value.id),
      productId: String(productId),
      quantity: String(Math.max(0, quantity))
    })

    const url = `${apiBase}/user/cart?${params.toString()}`
    await $fetch(url, {
      method: 'POST',
      headers: { accept: '*/*' }
    })
    return true
  } catch (error) {
    console.warn('Failed to sync cart item:', error)
    return false
  }
}

const increaseQuantity = async (item) => {
  if (updatingItems.value.has(item.cartId)) return
  
  updatingItems.value.add(item.cartId)
  try {
    const newQty = item.quantity + 1
    const success = await syncCartItem(item.productId, newQty)
    if (success) {
      await loadCart() // Reload cart to get updated data
    } else {
      showToast('Failed to update quantity. Please try again.')
    }
  } finally {
    updatingItems.value.delete(item.cartId)
  }
}

const decreaseQuantity = async (item) => {
  if (updatingItems.value.has(item.cartId) || item.quantity <= 1) return
  
  updatingItems.value.add(item.cartId)
  try {
    const newQty = item.quantity - 1
    const success = await syncCartItem(item.productId, newQty)
    if (success) {
      await loadCart() // Reload cart to get updated data
    } else {
      showToast('Failed to update quantity. Please try again.')
    }
  } finally {
    updatingItems.value.delete(item.cartId)
  }
}

const removeItem = async (item) => {
  if (updatingItems.value.has(item.cartId)) return
  
  updatingItems.value.add(item.cartId)
  try {
    const success = await syncCartItem(item.productId, 0)
    if (success) {
      await loadCart() // Reload cart to get updated data
      showToast('Item removed from cart')
    } else {
      showToast('Failed to remove item. Please try again.')
    }
  } finally {
    updatingItems.value.delete(item.cartId)
  }
}

// Checkout
const handleCheckout = async () => {
  if (!auth.isAuthenticated.value || !auth.user.value) {
    showToast('Please log in to checkout')
    router.push('/login?redirect=' + encodeURIComponent('/cart'))
    return
  }

  if (cartItems.value.length === 0) {
    showToast('Your cart is empty')
    return
  }

  if (checkingOut.value) return

  checkingOut.value = true
  const user = auth.user.value

  try {
    const params = new URLSearchParams({
      id: String(user.id),
      username: user.username || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      address: user.address || '',
      pincode: user.pincode || ''
    })

    const url = `${apiBase}/user/order?${params.toString()}`
    
    const response = await $fetch(url, {
      method: 'POST',
      headers: { accept: '*/*' }
    })

    // Check if order was successful (status 200-299 means success)
    // Since response is empty, we rely on no exception being thrown
    console.log('[Cart] Order placed successfully')
    
    // Clear the cart after successful order
    await cart.clear()
    
    // Reload cart data to reflect empty cart
    await loadCart()
    
    // Redirect to purchased page
    router.push('/purchased')
    
  } catch (err) {
    console.error('[Cart] Failed to place order:', err)
    
    // Check HTTP status code
    const statusCode = err?.statusCode || err?.status || err?.response?.status
    
    if (statusCode >= 400 && statusCode < 500) {
      // Client error (4xx)
      showToast('Failed to place order. Please check your information and try again.')
    } else if (statusCode >= 500) {
      // Server error (5xx)
      showToast('Server error. Please try again later.')
    } else {
      // Network or other error
      showToast('Failed to place order. Please check your connection and try again.')
    }
  } finally {
    checkingOut.value = false
  }
}

// Toast notification
const showToast = (msg) => {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2000)
}

// Load cart on mount
onMounted(() => {
  if (auth.isAuthenticated.value) {
    loadCart()
  }
})

// Watch for auth changes
watch(() => auth.isAuthenticated.value, (isAuth) => {
  if (isAuth) {
    loadCart()
  } else {
    cartData.value = null
  }
})

// SEO - Make page non-indexable
useHead({
  title: 'Shopping Cart - Ceramic Artistry',
  meta: [
    {
      name: 'description',
      content: 'Review your selected ceramic products and proceed to checkout.'
    },
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>

<style scoped>
.cart-page {
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

/* Empty Cart */
.empty-cart {
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

/* Cart Content */
.cart-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (min-width: 768px) {
  .cart-content {
    flex-direction: row;
    align-items: flex-start;
  }
  
  .cart-items {
    flex: 1;
  }
  
  .order-summary {
    width: 320px;
    position: sticky;
    top: 80px;
  }
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  background: #fff;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  gap: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s, transform 0.2s;
  border: 1px solid #f0f0f0;
}

.cart-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .cart-item {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
}

.item-image-wrapper {
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
  .item-image-wrapper {
    width: 100%;
    height: 240px;
    align-self: center;
  }
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.item-image-wrapper:hover .item-image {
  transform: scale(1.05);
}

.discount-badge-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #d32f2f, #f44336);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.item-title-section {
  flex: 1;
  min-width: 200px;
}

.item-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a1a;
  text-decoration: none;
  line-height: 1.3;
  display: block;
  margin-bottom: 0.375rem;
  transition: color 0.2s;
}

.item-name:hover {
  color: #d32f2f;
}

.item-description {
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.item-price-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}

.item-pricing {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.item-price-original {
  font-size: 0.875rem;
  color: #999;
  text-decoration: line-through;
  font-weight: 500;
}

.item-price {
  font-size: 1.375rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}

.item-price.has-discount {
  color: #d32f2f;
}

.item-quantity-badge {
  font-size: 0.8125rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-weight: 500;
}

/* Benefits Section */
.item-benefits {
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.benefits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.benefit-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.benefit-item:hover {
  background: linear-gradient(135deg, #e9ecef, #f8f9fa);
  transform: translateY(-1px);
}

.benefit-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.benefit-text {
  color: #495057;
  font-weight: 600;
}

/* Reviews Section */
.item-reviews {
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.reviews-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reviews-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reviews-rating {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #f57c00;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.reviews-count {
  font-size: 0.8125rem;
  color: #666;
  font-weight: 500;
}

.reviews-empty {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #999;
  font-style: italic;
}

.reviews-icon {
  font-size: 1rem;
  opacity: 0.6;
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
  margin-top: auto;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  padding: 0.375rem;
  background: #fff;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f8f9fa;
  color: #333;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.qty-btn:hover:not(:disabled) {
  background: #e9ecef;
  transform: scale(1.05);
}

.qty-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: #f5f5f5;
}

.qty-value {
  min-width: 40px;
  text-align: center;
  font-weight: 700;
  color: #1a1a1a;
  font-size: 1rem;
}

.remove-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 2px solid #ffebee;
  color: #d32f2f;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background: #ffebee;
  border-color: #d32f2f;
  transform: translateY(-1px);
}

.remove-btn:active:not(:disabled) {
  transform: translateY(0);
}

.remove-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.remove-icon {
  font-size: 1rem;
  line-height: 1;
}

/* Order Summary */
.order-summary {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.summary-label {
  font-size: 0.9375rem;
  color: #666;
}

.summary-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #333;
}

.discount-row .summary-value {
  color: #d32f2f;
}

.summary-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 1rem 0;
}

.total-row {
  margin-bottom: 1.5rem;
}

.total-row .summary-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
}

.total-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.checkout-btn {
  width: 100%;
  background: #333;
  color: #fff;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.checkout-btn:hover:not(:disabled) {
  background: #555;
}

.checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}
</style>
