<template>
  <div class="cart-page">
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
      <!-- Loading State -->
      <section v-if="pending" class="loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading your cart...</p>
      </section>

      <!-- Error State -->
      <section v-else-if="error" class="error">
        <h1 class="error-title">Couldn't load cart</h1>
        <p class="error-sub">{{ errorMessage }}</p>
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
            <NuxtLink :to="productUrl(item.product)" class="item-image">
              <img
                :src="getProductImage(item.product)"
                :alt="item.product.name"
                loading="lazy"
              />
              <span v-if="hasDiscount(item.product)" class="discount-badge">
                {{ item.product.discounts.discount }}% OFF
              </span>
            </NuxtLink>

            <div class="item-details">
              <NuxtLink :to="productUrl(item.product)" class="item-name">
                {{ item.product.name }}
              </NuxtLink>
              
              <div class="item-qty-badge">QTY: {{ item.quantity }}</div>
              
              <div class="item-row">
                <div class="quantity-controls">
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="updatingItems.has(item.cartId) || item.quantity <= 1"
                    @click="decreaseQuantity(item)"
                  >
                    −
                  </button>
                  <span class="qty-value">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="qty-btn"
                    :disabled="updatingItems.has(item.cartId)"
                    @click="increaseQuantity(item)"
                  >
                    +
                  </button>
                </div>
                <div class="item-price">Rs. {{ formatPrice(getFinalPrice(item.product)) }}</div>
              </div>
              
              <button
                type="button"
                class="remove-btn"
                :disabled="updatingItems.has(item.cartId)"
                @click="removeItem(item)"
              >
                <span class="remove-icon">🗑️</span>
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <h2 class="summary-title">Order Summary</h2>
          
          <div class="summary-row">
            <span class="summary-label">Subtotal</span>
            <span class="summary-value">Rs. {{ formatPrice(subtotal) }}</span>
          </div>
          
          <div v-if="totalDiscount > 0" class="summary-row discount-row">
            <span class="summary-label">Discount</span>
            <span class="summary-value discount-value">-Rs. {{ formatPrice(totalDiscount) }}</span>
          </div>
          
          <div class="summary-divider"></div>
          
          <div class="summary-row total-row">
            <span class="summary-label">Total</span>
            <span class="summary-value total-value">Rs. {{ formatPrice(total) }}</span>
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

