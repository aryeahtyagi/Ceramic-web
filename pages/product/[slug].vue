<template>
  <div class="product-page">
    <!-- Top Banner -->
    <div class="top-banner">
      <p class="banner-text">Designed to impress, Made to use</p>
    </div>

    <!-- Header -->
    <header class="topbar">
      <button class="menu-btn" type="button" aria-label="Menu" @click="menuOpen = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
      <NuxtLink to="/" class="brand-logo">
        <span class="logo-text">SVRVE</span>
        <span class="logo-dot">•</span>
      </NuxtLink>
      <div class="topbar-actions">
        <button class="cart-btn" type="button" @click="router.push('/cart')" aria-label="Cart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <span v-if="cart.totalQty.value" class="cart-badge" aria-label="Cart items">{{ cart.totalQty.value }}</span>
        </button>
        <AccountDropdown />
      </div>
    </header>

    <!-- Hamburger Menu -->
    <HamburgerMenu :is-open="menuOpen" @close="menuOpen = false" />

    <div class="content">
      <section v-if="pending" class="loading">
        <div class="img-skel"></div>
        <div class="line w-70"></div>
        <div class="line w-90"></div>
        <div class="line w-60"></div>
      </section>

      <section v-else-if="error || !product" class="error">
        <h1 class="error-title">Couldn’t load product</h1>
        <p class="error-sub">
          Please check your backend and try again.
        </p>
        <button class="retry" type="button" @click="refresh()">Retry</button>
      </section>

      <section v-else class="product">
        <!-- Product Media -->
        <div class="media">
          <div 
            class="image-swiper"
            tabindex="0"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseEnd"
            @mouseleave="handleMouseEnd"
            @keydown="handleKeyDown"
          >
            <div 
              class="image-container"
              :class="{ dragging: isDragging }"
              :style="{ transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))` }"
            >
              <img
                v-for="(img, idx) in gallery"
                :key="`gallery-${idx}-${img}`"
                class="hero-img"
                :src="img"
                :alt="product.name"
                :loading="idx === 0 ? 'eager' : 'lazy'"
                :fetchpriority="idx === 0 ? 'high' : undefined"
                decoding="async"
                referrerpolicy="no-referrer"
                crossorigin="anonymous"
              />
            </div>

            <div v-if="gallery.length > 1" class="image-nav">
              <button
                v-if="currentImageIndex > 0"
                type="button"
                class="nav-btn nav-prev"
                @click="goToPrevious"
                aria-label="Previous image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                v-if="currentImageIndex < gallery.length - 1"
                type="button"
                class="nav-btn nav-next"
                @click="goToNext"
                aria-label="Next image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div v-if="gallery.length > 1" class="image-indicators">
              <button
                v-for="(img, idx) in gallery"
                :key="`indicator-${idx}`"
                type="button"
                class="indicator"
                :class="{ active: idx === currentImageIndex }"
                @click="goToImage(idx)"
                :aria-label="`Go to image ${idx + 1}`"
              />
            </div>

            <div v-if="discountPercent" class="discount-badge">{{ discountPercent }}% OFF</div>
            
            <button 
              type="button" 
              class="zoom-btn"
              @click="openZoomModal"
              aria-label="Zoom image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="info">
          <h1 class="product-name">{{ product.name }}</h1>

          <div class="price-section">
            <div class="price-row">
              <span class="price-display">
                <span class="price-currency">Rs.</span>
                <span class="price-amount">{{ formatPriceNumberOnly(offerPrice || product.price) }}</span>
              </span>
              <span v-if="discountPercent" class="original-price-display">
                <span class="original-price-currency">Rs.</span>
                <span class="original-price-amount">{{ formatPriceNumberOnly(product.price) }}</span>
              </span>
              <span v-if="selectedQuantity > 1" class="qty-total">
                for {{ selectedQuantity }} pcs · Rs. {{ formatPriceNumberOnly(totalSelectedPrice) }}
              </span>
            </div>
            <p class="price-tax-note">Price incl. of all taxes</p>
          </div>

          <button
            v-if="productReviewsSorted.length"
            type="button"
            class="rating-section rating-section--link"
            aria-label="Click to scroll to customer reviews"
            @click="scrollToReviews"
          >
            <div class="rating-row">
              <div class="stars">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= starRating }">★</span>
              </div>
              <span v-if="reviewsCount > 0" class="reviews-text">
                {{ averageRating }}/5 ({{ reviewsCount }} review{{ reviewsCount !== 1 ? 's' : '' }})
              </span>
              <span v-else class="reviews-text">No reviews yet</span>
            </div>
            <span class="rating-hint">Click here to see customer reviews with photos</span>
          </button>
          <div v-else class="rating-section">
            <div class="stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= starRating }">★</span>
            </div>
            <span v-if="reviewsCount > 0" class="reviews-text">
              {{ averageRating }}/5 ({{ reviewsCount }} review{{ reviewsCount !== 1 ? 's' : '' }})
            </span>
            <span v-else class="reviews-text">No reviews yet</span>
          </div>

          <!-- Rating distribution bars + rotating review excerpts (from API reviews) -->
          <button
            v-if="productReviewsSorted.length"
            type="button"
            class="rating-breakdown-btn"
            aria-label="View all customer reviews"
            @click="scrollToReviews"
          >
            <div class="rating-histogram" aria-hidden="true">
              <div v-for="s in [5, 4, 3, 2, 1]" :key="s" class="rating-histogram-row">
                <span class="rating-histogram-label">{{ s }}★</span>
                <div class="rating-histogram-track">
                  <div
                    class="rating-histogram-fill"
                    :style="{ width: `${ratingHistogramPercent[s]}%` }"
                  />
                </div>
              </div>
            </div>
            <div v-if="reviewsWithTextSnippet.length" class="rating-snippet-wrap">
              <Transition name="review-snippet-fade" mode="out-in">
                <p :key="rotatingReviewIndex" class="rating-snippet-text" aria-live="polite">
                  “{{ currentRotatingSnippet }}”
                </p>
              </Transition>
            </div>
          </button>

          <!-- Service highlights (Amazon-style) -->
          <div class="service-highlights" aria-label="Delivery and returns">
            <div class="service-highlight-item">
              <svg class="service-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
                <path d="M6 15h4"/>
              </svg>
              <span class="service-highlight-text">Pay on delivery</span>
            </div>
            <div class="service-highlight-item">
              <svg class="service-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M1 3h15v13H1z"/>
                <path d="M16 8h4l3 3v5h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
                <circle cx="18" cy="6" r="3"/>
                <path d="M18 4.5v3M18 6h1.5"/>
              </svg>
              <span class="service-highlight-text">One day delivery guarantee</span>
            </div>
            <div class="service-highlight-item">
              <svg class="service-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M1 3h15v13H1z"/>
                <path d="M16 8h4l3 3v5h-7V8z"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span class="service-highlight-text">Free delivery</span>
            </div>
            <div class="service-highlight-item">
              <svg class="service-highlight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="6" width="18" height="13" rx="2"/>
                <path d="M8 11l-4 4 4 4"/>
                <path d="M4 15h13"/>
              </svg>
              <span class="service-highlight-text">30 days return</span>
            </div>
          </div>

          <!-- Quantity + Add to bag (stacked capsules) -->
          <div class="product-actions">
            <div class="quantity-section">
              <span class="sr-only">Quantity</span>
              <div class="quantity-controls" role="group" aria-label="Quantity">
                <button
                  class="qty-btn qty-btn--minus"
                  type="button"
                  @click="selectedQuantity = Math.max(1, selectedQuantity - 1)"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span class="qty-value">{{ selectedQuantity }}</span>
                <button class="qty-btn qty-btn--plus" type="button" @click="selectedQuantity++" aria-label="Increase quantity">
                  +
                </button>
              </div>
            </div>

            <button
              class="add-to-cart-btn"
              type="button"
              @click="addCurrentToCart"
              :aria-label="selectedQuantity > 1 ? `Add ${selectedQuantity} items to bag` : 'Add to bag'"
            >
              <template v-if="selectedQuantity > 1">
                Add {{ selectedQuantity }} items to bag
              </template>
              <template v-else>
                Add to bag
              </template>
            </button>
          </div>

          <!-- Product Description -->
          <div v-if="product.description || product.about" class="description-section">
            <h2 class="section-title">Description</h2>
            <p class="description-text">{{ product.description || product.about }}</p>
          </div>

          <!-- Features/Benefits -->
          <div v-if="lovePoints.length > 0" class="features-section">
            <h2 class="section-title">Features</h2>
            <ul class="features-list">
              <li v-for="point in lovePoints" :key="point.id || point.value" class="feature-item">
                {{ point.value }}
              </li>
            </ul>
          </div>

          <!-- Customer reviews (mobile: original position — before specs / shipping) -->
          <div
            v-if="productReviewsSorted.length"
            id="product-reviews-mobile"
            class="reviews-section product-reviews-mobile"
          >
            <div class="reviews-section-header">
              <h2 class="section-title">Customer reviews</h2>
              <p v-if="reviewsCount > 0" class="reviews-section-summary">
                <span class="reviews-summary-rating">{{ averageRating }}</span> out of 5
                <span class="reviews-summary-dot" aria-hidden="true">·</span>
                {{ reviewsCount }} {{ reviewsCount === 1 ? 'review' : 'reviews' }}
              </p>
            </div>

            <div class="reviews-filters" role="region" aria-label="Filter reviews">
              <div class="reviews-filters-row">
                <button
                  type="button"
                  class="reviews-filter-chip"
                  :class="{ 'reviews-filter-chip--active': reviewsFilterPhotosOnly }"
                  :aria-pressed="reviewsFilterPhotosOnly"
                  :disabled="reviewsWithPhotoCount === 0"
                  @click="reviewsFilterPhotosOnly = !reviewsFilterPhotosOnly"
                >
                  With photos
                  <span v-if="reviewsWithPhotoCount" class="reviews-filter-count">({{ reviewsWithPhotoCount }})</span>
                </button>
              </div>
              <div class="reviews-filters-row reviews-filters-row--stars" role="group" aria-label="Filter by star rating">
                <button
                  type="button"
                  class="reviews-filter-chip"
                  :class="{ 'reviews-filter-chip--active': reviewsFilterStar === null }"
                  @click="setReviewStarFilter(null)"
                >
                  All stars
                </button>
                <button
                  v-for="s in [1, 2, 3, 4, 5]"
                  :key="`m-star-${s}`"
                  type="button"
                  class="reviews-filter-chip"
                  :class="{ 'reviews-filter-chip--active': reviewsFilterStar === s }"
                  :disabled="starReviewCounts[s] === 0"
                  @click="toggleReviewStarFilter(s)"
                >
                  {{ s }}★
                  <span class="reviews-filter-count">({{ starReviewCounts[s] }})</span>
                </button>
              </div>
            </div>

            <ul v-if="displayedReviews.length" class="reviews-list" role="list">
              <li
                v-for="review in displayedReviews"
                :key="`m-${review.id ?? `${review.createdOn}-${review.description}`}`"
                class="review-card"
              >
                <div class="review-card-top">
                  <div class="review-author-block">
                    <div class="review-avatar" aria-hidden="true">{{ reviewerInitial(review.user) }}</div>
                    <div class="review-author-meta">
                      <div class="review-author-name">{{ reviewerDisplayName(review.user) }}</div>
                      <time
                        v-if="review.createdOn"
                        class="review-date"
                        :datetime="String(review.createdOn)"
                      >{{ formatReviewDate(review.createdOn) }}</time>
                    </div>
                  </div>
                  <div
                    class="review-stars-row"
                    :aria-label="`Rated ${Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0)))} out of 5`"
                  >
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="star review-star"
                      :class="{ filled: i <= Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0))) }"
                    >★</span>
                  </div>
                </div>
                <p v-if="review.description" class="review-text">{{ review.description }}</p>
                <div v-if="getReviewImageUrls(review).length" class="review-images">
                  <button
                    v-for="(imgUrl, idx) in getReviewImageUrls(review)"
                    :key="`m-${review.id}-img-${idx}`"
                    type="button"
                    class="review-thumb-btn"
                    @click="reviewPreviewUrl = imgUrl"
                  >
                    <img :src="imgUrl" :alt="`Photo from review ${idx + 1}`" loading="lazy" decoding="async" />
                  </button>
                </div>
              </li>
            </ul>
            <div v-else-if="filteredReviewsSorted.length === 0" class="reviews-filter-empty">
              <p class="reviews-filter-empty-text">No reviews match these filters.</p>
              <button type="button" class="reviews-filter-clear" @click="clearReviewFilters">
                Clear filters
              </button>
            </div>
            <div v-if="(showReviewsLoadMore || showReviewsSeeLess) && displayedReviews.length" class="reviews-actions">
              <button
                v-if="showReviewsLoadMore"
                type="button"
                class="reviews-load-btn"
                aria-label="Load more reviews"
                @click="loadMoreReviews"
              >
                Load more
              </button>
              <button
                v-if="showReviewsSeeLess"
                type="button"
                class="reviews-load-btn reviews-load-btn--secondary"
                aria-label="Show only the first two reviews"
                @click="seeLessReviews"
              >
                See less
              </button>
            </div>
          </div>

          <!-- Expandable Sections -->
          <div class="expandable-sections">
            <div 
              v-if="specifications.length"
              class="expandable-section"
              :class="{ expanded: expandedSections.material }"
            >
              <button 
                class="section-header"
                type="button"
                @click="toggleSection('material')"
              >
                <span>MATERIAL & SPECIFICATIONS</span>
                <span class="toggle-icon">{{ expandedSections.material ? '−' : '+' }}</span>
              </button>
              <div v-if="expandedSections.material" class="section-content">
                <table class="specifications-table">
                  <tbody>
                    <tr
                      v-for="spec in specifications"
                      :key="spec.id"
                      class="spec-row"
                    >
                      <td class="spec-label">{{ spec.label }}</td>
                      <td class="spec-value">{{ spec.value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="expandable-section" :class="{ expanded: expandedSections.shipping }">
              <button 
                class="section-header"
                type="button"
                @click="toggleSection('shipping')"
              >
                <span>SHIPPING & RETURNS</span>
                <span class="toggle-icon">{{ expandedSections.shipping ? '−' : '+' }}</span>
              </button>
              <div v-if="expandedSections.shipping" class="section-content">
                <p>Cash on delivery available. Easy returns within 7 days of delivery.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer reviews (desktop only: below product image, left column) -->
        <div
          v-if="productReviewsSorted.length"
          id="product-reviews-desktop"
          class="reviews-section product-reviews product-reviews-desktop"
        >
          <div class="reviews-section-header">
            <h2 class="section-title">Customer reviews</h2>
            <p v-if="reviewsCount > 0" class="reviews-section-summary">
              <span class="reviews-summary-rating">{{ averageRating }}</span> out of 5
              <span class="reviews-summary-dot" aria-hidden="true">·</span>
              {{ reviewsCount }} {{ reviewsCount === 1 ? 'review' : 'reviews' }}
            </p>
          </div>

          <div class="reviews-filters" role="region" aria-label="Filter reviews">
            <div class="reviews-filters-row">
              <button
                type="button"
                class="reviews-filter-chip"
                :class="{ 'reviews-filter-chip--active': reviewsFilterPhotosOnly }"
                :aria-pressed="reviewsFilterPhotosOnly"
                :disabled="reviewsWithPhotoCount === 0"
                @click="reviewsFilterPhotosOnly = !reviewsFilterPhotosOnly"
              >
                With photos
                <span v-if="reviewsWithPhotoCount" class="reviews-filter-count">({{ reviewsWithPhotoCount }})</span>
              </button>
            </div>
            <div class="reviews-filters-row reviews-filters-row--stars" role="group" aria-label="Filter by star rating">
              <button
                type="button"
                class="reviews-filter-chip"
                :class="{ 'reviews-filter-chip--active': reviewsFilterStar === null }"
                @click="setReviewStarFilter(null)"
              >
                All stars
              </button>
              <button
                v-for="s in [1, 2, 3, 4, 5]"
                :key="`d-star-${s}`"
                type="button"
                class="reviews-filter-chip"
                :class="{ 'reviews-filter-chip--active': reviewsFilterStar === s }"
                :disabled="starReviewCounts[s] === 0"
                @click="toggleReviewStarFilter(s)"
              >
                {{ s }}★
                <span class="reviews-filter-count">({{ starReviewCounts[s] }})</span>
              </button>
            </div>
          </div>

          <ul v-if="displayedReviews.length" class="reviews-list" role="list">
            <li
              v-for="review in displayedReviews"
              :key="`d-${review.id ?? `${review.createdOn}-${review.description}`}`"
              class="review-card"
            >
              <div class="review-card-top">
                <div class="review-author-block">
                  <div class="review-avatar" aria-hidden="true">{{ reviewerInitial(review.user) }}</div>
                  <div class="review-author-meta">
                    <div class="review-author-name">{{ reviewerDisplayName(review.user) }}</div>
                    <time
                      v-if="review.createdOn"
                      class="review-date"
                      :datetime="String(review.createdOn)"
                    >{{ formatReviewDate(review.createdOn) }}</time>
                  </div>
                </div>
                <div
                  class="review-stars-row"
                  :aria-label="`Rated ${Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0)))} out of 5`"
                >
                  <span
                    v-for="i in 5"
                    :key="i"
                    class="star review-star"
                    :class="{ filled: i <= Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0))) }"
                  >★</span>
                </div>
              </div>
              <p v-if="review.description" class="review-text">{{ review.description }}</p>
              <div v-if="getReviewImageUrls(review).length" class="review-images">
                <button
                  v-for="(imgUrl, idx) in getReviewImageUrls(review)"
                  :key="`d-${review.id}-img-${idx}`"
                  type="button"
                  class="review-thumb-btn"
                  @click="reviewPreviewUrl = imgUrl"
                >
                  <img :src="imgUrl" :alt="`Photo from review ${idx + 1}`" loading="lazy" decoding="async" />
                </button>
              </div>
            </li>
          </ul>
          <div v-else-if="filteredReviewsSorted.length === 0" class="reviews-filter-empty">
            <p class="reviews-filter-empty-text">No reviews match these filters.</p>
            <button type="button" class="reviews-filter-clear" @click="clearReviewFilters">
              Clear filters
            </button>
          </div>
          <div v-if="(showReviewsLoadMore || showReviewsSeeLess) && displayedReviews.length" class="reviews-actions">
            <button
              v-if="showReviewsLoadMore"
              type="button"
              class="reviews-load-btn"
              aria-label="Load more reviews"
              @click="loadMoreReviews"
            >
              Load more
            </button>
            <button
              v-if="showReviewsSeeLess"
              type="button"
              class="reviews-load-btn reviews-load-btn--secondary"
              aria-label="Show only the first two reviews"
              @click="seeLessReviews"
            >
              See less
            </button>
          </div>
        </div>

        <!-- Explore more (same category) — API fetched only when this block scrolls into view -->
        <section
          v-if="exploreApiType"
          ref="exploreSectionRef"
          class="explore-more"
          aria-labelledby="explore-more-heading"
        >
          <h2 id="explore-more-heading" class="explore-more-title">Explore more like this</h2>

          <div v-if="explorePending" class="explore-more-grid explore-more-grid--skeleton" aria-hidden="true">
            <div v-for="n in 4" :key="`ex-skel-${n}`" class="explore-more-card explore-more-card--skeleton">
              <div class="explore-more-card-image" />
              <div class="explore-more-card-body">
                <div class="explore-skel-line" />
                <div class="explore-skel-line explore-skel-line--short" />
              </div>
            </div>
          </div>

          <p v-else-if="exploreError" class="explore-more-error" role="status">
            Couldn’t load suggestions.
            <button type="button" class="explore-more-retry" @click="retryExploreMore">Retry</button>
          </p>

          <div v-else-if="exploreCards.length" class="explore-more-grid">
            <NuxtLink
              v-for="(item, idx) in exploreCards"
              :key="`explore-${item.id}`"
              class="explore-more-card"
              :to="item.href"
              :aria-label="`View ${item.name}`"
            >
              <div class="explore-more-card-image">
                <img
                  class="explore-more-card-img"
                  :src="item.image"
                  :alt="item.name"
                  :loading="idx < 4 ? 'eager' : 'lazy'"
                  decoding="async"
                  referrerpolicy="no-referrer"
                  crossorigin="anonymous"
                />
                <span v-if="item.discountPercent" class="explore-more-discount">{{ item.discountPercent }}% OFF</span>
              </div>
              <div class="explore-more-card-body">
                <h3 class="explore-more-card-name">{{ item.name }}</h3>
                <span class="explore-more-card-price">{{ formatPrice(item.price) }}</span>
              </div>
            </NuxtLink>
          </div>

          <p v-else-if="exploreFetchDone" class="explore-more-empty" role="status">
            No other products in this category yet.
          </p>
        </section>
      </section>

      <!-- Zoom Modal -->
      <Transition name="zoom-modal">
        <div v-if="showZoomModal" class="zoom-modal-overlay" @click="handleOverlayClick">
          <div class="zoom-modal-content" @click.stop>
            <button class="zoom-close-btn" type="button" @click="closeZoomModal" aria-label="Close zoom">
              ×
            </button>
            <div 
              class="zoom-image-container"
              @mousedown="startPan"
              @mousemove="handlePan"
              @mouseup="endPan"
              @mouseleave="endPan"
              @wheel.prevent="handleWheelZoom"
            >
              <img
                :src="gallery[currentImageIndex]"
                :alt="product.name"
                class="zoom-image"
                :style="{ 
                  transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
                  transition: zoomLevel <= 1 ? 'transform 0.3s' : 'none'
                }"
              />
            </div>
            <div class="zoom-controls">
              <button class="zoom-control-btn" type="button" @click="zoomIn" aria-label="Zoom in">+</button>
              <button class="zoom-control-btn" type="button" @click="zoomOut" aria-label="Zoom out">−</button>
              <button class="zoom-control-btn" type="button" @click="resetZoom" aria-label="Reset zoom">Reset</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Review photo lightbox -->
      <Transition name="zoom-modal">
        <div
          v-if="reviewPreviewUrl"
          class="review-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
          @click.self="reviewPreviewUrl = null"
        >
          <button type="button" class="review-preview-close" aria-label="Close" @click="reviewPreviewUrl = null">
            ×
          </button>
          <img :src="reviewPreviewUrl" alt="" class="review-preview-img" />
        </div>
      </Transition>
    </div>

    <div v-if="toast" class="toast" role="status" aria-live="polite">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue'
import { joinURL } from 'ufo'

const route = useRoute()
const requestURL = useRequestURL()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const slug = computed(() => String(route.params.slug || ''))
const id = computed(() => {
  const m = slug.value.match(/-(\d+)$/)
  return m ? m[1] : null
})

// Server-side fetch: product and SEO (runs on server so View Source has full HTML)
const { data, pending, error, refresh } = await useFetch(() => (id.value ? `${apiBase}/collections/${id.value}` : null), {
  key: computed(() => `product-${id.value}`)
})

const { data: seoData } = await useFetch(() => (id.value ? `${apiBase}/product-seo/${id.value}` : null), {
  key: computed(() => `product-seo-${id.value}`)
})

const raw = computed(() => (data.value && typeof data.value === 'object' ? data.value : null))

const normalize = (v) =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const mapTypeToCategory = (typeValue) => {
  const t = normalize(typeValue)
  if (!t) return null
  if (t.includes('plate')) return 'plates'
  if (t.includes('bowl')) return 'bowls'
  if (t.includes('mug') || t.includes('cup')) return 'mugs'
  if (t.includes('vase')) return 'vases'
  return null
}

const extractCategoryFromDetails = (product) => {
  const details = Array.isArray(product?.productDetails) ? product.productDetails : []
  const typeRow = details.find((d) => normalize(d?.dimension?.name) === 'type')
  return mapTypeToCategory(typeRow?.value)
}

const placeholderForCategory = (category) => {
  if (category === 'vases') return '/images/ceramic-vase.svg'
  if (category === 'mugs') return '/images/ceramic-mug.svg'
  if (category === 'bowls') return '/images/ceramic-bowl.svg'
  return '/images/ceramic-plate.svg'
}

const isBlockedImageHost = (url) => {
  const u = String(url || '').trim()
  if (!u) return false
  if (u.includes('img.icons8.com')) return true
  return false
}

const resolveImageUrl = (url) => {
  const u = String(url || '').trim()
  if (!u) return ''
  if (isBlockedImageHost(u)) return ''
  // Replace localhost URLs with configured API base
  if (u.includes('localhost:9090') || u.includes('localhost:')) {
    try {
      const urlObj = new URL(u)
      const path = urlObj.pathname + urlObj.search
      return `${apiBase}${path}`
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = u.match(/localhost:\d+(\/.*)/)
      if (match) return `${apiBase}${match[1]}`
      return u
    }
  }
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('/')) return `${apiBase}${u}`
  return u
}

