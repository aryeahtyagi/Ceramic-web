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
        <p class="loading-text">Loading blogs...</p>
        <p style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
          Debug: pending={{ pending }}, isLoading={{ isLoading }}, error={{ error ? 'Yes' : 'No' }}, data={{ blogsData ? 'Yes' : 'No' }}
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p class="error-text">Failed to load blogs. Please try again later.</p>
        <button class="retry-btn" type="button" @click="refresh()">Retry</button>
      </div>

      <!-- Blog Posts Grid -->
      <div v-else class="blog-grid">
        <!-- Debug: Show count -->
        <div style="grid-column: 1 / -1; padding: 1rem; background: #f0f0f0; margin-bottom: 1rem; font-size: 0.875rem;">
          <strong>Debug:</strong> Showing {{ blogPosts.length }} of {{ blogsData?.length || 0 }} blogs
        </div>
        
        <article
          v-for="post in blogPosts"
          :key="post.id"
          class="blog-card"
        >
          <a 
            :href="`/blog/${post.slug}`"
            class="blog-card-link"
            @click.prevent="handleBlogClick(post.slug)"
          >
            <div v-if="post.image && resolveImageUrl(post.image)" class="blog-image">
              <img
                :src="resolveImageUrl(post.image)"
                :alt="post.title"
                loading="lazy"
                @error="handleImageError($event)"
                @load="handleImageLoad($event)"
              />
            </div>
            <div class="blog-content">
              <div class="blog-meta">
                <span class="blog-date">{{ formatDate(post.date) }}</span>
                <span class="blog-category">{{ post.category }}</span>
                <span v-if="post.readingTime" class="blog-reading-time">{{ post.readingTime }} min read</span>
              </div>
              <h2 class="blog-title">{{ post.title }}</h2>
              <p class="blog-excerpt">{{ post.excerpt }}</p>
              <span class="read-more">Read More →</span>
            </div>
          </a>
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
import { ref, computed, watch, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const cart = useCart()
const config = useRuntimeConfig()
const apiBase = computed(() => String(config.public.apiBase || '').replace(/\/$/, ''))

// --- Menu ---
const menuOpen = ref(false)

// Fetch blogs from API - use ref for manual control
const blogsData = ref(null)
const pending = ref(true)
const error = ref(null)

// Manual fetch to have better control
const fetchBlogs = async () => {
  try {
    pending.value = true
    error.value = null
    console.log('[Blog List] Fetching blogs from:', `${apiBase.value}/blogs`)
    
    const response = await $fetch('/blogs', {
      baseURL: apiBase.value
    })
    
    console.log('[Blog List] Raw response:', response)
    console.log('[Blog List] Response type:', typeof response)
    console.log('[Blog List] Is array?', Array.isArray(response))
    
    blogsData.value = response
    pending.value = false
    console.log('[Blog List] Fetch complete, blogsData set to:', blogsData.value)
  } catch (err) {
    console.error('[Blog List] Fetch error:', err)
    error.value = err
    pending.value = false
  }
}

// Fetch on mount
onMounted(() => {
  fetchBlogs()
})

const refresh = () => {
  fetchBlogs()
}

// Watch for data changes
watch(blogsData, (newVal) => {
  console.log('[Blog List] blogsData changed:', newVal)
  console.log('[Blog List] Type:', typeof newVal)
  console.log('[Blog List] Is array?', Array.isArray(newVal))
  if (newVal) {
    console.log('[Blog List] Value length:', Array.isArray(newVal) ? newVal.length : 'N/A')
  }
}, { immediate: true })

// Watch for pending changes
watch(pending, (newVal) => {
  console.log('[Blog List] Pending state changed:', newVal)
})

// Watch for error changes
watch(error, (newVal) => {
  console.log('[Blog List] Error state changed:', newVal)
})

// Force pending to false if we have data (workaround for useFetch issue)
const isLoading = computed(() => {
  // Check if we have data (even if pending is still true)
  const hasData = blogsData.value !== null && blogsData.value !== undefined
  console.log('[Blog List] isLoading check - hasData:', hasData, 'pending:', pending.value)
  if (hasData) {
    return false // If we have data, we're not loading
  }
  return pending.value
})

// Transform API data to display format
const blogPosts = computed(() => {
  if (!blogsData.value || !Array.isArray(blogsData.value)) {
    console.log('[Blog List] No blogs data or not an array')
    return []
  }
  
  console.log('[Blog List] Total blogs from API:', blogsData.value.length)
  console.log('[Blog List] Blog statuses:', blogsData.value.map(b => ({ id: b.id, status: b.status, title: b.title })))
  
  // Show all blogs regardless of status for now (we can filter later if needed)
  const filtered = blogsData.value.filter(blog => {
    // Check multiple possible status values
    const status = String(blog.status || '').toLowerCase()
    // Show all blogs - remove status filter temporarily to debug
    return true
    // return status === 'published' || status === 'publish' || !status
  })
  
  console.log('[Blog List] Filtered blogs:', filtered.length)
  console.log('[Blog List] Blog IDs:', filtered.map(b => b.id))
  
  const mapped = filtered.map(blog => ({
    id: blog.id,
    slug: blog.slug || `blog-${blog.id}`,
    title: blog.title || 'Untitled',
    excerpt: blog.metaDescription || blog.content?.substring(0, 150) || 'No description available.',
      image: blog.featuredImageUrl || '',
    date: blog.publishedAt ? new Date(blog.publishedAt) : new Date(blog.createdAt || Date.now()),
    category: blog.category || 'Uncategorized',
    readingTime: blog.readingTime || null
  }))
  
  console.log('[Blog List] Mapped blog posts:', mapped.length)
  return mapped
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
  console.log('[Blog List] Image failed to load:', event.target.src)
  // Hide the image or show a simple placeholder div instead
  event.target.style.display = 'none'
  // Create a placeholder div if parent doesn't have one
  const parent = event.target.parentElement
  if (parent && !parent.querySelector('.image-placeholder')) {
    const placeholder = document.createElement('div')
    placeholder.className = 'image-placeholder'
    placeholder.style.cssText = 'width: 100%; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;'
    placeholder.textContent = 'Image not available'
    parent.appendChild(placeholder)
  }
  event.target.onerror = null // Prevent infinite loop
}

// Handle image load
const handleImageLoad = (event) => {
  console.log('[Blog List] Image loaded successfully:', event.target.src)
}

// Handle blog click
const handleBlogClick = async (slug) => {
  const targetPath = `/blog/${slug}`
  try {
    await router.push(targetPath)
  } catch (error) {
    console.error('[Blog List] Navigation error:', error)
    try {
      await router.replace(targetPath)
    } catch (err) {
      console.error('[Blog List] Replace also failed:', err)
    }
  }
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

// SEO
useHead({
  title: 'Blog - SVRVE',
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

.blog-reading-time {
  font-weight: 400;
  color: #999;
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
</style>