// --- Menu ---
const menuOpen = ref(false)

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
    cart.items.value = []
    return
  }

  const cartItems = backendData.cart
  const products = backendData.ceremics

  const localItems = cartItems
    .map(cartItem => {
      const product = products.find(p => p.id === cartItem.productId)
      if (!product || cartItem.quantity <= 0) return null

      let productImage = ''
      if (product.images && product.images.length > 0) {
        const catalogImg = product.images.find(img => img.catalogImage)
        if (catalogImg?.imageUrl) productImage = resolveImageUrl(catalogImg.imageUrl)
        else if (product.images[0]?.imageUrl) productImage = resolveImageUrl(product.images[0].imageUrl)
      }
      if (!productImage && product.image?.value) {
        productImage = resolveImageUrl(product.image.value)
      }

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

  cart.items.value = localItems
}

const productUrl = (product) => {
  const slug = slugify(product.name)
  return `/product/${slug}-${product.id}`
}

const formatPrice = (price) => {
  const n = Number(price || 0)
  const formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
  return formatted
}

const hasDiscount = (product) => {
  return product?.discounts?.enable && product?.discounts?.discount > 0
}

const getFinalPrice = (product) => {
  if (!hasDiscount(product)) return product.price
  const discount = product.discounts.discount || 0
  return Math.round(product.price * (100 - discount) / 100)
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

const getProductImage = (product) => {
  if (product.images && product.images.length > 0) {
    const catalogImg = product.images.find(img => img.catalogImage)
    if (catalogImg?.imageUrl) return resolveImageUrl(catalogImg.imageUrl)
    if (product.images[0]?.imageUrl) return resolveImageUrl(product.images[0].imageUrl)
  }
  
  if (product.image?.value) {
    if (isBlockedImageHost(product.image.value)) {
      return '/images/ceramic-plate.svg'
    }
    return resolveImageUrl(product.image.value)
  }
  
  const type = product.productDetails?.find(d => d.dimension?.name === 'Type')?.value?.toLowerCase() || 'plate'
  if (type.includes('mug')) return '/images/ceramic-mug.svg'
  if (type.includes('bowl')) return '/images/ceramic-bowl.svg'
  if (type.includes('vase')) return '/images/ceramic-vase.svg'
  return '/images/ceramic-plate.svg'
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
      await loadCart()
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
      await loadCart()
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
      await loadCart()
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
    
    await $fetch(url, {
      method: 'POST',
      headers: { accept: '*/*' }
    })

    console.log('[Cart] Order placed successfully')
    await cart.clear()
    await loadCart()
    router.push('/purchased')
    
  } catch (err) {
    console.error('[Cart] Failed to place order:', err)
    const statusCode = err?.statusCode || err?.status || err?.response?.status
    
    if (statusCode >= 400 && statusCode < 500) {
      showToast('Failed to place order. Please check your information and try again.')
    } else if (statusCode >= 500) {
      showToast('Server error. Please try again later.')
    } else {
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
  }, 3000)
}

// Load cart on mount
onMounted(() => {
  if (auth.isAuthenticated.value) {
    loadCart()
  }
})

// SEO
useHead({
  title: 'Shopping Cart - Ceramic Artistry',
  meta: [
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
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 4rem 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
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
  width: 100%;
  box-sizing: border-box;
}

.cart-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.item-image {
  width: 95px;
  min-width: 95px;
  height: 95px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f8f8;
  position: relative;
  display: block;
  text-decoration: none;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.discount-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #d32f2f, #f44336);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  z-index: 1;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  max-width: calc(100% - 95px - 16px);
  overflow: hidden;
}

.item-name {
  font-size: 0.9375rem;
  font-weight: 400;
  color: #2c2c2c;
  text-decoration: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  display: block;
  word-break: break-word;
  overflow-wrap: break-word;
}

.item-name:hover {
  color: #000;
}

.item-qty-badge {
  font-size: 0.75rem;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 0;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  width: fit-content;
}

.item-row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0;
  background: #fff;
  flex-shrink: 0;
  min-width: fit-content;
}

.qty-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #fff;
  color: #333;
  font-size: 1.25rem;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.qty-btn:hover:not(:disabled) {
  background: #fafafa;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-value {
  min-width: 40px;
  text-align: center;
  font-weight: 700;
  color: #1a1a1a;
  font-size: 1rem;
  flex-shrink: 0;
}

.item-price {
  font-size: 0.9375rem;
  font-weight: 400;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  white-space: nowrap;
  text-align: right;
  justify-self: end;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  color: #333;
  font-size: 0.8125rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.2s;
  align-self: flex-start;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  width: fit-content;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 640px) {
  .cart-item {
    flex-wrap: wrap;
  }
  
  .item-image {
    width: 100%;
    min-width: 100%;
    height: auto;
    aspect-ratio: 1;
  }
  
  .item-details {
    max-width: 100%;
    width: 100%;
  }
  
  .item-row {
    flex-wrap: wrap;
  }
  
  .item-price {
    width: 100%;
    text-align: left;
    margin-top: 8px;
  }
}

.remove-btn:hover:not(:disabled) {
  background: #fafafa;
}

.remove-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Order Summary */
.order-summary {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.summary-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c2c2c;
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-label {
  font-size: 0.9375rem;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.summary-value {
  font-size: 0.9375rem;
  color: #2c2c2c;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.discount-value {
  color: #4caf50;
}

.total-row {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.total-value {
  font-weight: 600;
  font-size: 1rem;
}

.summary-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 12px 0;
}

.checkout-btn {
  width: 100%;
  padding: 14px;
  background: #2c2c2c;
  color: #fff;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.2s;
  margin-top: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.checkout-btn:hover:not(:disabled) {
  background: #000;
}

.checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(44, 44, 44, 0.9);
  color: #fff;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  z-index: 1000;
  max-width: 90%;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
