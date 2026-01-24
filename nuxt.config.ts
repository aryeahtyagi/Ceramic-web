// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Devtools/HMR can prevent bfcache in Lighthouse; keep it dev-only.
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  
  runtimeConfig: {
    public: {
      // Change via env: NUXT_PUBLIC_API_BASE=http://localhost:9090
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:9090'
    }
  },

  // GitHub Pages configuration
  app: {
    baseURL: process.env.NODE_ENV === 'production' ? '/Ceramic-web/' : '/',
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
  }
})
