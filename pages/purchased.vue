<template>
  <div class="purchased-page">
    <header class="topbar">
      <NuxtLink to="/collections" class="back" aria-label="Back to collections">
        ←
      </NuxtLink>
      <div class="topbar-title">Order Confirmed</div>
      <AccountDropdown />
    </header>

    <div class="content">
      <div class="success-icon">✓</div>
      <h1 class="title">Thank You for Your Purchase!</h1>
      <p class="message">
        Your order has been placed successfully. You might receive a confirmation call on your phone number for the same.
      </p>
      <div class="action-buttons">
        <NuxtLink to="/collections" class="btn btn-secondary">Go to Collections</NuxtLink>
        <NuxtLink to="/orders" class="btn btn-primary">Track Your Order</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Order Confirmed - Ceramic Artistry',
  meta: [
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>

<style scoped>
.purchased-page {
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
  max-width: 600px;
  margin: 4rem auto;
  padding: 2rem;
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  background: #4caf50;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.message {
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  text-decoration: none;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  font-size: 0.9375rem;
}

.btn-primary {
  background: #333;
  color: #fff;
}

.btn-primary:hover {
  background: #555;
}

.btn-secondary {
  background: #fff;
  color: #333;
  border: 1px solid #333;
}

.btn-secondary:hover {
  background: #f5f5f5;
}
</style>
