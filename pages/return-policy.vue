<template>
  <div class="policy-page">
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
      <article class="policy-content">
        <h1 class="policy-title">Return & Exchange Policy</h1>
        <p class="policy-intro">We want you to love every piece you receive from us. If something isn't right, we're here to help.</p>

        <section class="policy-section">
          <h2 class="section-heading">Returns</h2>
          <ul class="policy-list">
            <li>We accept returns for both defective and non-defective products.</li>
            <li>You can request a return within 30 days (1 month) from the date of delivery.</li>
            <li>The product must be unused, in its original condition, and with original packaging.</li>
            <li>For defective or damaged items, please share images while requesting a return so we can assist you quickly.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">Exchanges</h2>
          <ul class="policy-list">
            <li>We also offer product exchanges.</li>
            <li>You can exchange your item for another product available on our website.</li>
            <li>Exchanges must also be requested within 30 days of delivery.</li>
            <li>If there is a price difference, it will be adjusted accordingly.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">Eligibility</h2>
          <ul class="policy-list">
            <li>Returns and exchanges are available only for orders within India.</li>
            <li>Items that are used, damaged (not due to transit), or missing original packaging may not be eligible.</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">How to Request a Return or Exchange</h2>
          <p class="policy-text">To initiate a return or exchange, please write to us at <a href="mailto:svrve.ceramic@gmail.com" class="policy-link">svrve.ceramic@gmail.com</a> with:</p>
          <ul class="policy-list">
            <li>Your order details</li>
            <li>Reason for return/exchange</li>
            <li>Image of the defective piece (for defective or damaged items)</li>
            <li>Image of the bill that was handed to you when the product was delivered</li>
          </ul>
          <p class="policy-text">We will guide you through the next steps.</p>
        </section>

        <div class="policy-cta">
          <NuxtLink to="/collections" class="cta-button">Continue Shopping</NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
const cart = useCart()
const menuOpen = ref(false)

useHead({
  title: 'Return & Exchange Policy - SVRVE Ceramics',
  meta: [
    {
      name: 'description',
      content: 'Learn about our return and exchange policy. We accept returns within 30 days for both defective and non-defective products. Exchanges available for orders within India.'
    }
  ]
})
</script>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: #fff;
}

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
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

.policy-content {
  color: #2c2c2c;
}

.policy-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.02em;
}

.policy-intro {
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
  margin: 0 0 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-section {
  margin-bottom: 2rem;
}

.section-heading {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.policy-list {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
}

.policy-list li {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #444;
  margin-bottom: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-list li:last-child {
  margin-bottom: 0;
}

.policy-text {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #444;
  margin: 0 0 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-link {
  color: #2c2c2c;
  text-decoration: underline;
  font-weight: 500;
}

.policy-link:hover {
  color: #000;
}

.policy-cta {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.cta-button {
  display: inline-block;
  background-color: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
  padding: 14px 32px;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.cta-button:hover {
  background-color: #000;
  border-color: #000;
}

@media (max-width: 768px) {
  .policy-title {
    font-size: 1.5rem;
  }

  .content {
    padding: 32px 16px 48px;
  }
}
</style>