const pickBackendImage = (p) => {
  const direct = p?.image?.value
  if (direct) return resolveImageUrl(direct)

  const images = Array.isArray(p?.images) ? p.images : []
  const catalog = images.find((x) => x?.catalogImage)
  if (catalog?.imageUrl) return resolveImageUrl(catalog.imageUrl)
  if (images[0]?.imageUrl) return resolveImageUrl(images[0].imageUrl)
  return ''
}

const product = computed(() => {
  const p = raw.value
  if (!p) return null
  const name = p?.name || 'Ceramic Product'
  const category = extractCategoryFromDetails(p) || 'plates'
  return {
    id: p?.id,
    name,
    description: p?.description || '',
    about: p?.about || '',
    price: Number(p?.price || 0),
    category,
    discounts: p?.discounts || null,
    benefits: Array.isArray(p?.benefits) ? p.benefits : [],
    lovePoints: Array.isArray(p?.productLovePoints) ? p.productLovePoints : [],
    productDetails: Array.isArray(p?.productDetails) ? p.productDetails : [],
    images: Array.isArray(p?.images) ? p.images : [],
    hero: pickBackendImage(p),
    /** From GET /collections/{id} — aggregate rating & count */
    reviewsMetaData: p?.reviewsMetaData && typeof p.reviewsMetaData === 'object' ? p.reviewsMetaData : null,
    reviews: Array.isArray(p?.reviews) ? p.reviews : []
  }
})

