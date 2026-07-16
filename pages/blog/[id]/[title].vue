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

          <!-- Always-available newsletter CTA — same modal as timed popup (guests) -->
          <div class="blog-inline-newsletter">
            <div class="blog-inline-newsletter-media">
              <img
                class="blog-inline-newsletter-mug"
                src="https://api.svrve.com/image/67"
                alt="Free ceramic mug gift"
                width="180"
                height="180"
                loading="lazy"
              />
            </div>
            <div class="blog-inline-newsletter-copy">
              <p class="blog-inline-newsletter-eyebrow">Free gift with signup</p>
              <p class="blog-inline-newsletter-label">
                Sign up &amp; get beautiful ceramic mugs — absolutely free
              </p>
              <p v-if="!isAuthenticated" class="blog-inline-newsletter-hint">
                Create an account to claim your complimentary mug and get new posts &amp; offers.
              </p>
              <p v-else class="blog-inline-newsletter-hint blog-inline-newsletter-hint--signed-in">
                You’re signed in — check your account for gift eligibility and updates.
              </p>
              <button
                type="button"
                class="blog-inline-newsletter-btn"
                :disabled="isAuthenticated"
                @click="handleNewsletterSubscribeClick"
              >
                {{ isAuthenticated ? "You're signed up" : 'Sign up & claim free mug' }}
              </button>
            </div>
          </div>

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

    <!-- Newsletter / login prompt (client-only, 5s after article loads) -->
    <Teleport to="body">
      <Transition name="blog-nl-popup">
        <div
          v-if="showNewsletterPopup"
          class="blog-nl-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-nl-title"
          @click.self="dismissNewsletterPopup"
        >
          <div class="blog-nl-modal">
            <button
              type="button"
              class="blog-nl-close"
              aria-label="Close"
              @click="dismissNewsletterPopup"
            >
              ×
            </button>
            <div class="blog-nl-media">
              <img
                class="blog-nl-mug"
                src="https://api.svrve.com/image/67"
                alt="Free ceramic mug gift"
                width="200"
                height="200"
                loading="lazy"
              />
            </div>
            <p class="blog-nl-eyebrow">Complimentary gift</p>
            <h2 id="blog-nl-title" class="blog-nl-title">
              Sign up &amp; get beautiful ceramic mugs — absolutely free
            </h2>
            <p class="blog-nl-text">
              Create an account to claim your free mug and get new blogs, drops, and offers.
            </p>
            <div class="blog-nl-actions">
              <NuxtLink
                class="blog-nl-cta"
                :to="loginSubscribeUrl"
                @click="dismissNewsletterPopup"
              >
                Sign up &amp; claim free mug
              </NuxtLink>
              <button type="button" class="blog-nl-later" @click="dismissNewsletterPopup">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, watch, onScopeDispose, onMounted, onUnmounted, nextTick } from 'vue'
import { BLOG_NEWSLETTER_DISMISS_KEY } from '~/utils/blogNewsletterStorage.js'

const route = useRoute()
/** Top-level ref so template unwraps correctly (nested auth.isAuthenticated does NOT unwrap in templates) */
const { isAuthenticated } = useAuth()
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

/** Newsletter popup — 5s after successful load; login CTA for guests */
const showNewsletterPopup = ref(false)
const NEWSLETTER_DELAY_MS = 5_000
let newsletterTimerId = null

const loginSubscribeUrl = computed(() => {
  const path = route.fullPath || '/blog'
  return `/login?redirect=${encodeURIComponent(path)}`
})

function clearNewsletterTimer() {
  if (newsletterTimerId != null && typeof window !== 'undefined') {
    window.clearTimeout(newsletterTimerId)
    newsletterTimerId = null
  }
}

