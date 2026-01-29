<template>
  <div class="blog-detail-page">
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
      <div v-if="pending" class="loading-state">
        <p class="loading-text">Loading blog post...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-text">Failed to load blog post. Please try again later.</p>
        <button class="retry-btn" type="button" @click="refresh()">Retry</button>
      </div>

      <!-- Not Found State -->
      <div v-else-if="!blog" class="not-found-state">
        <h1>Blog Post Not Found</h1>
        <p>The blog post you're looking for doesn't exist.</p>
        <NuxtLink to="/blog" class="back-link">← Back to Blog</NuxtLink>
      </div>

      <!-- Blog Content -->
      <article v-else class="blog-article">
        <!-- Page Header -->
        <div class="page-header">
          <h1 class="page-title">Blog Page Welcome</h1>
        </div>

        <!-- Featured Image -->
        <div v-if="blog.featuredImageUrl" class="featured-image">
          <img
            :src="resolveImageUrl(blog.featuredImageUrl)"
            :alt="blog.title || 'Blog featured image'"
            loading="eager"
          />
        </div>

        <!-- Blog Header -->
        <header class="blog-header">
          <h1 class="blog-title">{{ blog.h1Title || blog.title || 'Untitled' }}</h1>
          <div class="blog-meta">
            <span v-if="blog.publishedAt" class="blog-date">{{ formatDate(blog.publishedAt) }}</span>
            <span v-if="blog.category" class="blog-category">{{ blog.category }}</span>
            <span v-if="blog.readingTime" class="blog-reading-time">{{ blog.readingTime }} min read</span>
          </div>
          <div v-if="blog.tags && blog.tags.length > 0" class="blog-tags">
            <span
              v-for="tag in blog.tags"
              :key="tag"
              class="blog-tag"
            >{{ tag }}</span>
          </div>
        </header>

        <!-- Blog Content -->
        <div class="blog-content" v-html="blog.content || ''"></div>

        <!-- Back Link -->
        <div class="back-section">
          <NuxtLink to="/blog" class="back-link">← Back to Blog</NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const cart = useCart()
const config = useRuntimeConfig()
const apiBase = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

// --- Menu ---
const menuOpen = ref(false)

// Fetch blog data
const blogsData = ref(null)
const pending = ref(true)
const error = ref(null)

const slug = computed(() => route.params.slug || '')

// Fetch blogs from API and find matching blog
const fetchBlog = async () => {
  try {
    pending.value = true
    error.value = null
    
    const response = await $fetch('/blogs', {
      baseURL: apiBase.value
    })
    
    blogsData.value = response
    pending.value = false
  } catch (err) {
    console.error('[Blog Detail] Fetch error:', err)
    error.value = err
    pending.value = false
  }
}

// Find blog by slug
const blog = computed(() => {
  if (!blogsData.value || !Array.isArray(blogsData.value)) return null
  
  const found = blogsData.value.find(b => {
    const blogSlug = String(b.slug || '').trim().toLowerCase()
    const routeSlug = String(slug.value || '').trim().toLowerCase()
    return blogSlug === routeSlug
  })
  
  return found || null
})

// Watch slug changes and refetch
watch(() => route.params.slug, () => {
  if (slug.value) {
    fetchBlog()
  }
}, { immediate: true })

// Fetch on mount
onMounted(() => {
  if (slug.value) {
    fetchBlog()
  }
})

const refresh = () => {
  fetchBlog()
}

// Helper to resolve image URLs (handle localhost)
const resolveImageUrl = (url) => {
  const u = String(url || '').trim()
  if (!u) return ''
  if (u.includes('localhost:9090') || u.includes('localhost:')) {
    try {
      const urlObj = new URL(u)
      const path = urlObj.pathname + urlObj.search
      return `${apiBase.value}${path}`
    } catch {
      const match = u.match(/localhost:\d+(\/.*)/)
      if (match) return `${apiBase.value}${match[1]}`
      return u
    }
  }
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return `${apiBase.value}${u}`
  return u
}

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

// Helper function to get SEO value with fallback
const getSeoValue = (apiValue, fallback) => {
  if (apiValue && String(apiValue).trim() !== '') {
    return String(apiValue).trim()
  }
  return fallback
}