/** Segment for GET /collections/type/{type} — same as collections page (plates, mugs, …) */
const exploreApiType = computed(() => {
  const p = product.value
  if (!p?.id) return null
  const cat = p.category
  if (!cat) return null
  return String(cat).toLowerCase().replace(/\s+/g, '-')
})

const exploreSectionRef = ref(null)
const exploreFetchStarted = ref(false)
const exploreFetchDone = ref(false)
const exploreList = ref([])
const explorePending = ref(false)
const exploreError = ref(null)
let exploreObserver = null

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const exploreCards = computed(() =>
  exploreList.value.map((p) => {
    const name = p?.name || 'Ceramic Product'
    const cat = extractCategoryFromDetails(p) || product.value?.category || 'plates'
    const image = pickBackendImage(p) || placeholderForCategory(cat)
    const discountPercent = p?.discounts?.enable ? Number(p?.discounts?.discount || 0) : 0
    return {
      id: p.id,
      name,
      price: Number(p?.price || 0),
      image,
      href: `/product/${slugify(name)}-${p.id}`,
      discountPercent: discountPercent > 0 ? discountPercent : null
    }
  })
)

function disconnectExploreObserver() {
  exploreObserver?.disconnect()
  exploreObserver = null
}

async function fetchExploreMore(isRetry = false) {
  if (explorePending.value) return
  const t = exploreApiType.value
  const pid = product.value?.id
  if (!t || pid == null) return
  if (!isRetry && exploreFetchStarted.value) return
  exploreFetchStarted.value = true
  explorePending.value = true
  exploreError.value = null
  try {
    const list = await $fetch(`${apiBase}/collections/type/${encodeURIComponent(t)}`)
    const arr = Array.isArray(list) ? list : []
    exploreList.value = arr.filter((p) => Number(p?.id) !== Number(pid))
    exploreFetchDone.value = true
  } catch (e) {
    exploreError.value = e
    exploreFetchDone.value = true
  } finally {
    explorePending.value = false
  }
}

