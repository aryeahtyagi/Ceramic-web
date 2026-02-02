<template>
  <div class="blog-detail-page">

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
        <!-- Top Navigation -->
        <div class="article-nav">
          <NuxtLink to="/blog" class="nav-back-btn">
            <span class="sr-only">Back to blog</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </NuxtLink>
          <button class="nav-share-btn" type="button" @click="handleShare" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <!-- Featured Image (no explicit width/height; sizing via CSS only) -->
        <div v-if="blog.featuredImageUrl" class="featured-image" ref="featuredImageWrapRef">
          <img
            ref="featuredImageRef"
            :src="resolveImageUrl(blog.featuredImageUrl)"
            :alt="blog.title || 'Blog featured image'"
            loading="eager"
          />
        </div>

        <!-- Article Content -->
        <div class="article-content">
          <!-- Title -->
          <h1 class="article-title">{{ blog.h1Title || blog.title || 'Untitled' }}</h1>
          
          <!-- Metadata -->
          <div class="article-meta">
            <span v-if="blog.publishedAt" class="meta-date">{{ formatDateShort(blog.publishedAt) }}</span>
            <span v-if="blog.publishedAt && blog.readingTime" class="meta-separator">•</span>
            <span v-if="blog.readingTime" class="meta-reading-time">{{ blog.readingTime }} min read</span>
          </div>

          <!-- Blog Content -->
          <div class="blog-content" v-html="processedContent"></div>

          <!-- Updated / Last modified (bottom, before related products) -->
          <p v-if="blog.updatedAt || blog.publishedAt" class="article-updated">Last modified on {{ formatDateShort(blog.updatedAt || blog.publishedAt) }}</p>
        </div>
      </article>

      <!-- Related Products Carousel -->
      <section v-if="blog && blog.collectionCategory && relatedProducts.length > 0" class="related-products-section">
        <h2 class="related-products-title">Related Products</h2>
        <div class="products-carousel-wrapper">
          <div class="products-carousel" ref="carouselRef">
            <NuxtLink
              v-for="product in relatedProducts"
              :key="product.id"
              :to="getProductUrl(product)"
              class="product-card"
            >
              <div class="product-image">
                <img
                  :src="getProductImage(product)"
                  :alt="product.name"
                  loading="lazy"
                />
                <span v-if="product.discountPercent" class="discount-badge">{{ product.discountPercent }}% OFF</span>
              </div>
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-price">Rs. {{ formatPrice(product.price) }}</div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onScopeDispose, onMounted, nextTick } from 'vue'

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const siteUrl = String(config.public.siteUrl || 'https://svrve.com').replace(/\/$/, '')

const blogId = route.params.id

// Server-side fetch: blog by ID — use string URL so navigation from list works
const blogUrl = blogId ? `${apiBase}/blog/${blogId}` : null
const { data: blog, pending, error, refresh } = await useFetch(blogUrl, {
  key: `blog-${blogId || 'missing'}`,
})

// Related products: fetch when blog has category; guard updates so we never set state after unmount
const relatedProductsResponse = ref(null)
const isActive = ref(true)
onScopeDispose(() => { isActive.value = false })

const fetchRelated = async () => {
  const cat = blog.value?.collectionCategory
  if (!cat) return
  try {
    const url = `${apiBase}/collections/type/${cat}`
    const data = await $fetch(url)
    if (isActive.value) relatedProductsResponse.value = Array.isArray(data) ? data : []
  } catch {
    if (isActive.value) relatedProductsResponse.value = []
  }
}
// Run on server (after blog is loaded) and on client when blog loads
if (blog.value?.collectionCategory) {
  await fetchRelated()
}
watch(() => blog.value?.collectionCategory, (cat) => { if (cat) fetchRelated() }, { immediate: true })
const category = computed(() => blog.value?.collectionCategory ?? null)

// Transform related products to display format
const relatedProducts = computed(() => {
  const raw = relatedProductsResponse.value
  const list = Array.isArray(raw) ? raw : []
  return list.map(product => {
    const catalogImage = product.images?.find(img => img.catalogImage) || product.images?.[0]
    const imageUrl = catalogImage?.imageUrl || product.image || ''
    const discountPercent = product.discounts?.enable ? Number(product.discounts.discount || 0) : 0
    return {
      id: product.id,
      name: product.name || 'Product',
      price: Number(product.price || 0),
      image: imageUrl,
      discountPercent: discountPercent > 0 ? discountPercent : null,
      raw: product
    }
  })
})

