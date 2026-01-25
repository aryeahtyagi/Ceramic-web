<template>
  <div class="purchased-page">
    <header class="topbar">
      <NuxtLink to="/collections" class="back" aria-label="Back to collections">
        ←
      </NuxtLink>
      <div class="topbar-title">Order Confirmation</div>
      <div class="topbar-spacer"></div>
    </header>

    <div class="content">
      <div class="success-container">
        <div class="success-icon">✓</div>
        <h1 class="success-title">Thank You for Your Purchase!</h1>
        <p class="success-message">
          Your order has been placed successfully. We've received your order and will begin processing it shortly.
        </p>
        
        <div class="order-info">
          <p class="info-text">
            You might receive a confirmation call on your phone number for the same.
          </p>
        </div>

        <div class="actions">
          <button
            type="button"
            class="action-btn primary"
            @click="trackOrder"
          >
            Track Your Order
          </button>
          <NuxtLink to="/collections" class="action-btn secondary">
            Continue Shopping
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()

const trackOrder = () => {
  router.push('/orders')
}

// SEO - Make page non-indexable
useHead({
  title: 'Order Confirmation - Ceramic Artistry',
  meta: [
    {
      name: 'description',
      content: 'Thank you for your purchase. Your order has been placed successfully.'
    },
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
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.success-container {
  background: #fff;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #4caf50, #45a049);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1rem;
  line-height: 1.2;
}

.success-message {
  font-size: 1.125rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.order-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  border: 1px solid #e9ecef;
}

.info-text {
  font-size: 0.9375rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 480px) {
  .actions {
    flex-direction: row;
    justify-content: center;
  }
}

.action-btn {
  flex: 1;
  max-width: 280px;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  display: inline-block;
}

.action-btn.primary {
  background: linear-gradient(135deg, #333, #555);
  color: #fff;
  border-color: #333;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #555, #777);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.secondary {
  background: #fff;
  color: #333;
  border-color: #e5e5e5;
}

.action-btn.secondary:hover {
  background: #f8f9fa;
  border-color: #333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 480px) {
  .success-container {
    padding: 2rem 1.5rem;
  }

  .success-title {
    font-size: 1.5rem;
  }

  .success-message {
    font-size: 1rem;
  }

  .action-btn {
    width: 100%;
    max-width: none;
  }
}
</style>
