## Backend API base URL

This Nuxt app calls your Spring Boot backend.

### Configure the API base URL

Set these environment variables before running/building:

- **`NUXT_PUBLIC_API_BASE`**: example `https://api.svrve.com`
- **`NUXT_PUBLIC_SITE_URL`**: example `https://svrve.com`

### Local dev example (PowerShell)

```powershell
$env:NUXT_PUBLIC_API_BASE="https://api.svrve.com"
$env:NUXT_PUBLIC_SITE_URL="https://svrve.com"
npm run dev
```

### Notes for GitHub Pages

GitHub Pages is static hosting. The `NUXT_PUBLIC_API_BASE` value is embedded during build/generate time, so to change it you typically rebuild + redeploy.