function retryExploreMore() {
  exploreFetchStarted.value = false
  exploreFetchDone.value = false
  exploreError.value = null
  exploreList.value = []
  fetchExploreMore(true)
}

function connectExploreObserver() {
  if (!import.meta.client) return
  disconnectExploreObserver()
  const el = exploreSectionRef.value
  if (!el) return
  exploreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        fetchExploreMore(false)
        disconnectExploreObserver()
      }
    },
    { root: null, rootMargin: '240px 0px 0px 0px', threshold: 0 }
  )
  exploreObserver.observe(el)
}

const gallery = computed(() => {
  const p = product.value
  if (!p) return []
  const list = []

  if (p.hero) list.push(p.hero)

  for (const img of p.images) {
    const u = resolveImageUrl(img?.imageUrl)
    if (u) list.push(u)
  }

  // de-dupe
  return Array.from(new Set(list))
})

const heroImage = ref('/images/ceramic-plate.svg')
const currentImageIndex = ref(0)

watchEffect(() => {
  const p = product.value
  if (!p) return
  const firstImage = gallery.value[0] || placeholderForCategory(p.category)
  heroImage.value = firstImage
  currentImageIndex.value = 0
})

// Update heroImage when currentImageIndex changes
watch(currentImageIndex, (idx) => {
  if (gallery.value[idx]) {
    heroImage.value = gallery.value[idx]
  }
})

// Swipe handling
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragOffset = ref(0)

const minSwipeDistance = 50

const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const deltaX = currentX - touchStartX.value
  const deltaY = currentY - touchStartY.value
  
  // Only allow horizontal swipe if it's more horizontal than vertical
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    dragOffset.value = deltaX
  }
}

const handleTouchEnd = (e) => {
  if (!isDragging.value) return
  
  touchEndX.value = e.changedTouches[0].clientX
  touchEndY.value = e.changedTouches[0].clientY
  
  const deltaX = touchEndX.value - touchStartX.value
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(touchEndY.value - touchStartY.value)
  
  // Only process swipe if it's more horizontal than vertical
  if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
    if (deltaX > 0) {
      goToPrevious()
    } else {
      goToNext()
    }
  }
  
  isDragging.value = false
  dragOffset.value = 0
}

const handleMouseDown = (e) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  touchStartX.value = e.clientX
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  const deltaX = e.clientX - dragStartX.value
  dragOffset.value = deltaX
}

const handleMouseEnd = () => {
  if (!isDragging.value) return
  
  const absDeltaX = Math.abs(dragOffset.value)
  if (absDeltaX > minSwipeDistance) {
    if (dragOffset.value > 0) {
      goToPrevious()
    } else {
      goToNext()
    }
  }
  
  isDragging.value = false
  dragOffset.value = 0
}

const goToImage = (index) => {
  if (index >= 0 && index < gallery.value.length) {
    currentImageIndex.value = index
  }
}

const goToNext = () => {
  if (currentImageIndex.value < gallery.value.length - 1) {
    currentImageIndex.value++
  }
}

const goToPrevious = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const handleKeyDown = (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goToPrevious()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goToNext()
  }
}

// --- Auth & Cart ---
const auth = useAuth()
const cart = useCart()
const router = useRouter()

// --- Menu ---
const menuOpen = ref(false)

const productQty = computed(() => {
  const p = product.value
  if (!p?.id) return 0
  return cart.getQty(Number(p.id))
})

const toast = ref('')
let toastTimer = null

const showToast = (msg) => {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 1800)
}

const checkAuth = () => {
  if (!auth.isAuthenticated.value) {
    const currentPath = route.fullPath
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
    return false
  }
  return true
}

const selectedQuantity = ref(1)

const addCurrentToCart = async () => {
  if (!checkAuth()) return

  const p = product.value
  if (!p?.id) return
  
  const success = await cart.addItem(
    {
      id: Number(p.id),
      name: p.name,
      price: Number(p.price || 0),
      image: gallery.value[currentImageIndex.value] || heroImage.value,
      slug: String(route.params.slug || '')
    },
    selectedQuantity.value
  )
  
  if (success) {
    showToast('Added to bag')
  } else {
    showToast('Failed to update cart. Please try again.')
  }
}

const handleQtyChange = async (action) => {
  if (!checkAuth()) return

  const p = product.value
  if (!p?.id) return

  let success = false
  if (action === 'inc') {
    success = await cart.inc(Number(p.id), 1)
  } else if (action === 'dec') {
    success = await cart.dec(Number(p.id), 1)
  }
  
  if (!success) {
    showToast('Failed to update cart. Please try again.')
  }
}

const showCartToast = () => {
  const n = cart.totalQty.value
  if (!n) {
    showToast('Cart is empty')
    return
  }
  showToast(`${n} item${n === 1 ? '' : 's'} in cart`)
}

const discountPercent = computed(() => {
  const d = product.value?.discounts
  if (!d?.enable) return null
  const n = Number(d?.discount || 0)
  return n > 0 ? n : null
})

const categoryLabel = computed(() => {
  const c = product.value?.category
  if (c === 'plates') return 'Plates'
  if (c === 'bowls') return 'Bowls'
  if (c === 'mugs') return 'Mugs'
  if (c === 'vases') return 'Vases'
  return null
})

const benefits = computed(() => product.value?.benefits || [])
const lovePoints = computed(() => product.value?.lovePoints || [])

const detailsRows = computed(() => {
  const rows = []
  const details = product.value?.productDetails || []
  for (const d of details) {
    const key = d?.dimension?.name
    if (!key || normalize(key) === 'type') continue
    const unit = d?.dimension?.unit || ''
    const val = d?.value ?? ''
    const value = unit ? `${val} ${unit}` : String(val)
    rows.push({ key, value })
  }
  return rows
})

// Reviews — prefer reviewsMetaData from product API; fallback to computing from reviews[]
const reviewsCount = computed(() => {
  const p = product.value
  const meta = p?.reviewsMetaData
  if (meta && meta.reviews != null && meta.reviews !== '') {
    const n = Number(meta.reviews)
    return Number.isFinite(n) ? n : 0
  }
  return Array.isArray(p?.reviews) ? p.reviews.length : 0
})

const averageRating = computed(() => {
  const p = product.value
  const meta = p?.reviewsMetaData
  if (meta && meta.rating != null && meta.rating !== '') {
    const rating = Number(meta.rating)
    if (Number.isFinite(rating)) {
      return rating.toFixed(1)
    }
  }
  const reviews = p?.reviews
  if (Array.isArray(reviews) && reviews.length > 0) {
    const ratings = reviews.map((r) => Number(r.rating || 0)).filter((r) => r > 0)
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      return avg.toFixed(1)
    }
  }
  return '0.0'
})

