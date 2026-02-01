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

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading blogs...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p class="error-text">Failed to load blogs. Please try again later.</p>
        <button class="retry-btn" type="button" @click="refresh()">Retry</button>
      </div>

      <!-- Blog Posts Grid -->
      <div v-else-if="blogPosts.length > 0" class="blog-grid">
        <article
          v-for="post in blogPosts"
          :key="post.id"
          class="blog-card"
        >
          <NuxtLink 
            :to="`/blog/${post.id}/${post.titleSlug}`"
            class="blog-card-link"
          >
            <div v-if="post.image && resolveImageUrl(post.image)" class="blog-image-wrapper">
              <div class="blog-image">
                <img
                  :src="resolveImageUrl(post.image)"
                  :alt="post.title"
                  loading="lazy"
                  @error="handleImageError($event)"
                />
              </div>
              <div class="image-overlay"></div>
            </div>
            <div v-else class="blog-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div class="blog-content">
              <div class="blog-meta">
                <span class="blog-category">{{ post.category }}</span>
                <span class="meta-separator">•</span>
                <span class="blog-date">{{ formatDate(post.date) }}</span>
                <span v-if="post.readingTime" class="meta-separator">•</span>
                <span v-if="post.readingTime" class="blog-reading-time">{{ post.readingTime }} min read</span>
              </div>
              <h2 class="blog-title">{{ post.title }}</h2>
              <p class="blog-excerpt">{{ post.excerpt }}</p>
              <div class="read-more-wrapper">
                <span class="read-more">Read Article</span>
                <svg class="read-more-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && !error && blogPosts.length === 0" class="empty-state">
        <p class="empty-text">No blog posts available yet. Check back soon!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Force SSR so blog list is in initial HTML for SEO
definePageMeta({ ssr: true })

const route = useRoute()
const router = useRouter()
const cart = useCart()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const siteUrl = String(config.public.siteUrl || 'https://svrve.com').replace(/\/$/, '')

// --- Menu ---
const menuOpen = ref(false)

// Server-side fetch: blogs list — must run on server so View Source shows full content
const { data: blogsData, pending, error, refresh } = await useFetch(
  () => {
    const cfg = useRuntimeConfig()
    const base = String(cfg.public.apiBase || '').replace(/\/$/, '')
    return `${base}/blogs`
  },
  {
    key: 'blogs-list',
    server: true,
    lazy: false
  }
)

const isLoading = computed(() => pending.value)

// Slugify function for URL-friendly titles
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Transform API data to display format
const blogPosts = computed(() => {
  if (!blogsData.value || !Array.isArray(blogsData.value)) {
    return []
  }
  
  const filtered = blogsData.value.filter(blog => {
    const status = String(blog.status || '').toLowerCase()
    return status === 'published' || status === 'publish' || !status
  })
  
  return filtered.map(blog => ({
    id: blog.id,
    slug: blog.slug || `blog-${blog.id}`,
    title: blog.title || 'Untitled',
    titleSlug: slugify(blog.title || 'Untitled'),
    excerpt: blog.metaDescription || (blog.content ? blog.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'No description available.'),
    image: blog.featuredImageUrl || '',
    date: blog.publishedAt ? new Date(blog.publishedAt) : new Date(blog.createdAt || Date.now()),
    category: blog.category || 'Uncategorized',
    readingTime: blog.readingTime || null
  }))
})

// Format date for display
const formatDate = (date) => {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  } catch {
    return ''
  }
}

// Handle image errors
const handleImageError = (event) => {
  event.target.style.display = 'none'
  const parent = event.target.closest('.blog-image-wrapper')
  if (parent) {
    parent.classList.add('has-error')
  }
  event.target.onerror = null
}

// Helper to resolve image URLs (handle localhost)
const resolveImageUrl = (url) => {
  const u = String(url || '').trim()
  if (!u) return ''
  if (u.includes('localhost:9090') || u.includes('localhost:')) {
    try {
      const urlObj = new URL(u)
      const path = urlObj.pathname + urlObj.search
      return `${apiBase}${path}`
    } catch {
      const match = u.match(/localhost:\d+(\/.*)/)
      if (match) return `${apiBase}${match[1]}`
      return u
    }
  }
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return `${apiBase}${u}`
  return u
}

