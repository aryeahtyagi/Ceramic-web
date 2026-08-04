// https://nuxt.com/docs/api/configuration/nuxt-config
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load .env.local file if it exists
const envLocalPath = resolve(process.cwd(), '.env.local')
dotenv.config({ path: envLocalPath })

// When running `nuxt dev`, NODE_ENV is development — default to local backend.
// Production builds / preview use production URLs unless NUXT_PUBLIC_* is set.
const isNuxtDev = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  // Devtools/HMR can prevent bfcache in Lighthouse; keep it dev-only.
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  
  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        (isNuxtDev ? 'http://localhost:9090' : 'https://api.svrve.com'),
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ||
        (isNuxtDev ? 'http://localhost:3000' : 'https://svrve.com'),
      // Not a secret — it's meant to be embedded in frontend JS. Hardcoded fallback so a prod
      // server that hasn't been given this (newer) env var yet still shows the Google button,
      // same safety net apiBase/siteUrl already have above.
      googleClientId:
        process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ||
        (isNuxtDev ? '' : '1069497687982-qn8po112qgf64bs1eoug2l7nlumv08mh.apps.googleusercontent.com')
    }
  },

  // GitHub Pages configuration
  app: {
    baseURL: '/',
    head: {
      htmlAttrs: {
        lang: 'en-IN'
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
        { rel: 'canonical', href: 'https://svrve.com' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500&display=swap'
        }
      ],
      script: [
        {
          // Restore original URL from ?p= param (GitHub Pages SPA routing). No unload/beforeunload — keeps bfcache eligible.
          children: `(function(){try{var search=window.location.search||'';if(!search)return;var params=new URLSearchParams(search);var p=params.get('p');if(!p)return;var decoded=decodeURIComponent(p);if(!decoded)return;var url=new URL(decoded,window.location.origin);window.history.replaceState({},'',url.pathname+url.search+url.hash);}catch(e){}})();`
        }
      ]
    }
  },

  // Global CSS
  css: ['~/assets/css/main.css'],

  // Server-Side Rendering for SEO (HTML is rendered on the server so crawlers see full content)
  ssr: true,

  // Optional: pre-render these routes at build time (hybrid mode)
  nitro: {
    prerender: {
      routes: ['/', '/collections', '/blog']
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
