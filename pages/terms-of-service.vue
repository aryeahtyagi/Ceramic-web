<template>
  <div class="policy-page">
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
      <article class="policy-content">
        <h1 class="policy-title">Terms of Service</h1>
        <p class="policy-updated">Last updated: {{ lastUpdated }}</p>
        <p class="policy-intro">
          These Terms of Service ("Terms") govern your access to and use of the SVRVE website,
          including browsing our collections, creating an account, using the custom plate designer,
          and placing orders. By using our site, you agree to these Terms.
        </p>
        <p class="policy-disclaimer">
          This document is provided as a general reference and reflects how our website actually
          works. It is not a substitute for legal advice — please have it reviewed by a qualified
          professional before relying on it for compliance purposes.
        </p>

        <section class="policy-section">
          <h2 class="section-heading">1. Acceptance of Terms</h2>
          <p class="policy-text">
            By accessing or using our website, you confirm that you accept these Terms and our
            <NuxtLink to="/privacy-policy" class="policy-link">Privacy Policy</NuxtLink>, and agree to
            comply with them. If you do not agree, please do not use our site.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">2. Eligibility and Accounts</h2>
          <ul class="policy-list">
            <li>You must be at least 18 years old, or using the site under the supervision of a parent
              or guardian, to create an account or place an order</li>
            <li>You're responsible for the accuracy of the information you provide, and for keeping your
              account credentials secure</li>
            <li>You may create an account with your email address, or sign up using "Sign in with
              Google"</li>
            <li>You're responsible for all activity that happens under your account</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">3. Products and Orders</h2>
          <ul class="policy-list">
            <li>All product descriptions, images, and prices are subject to change without notice</li>
            <li>We reserve the right to limit quantities, refuse, or cancel any order at our discretion —
              for example, in cases of suspected fraud or errors in pricing or availability</li>
            <li>Handcrafted and custom items may have minor natural variations in color, texture, or
              finish, which are not considered defects</li>
            <li>Please review our <NuxtLink to="/return-policy" class="policy-link">Return Policy</NuxtLink> for details on returns and exchanges</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">4. Custom Plate Designer</h2>
          <p class="policy-text">
            Our "Design Your Own Plate" tool lets you create a custom design using text, shapes, and
            images you upload, save it to your account, and submit it to us as a custom order request.
          </p>
          <ul class="policy-list">
            <li>You may only upload images that you own or have the right to use. Do not upload images
              that infringe someone else's copyright or trademark, or that are obscene, hateful,
              defamatory, or otherwise unlawful</li>
            <li>By uploading an image or creating a design, you grant us a limited license to store,
              reproduce, and use that content solely to render your design, fulfil your custom order,
              and provide the saving/sharing features of the tool</li>
            <li>You keep ownership of the content you upload. We don't claim ownership over your designs
              or images</li>
            <li>If you generate a shareable link for a design, that design becomes viewable by anyone who
              has the link, until you delete the design or request that we disable the link</li>
            <li>Submitting a custom design via "Place Order" sends us your design details by email and is
              a request for a quote/order — it is not a confirmed order until we've contacted you to
              confirm pricing, feasibility, and delivery details</li>
            <li>We may decline to produce a design that violates these Terms, is not technically
              feasible to reproduce on ceramic, or that we otherwise choose not to fulfil, in which case
              we'll let you know</li>
            <li>We reserve the right to remove any saved or shared design that violates these Terms</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">5. Pricing and Payment</h2>
          <p class="policy-text">
            Prices are listed in Indian Rupees (₹) unless stated otherwise and are subject to change
            without notice. For custom plate orders submitted via email, final pricing will be confirmed
            with you directly before your order is produced. Payment methods and terms will be
            communicated to you as part of the order confirmation process.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">6. Shipping and Delivery</h2>
          <p class="policy-text">
            We aim to dispatch and deliver orders within a reasonable timeframe, but delivery estimates
            are not guaranteed and may be affected by factors outside our control, including courier
            delays, weather, or regional restrictions. Risk of loss and title for products pass to you
            upon delivery.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">7. Intellectual Property</h2>
          <p class="policy-text">
            All content on this site — including our logo, product photography, text, and site design —
            is owned by or licensed to SVRVE and is protected by applicable intellectual property laws.
            You may not copy, reproduce, or use our content for commercial purposes without our written
            permission. This does not apply to content you upload yourself, such as images used in the
            plate designer, which remain yours as described in Section 4.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">8. Prohibited Uses</h2>
          <p class="policy-text">You agree not to:</p>
          <ul class="policy-list">
            <li>Use the site for any unlawful purpose or in violation of these Terms</li>
            <li>Attempt to gain unauthorized access to our systems, another user's account, or any
              non-public part of the site</li>
            <li>Upload malicious code, or interfere with or disrupt the site's functionality</li>
            <li>Use automated means (bots, scrapers) to access the site without our permission</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with anyone</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">9. Third-Party Sign-In</h2>
          <p class="policy-text">
            If you choose to sign in using Google, your use of that feature is also subject to Google's
            own terms and privacy policy. We only receive the basic profile information (name, email,
            account identifier) needed to create or match your SVRVE account.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">10. Disclaimers and Limitation of Liability</h2>
          <p class="policy-text">
            Our site and products are provided "as is" without warranties of any kind, express or
            implied, to the fullest extent permitted by law. To the fullest extent permitted by
            applicable law, SVRVE will not be liable for any indirect, incidental, or consequential
            damages arising from your use of the site or products. Nothing in these Terms limits any
            liability that cannot be limited under applicable law.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">11. Changes to These Terms</h2>
          <p class="policy-text">
            We may update these Terms from time to time. If we make material changes, we'll update the
            "Last updated" date above. Your continued use of the site after changes take effect means
            you accept the updated Terms.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">12. Governing Law</h2>
          <p class="policy-text">
            These Terms are governed by the laws of India, without regard to conflict-of-law principles.
            Any disputes arising from these Terms or your use of the site will be subject to the
            exclusive jurisdiction of the courts of India.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">13. Contact Us</h2>
          <p class="policy-text">
            If you have questions about these Terms, please write to us at
            <a href="mailto:svrve.ceramic@gmail.com" class="policy-link">svrve.ceramic@gmail.com</a>.
          </p>
        </section>

        <div class="policy-cta">
          <NuxtLink to="/collections" class="cta-button">Continue Shopping</NuxtLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
