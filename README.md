# Ceramic Web

A beautiful Nuxt 3 website for showcasing and selling ceramic products.

## Development

```bash
# Install dependencies
npm install

# Run development server (default - uses production API)
npm run dev

# Run development server with LOCAL backend (localhost:9090)
npm run dev:local

# Run development server with PRODUCTION backend (api.svrve.com)
npm run dev:prod

# Build for production (default - uses production API)
npm run build

# Build with LOCAL backend
npm run build:local

# Build with PRODUCTION backend
npm run build:prod

# Generate static site for GitHub Pages (default - uses production API)
npm run generate

# Generate static site with PRODUCTION backend
npm run generate:prod

# Preview production build (runs the built SSR app)
npm run preview

# Start production server (same as preview - run after npm run build)
npm run start
```

## SSR (Server-Side Rendering)

This project has **SSR enabled** (`ssr: true`) for better SEO. Pages are rendered on the server so search engines receive full HTML.

- **Development**: `npm run dev` — runs with SSR; you’ll see server-rendered HTML.
- **Production**: `npm run build` then `npm run start` (or `npm run preview`) — builds the Node server and runs it. The app runs as a Node server, not a static SPA.

For static export (e.g. GitHub Pages), use `npm run generate`; Nuxt will pre-render routes to static HTML.

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
- **Configurable base URL**: automatically set via npm scripts
  - **Production**: `https://api.svrve.com` (used by `npm run dev:prod` and `npm run build:prod`)
  - **Local**: `http://localhost:9090` (used by `npm run dev:local` and `npm run build:local`)

The public site URL used for SEO / canonical links is also configured via the scripts:
- **Production**: `https://svrve.com`
- **Local**: `http://localhost:3000`

### Quick Start

- **For local development**: `npm run dev:local` (connects to `localhost:9090`)
- **For production testing**: `npm run dev:prod` (connects to `api.svrve.com`)

Note: The default `npm run dev` uses production settings. Use the `:local` or `:prod` variants for explicit environment control.

## Going live (production)

Use the **production API** and site URL when deploying:

- **API**: `https://api.svrve.com`
- **Site**: `https://svrve.com`

**Build and run (SSR server):**
```bash
npm run build:prod   # build with prod API + site URL
npm run start       # run the built app
```

**One-step deploy (build + start):**
```bash
npm run deploy
```

**Static export (e.g. GitHub Pages):**
```bash
npm run generate:prod
```

When going live, either:
- Do **not** use a `.env.local` that points to a local API, or
- Remove/rename `.env.local` before building so the prod defaults in `build:prod` / `generate:prod` are used.