const starRating = computed(() => {
  const n = Number(averageRating.value)
  if (!Number.isFinite(n)) return 0
  return Math.min(5, Math.max(0, Math.round(n)))
})

const productReviewsSorted = computed(() => {
  const list = product.value?.reviews
  if (!Array.isArray(list) || !list.length) return []
  return [...list].sort((a, b) => {
    const ta = new Date(a?.createdOn || 0).getTime()
    const tb = new Date(b?.createdOn || 0).getTime()
    return tb - ta
  })
})

function reviewStarBucket(review) {
  const raw = Number(review?.rating)
  if (!Number.isFinite(raw)) return null
  return Math.min(5, Math.max(1, Math.round(raw)))
}

/** Percent of reviews per star (1–5) for histogram bars */
const ratingHistogramPercent = computed(() => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of productReviewsSorted.value) {
    const raw = Number(r?.rating)
    if (!Number.isFinite(raw) || raw < 1) continue
    const rounded = Math.round(raw)
    const bucket = Math.min(5, Math.max(1, rounded))
    counts[bucket]++
  }
  const total = productReviewsSorted.value.length || 1
  const pct = {}
  for (let s = 1; s <= 5; s++) {
    pct[s] = Math.round((counts[s] / total) * 100)
  }
  return pct
})

const reviewsWithTextSnippet = computed(() =>
  productReviewsSorted.value.filter(
    (r) => typeof r?.description === 'string' && String(r.description).trim().length > 0
  )
)

const rotatingReviewIndex = ref(0)

function truncateReviewText(text, max) {
  const t = String(text || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

const currentRotatingSnippet = computed(() => {
  const list = reviewsWithTextSnippet.value
  if (!list.length) return ''
  const text = String(list[rotatingReviewIndex.value]?.description || '').trim()
  return truncateReviewText(text, 130)
})

/** First batch of reviews shown; "Load more" adds this many each click */
const REVIEWS_INITIAL_COUNT = 2
const REVIEWS_LOAD_MORE_INCREMENT = 5
const reviewsVisibleCount = ref(REVIEWS_INITIAL_COUNT)
const reviewsFilterStar = ref(null)
const reviewsFilterPhotosOnly = ref(false)

watch(id, () => {
  reviewsVisibleCount.value = REVIEWS_INITIAL_COUNT
  rotatingReviewIndex.value = 0
  reviewsFilterStar.value = null
  reviewsFilterPhotosOnly.value = false
  exploreList.value = []
  exploreFetchStarted.value = false
  exploreFetchDone.value = false
  exploreError.value = null
  explorePending.value = false
  nextTick(() => connectExploreObserver())
})

watch(reviewsWithTextSnippet, (list) => {
  if (rotatingReviewIndex.value >= list.length) {
    rotatingReviewIndex.value = 0
  }
})

function scrollToReviews() {
  if (!import.meta.client) return
  const isDesktop = window.matchMedia('(min-width: 768px)').matches
  const id = isDesktop ? 'product-reviews-desktop' : 'product-reviews-mobile'
  const el = document.getElementById(id)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  try {
    history.replaceState(null, '', `#${id}`)
  } catch {
    /* ignore */
  }
}

function formatReviewDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(d)
  } catch {
    return ''
  }
}

function reviewerDisplayName(user) {
  if (!user || typeof user !== 'object') return 'Verified buyer'
  const raw = user.username || user.email || ''
  const s = String(raw).trim()
  if (!s) return 'Verified buyer'
  if (s.includes('@')) {
    const local = s.split('@')[0]
    return local || 'Verified buyer'
  }
  return s.length > 36 ? `${s.slice(0, 33)}…` : s
}

function reviewerInitial(user) {
  const name = reviewerDisplayName(user)
  const ch = name.charAt(0)
  return ch ? ch.toUpperCase() : '?'
}

function getReviewImageUrls(review) {
  const images = review?.images
  if (images == null || images === '') return []
  const list = Array.isArray(images) ? images : [images]
  const out = []
  for (const item of list) {
    if (item == null || item === '') continue
    const url =
      typeof item === 'string'
        ? item
        : String(item.imageUrl || item.url || item.image || '').trim()
    if (url) out.push(resolveImageUrl(url))
  }
  return out
}

const filteredReviewsSorted = computed(() => {
  let list = productReviewsSorted.value
  if (reviewsFilterPhotosOnly.value) {
    list = list.filter((r) => getReviewImageUrls(r).length > 0)
  }
  if (reviewsFilterStar.value != null) {
    const star = reviewsFilterStar.value
    list = list.filter((r) => reviewStarBucket(r) === star)
  }
  return list
})

const starReviewCounts = computed(() => {
  const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of productReviewsSorted.value) {
    const b = reviewStarBucket(r)
    if (b) c[b]++
  }
  return c
})

const reviewsWithPhotoCount = computed(() =>
  productReviewsSorted.value.filter((r) => getReviewImageUrls(r).length > 0).length
)

const totalReviewsListed = computed(() => filteredReviewsSorted.value.length)

const displayedReviews = computed(() =>
  filteredReviewsSorted.value.slice(0, reviewsVisibleCount.value)
)

watch(totalReviewsListed, (n) => {
  if (reviewsVisibleCount.value > n) {
    reviewsVisibleCount.value = n
  }
})

watch([reviewsFilterStar, reviewsFilterPhotosOnly], () => {
  const n = filteredReviewsSorted.value.length
  reviewsVisibleCount.value = Math.min(REVIEWS_INITIAL_COUNT, n)
})

function setReviewStarFilter(star) {
  reviewsFilterStar.value = star
}

function toggleReviewStarFilter(s) {
  reviewsFilterStar.value = reviewsFilterStar.value === s ? null : s
}

function clearReviewFilters() {
  reviewsFilterStar.value = null
  reviewsFilterPhotosOnly.value = false
}

const showReviewsLoadMore = computed(
  () => totalReviewsListed.value > 0 && reviewsVisibleCount.value < totalReviewsListed.value
)

const showReviewsSeeLess = computed(
  () => totalReviewsListed.value > REVIEWS_INITIAL_COUNT && reviewsVisibleCount.value > REVIEWS_INITIAL_COUNT
)

function loadMoreReviews() {
  const total = totalReviewsListed.value
  reviewsVisibleCount.value = Math.min(
    reviewsVisibleCount.value + REVIEWS_LOAD_MORE_INCREMENT,
    total
  )
}

function seeLessReviews() {
  reviewsVisibleCount.value = REVIEWS_INITIAL_COUNT
}

const reviewPreviewUrl = ref(null)

watch(reviewPreviewUrl, (url) => {
  if (import.meta.client) {
    document.body.style.overflow = url ? 'hidden' : ''
  }
})

const onReviewPreviewKeydown = (e) => {
  if (e.key === 'Escape') reviewPreviewUrl.value = null
}

let reviewSnippetRotateTimer = null

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onReviewPreviewKeydown)
    reviewSnippetRotateTimer = setInterval(() => {
      const list = reviewsWithTextSnippet.value
      if (list.length <= 1) return
      rotatingReviewIndex.value = (rotatingReviewIndex.value + 1) % list.length
    }, 5000)
    nextTick(() => connectExploreObserver())
  }
})

onUnmounted(() => {
  disconnectExploreObserver()
  if (import.meta.client) {
    window.removeEventListener('keydown', onReviewPreviewKeydown)
    document.body.style.overflow = ''
    if (reviewSnippetRotateTimer) {
      clearInterval(reviewSnippetRotateTimer)
      reviewSnippetRotateTimer = null
    }
  }
})

// Material & Specifications
const specifications = computed(() => {
  const p = product.value
  if (!p) return []
  const details = Array.isArray(p.productDetails) ? p.productDetails : []

  return details
    .map((d) => {
      const label = d?.dimension?.name
      const value = d?.value
      if (!label || !value) return null
      return {
        id: d.id || `${label}-${value}`,
        label,
        value
      }
    })
    .filter(Boolean)
})

// Expandable sections
const expandedSections = ref({
  material: false,
  shipping: false
})

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// Zoom modal
const showZoomModal = ref(false)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)

const openZoomModal = () => {
  showZoomModal.value = true
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
  if (process.client) {
    document.body.style.overflow = 'hidden'
  }
}

const handleOverlayClick = (e) => {
  // Only close if clicking directly on the overlay (not on content or image)
  if (e.target === e.currentTarget) {
    closeZoomModal()
  }
}

const closeZoomModal = () => {
  showZoomModal.value = false
  resetZoom()
  if (process.client) {
    document.body.style.overflow = ''
  }
}

