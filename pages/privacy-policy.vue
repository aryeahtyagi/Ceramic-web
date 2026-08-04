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
        <h1 class="policy-title">Privacy Policy</h1>
        <p class="policy-updated">Last updated: {{ lastUpdated }}</p>
        <p class="policy-intro">
          This Privacy Policy explains how SVRVE ("we", "us", "our") collects, uses, shares, and protects
          your information when you use our website and services, including browsing our collections,
          creating an account, designing a custom ceramic plate, and placing orders.
        </p>
        <p class="policy-disclaimer">
          This policy is provided as a general reference and reflects the data our website actually
          collects. It is not a substitute for legal advice — please have it reviewed by a qualified
          professional before relying on it for compliance purposes.
        </p>

        <section class="policy-section">
          <h2 class="section-heading">1. Information We Collect</h2>

          <h3 class="subsection-heading">Account information</h3>
          <p class="policy-text">When you sign up or log in, we collect:</p>
          <ul class="policy-list">
            <li>Username, phone number, and email address</li>
            <li>Delivery address and pincode (optional, used for shipping)</li>
            <li>If you use "Sign in with Google," your name, email address, and Google account
              identifier, as shared with us by Google</li>
          </ul>

          <h3 class="subsection-heading">Custom plate designs</h3>
          <p class="policy-text">
            Our "Design Your Own Plate" tool lets you create custom designs using text, shapes, and
            photos you upload. When you save a design, we store the design data (including any images
            you've uploaded into it) so you can return to edit it later. If you generate a shareable link
            for a design, anyone with that link can view a flattened image of it — please don't include
            personal or sensitive information in a design you intend to share.
          </p>

          <h3 class="subsection-heading">Order and cart information</h3>
          <p class="policy-text">We collect the products you add to your cart, quantities, and your order history so we can fulfil and track your orders.</p>

          <h3 class="subsection-heading">Usage and analytics data</h3>
          <p class="policy-text">
            We collect basic usage data to understand how the site is used and to improve it — for
            example, pages viewed, time spent reading blog posts, and interactions with on-site prompts
            (like sign-up popups). This is tied to a session identifier and, if you're logged in, your
            account.
          </p>

          <h3 class="subsection-heading">Cookies and local storage</h3>
          <p class="policy-text">
            We use your browser's local storage and session storage (not third-party tracking cookies) to
            keep you logged in, remember your cart between visits, and remember whether you've already
            seen certain on-site prompts. You can clear this at any time by clearing your browser's site
            data, which will log you out and empty your cart.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">2. How We Use Your Information</h2>
          <ul class="policy-list">
            <li>To create and manage your account, and to let you log in</li>
            <li>To process, fulfil, and communicate with you about your orders — including custom plate
              orders submitted via email</li>
            <li>To save and let you resume editing your custom plate designs</li>
            <li>To respond to support, return, and exchange requests</li>
            <li>To send you relevant updates, offers, or newsletters, where you've opted in (for example,
              via a sign-up popup)</li>
            <li>To understand how our site is used, and to improve it</li>
            <li>To detect and prevent fraud, abuse, or security issues</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">3. How We Share Your Information</h2>
          <p class="policy-text">We do not sell your personal information. We may share it in the following limited circumstances:</p>
          <ul class="policy-list">
            <li><strong>Service providers</strong> who help us run the site, such as our hosting provider
              and Google (for sign-in and web fonts)</li>
            <li><strong>Shared design links</strong> — if you generate a shareable link to a custom
              design, the flattened image and design name are visible to anyone with that link</li>
            <li><strong>Legal reasons</strong> — if required by law, or to protect the rights, property,
              or safety of SVRVE, our customers, or others</li>
            <li><strong>Business transfers</strong> — if SVRVE is involved in a merger, acquisition, or
              sale of assets, your information may be transferred as part of that transaction</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">4. Third-Party Services</h2>
          <p class="policy-text">We use a small number of trusted third-party services:</p>
          <ul class="policy-list">
            <li><strong>Google Sign-In</strong> — to let you create an account or log in using your
              Google account, subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" class="policy-link">Google's Privacy Policy</a></li>
            <li><strong>Google Fonts</strong> — to load typefaces used on our site</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">5. Data Storage and Security</h2>
          <p class="policy-text">
            Your information is stored on secured servers. We take reasonable technical and
            organizational measures to protect it against unauthorized access, loss, or misuse. However,
            no method of transmission or storage over the internet is completely secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">6. Your Rights and Choices</h2>
          <p class="policy-text">Depending on applicable law, you may have the right to:</p>
          <ul class="policy-list">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for marketing communications at any time</li>
            <li>Delete individual saved designs yourself from the "My Designs" panel, or request removal
              of a shared design link</li>
          </ul>
          <p class="policy-text">To exercise any of these rights, contact us using the details below.</p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">7. Children's Privacy</h2>
          <p class="policy-text">
            Our services are not directed to children under 18. We do not knowingly collect personal
            information from children. If you believe a child has provided us with personal information,
            please contact us so we can remove it.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">8. Changes to This Policy</h2>
          <p class="policy-text">
            We may update this Privacy Policy from time to time. If we make material changes, we will
            update the "Last updated" date above. Your continued use of the site after changes take
            effect means you accept the updated policy.
          </p>
        </section>

        <section class="policy-section">
          <h2 class="section-heading">9. Contact Us</h2>
          <p class="policy-text">
            If you have questions about this Privacy Policy or how we handle your information, please
            write to us at <a href="mailto:svrve.ceramic@gmail.com" class="policy-link">svrve.ceramic@gmail.com</a>.
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
  title: 'Privacy Policy - SVRVE Ceramics',
  meta: [
    {
      name: 'description',
      content: 'Learn how SVRVE collects, uses, and protects your information, including account details, custom plate designs, and order data.'
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

.subsection-heading {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  color: #2c2c2c;
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