const cart = useCart()
const menuOpen = ref(false)

const lastUpdated = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

useHead({
  title: 'Terms of Service - SVRVE Ceramics',
  meta: [
    {
      name: 'description',
      content: 'Read the terms and conditions that govern your use of the SVRVE website, custom plate designer, and orders.'
    }
  ]
})
</script>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: #fff;
}

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
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 20px 60px;
}

.policy-content {
  color: #2c2c2c;
}

.policy-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.02em;
}

.policy-updated {
  font-size: 0.8125rem;
  color: #888;
  margin: 0 0 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-intro {
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
  margin: 0 0 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-disclaimer {
  font-size: 0.875rem;
  line-height: 1.6;
  color: #8a6a4a;
  background: #fdf8ef;
  border: 1px solid #f0e2c8;
  padding: 0.875rem 1rem;
  margin: 0 0 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-section {
  margin-bottom: 2rem;
}

.section-heading {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.policy-list {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
}

.policy-list li {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #444;
  margin-bottom: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-list li:last-child {
  margin-bottom: 0;
}

.policy-text {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #444;
  margin: 0 0 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.policy-link {
  color: #2c2c2c;
  text-decoration: underline;
  font-weight: 500;
}

.policy-link:hover {
  color: #000;
}

.policy-cta {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.cta-button {
  display: inline-block;
  background-color: #2c2c2c;
  color: #fff;
  border: 1px solid #2c2c2c;
  padding: 14px 32px;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.cta-button:hover {
  background-color: #000;
  border-color: #000;
}

@media (max-width: 768px) {
  .policy-title {
    font-size: 1.5rem;
  }

  .content {
    padding: 32px 16px 48px;
  }
}
</style>