const zoomIn = () => {
  zoomLevel.value = Math.min(5, zoomLevel.value + 0.5)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.5)
  if (zoomLevel.value <= 1) {
    panX.value = 0
    panY.value = 0
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const handleWheelZoom = (e) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.5, Math.min(5, zoomLevel.value + delta))
  zoomLevel.value = newZoom
  if (newZoom <= 1) {
    panX.value = 0
    panY.value = 0
  }
}

const startPan = (e) => {
  if (zoomLevel.value <= 1) return
  isPanning.value = true
  panStartX.value = e.clientX - panX.value
  panStartY.value = e.clientY - panY.value
}

const handlePan = (e) => {
  if (!isPanning.value || zoomLevel.value <= 1) return
  panX.value = e.clientX - panStartX.value
  panY.value = e.clientY - panStartY.value
}

const endPan = () => {
  isPanning.value = false
}

const formatPrice = (price) => {
  const n = Number(price || 0)
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  } catch {
    return `₹${n}`
  }
}

/** Digits only (en-IN), for Rs. + amount layout */
const formatPriceNumberOnly = (price) => {
  const n = Number(price || 0)
  try {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(Math.round(n))
  }
}

const safeImg = (u) => {
  const s = resolveImageUrl(u)
  return s || ''
}

// --- JSON-LD (client-side; SSR is off) ---
const appBase = computed(() => String(config.app?.baseURL || '/'))
// Prefer configured public site URL for SEO so we always emit https://svrve.com links in production
const siteOrigin = computed(() => {
  const cfg = String(config.public.siteUrl || '').trim()
  if (cfg) {
    return cfg.replace(/\/$/, '')
  }
  // Fallback to current origin (useful in dev)
  return requestURL.origin
})

const canonicalPath = computed(() => String(route.path || '/'))
const canonicalUrl = computed(() => {
  const path = canonicalPath.value.replace(/^\//, '')
  return joinURL(siteOrigin.value, appBase.value, path)
})

const absUrl = (u) => {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  // Public assets should respect Nuxt baseURL on GitHub Pages
  const path = s.replace(/^\//, '')
  return joinURL(siteOrigin.value, appBase.value, path)
}

const priceValidUntil = computed(() => {
  // "Two months from now" rolling window, formatted YYYY-MM-DD (recommended by Google).
  const d = new Date()
  d.setMonth(d.getMonth() + 2)
  // Ensure valid ISO date even across month boundaries
  return d.toISOString().slice(0, 10)
})

const offerPrice = computed(() => {
  const p = product.value
  if (!p) return null
  const list = Number(p.price || 0)
  const d = discountPercent.value
  if (!d) return list
  const sale = Math.round((list * (100 - d)) / 100)
  return sale
})

const totalSelectedPrice = computed(() => {
  const p = product.value
  if (!p) return 0
  const unit = offerPrice.value ?? Number(p.price || 0)
  return unit * Math.max(1, Number(selectedQuantity.value || 1))
})

const additionalPropsLd = computed(() => {
  const rows = detailsRows.value || []
  return rows.map((r) => ({
    '@type': 'PropertyValue',
    name: r.key,
    value: r.value
  }))
})

// Helper function to get SEO value with fallback
const getSeoValue = (apiValue, fallback) => {
  if (apiValue && String(apiValue).trim() !== '') {
    return String(apiValue).trim()
  }
  return fallback
}

const breadcrumbsLd = computed(() => {
  const home = joinURL(siteOrigin.value, appBase.value)
  const collections = joinURL(siteOrigin.value, appBase.value, 'collections')
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: home },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: collections },
      { '@type': 'ListItem', position: 3, name: product.value?.name || 'Product', item: canonicalUrl.value }
    ]
  }
})

const productJsonLd = computed(() => {
  const p = product.value
  if (!p) return null

  const seo = seoData.value || {}
  
  // Get schema type from API, fallback to 'Product'
  const schemaType = (seo.schemaType && String(seo.schemaType).trim() !== '') 
    ? String(seo.schemaType).trim() 
    : 'Product'

  // Use metaDescription from API if available, otherwise fallback to product description
  const desc = getSeoValue(seo.metaDescription, p.description || p.about || 'Handcrafted ceramic product.')
  const imgs = (gallery.value.length ? gallery.value : [placeholderForCategory(p.category)]).map(absUrl).filter(Boolean)
  const sku = String(p.id ?? '')

  const offer = {
    '@type': 'Offer',
    url: canonicalUrl.value,
    priceCurrency: 'INR',
    // Google expects Offer.price as a string
    price: String(offerPrice.value ?? Number(p.price || 0)),
    priceValidUntil: priceValidUntil.value,
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'Ceramic Artistry' }
  }

  const graph = [
    breadcrumbsLd.value,
    {
      '@type': schemaType,
      '@id': `${canonicalUrl.value}#product`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl.value },
      name: p.name,
      description: desc,
      ...(imgs.length ? { image: imgs } : {}),
      ...(sku ? { sku } : {}),
      ...(categoryLabel.value ? { category: categoryLabel.value } : {}),
      brand: { '@type': 'Brand', name: 'Ceramic Artistry' },
      offers: offer,
      ...(additionalPropsLd.value.length ? { additionalProperty: additionalPropsLd.value } : {})
    }
  ]

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  }
})

// Basic client-side meta (SSR is off, but still useful for share previews in-app)
watchEffect(() => {
  const p = product.value
  if (!p) return
  
  const seo = seoData.value || {}
  
  // Get SEO values from API, fallback to hardcoded/default values
  const seoTitle = getSeoValue(seo.seoTitle, 'Forest Green Ceramic Dinner Set (12 Pieces) | SVRVE')
  const metaDesc = getSeoValue(seo.metaDescription, 'Buy premium forest green ceramic dinner set (12 pieces). Microwave-safe, dishwasher-safe stoneware collection from SVRVE.')
  const ogTitle = getSeoValue(seo.ogTitle, 'Forest Green Ceramic Dinner Set (12 Pieces) | SVRVE')
  const ogDesc = getSeoValue(seo.ogDescription, 'Buy premium forest green ceramic dinner set (12 pieces). Microwave-safe, dishwasher-safe stoneware collection from SVRVE.')
  const ogImage = getSeoValue(seo.ogImageUrl, heroImage.value ? absUrl(heroImage.value) : '')
  const canonical = getSeoValue(seo.canonicalUrl, canonicalUrl.value)
  
  // Build meta tags array
  const metaTags = [
    { name: 'description', content: metaDesc }
  ]
  
  // Add keywords if available
  if (seo.primaryKeyword && String(seo.primaryKeyword).trim() !== '') {
    const keywords = [String(seo.primaryKeyword).trim()]
    if (seo.secondaryKeywords && String(seo.secondaryKeywords).trim() !== '') {
      keywords.push(String(seo.secondaryKeywords).trim())
    }
    metaTags.push({ name: 'keywords', content: keywords.join(', ') })
  }
  
  // Add OG tags
  metaTags.push({ property: 'og:title', content: ogTitle })
  metaTags.push({ property: 'og:description', content: ogDesc })
  
  // Add OG image if available
  if (ogImage) {
    metaTags.push({ property: 'og:image', content: ogImage })
  }
  
  // Add robots meta if indexStatus is set
  if (seo.indexStatus && String(seo.indexStatus).trim() !== '') {
    const indexStatus = String(seo.indexStatus).trim().toLowerCase()
    if (indexStatus === 'noindex' || indexStatus === 'noindex, nofollow') {
      metaTags.push({ name: 'robots', content: indexStatus })
    }
  }
  
  // Build link tags
  const linkTags = []
  if (canonical) {
    linkTags.push({ rel: 'canonical', href: canonical })
  }
  
  useHead({
    title: seoTitle,
    link: linkTags,
    meta: metaTags
  })
})

watchEffect(() => {
  if (!productJsonLd.value) return
  useHead({
    script: [
      {
        key: 'ld-product',
        type: 'application/ld+json',
        children: JSON.stringify(productJsonLd.value)
      }
    ]
  })
})

// Hint the browser to prioritize the hero image (helps LCP)
watchEffect(() => {
  const href = heroImage.value ? absUrl(heroImage.value) : ''
  if (!href) return
  useHead({
    link: [
      {
        key: 'preload-hero',
        rel: 'preload',
        as: 'image',
        href,
        fetchpriority: 'high'
      }
    ]
  })
})
</script>

<style scoped>
.product-page {
  min-height: 100vh;
  background: #fff;
}

