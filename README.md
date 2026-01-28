# Ceramic Web

A beautiful Nuxt 3 website for showcasing and selling ceramic products.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Generate static site for GitHub Pages
npm run generate

# Preview production build
npm run preview
```

## GitHub Pages Deployment

This project is configured for GitHub Pages deployment. The base path is set to `/Ceramic-web/` for production builds.

The GitHub Actions workflow will automatically:
1. Generate the static site: `npm run generate`
2. Deploy the `dist` folder to GitHub Pages

## Project Structure

- `pages/` - File-based routing (index.vue, collections.vue)
- `assets/` - CSS and other static assets
- `public/` - Static files (robots.txt, etc.)
- `nuxt.config.ts` - Nuxt configuration

## Backend API (Spring Boot)

The collections/products page fetches data from your backend:

- **Endpoint**: `GET /collections`
- **Configurable base URL**: set `NUXT_PUBLIC_API_BASE`
  - Example (production): `NUXT_PUBLIC_API_BASE=https://api.svrve.com`
  - Example (local): `NUXT_PUBLIC_API_BASE=http://localhost:9090`

The public site URL used for SEO / canonical links is configured via:

- `NUXT_PUBLIC_SITE_URL` (example: `https://svrve.com`)

Note: since this is a static deploy, changing the API base or site URL typically means rebuilding + redeploying with new env values.
