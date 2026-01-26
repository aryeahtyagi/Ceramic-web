<template>
  <div class="orders-page">
    <header class="topbar">
      <NuxtLink to="/collections" class="back" aria-label="Back to collections">
        ←
      </NuxtLink>
      <div class="topbar-title">My Orders</div>
      <AccountDropdown />
    </header>

    <div class="content">
      <div v-if="pending" class="loading">Loading orders...</div>
      <div v-else-if="error" class="error">Failed to load orders. Please try again.</div>
      <div v-else-if="!orders.length" class="empty">
        <p>No orders found.</p>
      </div>
      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-item">
          <NuxtLink :to="productUrl(order.product)" class="order-image-wrapper">
            <img :src="getProductImage(order.product)" :alt="order.product.name" class="order-image" />
          </NuxtLink>
          <div class="order-info">
            <NuxtLink :to="productUrl(order.product)" class="order-name">{{ order.product.name }}</NuxtLink>
            <div class="order-price">Rs. {{ formatPrice(getFinalPrice(order.product)) }}</div>
            <div class="order-status">Order Confirmed</div>
            <div class="order-timeline">Will be delivered to you in a few days (max: 3 days)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const auth = useAuth()
const router = useRouter()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

if (process.client && !auth.isAuthenticated.value) {
  router.push('/login?redirect=' + encodeURIComponent('/orders'))
}

const ordersData = ref(null)
const pending = ref(false)
const error = ref(null)

const orders = computed(() => {
  if (!ordersData.value?.orderBooks || !ordersData.value?.ceremics) return []
  const orderBooks = ordersData.value.orderBooks
  const products = ordersData.value.ceremics
  return orderBooks.map(ob => {
    const product = products.find(p => p.id === ob.productId)
    return product ? { id: ob.id, product, quantity: ob.quantity } : null
  }).filter(Boolean)
})

const loadOrders = async () => {
  if (!auth.isAuthenticated.value || !auth.user.value) return
  const user = auth.user.value
  pending.value = true
  error.value = null
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
    ordersData.value = await $fetch(url, { method: 'POST', headers: { accept: '*/*' } })
  } catch (err) {
    console.error('[Orders] Failed to load:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

const slugify = (text) => String(text || '').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
const productUrl = (product) => `/product/${slugify(product.name)}-${product.id}`
const formatPrice = (price) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(price || 0))
const hasDiscount = (product) => product?.discounts?.enable && product?.discounts?.discount > 0
const getFinalPrice = (product) => hasDiscount(product) ? Math.round(product.price * (100 - (product.discounts.discount || 0)) / 100) : product.price
const getProductImage = (product) => {
  if (product.images?.length > 0) {
    const catalogImg = product.images.find(img => img.catalogImage)
    if (catalogImg?.imageUrl) return catalogImg.imageUrl
    if (product.images[0]?.imageUrl) return product.images[0].imageUrl
  }
  if (product.image?.value && !product.image.value.includes('img.icons8.com')) return product.image.value
  return '/images/ceramic-plate.svg'
}

onMounted(() => {
  if (auth.isAuthenticated.value) loadOrders()
})

watch(() => auth.isAuthenticated.value, (isAuth) => {
  if (isAuth) loadOrders()
  else ordersData.value = null
})

useHead({
  title: 'My Orders - Ceramic Artistry',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})
</script>

<style scoped>
.orders-page {
  min-height: 100vh;
  background: #fff;
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
}

.topbar-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.loading, .error, .empty {
  text-align: center;
  padding: 4rem 1rem;
  color: #666;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  gap: 1.5rem;
}

.order-image-wrapper {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f8f8;
}

.order-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  text-decoration: none;
}

.order-name:hover {
  color: #000;
}

.order-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.order-status {
  font-size: 0.875rem;
  font-weight: 600;
  color: #4caf50;
  margin-top: 0.5rem;
}

.order-timeline {
  font-size: 0.875rem;
  color: #666;
  margin-top: 0.25rem;
}
</style>
