## Backend API base URL

This Nuxt app calls your Spring Boot backend.

### Configure the API base URL

Set this environment variable before running/building:

- **`NUXT_PUBLIC_API_BASE`**: example `http://localhost:9090`

### Local dev example (PowerShell)

```powershell
$env:NUXT_PUBLIC_API_BASE="http://localhost:9090"
npm run dev
```

### Notes for GitHub Pages

GitHub Pages is static hosting. The `NUXT_PUBLIC_API_BASE` value is embedded during build/generate time, so to change it you typically rebuild + redeploy.