function dismissNewsletterPopup() {
  showNewsletterPopup.value = false
  if (import.meta.client) {
    try {
      sessionStorage.setItem(BLOG_NEWSLETTER_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    document.body.style.overflow = ''
  }
}

/** Open the same subscribe modal from the inline page button (ignores “dismissed” session flag) */
function openNewsletterSubscribeFromPage() {
  if (!import.meta.client) return
  if (isAuthenticated.value) return
  showNewsletterPopup.value = true
  document.body.style.overflow = 'hidden'
}

function handleNewsletterSubscribeClick() {
  if (isAuthenticated.value) return
  openNewsletterSubscribeFromPage()
}

function canShowNewsletterPopup() {
  if (!import.meta.client) return false
  if (!blog.value || pending.value || error.value) return false
  if (isAuthenticated.value) return false
  try {
    if (sessionStorage.getItem(BLOG_NEWSLETTER_DISMISS_KEY)) return false
  } catch {
    /* ignore */
  }
  return true
}

function scheduleNewsletterPopup() {
  clearNewsletterTimer()
  if (!canShowNewsletterPopup()) return

  newsletterTimerId = window.setTimeout(() => {
    newsletterTimerId = null
    if (!canShowNewsletterPopup()) return
    showNewsletterPopup.value = true
  }, NEWSLETTER_DELAY_MS)
}

/** Must run on client after mount — SSR / first paint never schedules a browser timer */
function resetAndScheduleNewsletterPopup() {
  showNewsletterPopup.value = false
  if (import.meta.client) document.body.style.overflow = ''
  clearNewsletterTimer()
  nextTick(() => scheduleNewsletterPopup())
}

onMounted(() => {
  nextTick(() => {
    resetAndScheduleNewsletterPopup()
  })
})

watch(
  () => [String(blogId ?? ''), blog.value?.id, pending.value, error.value, isAuthenticated.value],
  () => {
    resetAndScheduleNewsletterPopup()
  },
  { immediate: true, flush: 'post' }
)

watch(showNewsletterPopup, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  clearNewsletterTimer()
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})

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

/* Inline newsletter CTA (below article body; guests only) */
.blog-inline-newsletter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 0;
  padding: 1.25rem 1.125rem 1.5rem;
  background: linear-gradient(180deg, #faf8f6 0%, #fff 55%, #f7f5f2 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  text-align: center;
}

.blog-inline-newsletter-media {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: #ebe6df;
  box-shadow: 0 8px 24px rgba(60, 40, 20, 0.12);
}

.blog-inline-newsletter-mug {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.blog-inline-newsletter-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.blog-inline-newsletter-eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a6a4a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-inline-newsletter-label {
  margin: 0 0 0.5rem;
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.3;
  color: #111;
  letter-spacing: -0.02em;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-inline-newsletter-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.85rem;
  padding: 0.7rem 1.35rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  background: #111;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease, transform 0.15s ease;
}

.blog-inline-newsletter-btn:hover {
  background: #333;
}

.blog-inline-newsletter-btn:active {
  transform: scale(0.99);
}

.blog-inline-newsletter-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.blog-inline-newsletter-hint {
  margin: 0;
  max-width: 28rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #666;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-inline-newsletter-hint--signed-in {
  color: #2d6a4f;
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
  margin: 0 0 6px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* slab-serif — global main.css */
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

/* Newsletter / login popup (teleported to body) */
.blog-nl-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.blog-nl-modal {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 28px 24px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  text-align: center;
}

.blog-nl-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  color: #666;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
  z-index: 1;
}

.blog-nl-close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111;
}

.blog-nl-media {
  width: 148px;
  height: 148px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  overflow: hidden;
  background: #ebe6df;
  box-shadow: 0 10px 28px rgba(60, 40, 20, 0.14);
}

.blog-nl-mug {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.blog-nl-eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a6a4a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-nl-title {
  margin: 0 0 12px;
  padding: 0 8px;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.blog-nl-text {
  margin: 0 0 22px;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #444;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-nl-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.blog-nl-cta {
  display: block;
  text-align: center;
  padding: 14px 18px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  background: #111;
  border-radius: 999px;
  transition: background 0.2s ease, transform 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.blog-nl-cta:hover {
  background: #333;
}

.blog-nl-cta:active {
  transform: scale(0.99);
}

.blog-nl-later {
  padding: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.blog-nl-later:hover {
  color: #111;
}

.blog-nl-popup-enter-active,
.blog-nl-popup-leave-active {
  transition: opacity 0.25s ease;
}

.blog-nl-popup-enter-active .blog-nl-modal,
.blog-nl-popup-leave-active .blog-nl-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.blog-nl-popup-enter-from,
.blog-nl-popup-leave-to {
  opacity: 0;
}

.blog-nl-popup-enter-from .blog-nl-modal,
.blog-nl-popup-leave-to .blog-nl-modal {
  transform: scale(0.96) translateY(8px);
  opacity: 0.9;
}

/* ---------------------------------------------------------------------------
   Desktop layout & polish (1024px+) — mobile / tablet base styles unchanged
   --------------------------------------------------------------------------- */
@media (min-width: 1024px) {
  .blog-detail-page {
    background: linear-gradient(180deg, #f8f8f8 0%, #ececec 45%, #e8e8e8 100%);
    padding-bottom: 48px;
  }

  .content {
    max-width: 1120px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 32px;
    padding-right: 32px;
  }

  .blog-article {
    margin-top: 24px;
    border-radius: 20px;
    overflow: hidden;
    background: #fff;
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.04),
      0 12px 32px rgba(0, 0, 0, 0.08);
  }

  /* Sticky bar inside the card (replaces floating overlay on large screens) */
  .article-nav {
    position: sticky;
    top: 0;
    z-index: 30;
    padding: 16px 28px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    pointer-events: auto;
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset;
  }

  .nav-back-btn,
  .nav-share-btn {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .featured-image {
    aspect-ratio: 21 / 9;
    max-height: 440px;
    margin: 0;
    border-radius: 0;
  }

  .featured-image img {
    object-position: center center;
  }

  .article-content {
    max-width: 680px;
    padding: 48px 56px 56px;
    margin: 0 auto;
    background: #fff;
  }

  .article-title {
    font-size: 2.75rem;
    line-height: 1.12;
    font-weight: 800;
    letter-spacing: -0.038em;
    margin-bottom: 20px;
  }

  .article-meta {
    margin-bottom: 40px;
    padding-bottom: 28px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
    font-size: 0.8125rem;
    letter-spacing: 0.08em;
  }

  .blog-content {
    font-size: 1.125rem;
    line-height: 1.88;
    color: #2a2a2a;
  }

  .blog-content :deep(p) {
    max-width: 65ch;
  }

  .blog-content :deep(h2) {
    margin-top: 2.75rem;
  }

  .blog-content :deep(blockquote) {
    border-left-width: 4px;
    border-left-color: #2c2c2c;
    background: linear-gradient(90deg, #f9f9f9 0%, #fff 100%);
    border-radius: 0 8px 8px 0;
    padding: 1.75rem 2rem;
    font-size: 1.0625rem;
  }

  .blog-content :deep(.blog-content-image) {
    border-radius: 12px;
    margin: 2.5rem auto;
    max-width: 100%;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .blog-inline-newsletter {
    flex-direction: row;
    align-items: center;
    text-align: left;
    gap: 1.75rem;
    margin: 2.5rem auto 0;
    max-width: 100%;
    padding: 1.5rem 1.75rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: linear-gradient(145deg, #faf8f6 0%, #f3f0eb 50%, #faf8f6 100%);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .blog-inline-newsletter-media {
    width: 168px;
    height: 168px;
  }

  .blog-inline-newsletter-copy {
    align-items: flex-start;
    flex: 1;
    min-width: 0;
  }

  .blog-inline-newsletter-label {
    font-size: 1.25rem;
  }

  .blog-inline-newsletter-hint {
    max-width: none;
  }

  .article-updated {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    font-size: 0.8125rem;
    color: #6b6b6b;
  }

  /* Related products: grid instead of horizontal scroll */
  .related-products-section {
    max-width: 1120px;
    margin: 32px auto 0;
    padding: 40px 40px 56px;
    background: #fff;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow:
      0 4px 6px rgba(0, 0, 0, 0.04),
      0 12px 28px rgba(0, 0, 0, 0.06);
  }

  .related-products-title {
    font-size: 1.375rem;
    margin-bottom: 1.75rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  }

  .products-carousel-wrapper {
    overflow: visible;
    padding-bottom: 0;
  }

  .products-carousel {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.25rem;
    padding-bottom: 0;
  }

  .product-card {
    flex: none;
    width: 100%;
    border-radius: 12px;
  }

  .product-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}
</style>