/* Top Banner */
.top-banner {
  background: #fafafa;
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.banner-text {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: #666;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  letter-spacing: 0.05em;
  text-transform: none;
}

.banner-text::first-letter {
  text-transform: capitalize;
}

/* Header */
.topbar {
  position: sticky;
  top: 0;
  z-index: 150;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn svg {
  width: 24px;
  height: 24px;
  stroke: #333;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #333;
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: 0.05em;
}

.logo-text {
  font-family: sans-serif;
}

.logo-dot {
  font-size: 0.75rem;
  color: #333;
}

.topbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.cart-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-btn svg {
  width: 20px;
  height: 20px;
  stroke: #333;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #d32f2f;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.content {
  padding: 14px;
  max-width: 860px;
  margin: 0 auto;
}

.loading .img-skel {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.loading .line {
  height: 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  margin: 10px 0;
}

.w-90 { width: 90%; }
.w-70 { width: 70%; }
.w-60 { width: 60%; }

@keyframes shimmer {
  0% { background-position: 0% 0; }
  100% { background-position: 200% 0; }
}

.error {
  text-align: center;
  padding: 26px 10px;
}

.error-title {
  font-size: 1.25rem;
  margin: 0 0 8px;
}

.error-sub {
  margin: 0 auto 14px;
  max-width: 38ch;
  color: var(--text-muted);
}

.retry {
  border: none;
  border-radius: 999px;
  padding: 12px 16px;
  font-weight: 900;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.product {
  display: grid;
  gap: 14px;
}

.media {
  position: relative;
}

.image-swiper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08);
  background: #eee;
  touch-action: pan-y pinch-zoom;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
}

.image-swiper:focus-visible {
  outline: 3px solid var(--primary-color, #8B4513);
  outline-offset: 2px;
}

.image-container {
  display: flex;
  width: 100%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.image-container.dragging {
  transition: none;
}

.hero-img {
  width: 100%;
  flex-shrink: 0;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  pointer-events: none;
}

.image-nav {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dark, #2c3e50);
  transition: all 0.2s ease;
  z-index: 11;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-50%) scale(1.05);
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

.nav-prev {
  left: 12px;
}

.nav-next {
  right: 12px;
}

.image-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 11;
  pointer-events: none;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  pointer-events: all;
  transition: all 0.2s ease;
  padding: 0;
}

.indicator.active {
  background: rgba(255, 255, 255, 1);
  width: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.discount-badge {
  position: absolute;
  right: 12px;
  top: 12px;
  font-size: 0.8rem;
  font-weight: 1000;
  padding: 8px 10px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #1f7a5c, #2aa87d);
  box-shadow: 0 10px 18px rgba(31, 122, 92, 0.22);
}

.thumbs {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}
.thumbs::-webkit-scrollbar { display: none; }

.thumb {
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 14px;
  flex: 0 0 auto;
  cursor: pointer;
  outline: none;
}

.thumb img {
  width: 70px;
  height: 70px;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.thumb.active img {
  border-color: rgba(139, 69, 19, 0.7);
}

.info {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  padding: 14px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
}

.title {
  margin: 0 0 6px;
  font-size: 1.4rem;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0 0 10px;
  color: var(--text-muted);
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 0 6px;
}

.price {
  font-size: 1.35rem;
  font-weight: 1000;
  color: var(--primary-color);
}

.chip {
  font-weight: 900;
  font-size: 0.85rem;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(44, 62, 80, 0.9);
}

.about {
  margin: 10px 0 0;
  color: rgba(44, 62, 80, 0.9);
  line-height: 1.5;
}

.section {
  margin-top: 16px;
}

.h2 {
  font-size: 1.05rem;
  margin: 0 0 10px;
}

.benefits {
  display: grid;
  gap: 10px;
}

.benefit {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.7);
}

.benefit-ic {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.benefit-title {
  font-weight: 900;
}
.benefit-sub {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.bullets {
  margin: 0;
  padding-left: 18px;
  color: rgba(44, 62, 80, 0.9);
}
.bullets li { margin: 8px 0; }

.details {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin: 0;
}

.details dt {
  font-weight: 900;
  color: rgba(44, 62, 80, 0.9);
}

.details dd {
  margin: 0;
  color: var(--text-muted);
}

/* Reviews: mobile = inside .info (after features); desktop = under image, left column */
.product-reviews-desktop {
  display: none;
}

.product-reviews-mobile {
  display: block;
}

@media (min-width: 768px) {
  .product-reviews-mobile {
    display: none !important;
  }

  .product-reviews-desktop {
    display: block;
  }

  .product {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    align-items: start;
  }

  .product .media {
    grid-column: 1;
    grid-row: 1;
  }

  .product .product-reviews-desktop {
    grid-column: 1;
    grid-row: 2;
    min-width: 0;
    margin-bottom: 0;
    border-top: none;
    padding: 16px 14px 18px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 18px;
    box-shadow: 0 10px 22px rgba(0, 0, 0, 0.06);
  }

  .product .info {
    grid-column: 2;
    grid-row: 1 / -1;
    min-width: 0;
  }
}

.toast {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 88px;
  z-index: 170;
  background: rgba(44, 62, 80, 0.92);
  color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 0.9rem;
  max-width: 92vw;
}

/* Product Info Styles */
.product-name {
  font-size: 1.5rem;
  margin: 0 0 16px;
  max-width: 100%;
  /* font: Roboto Slab slab-serif — global main.css */
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

button.rating-section--link {
  width: 100%;
  max-width: 100%;
  padding: 8px 4px 8px 0;
  margin: 0 0 16px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 10px;
  outline-offset: 3px;
  transition: background 0.15s ease, box-shadow 0.15s ease;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-hint {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #007185;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

button.rating-section--link:hover {
  background: rgba(0, 0, 0, 0.04);
}

button.rating-section--link:hover .reviews-text {
  color: #007185;
  text-decoration: underline;
  text-underline-offset: 3px;
}

button.rating-section--link:hover .rating-hint {
  text-decoration: underline;
  text-underline-offset: 2px;
}

button.rating-section--link:focus-visible {
  outline: 2px solid #2c2c2c;
}

/* Histogram + rotating snippets (below rating row) */
.rating-breakdown-btn {
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 0 0 14px;
  padding: 10px 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: #fafafa;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.rating-breakdown-btn:hover {
  background: #f3f4f6;
  border-color: rgba(0, 0, 0, 0.12);
}

.rating-breakdown-btn:focus-visible {
  outline: 2px solid #2c2c2c;
  outline-offset: 2px;
}

.rating-histogram {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

.rating-histogram-row {
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  align-items: center;
  gap: 8px;
}

.rating-histogram-label {
  font-size: 0.7rem;
  color: #666;
  font-weight: 600;
  text-align: right;
}

.rating-histogram-track {
  height: 6px;
  border-radius: 999px;
  background: #e0e0e0;
  overflow: hidden;
}

.rating-histogram-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffa41c, #ff9900);
  min-width: 0;
  transition: width 0.35s ease;
}

.rating-snippet-wrap {
  min-height: 2.8em;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 8px;
}

.rating-snippet-text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #444;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.review-snippet-fade-enter-active,
.review-snippet-fade-leave-active {
  transition: opacity 0.25s ease;
}

.review-snippet-fade-enter-from,
.review-snippet-fade-leave-to {
  opacity: 0;
}

.stars {
  display: flex;
  gap: 4px;
  align-items: center;
}

.star {
  font-size: 1.35rem;
  line-height: 1;
  color: #ddd;
}

.rating-section .stars .star {
  font-size: 1.65rem;
}

.star.filled {
  color: #ffc107;
}

.reviews-text {
  font-size: 0.875rem;
  color: #666;
}

.service-highlights {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin-bottom: 20px;
  max-width: 100%;
}

.service-highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.service-highlight-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  color: #111;
}

.service-highlight-text {
  font-size: 0.8125rem;
  line-height: 1.35;
  color: #007185;
  font-weight: 400;
}

.price-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 24px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px 12px;
  flex-wrap: wrap;
}

/* Reference: large bold amount, slightly smaller "Rs." */
.price-display {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.price-currency {
  font-size: 1.125rem;
  font-weight: 700;
  color: #000;
  line-height: 1;
}

.price-amount {
  font-size: 1.875rem;
  font-weight: 700;
  color: #000;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.original-price-display {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  text-decoration: line-through;
  color: #888;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.original-price-currency {
  font-size: 0.9375rem;
  font-weight: 500;
}

.original-price-amount {
  font-size: 1.125rem;
  font-weight: 500;
}

.price-tax-note {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.35;
  color: #555;
  letter-spacing: 0.01em;
}

.qty-total {
  font-size: 0.875rem;
  color: #666;
  margin-left: auto;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-bottom: 24px;
}

.quantity-section {
  margin: 0;
  width: 100%;
}

.quantity-controls {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding: 0 4px;
  border: 1px solid #e0e0e0;
  border-radius: 9999px;
  background: #fff;
  box-sizing: border-box;
}

.qty-btn {
  flex: 0 0 48px;
  width: 48px;
  height: auto;
  min-height: 44px;
  align-self: center;
  border: none;
  background: transparent;
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.qty-btn--minus {
  color: #b0b0b0;
}

.qty-btn--plus {
  color: #111;
  font-weight: 500;
}

.qty-btn:hover {
  background: rgba(0, 0, 0, 0.04);
}

.qty-btn:active {
  background: rgba(0, 0, 0, 0.07);
}

.qty-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  text-align: center;
  font-weight: 700;
  font-size: 1.0625rem;
  color: #111;
  font-variant-numeric: tabular-nums;
}

.add-to-cart-btn {
  width: 100%;
  padding: 14px 20px;
  min-height: 48px;
  border: none;
  border-radius: 9999px;
  background: #ffd814;
  color: #111;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  box-sizing: border-box;
}

.add-to-cart-btn:hover {
  background: #f0c800;
}

.add-to-cart-btn:active {
  transform: scale(0.99);
}

.add-to-cart-btn:focus-visible {
  outline: 2px solid #111;
  outline-offset: 2px;
}

.description-section,
.features-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2c2c2c;
  margin: 0 0 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.description-text {
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.6;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.feature-item:last-child {
  border-bottom: none;
}

/* Customer reviews */
.reviews-section {
  margin-bottom: 36px;
  padding: 20px 0 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  scroll-margin-top: 80px;
}

.reviews-section-header {
  margin-bottom: 16px;
}

.reviews-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.reviews-filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.reviews-filters-row--stars {
  gap: 6px;
}

.reviews-filter-chip {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 11px;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.25;
  color: #555;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  font-family: inherit;
}

.reviews-filter-chip:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: rgba(0, 0, 0, 0.14);
  color: #222;
}

.reviews-filter-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.reviews-filter-chip--active {
  background: #1a1a1a;
  border-color: #1a1a1a;
  color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.reviews-filter-chip--active:hover:not(:disabled) {
  background: #333;
  border-color: #333;
  color: #fff;
}

.reviews-filter-count {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.85;
}

.reviews-filter-empty {
  padding: 20px 0 8px;
  text-align: center;
}

.reviews-filter-empty-text {
  margin: 0 0 12px;
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.45;
}

.reviews-filter-clear {
  appearance: none;
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #333;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  font-family: inherit;
}

.reviews-filter-clear:hover {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.22);
}

.reviews-section-summary {
  margin: 8px 0 0;
  font-size: 0.9375rem;
  color: #555;
  line-height: 1.5;
}

.reviews-summary-rating {
  font-weight: 700;
  color: #2c2c2c;
}

.reviews-summary-dot {
  margin: 0 6px;
  color: #bbb;
}

.reviews-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reviews-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px 16px;
  margin-top: 16px;
}

.reviews-load-btn {
  appearance: none;
  padding: 6px 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: none;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  color: #5c5c5c;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
  font-family: inherit;
  line-height: 1.35;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}

.reviews-load-btn:hover {
  background: #f7f7f7;
  color: #333;
  border-color: rgba(0, 0, 0, 0.14);
  box-shadow: none;
}

.reviews-load-btn:focus-visible {
  outline: 2px solid rgba(44, 44, 44, 0.35);
  outline-offset: 2px;
}

.reviews-load-btn--secondary {
  padding: 4px 8px;
  border: none;
  background: transparent;
  box-shadow: none;
  color: #888;
  font-size: 0.8125rem;
  font-weight: 400;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(0, 0, 0, 0.18);
}

.reviews-load-btn--secondary:hover {
  color: #555;
  background: transparent;
  text-decoration-color: rgba(0, 0, 0, 0.35);
}

.reviews-load-btn--secondary:focus-visible {
  outline: 2px solid rgba(44, 44, 44, 0.25);
  outline-offset: 2px;
  border-radius: 4px;
}

.review-card {
  padding: 18px 16px;
  background: linear-gradient(180deg, #fafafa 0%, #fff 48%);
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.review-card-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.review-author-block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.review-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8eef2 0%, #dce4ea 100%);
  color: #2c3e50;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.review-author-meta {
  min-width: 0;
}

.review-author-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1a1a1a;
  line-height: 1.3;
  word-break: break-word;
}

.review-date {
  display: block;
  margin-top: 4px;
  font-size: 0.8125rem;
  color: #888;
}

.review-stars-row {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: center;
}

.review-stars-row .review-star {
  font-size: 1.35rem;
  line-height: 1;
}

.review-text {
  margin: 0;
  font-size: 0.9375rem;
  color: #444;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.review-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.review-thumb-btn {
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  cursor: zoom-in;
  background: #f5f5f5;
  width: 88px;
  height: 88px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.review-thumb-btn:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.review-thumb-btn:focus-visible {
  outline: 2px solid #2c2c2c;
  outline-offset: 2px;
}

.review-thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.review-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 210;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  cursor: zoom-out;
}

.review-preview-img {
  max-width: min(96vw, 900px);
  max-height: 88vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  cursor: default;
}

.review-preview-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.review-preview-close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.expandable-sections {
  margin-top: 32px;
}

.expandable-section {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.section-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.toggle-icon {
  font-size: 1.5rem;
  font-weight: 300;
  color: #666;
}

.section-content {
  padding-bottom: 16px;
  font-size: 0.9375rem;
  color: #666;
  line-height: 1.6;
}

/* Specifications Table */
.specifications-table {
  margin-top: 12px;
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.spec-row {
  border-bottom: 1px solid #e5e5e5;
  transition: background-color 0.2s ease;
}

.spec-row:last-child {
  border-bottom: none;
}

.spec-row:hover {
  background-color: #f9f9f9;
}

.spec-label {
  font-weight: 600;
  color: #333;
  font-size: 0.9375rem;
  padding: 14px 16px;
  width: 40%;
  vertical-align: top;
  border-right: 1px solid #e5e5e5;
}

.spec-value {
  color: #555;
  font-size: 0.9375rem;
  padding: 14px 16px;
  vertical-align: top;
}

@media (max-width: 640px) {
  .spec-label {
    width: 35%;
    padding: 12px 14px;
    font-size: 0.875rem;
  }

  .spec-value {
    padding: 12px 14px;
    font-size: 0.875rem;
  }
}

/* Zoom Button */
.zoom-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.zoom-btn svg {
  width: 20px;
  height: 20px;
  stroke: #333;
}

/* Zoom Modal */
.zoom-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.zoom-modal-content {
  position: relative;
  width: fit-content;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zoom-close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-image-container {
  width: fit-content;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  margin: 0 auto;
}

.zoom-image-container:active {
  cursor: grabbing;
}

.zoom-image {
  max-width: 90vw;
  max-height: 80vh;
  width: auto;
  height: auto;
  object-fit: contain;
  user-select: none;
}

.zoom-controls {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.zoom-control-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.zoom-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.zoom-modal-enter-active,
.zoom-modal-leave-active {
  transition: opacity 0.3s;
}

.zoom-modal-enter-from,
.zoom-modal-leave-to {
  opacity: 0;
}

/* Explore more like this (lazy-loaded) */
.explore-more {
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  scroll-margin-top: 72px;
}

.explore-more-title {
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2c2c2c;
  margin: 0 0 18px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.explore-more-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 768px) {
  .explore-more-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
}

@media (min-width: 1100px) {
  .explore-more-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.explore-more-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: #fff;
  overflow: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.explore-more-card:hover {
  opacity: 0.92;
}

.explore-more-card:active {
  transform: scale(0.99);
}

.explore-more-card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #f8f8f8;
  overflow: hidden;
}

.explore-more-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.explore-more-discount {
  position: absolute;
  right: 8px;
  top: 8px;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 5px 8px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #1f7a5c, #2aa87d);
  box-shadow: 0 6px 14px rgba(31, 122, 92, 0.2);
}

.explore-more-card-body {
  padding: 14px 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.explore-more-card-name {
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.35;
  letter-spacing: 0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.explore-more-card-price {
  font-size: 0.875rem;
  font-weight: 400;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.explore-more-error {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.explore-more-retry {
  appearance: none;
  padding: 5px 12px;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  font-family: inherit;
}

.explore-more-retry:hover {
  background: #f5f5f5;
}

.explore-more-empty {
  margin: 0;
  font-size: 0.9rem;
  color: #777;
}

.explore-more-grid--skeleton .explore-more-card--skeleton {
  pointer-events: none;
}

.explore-more-card--skeleton .explore-more-card-image {
  background: linear-gradient(90deg, #eee 0%, #f5f5f5 50%, #eee 100%);
  background-size: 200% 100%;
  animation: explore-skel-shimmer 1.2s ease-in-out infinite;
}

.explore-skel-line {
  height: 12px;
  border-radius: 4px;
  background: #ececec;
  width: 100%;
}

.explore-skel-line--short {
  width: 55%;
}

@keyframes explore-skel-shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
</style>

