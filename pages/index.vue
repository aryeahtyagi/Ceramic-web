<template>
  <div class="home-page">
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
</template>

<script setup>
// Nuxt 3 Composition API - no need to export default
</script>

<style scoped>
.home-page {
  width: 100%;
}

.hero {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  color: var(--text-light);
  padding: 120px 20px;
  text-align: center;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  max-width: 800px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2.5rem;
  opacity: 0.95;
  font-weight: 300;
}

.cta-button {
  background-color: var(--accent-color);
  color: var(--text-dark);
  border: none;
  padding: 16px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  text-decoration: none;
  display: inline-block;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background-color: #ffb366;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.features {
  padding: 80px 20px;
  background-color: var(--bg-white);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: var(--text-dark);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
  margin-top: 3rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  background-color: var(--bg-light);
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

.cta-section {
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--secondary-color) 100%);
  padding: 80px 20px;
  text-align: center;
  color: var(--text-light);
}

.cta-section h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta-section p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .section-title,
  .cta-section h2 {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
