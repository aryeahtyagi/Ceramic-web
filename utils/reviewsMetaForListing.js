/**
 * Derive listing display fields from API `reviewsMetaData` and/or `reviews[]`
 * (same idea as the product detail page).
 * Kept in /utils with explicit relative imports from pages (avoids alias/SSR issues).
 */
export function reviewsMetaForListing(p) {
  const meta =
    p?.reviewsMetaData && typeof p.reviewsMetaData === 'object' ? p.reviewsMetaData : null
  const reviews = Array.isArray(p?.reviews) ? p.reviews : []

  let rating = null
  let count = 0

  if (meta) {
    if (meta.rating != null && meta.rating !== '') {
      const r = Number(meta.rating)
      if (Number.isFinite(r)) rating = r
    }
    if (meta.reviews != null && meta.reviews !== '') {
      const n = Number(meta.reviews)
      if (Number.isFinite(n)) count = Math.max(0, Math.floor(n))
    }
  }

  if (reviews.length > 0) {
    if (rating == null || !Number.isFinite(rating)) {
      const ratings = reviews.map((r) => Number(r.rating || 0)).filter((r) => r > 0)
      if (ratings.length > 0) {
        rating = ratings.reduce((a, b) => a + b, 0) / ratings.length
      }
    }
    if (count === 0) count = reviews.length
  }

  const ratingDisplay =
    rating != null && Number.isFinite(rating) ? Number(rating).toFixed(1) : null
  const starRating =
    rating != null && Number.isFinite(rating)
      ? Math.min(5, Math.max(0, Math.round(rating)))
      : 0

  const show =
    count > 0 ||
    (ratingDisplay != null && Number.parseFloat(ratingDisplay) > 0)

  return {
    ratingDisplay,
    starRating,
    count,
    show
  }
}