const carouselRef = ref(null)
const featuredImageRef = ref(null)
const featuredImageWrapRef = ref(null)

// Ensure featured image never has explicit width/height (sizing via CSS only)
function stripFeaturedImageDimensions() {
  nextTick(() => {
    const el = featuredImageRef.value
    if (el && el instanceof HTMLImageElement) {
      el.removeAttribute('width')
      el.removeAttribute('height')
    }
  })
}
watch(() => blog.value?.featuredImageUrl, () => stripFeaturedImageDimensions(), { immediate: true })
onMounted(stripFeaturedImageDimensions)

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

// Process blog content to handle custom tags
const processBlogContent = (content) => {
  if (!content) return ''
  
  let processed = String(content)
  
  // Convert <img>{link}</img> to <img src="link" alt="" />
  // Handle both <img>{link}</img> and <img>link</img> formats
  processed = processed.replace(/<img>\s*\{?\s*([^<{}]+?)\s*\}?\s*<\/img>/gi, (match, link) => {
    const imageUrl = resolveImageUrl(link.trim())
    if (!imageUrl) return ''
    // Escape HTML in URL to prevent XSS
    const safeUrl = imageUrl.replace(/"/g, '&quot;')
    return `<div class="blog-content-image"><img src="${safeUrl}" alt="" loading="lazy" /></div>`
  })
  
  // Convert <br> to proper line break
  processed = processed.replace(/<br\s*\/?>/gi, '<br />')
  
  // Convert <bold>{value}</bold> to <strong>value</strong>
  // Handle both <bold>{value}</bold> and <bold>value</bold> formats
  processed = processed.replace(/<bold>\s*\{?\s*([^<{}]+?)\s*\}?\s*<\/bold>/gi, '<strong>$1</strong>')
  
  // Also handle <b>{value}</b> for bold
  processed = processed.replace(/<b>\s*\{?\s*([^<{}]+?)\s*\}?\s*<\/b>/gi, '<strong>$1</strong>')
  
  // Ensure no img has explicit width/height attributes (use CSS for sizing)
  processed = processed.replace(/\s+width\s*=\s*["'][^"']*["']/gi, '')
  processed = processed.replace(/\s+height\s*=\s*["'][^"']*["']/gi, '')
  
  // Wrap every img in a container with aspect-ratio (sizing via CSS, no width/height on img)
  processed = processed.replace(/<img(\s[^>]*?)\s*\/?>/gi, '<div class="blog-content-image"><img$1></div>')
  
  return processed
}

// Processed blog content
const processedContent = computed(() => {
  if (!blog.value || !blog.value.content) return ''
  return processBlogContent(blog.value.content)
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

// Format date short (e.g., "MAY 12TH, 2025")
const formatDateShort = (date) => {
  if (!date) return ''
  try {
    const d = new Date(date)
    const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase()
    const day = d.getDate()
    const year = d.getFullYear()
    const daySuffix = getDaySuffix(day)
    return `${month} ${day}${daySuffix}, ${year}`
  } catch {
    return ''
  }
}

// Get day suffix (1st, 2nd, 3rd, 4th, etc.)
const getDaySuffix = (day) => {
  if (day >= 11 && day <= 13) return 'TH'
  switch (day % 10) {
    case 1: return 'ST'
    case 2: return 'ND'
    case 3: return 'RD'
    default: return 'TH'
  }
}

// Handle share (client-only; uses window/navigator)
const handleShare = async () => {
  if (typeof window === 'undefined') return
  if (navigator.share && blog.value) {
    try {
      await navigator.share({
        title: blog.value.title,
        text: blog.value.metaDescription || '',
        url: window.location.href
      })
    } catch (err) {
      // User cancelled or error
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    } catch (err) {
      // Fallback failed
    }
  }
}

// Helper function to get SEO value with fallback
const getSeoValue = (apiValue, fallback) => {
  if (apiValue && String(apiValue).trim() !== '') {
    return String(apiValue).trim()
  }
  return fallback
}

// Dynamic SEO with useHead (runs on server so View Source has full meta + canonical).
// When blogData is null (e.g. during client hydration), do not set title so we don't overwrite the SSR title.
useHead(() => {
  try {
  const blogData = blog.value
  if (!blogData) return {}

  const seoTitle = getSeoValue(blogData.seoTitle, blogData.title ? `${blogData.title} | SVRVE Blog` : 'Blog | SVRVE')
  const metaDesc = getSeoValue(blogData.metaDescription, blogData.content ? blogData.content.substring(0, 160).replace(/<[^>]*>/g, '') : 'Read our latest blog post on SVRVE.')
  // og:title = main article title (h1), not SEO title from API
  const ogTitle = blogData.h1Title || blogData.title || 'Blog | SVRVE'
  const ogDesc = getSeoValue(blogData.ogDescription, metaDesc)
  const ogImage = getSeoValue(blogData.ogImageUrl, blogData.featuredImageUrl ? resolveImageUrl(blogData.featuredImageUrl) : '')
  const currentUrl = `${siteUrl}/blog/${blogData.id}/${slugify(blogData.title)}`
  const canonical = getSeoValue(blogData.canonicalUrl, currentUrl)

  const metaTags = [
    { name: 'description', content: metaDesc },
    { property: 'og:title', content: ogTitle },
    { property: 'og:description', content: ogDesc },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: currentUrl }
  ]
  if (ogImage) metaTags.push({ property: 'og:image', content: ogImage })
  if (blogData.primaryKeyword && String(blogData.primaryKeyword).trim() !== '') {
    const kw = [String(blogData.primaryKeyword).trim()]
    if (blogData.secondaryKeywords && String(blogData.secondaryKeywords).trim() !== '') kw.push(String(blogData.secondaryKeywords).trim())
    metaTags.push({ name: 'keywords', content: kw.join(', ') })
  }
  if (blogData.publishedAt) metaTags.push({ property: 'article:published_time', content: new Date(blogData.publishedAt).toISOString() })
  if (blogData.indexStatus && String(blogData.indexStatus).trim() !== '') {
    const s = String(blogData.indexStatus).trim().toLowerCase()
    if (s === 'noindex' || s === 'noindex, nofollow') metaTags.push({ name: 'robots', content: s })
  }

  const featuredImage = blogData.featuredImageUrl ? resolveImageUrl(blogData.featuredImageUrl) : ''
  
  // Estimate word count from content
  const wordCount = blogData.content ? blogData.content.replace(/<[^>]*>/g, '').split(/\s+/).length : 0
  
  // Build keywords array
  const keywords = []
  if (blogData.primaryKeyword && String(blogData.primaryKeyword).trim() !== '') {
    keywords.push(String(blogData.primaryKeyword).trim())
  }
  if (blogData.secondaryKeywords && String(blogData.secondaryKeywords).trim() !== '') {
    const secondary = String(blogData.secondaryKeywords).trim().split(',').map(k => k.trim()).filter(k => k)
    keywords.push(...secondary)
  }
  
  // Parse tags
  let tagsArray = []
  if (blogData.tags) {
    if (Array.isArray(blogData.tags)) {
      tagsArray = blogData.tags
    } else if (typeof blogData.tags === 'string') {
      tagsArray = blogData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    }
  }
  
  // Build Product schemas from related products (guard in case component is tearing down)
  const products = (relatedProducts.value || []).slice()
  const productSchemas = products.map(product => {
    const productImage = getProductImage(product)
    const productUrl = `${siteUrl}${getProductUrl(product)}`
    
    const productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.raw?.description || product.raw?.about || '',
      image: productImage ? [productImage] : undefined,
      url: productUrl,
      sku: String(product.id),
      offers: {
        '@type': 'Offer',
        price: String(product.price),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: productUrl
      }
    }
    
    // Add discount if available
    if (product.discountPercent && product.raw?.discounts) {
      const originalPrice = product.price / (1 - product.discountPercent / 100)
      productSchema.offers.price = String(product.price)
      productSchema.offers.priceSpecification = {
        '@type': 'UnitPriceSpecification',
        price: String(product.price),
        priceCurrency: 'INR',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitCode: 'C62' // unit code for "one"
        }
      }
      productSchema.offers.priceValidUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 60 days from now
    }
    
    // Add brand
    productSchema.brand = {
      '@type': 'Brand',
      name: 'SVRVE'
    }
    
    // Add category if available
    if (blogData.collectionCategory) {
      productSchema.category = blogData.collectionCategory
    }
    
    // Remove undefined values
    Object.keys(productSchema).forEach(key => {
      if (productSchema[key] === undefined) {
        delete productSchema[key]
      }
    })
    if (productSchema.offers) {
      Object.keys(productSchema.offers).forEach(key => {
        if (productSchema.offers[key] === undefined) {
          delete productSchema.offers[key]
        }
      })
    }
    
    return productSchema
  })
  
  // Build BlogPosting schema
  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': blogData.schemaType || 'BlogPosting',
    headline: blogData.h1Title || blogData.title || 'Untitled',
    description: blogData.metaDescription || (blogData.content ? blogData.content.replace(/<[^>]*>/g, '').substring(0, 200) : ''),
    image: featuredImage ? [featuredImage] : undefined,
    datePublished: blogData.publishedAt ? new Date(blogData.publishedAt).toISOString() : undefined,
    dateModified: blogData.updatedAt ? new Date(blogData.updatedAt).toISOString() : (blogData.publishedAt ? new Date(blogData.publishedAt).toISOString() : undefined),
    author: {
      '@type': 'Person',
      name: 'Arya Tyagi'
    },
    publisher: {
      '@type': 'Organization',
      name: 'SVRVE',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png` // Adjust if you have a logo URL
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogData.canonicalUrl || currentUrl
    },
    articleSection: blogData.category || undefined,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    wordCount: wordCount > 0 ? wordCount : undefined,
    timeRequired: blogData.readingTime ? `PT${blogData.readingTime}M` : undefined, // ISO 8601 duration format
    inLanguage: 'en-IN',
    ...(tagsArray.length > 0 && { articleTag: tagsArray }),
    // Add mentions of related products
    ...(productSchemas.length > 0 && { 
      mentions: productSchemas.map(p => ({
        '@type': 'Product',
        '@id': p.url,
        name: p.name
      }))
    })
  }
  
  // Remove undefined values
  Object.keys(blogPostingSchema).forEach(key => {
    if (blogPostingSchema[key] === undefined) {
      delete blogPostingSchema[key]
    }
  })
  
  // Build Organization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SVRVE',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`, // Adjust if you have a logo URL
    sameAs: [] // Add social media links if available
  }

  const links = [
    { rel: 'canonical', href: canonical },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap' }
  ]
  const scriptTags = [
    { type: 'application/ld+json', children: JSON.stringify(blogPostingSchema) },
    { type: 'application/ld+json', children: JSON.stringify(organizationSchema) },
    ...productSchemas.map(ps => ({ type: 'application/ld+json', children: JSON.stringify(ps) }))
  ]
  return { title: seoTitle, link: links, meta: metaTags, script: scriptTags }
  } catch {
    return {}
  }
})

