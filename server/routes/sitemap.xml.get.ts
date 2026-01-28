export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
  
  console.log('[Sitemap] Fetching from backend:', `${apiBase}/sitemap`)
  
  try {
    // Fetch sitemap data from backend
    const sitemapUrl = `${apiBase}/sitemap`
    const response = await $fetch(sitemapUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*'
      }
    })
    
    console.log('[Sitemap] Backend response received:', typeof response)
    
    // Set proper content type for XML
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')
    
    // Return the response (could be XML string or object)
    if (typeof response === 'string') {
      return response
    }
    
    // If backend returns JSON, convert to XML (basic conversion)
    // You may need to adjust this based on your backend response format
    return response
  } catch (error) {
    console.error('[Sitemap] Failed to fetch from backend:', error)
    
    // Return a basic sitemap structure on error
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.public.siteUrl || 'https://svrve.com'}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
  }
})
