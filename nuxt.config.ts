// https://nuxt.com/docs/api/configuration/nuxt-config
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local file if it exists
const envLocalPath = resolve(process.cwd(), '.env.local')
dotenv.config({ path: envLocalPath })

export default defineNuxtConfig({
  // Devtools/HMR can prevent bfcache in Lighthouse; keep it dev-only.
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  
  runtimeConfig: {
    public: {
      // Backend API base URL (prod default points to live API)
      // Change via env: NUXT_PUBLIC_API_BASE=https://api.svrve.com
      // Or create .env.local file with: NUXT_PUBLIC_API_BASE=http://localhost:9090
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://api.svrve.com',
      // Public site URL used for SEO / canonical links
      // Change via env: NUXT_PUBLIC_SITE_URL=https://svrve.com
      // Or create .env.local file with: NUXT_PUBLIC_SITE_URL=http://localhost:3000
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
        { property: 'og:url', content: 'https://svrve.com' },
        { property: 'og:site_name', content: 'SVRVE' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Ceramic Artistry - Handcrafted Ceramics' },
        { name: 'twitter:description', content: 'Discover beautiful handcrafted ceramic products. Shop unique dinnerware, vases, decorative pieces, and mugs.' }
      ],
      link: [
        // Global canonical URL (can be overridden per page)
        { rel: 'canonical', href: 'https://svrve.com' }
      ],
      script: [
        {
          // Restore original URL from ?p= param (GitHub Pages SPA routing)
          children: `(function(){try{var search=window.location.search||'';if(!search)return;var params=new URLSearchParams(search);var p=params.get('p');if(!p)return;var decoded=decodeURIComponent(p);if(!decoded)return;var url=new URL(decoded,window.location.origin);window.history.replaceState({},'',url.pathname+url.search+url.hash);}catch(e){}})();`
        }
      ]
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