// Slugify function for URL-friendly titles
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Get product image URL
const getProductImage = (product) => {
  if (!product.image) return ''
  return resolveImageUrl(product.image)
}

// Get product URL
const getProductUrl = (product) => {
  const slug = slugify(product.name)
  return `/product/${slug}-${product.id}`
}

// Format price
const formatPrice = (price) => {
  const n = Number(price || 0)
  try {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(n)
  }
}
</script>

<style scoped>
.blog-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.content {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* Article Navigation */
.article-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: transparent;
  pointer-events: none;
}

.nav-back-btn,
.nav-share-btn {
  pointer-events: all;
  background: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-back-btn {
  padding: 10px 16px;
  border-radius: 24px;
  text-decoration: none;
  color: #000;
}

.nav-back-btn svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}

.nav-share-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: #000;
}

.nav-share-btn svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

.nav-back-btn:hover,
.nav-share-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Featured Image */
.featured-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 0;
  border-radius: 0;
  overflow: hidden;
  background: #e8e8e8;
  position: relative;
}

.featured-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

/* Article Content */
.article-content {
  max-width: 680px;
  margin: 0 auto;
  padding: 32px 20px 24px;
  background: #fff;
}

@media (min-width: 768px) {
  .article-content {
    padding: 48px 40px 32px;
  }
}