// SEO - watch for blog data and apply SEO
watch(() => blog.value, (blogData) => {
  if (!blogData) return

  const seoTitle = getSeoValue(blogData.seoTitle, blogData.title ? `${blogData.title} | SVRVE Blog` : 'Blog | SVRVE')
  const metaDesc = getSeoValue(blogData.metaDescription, blogData.content ? blogData.content.substring(0, 160).replace(/<[^>]*>/g, '') : 'Read our latest blog post on SVRVE.')
  const ogTitle = getSeoValue(blogData.ogTitle, seoTitle)
  const ogDesc = getSeoValue(blogData.ogDescription, metaDesc)
  const ogImage = getSeoValue(blogData.ogImageUrl, blogData.featuredImageUrl ? resolveImageUrl(blogData.featuredImageUrl) : '')
  const canonical = getSeoValue(blogData.canonicalUrl, typeof window !== 'undefined' ? window.location.href : '')

  const metaTags = [
    { name: 'description', content: metaDesc }
  ]

  if (blogData.primaryKeyword && String(blogData.primaryKeyword).trim() !== '') {
    const keywords = [String(blogData.primaryKeyword).trim()]
    if (blogData.secondaryKeywords && String(blogData.secondaryKeywords).trim() !== '') {
      keywords.push(String(blogData.secondaryKeywords).trim())
    }
    metaTags.push({ name: 'keywords', content: keywords.join(', ') })
  }

  metaTags.push({ property: 'og:title', content: ogTitle })
  metaTags.push({ property: 'og:description', content: ogDesc })
  metaTags.push({ property: 'og:type', content: 'article' })
  if (ogImage) {
    metaTags.push({ property: 'og:image', content: ogImage })
  }

  if (blogData.publishedAt) {
    metaTags.push({ property: 'article:published_time', content: new Date(blogData.publishedAt).toISOString() })
  }

  if (blogData.indexStatus && String(blogData.indexStatus).trim() !== '') {
    const indexStatus = String(blogData.indexStatus).trim().toLowerCase()
    if (indexStatus === 'noindex' || indexStatus === 'noindex, nofollow') {
      metaTags.push({ name: 'robots', content: indexStatus })
    }
  }

  useHead({
    title: seoTitle,
    link: canonical ? [{ rel: 'canonical', href: canonical }] : [],
    meta: metaTags
  })
}, { immediate: true })
</script>

<style scoped>
.blog-detail-page {
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
  max-width: 800px;
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
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Featured Image */
.featured-image {
  width: 100%;
  margin-bottom: 2rem;
  border-radius: 8px;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: auto;
  display: block;
}

/* Blog Header */
.blog-header {
  margin-bottom: 2rem;
}

.blog-title {
  font-size: 2.5rem;
  font-weight: 600;
  color: #2c2c2c;
  margin: 0 0 1rem;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
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

.blog-reading-time {
  font-weight: 400;
  color: #999;
}

.blog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.blog-tag {
  padding: 0.25rem 0.75rem;
  background: #f0f0f0;
  color: #666;
  font-size: 0.75rem;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Blog Content */
.blog-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-content :deep(h1),
.blog-content :deep(h2),
.blog-content :deep(h3),
.blog-content :deep(h4),
.blog-content :deep(h5),
.blog-content :deep(h6) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #2c2c2c;
  line-height: 1.3;
}

.blog-content :deep(p) {
  margin-bottom: 1.5rem;
}

.blog-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 2rem 0;
  border-radius: 8px;
}

.blog-content :deep(a) {
  color: #2c2c2c;
  text-decoration: underline;
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 2rem;
}

.blog-content :deep(li) {
  margin-bottom: 0.5rem;
}

/* Back Section */
.back-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c2c2c;
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  transition: color 0.2s;
}

.back-link:hover {
  color: #000;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 1rem;
}

.loading-text {
  font-size: 1rem;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem 1rem;
}

.error-text {
  font-size: 1rem;
  color: #d32f2f;
  margin-bottom: 1rem;
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

/* Not Found State */
.not-found-state {
  text-align: center;
  padding: 4rem 1rem;
}

.not-found-state h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #2c2c2c;
  margin: 0 0 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.not-found-state p {
  font-size: 1rem;
  color: #666;
  margin: 0 0 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}
</style>
