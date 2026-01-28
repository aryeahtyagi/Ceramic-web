// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Devtools/HMR can prevent bfcache in Lighthouse; keep it dev-only.
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  
  runtimeConfig: {
    public: {
      // Backend API base URL (prod default points to live API)
      // Change via env: NUXT_PUBLIC_API_BASE=https://api.svrve.com
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.svrve.com',
      // Public site URL used for SEO / canonical links
      // Change via env: NUXT_PUBLIC_SITE_URL=https://svrve.com
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://svrve.com'
    }
  },

  // GitHub Pages configuration
  app: {
    baseURL: '/',
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: 'Ceramic Artistry - Handcrafted Ceramics',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content: 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs. Each piece is carefully crafted by skilled artisans with sustainable practices.'
        },
        {
          name: 'keywords',
          content: 'ceramic, pottery, handcrafted ceramics, dinnerware, ceramic vases, ceramic mugs, decorative ceramics, artisan pottery'
        },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Ceramic Artistry - Handcrafted Ceramics' },
        { property: 'og:description', content: 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs.' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Ceramic Artistry - Handcrafted Ceramics' },
        { name: 'twitter:description', content: 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs.' }
      ],
      link: []
    }
  },

  // Global CSS
  css: ['~/assets/css/main.css'],

  // Static site generation for GitHub Pages (SSG) with HTML output
  // This makes above-the-fold content (and images) discoverable in the initial document.
  ssr: false,
  
  // Build optimization
  nitro: {
    prerender: {
      routes: ['/', '/collections']
    }
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false
  },

  // Vite dev server configuration for network access
  vite: {
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: {
        clientPort: 3000
      }
    }
  }
})