// Dynamic SEO with useHead (runs on server so View Source has full meta + schema)
useHead(() => {
  const posts = blogPosts.value
  const pageTitle = 'Blog - SVRVE'
  const pageDescription = 'Discover stories, tips, and insights about ceramics, craftsmanship, and design.'
  const currentUrl = `${siteUrl}/blog`

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: currentUrl,
    mainEntity: posts.length
      ? {
          '@type': 'ItemList',
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'BlogPosting',
              '@id': `${siteUrl}/blog/${post.id}/${post.titleSlug}`,
              headline: post.title,
              description: post.excerpt,
              image: post.image ? resolveImageUrl(post.image) : undefined,
              datePublished: post.date ? new Date(post.date).toISOString() : undefined,
              author: { '@type': 'Person', name: 'Arya Tyagi' },
              publisher: { '@type': 'Organization', name: 'SVRVE', url: siteUrl }
            }
          }))
        }
      : undefined
  }
  if (!collectionPageSchema.mainEntity) delete collectionPageSchema.mainEntity

  const blogPostingSchemas = posts.map(post => {
    const postUrl = `${siteUrl}/blog/${post.id}/${post.titleSlug}`
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: postUrl,
      datePublished: post.date ? new Date(post.date).toISOString() : undefined,
      author: { '@type': 'Person', name: 'Arya Tyagi' },
      publisher: { '@type': 'Organization', name: 'SVRVE', url: siteUrl, logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
      articleSection: post.category || undefined,
      inLanguage: 'en-IN',
      ...(post.image && { image: resolveImageUrl(post.image) })
    }
    Object.keys(schema).forEach(k => { if (schema[k] === undefined) delete schema[k] })
    return schema
  })

  const organizationSchema = { '@context': 'https://schema.org', '@type': 'Organization', name: 'SVRVE', url: siteUrl, logo: `${siteUrl}/logo.png`, sameAs: [] }
  const personSchema = { '@context': 'https://schema.org', '@type': 'Person', name: 'Arya Tyagi' }
  const scriptTags = [
    { type: 'application/ld+json', children: JSON.stringify(collectionPageSchema) },
    { type: 'application/ld+json', children: JSON.stringify(organizationSchema) },
    { type: 'application/ld+json', children: JSON.stringify(personSchema) },
    ...blogPostingSchemas.map(s => ({ type: 'application/ld+json', children: JSON.stringify(s) }))
  ]
  return {
    title: pageTitle,
    meta: [{ name: 'description', content: pageDescription }],
    script: scriptTags
  }
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
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2.5rem;
  margin-top: 3rem;
}

@media (max-width: 768px) {
  .blog-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

/* Blog Card */
.blog-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.blog-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.12);
}

.blog-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.blog-image-wrapper {
  position: relative;
  width: 100%;
  height: 240px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.blog-image-wrapper.has-error {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
}

.blog-image {
  width: 100%;
  height: 100%;
  position: relative;
}

.blog-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.blog-card:hover .blog-image img {
  transform: scale(1.1);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.02) 100%);
  pointer-events: none;
  transition: opacity 0.3s;
}

.blog-image-placeholder {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #ccc;
}

.blog-image-placeholder svg {
  width: 64px;
  height: 64px;
}

.blog-content {
  padding: 2rem;
}

.blog-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.8125rem;
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-category {
  color: #2c2c2c;
  font-weight: 600;
}

.meta-separator {
  color: #ccc;
}

.blog-date {
  font-weight: 400;
}

.blog-reading-time {
  font-weight: 400;
}

.blog-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1rem;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  transition: color 0.2s;
}

.blog-card:hover .blog-title {
  color: #000;
}

.blog-excerpt {
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.7;
  margin: 0 0 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.2s;
}

.read-more {
  transition: color 0.2s;
}

.read-more-arrow {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  transition: transform 0.2s;
}

.blog-card:hover .read-more-wrapper {
  color: #000;
}

.blog-card:hover .read-more-arrow {
  transform: translateX(4px);
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

/* Loading State */
.loading-state {
  text-align: center;
  padding: 6rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #2c2c2c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 1rem;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 6rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #d32f2f;
  margin-bottom: 0.5rem;
}

.error-text {
  font-size: 1rem;
  color: #d32f2f;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.retry-btn {
  padding: 10px 20px;
  border: 1px solid #2c2c2c;
  background: #2c2c2c;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #000;
}
</style>