/* Article Title */
.article-title {
  font-size: 1.625rem;
  font-weight: 800;
  color: #000;
  margin: 0 0 16px;
  line-height: 1.2;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.03em;
}

@media (min-width: 768px) {
  .article-title {
    font-size: 2.5rem;
    line-height: 1.15;
  }
}

/* Article Metadata */
.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  font-size: 0.875rem;
  color: #5c5c5c;
  font-weight: 400;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.meta-separator {
  color: #757575;
}

.meta-date,
.meta-reading-time {
  color: #5c5c5c;
}

.article-updated {
  margin: 2rem 0 0;
  font-size: 0.875rem;
  color: #5c5c5c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* Blog Content */
.blog-content {
  font-size: 1rem;
  line-height: 1.75;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 400;
}

@media (min-width: 768px) {
  .blog-content {
    font-size: 1.0625rem;
    line-height: 1.8;
  }
}

.blog-content :deep(h1),
.blog-content :deep(h2),
.blog-content :deep(h3),
.blog-content :deep(h4),
.blog-content :deep(h5),
.blog-content :deep(h6) {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  color: #000;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
}

.blog-content :deep(h1) {
  font-size: 1.875rem;
  margin-top: 3rem;
}

.blog-content :deep(h2) {
  font-size: 1.625rem;
  margin-top: 2.5rem;
}

.blog-content :deep(h3) {
  font-size: 1.375rem;
}

.blog-content :deep(h4) {
  font-size: 1.25rem;
}

@media (min-width: 768px) {
  .blog-content :deep(h1) {
    font-size: 2.25rem;
  }
  
  .blog-content :deep(h2) {
    font-size: 1.875rem;
  }
  
  .blog-content :deep(h3) {
    font-size: 1.5rem;
  }
}

.blog-content :deep(p) {
  margin-bottom: 1.5rem;
  color: #333;
}

@media (min-width: 768px) {
  .blog-content :deep(p) {
    margin-bottom: 1.75rem;
  }
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.5rem;
}

.blog-content :deep(li) {
  margin-bottom: 0.75rem;
  color: #333;
}

.blog-content :deep(blockquote) {
  margin: 2rem 0;
  padding: 1.5rem 1.5rem;
  border-left: 3px solid #bbb;
  background: #f5f5f5;
  border-radius: 0;
  font-style: italic;
  color: #4a4a4a;
  font-size: 1rem;
  line-height: 1.7;
}

@media (min-width: 768px) {
  .blog-content :deep(blockquote) {
    padding: 2rem 2rem;
    margin: 2.5rem 0;
    font-size: 1.0625rem;
  }
}

/* In-content images: wrapper has aspect-ratio; img fills it (no width/height on img) */
.blog-content :deep(.blog-content-image) {
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  margin: 2rem 0;
  border-radius: 0;
  overflow: hidden;
  background: #e8e8e8;
}

.blog-content :deep(.blog-content-image img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.blog-content :deep(a) {
  color: #2c2c2c;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1.5px;
  transition: color 0.2s;
  font-weight: 500;
}

.blog-content :deep(a:hover) {
  color: #000;
  text-decoration-thickness: 2px;
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

.loading-text {
  font-size: 1rem;
  color: #5c5c5c;
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

/* Not Found State */
.not-found-state {
  text-align: center;
  padding: 6rem 1rem;
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
  color: #5c5c5c;
  margin: 0 0 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
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

/* Related Products Section */
.related-products-section {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  background: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: -1px;
}

@media (min-width: 768px) {
  .related-products-section {
    padding: 32px 40px 60px;
  }
}

.related-products-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
  margin: 0 0 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.02em;
}

.products-carousel-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  padding-bottom: 8px;
}

.products-carousel-wrapper::-webkit-scrollbar {
  height: 6px;
}

.products-carousel-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.products-carousel-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.products-carousel-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.products-carousel {
  display: flex;
  gap: 1rem;
  padding-bottom: 8px;
}

.product-card {
  flex: 0 0 180px;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.12);
}

.product-card .product-image {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(135deg, #f6f6f6 0%, #ededed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.product-card .product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.product-card .discount-badge {
  position: absolute;
  right: 8px;
  top: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  color: #fff;
  background: linear-gradient(135deg, #d32f2f, #f44336);
  z-index: 1;
}

.product-card .product-info {
  padding: 12px;
}

.product-card .product-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2c2c2c;
  margin: 0 0 6px;
  line-height: 1.4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card .product-price {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

@media (min-width: 768px) {
  .product-card {
    flex: 0 0 200px;
  }
}
</style>
