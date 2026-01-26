<template>
  <div class="home-page">
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
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">Handcrafted Ceramic Artistry</h1>
          <p class="hero-subtitle">Beautiful, unique ceramics crafted with passion and care</p>
          <NuxtLink to="/collections" class="cta-button">Shop Now</NuxtLink>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features">
        <div class="container">
          <h2 class="section-title">Why Choose Our Ceramics</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🏺</div>
              <h3>Handcrafted</h3>
              <p>Each piece is carefully handcrafted by skilled artisans</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">✨</div>
              <h3>Unique Designs</h3>
              <p>One-of-a-kind pieces that add character to your space</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌿</div>
              <h3>Eco-Friendly</h3>
              <p>Made with sustainable materials and practices</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <h2>Ready to Find Your Perfect Piece?</h2>
          <p>Browse our collection of beautiful ceramics</p>
          <NuxtLink to="/collections" class="cta-button">Explore Collection</NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
const cart = useCart()

// --- Menu ---
const menuOpen = ref(false)
</script>

<style scoped>
.home-page {
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
  width: 100%;
}

.hero {
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: #fff;
  padding: 80px 20px;
  text-align: center;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  line-height: 1.2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: #fff;
}

.hero-subtitle {
  font-size: 1.125rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: #fff;
}

.cta-button {
  background-color: #fff;
  color: #2c2c2c;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 14px 32px;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.cta-button:hover {
  background-color: #f5f5f5;
  border-color: #2c2c2c;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.features {
  padding: 60px 20px;
  background-color: #fff;
}

.section-title {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  color: #2c2c2c;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 0;
  transition: border-color 0.2s;
}

.feature-card:hover {
  border-color: #2c2c2c;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.125rem;
  margin-bottom: 0.75rem;
  color: #2c2c2c;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
  font-size: 0.9375rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.cta-section {
  background: #fafafa;
  padding: 60px 20px;
  text-align: center;
  color: #2c2c2c;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.cta-section h2 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cta-section p {
  font-size: 1rem;
  margin-bottom: 2rem;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.cta-section .cta-button {
  background-color: #2c2c2c;
  color: #fff;
  border-color: #2c2c2c;
}

.cta-section .cta-button:hover {
  background-color: #000;
  border-color: #000;
}

@media (max-width: 768px) {
  .hero {
    padding: 60px 20px;
    min-height: 300px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .section-title,
  .cta-section h2 {
    font-size: 1.25rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .features {
    padding: 40px 20px;
  }

  .cta-section {
    padding: 40px 20px;
  }
}
</style>
