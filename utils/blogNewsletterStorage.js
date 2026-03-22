/** Session flag: user dismissed the blog newsletter popup (Maybe later / close). Cleared on logout so guests can see it again. */
export const BLOG_NEWSLETTER_DISMISS_KEY = 'blog_newsletter_popup_v2'

export function clearBlogNewsletterDismissFlag() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(BLOG_NEWSLETTER_DISMISS_KEY)
  } catch {
    /* ignore */
  }
}
