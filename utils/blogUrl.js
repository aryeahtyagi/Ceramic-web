// Single source of truth for a blog post's public URL, so links, canonical tags and
// redirects all agree (mismatches show up in Search Console as "Alternative page with proper canonical tag").

export const slugifyTitle = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Path like `/blog/12/my-post`. Uses the admin "Canonical URL" when it is a valid URL for this
 * same post (`/blog/{id}/{slug}`); otherwise falls back to the slugified title.
 */
export const blogPath = (blog) => {
  if (!blog?.id) return '/blog'
  const raw = String(blog.canonicalUrl || '').trim()
  if (raw) {
    try {
      const path = new URL(raw, 'https://svrve.com').pathname.replace(/\/+$/, '')
      const m = path.match(/^\/blog\/(\d+)\/([a-z0-9-]+)$/i)
      if (m && m[1] === String(blog.id)) return path
    } catch {
      // invalid URL — fall through to title slug
    }
  }
  return `/blog/${blog.id}/${slugifyTitle(blog.title || 'Untitled')}`
}
