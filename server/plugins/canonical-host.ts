// 301-redirect http:// and www. requests to https://svrve.com so Google sees one copy of every page.
// The site sits behind Cloudflare, which reports the visitor's scheme in x-forwarded-proto / cf-visitor.
// Runs as a 'request' hook (not server/middleware) so it also covers prerendered static pages like / and /blog.
import type { H3Event } from 'h3'

const CANONICAL_HOST = 'svrve.com'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', redirectToCanonicalHost)
})

function redirectToCanonicalHost(event: H3Event) {
  const host = String(getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || '')
    .split(':')[0]
    .toLowerCase()

  // Only touch the production domain (leaves localhost / preview hosts alone)
  if (host !== CANONICAL_HOST && host !== `www.${CANONICAL_HOST}`) return

  const forwardedProto = String(getRequestHeader(event, 'x-forwarded-proto') || '').split(',')[0].trim().toLowerCase()
  const cfVisitor = String(getRequestHeader(event, 'cf-visitor') || '')
  // Only treat as http when a proxy explicitly says so — avoids redirect loops if the origin itself is plain http
  const isHttp = forwardedProto === 'http' || cfVisitor.includes('"scheme":"http"')

  if (host === CANONICAL_HOST && !isHttp) return

  return sendRedirect(event, `https://${CANONICAL_HOST}${event.node.req.url || '/'}`, 301)
}
