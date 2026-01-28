<template>
  <div class="blog-page">
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
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Blog</h1>
        <p class="page-subtitle">Discover stories, tips, and insights about ceramics</p>
      </div>

      <!-- Blog Posts Grid -->
      <div class="blog-grid">
        <article
          v-for="post in blogPosts"
          :key="post.id"
          class="blog-card"
        >
          <NuxtLink :to="`/blog/${post.slug}`" class="blog-card-link">
            <div class="blog-image">
              <img
                :src="post.image"
                :alt="post.title"
                loading="lazy"
              />
            </div>
            <div class="blog-content">
              <div class="blog-meta">
                <span class="blog-date">{{ formatDate(post.date) }}</span>
                <span class="blog-category">{{ post.category }}</span>
              </div>
              <h2 class="blog-title">{{ post.title }}</h2>
              <p class="blog-excerpt">{{ post.excerpt }}</p>
              <span class="read-more">Read More →</span>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Empty State -->
      <div v-if="blogPosts.length === 0" class="empty-state">
        <p class="empty-text">No blog posts available yet. Check back soon!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
const cart = useCart()

// --- Menu ---
const menuOpen = ref(false)

// Sample blog posts data (replace with API call later)
const blogPosts = ref([
  {
    id: 1,
    slug: 'the-art-of-handcrafted-ceramics',
    title: 'The Art of Handcrafted Ceramics',
    excerpt: 'Discover the timeless beauty and craftsmanship behind handcrafted ceramic pieces. Learn about traditional techniques and modern innovations.',
    image: '/images/blog-ceramic-art.jpg',
    date: new Date('2024-01-15'),
    category: 'Craftsmanship'
  },
  {
    id: 2,
    slug: 'caring-for-your-ceramic-collection',
    title: 'Caring for Your Ceramic Collection',
    excerpt: 'Essential tips and tricks to maintain the beauty and longevity of your ceramic pieces. From cleaning to storage, we cover it all.',
    image: '/images/blog-care.jpg',
    date: new Date('2024-01-10'),
    category: 'Care Tips'
  },
  {
    id: 3,
    slug: 'sustainable-ceramic-practices',
    title: 'Sustainable Ceramic Practices',
    excerpt: 'Exploring eco-friendly approaches to ceramic production and how we can make more sustainable choices in our daily lives.',
    image: '/images/blog-sustainability.jpg',
    date: new Date('2024-01-05'),
    category: 'Sustainability'
  },
  {
    id: 4,
    slug: 'ceramic-design-trends-2024',
    title: 'Ceramic Design Trends 2024',
    excerpt: 'A look at the latest trends in ceramic design, from minimalist aesthetics to bold patterns and colors.',
    image: '/images/blog-trends.jpg',
    date: new Date('2024-01-01'),
    category: 'Design'
  },
  {
    id: 5,
    slug: 'history-of-ceramic-art',
    title: 'The Rich History of Ceramic Art',
    excerpt: 'Journey through the centuries to explore how ceramic art has evolved and influenced cultures around the world.',
    image: '/images/blog-history.jpg',
    date: new Date('2023-12-28'),
    category: 'History'
  },
  {
    id: 6,
    slug: 'choosing-the-right-ceramic-piece',
    title: 'Choosing the Right Ceramic Piece',
    excerpt: 'A guide to selecting ceramic pieces that match your style and needs. From functional to decorative, find your perfect match.',
    image: '/images/blog-choosing.jpg',
    date: new Date('2023-12-20'),
    category: 'Guide'
  }
])

// Format date for display
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// SEO
useHead({
  title: 'Blog - Ceramic Artistry',
  meta: [
    {
      name: 'description',
      content: 'Discover stories, tips, and insights about ceramics, craftsmanship, and design.'
    }
  ]
})
</script>

<style scoped>
.blog-page {
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 16px;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #2c2c2c;
  margin: 0 0 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.page-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Blog Grid */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .blog-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

/* Blog Card */
.blog-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: border-color 0.2s;
  overflow: hidden;
}

.blog-card:hover {
  border-color: #2c2c2c;
}

.blog-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.blog-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f8f8f8;
}

.blog-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.blog-card:hover .blog-image img {
  transform: scale(1.05);
}

.blog-content {
  padding: 1.5rem;
}

.blog-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-date {
  font-weight: 400;
}

.blog-category {
  font-weight: 500;
  color: #2c2c2c;
}

.blog-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2c2c;
  margin: 0 0 0.75rem;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-excerpt {
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.6;
  margin: 0 0 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.read-more {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  transition: color 0.2s;
}

.blog-card:hover .read-more {
  color: #000;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
}

.empty-text {
  font-size: 1rem;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}
</style>
