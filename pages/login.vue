<template>
  <div class="login-page">
    <!-- Visual side -->
    <div class="login-visual">
      <NuxtLink to="/" class="visual-brand">
        <span class="brand-text">SVRVE</span>
        <span class="brand-dot">•</span>
      </NuxtLink>

      <div class="visual-center">
        <div class="visual-plate">
          <div class="visual-plate-rim"></div>
          <div class="visual-plate-glyph">S</div>
        </div>
        <div class="visual-orbit orbit-a"></div>
        <div class="visual-orbit orbit-b"></div>
      </div>

      <div class="visual-copy">
        <p class="visual-eyebrow">Designed to impress, made to use</p>
        <h2 class="visual-heading">Handcrafted ceramics,<br />made personal.</h2>
        <p class="visual-sub">Join a community of collectors who bring a little more craft to their table.</p>
      </div>
    </div>

    <!-- Form side -->
    <div class="login-form-side">
      <div class="login-form-wrap">
        <div class="form-header">
          <h1 class="form-title">{{ isSignup ? 'Create Your Account' : 'Welcome Back' }}</h1>
          <p class="form-subtitle">
            {{ isSignup ? 'Join us to discover handcrafted ceramics' : 'Log in to continue shopping' }}
          </p>
        </div>

        <div ref="googleButtonRef" class="google-btn-container"></div>
        <p v-if="googleError" class="google-error">{{ googleError }}</p>

        <div class="divider"><span>or continue with phone</span></div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="phone" class="form-label">
              <span class="label-text">Phone Number</span>
              <span class="required">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-prefix">+91</span>
              <input
                id="phone"
                v-model="form.phoneNumber"
                type="tel"
                class="form-input"
                placeholder="Enter your phone number"
                required
                :disabled="loading"
                autocomplete="tel"
                maxlength="10"
              />
            </div>
          </div>

          <template v-if="isSignup">
            <div class="form-group">
              <label for="username" class="form-label">
                <span class="label-text">Username</span>
                <span class="required">*</span>
              </label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                class="form-input"
                placeholder="Choose a username"
                required
                :disabled="loading"
                autocomplete="username"
              />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">
                <span class="label-text">Email Address</span>
                <span class="required">*</span>
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="form-input"
                placeholder="Enter your email"
                required
                :disabled="loading"
                autocomplete="email"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="address" class="form-label">
                  <span class="label-text">Address</span>
                </label>
                <input
                  id="address"
                  v-model="form.address"
                  type="text"
                  class="form-input"
                  placeholder="Address"
                  :disabled="loading"
                  autocomplete="street-address"
                />
              </div>

              <div class="form-group">
                <label for="pincode" class="form-label">
                  <span class="label-text">Pincode</span>
                </label>
                <input
                  id="pincode"
                  v-model="form.pincode"
                  type="text"
                  class="form-input"
                  placeholder="Pincode"
                  :disabled="loading"
                  autocomplete="postal-code"
                  maxlength="6"
                />
              </div>
            </div>
          </template>

          <div v-if="error" class="error-message" role="alert">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            <span v-if="!loading">{{ isSignup ? 'Create Account' : 'Continue' }}</span>
            <span v-else class="loading-spinner">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25"/>
                <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            </span>
          </button>
        </form>

        <div class="toggle-mode">
          <button type="button" class="toggle-btn" @click="toggleMode" :disabled="loading">
            <span v-if="isSignup">Already have an account?</span>
            <span v-else>Don't have an account?</span>
            <strong>{{ isSignup ? 'Log In' : 'Sign Up' }}</strong>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const config = useRuntimeConfig()

const isSignup = ref(false)
const loading = ref(false)
const error = ref('')

const form = ref({
  phoneNumber: '',
  username: '',
  email: '',
  address: '',
  pincode: ''
})

// Check if redirect param exists
const redirectTo = computed(() => {
  const r = route.query.redirect
  return r && typeof r === 'string' ? r : '/collections'
})

const toggleMode = () => {
  isSignup.value = !isSignup.value
  error.value = ''
  // Clear form except phone number
  if (!isSignup.value) {
    form.value.username = ''
    form.value.email = ''
    form.value.address = ''
    form.value.pincode = ''
  }
}

// Attribute the signup/login to whatever sent the visitor here (e.g. the blog newsletter popup)
const source = computed(() => {
  const s = route.query.source
  return s && typeof s === 'string' ? s : undefined
})

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    if (isSignup.value) {
      await auth.signup({
        username: form.value.username,
        phoneNumber: form.value.phoneNumber,
        email: form.value.email,
        address: form.value.address,
        pincode: form.value.pincode
      }, source.value)
    } else {
      const user = await auth.login(form.value.phoneNumber, source.value)
      if (!user) {
        error.value = 'No account found with this phone number. Please sign up.'
        isSignup.value = true
        loading.value = false
        return
      }
    }

    // Success - redirect
    await router.push(redirectTo.value)
  } catch (err) {
    error.value = err?.message || err?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}

// --- Google Sign-In ---
const googleButtonRef = ref(null)
const googleError = ref('')
const { renderGoogleButton } = useGoogleSignIn()

async function handleGoogleCredential(response) {
  error.value = ''
  loading.value = true
  try {
    await auth.loginWithGoogle(response.credential, source.value)
    await router.push(redirectTo.value)
  } catch (err) {
    error.value = err?.message || err?.data?.message || 'Google sign-in failed. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const clientId = config.public.googleClientId
  if (!clientId || !googleButtonRef.value) return
  try {
    await renderGoogleButton(googleButtonRef.value, clientId, handleGoogleCredential)
  } catch {
    googleError.value = 'Could not load Google Sign-In right now.'
  }
})

// If already logged in, redirect
if (auth.isAuthenticated.value) {
  await router.push(redirectTo.value)
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* ---------- Visual side ---------- */
.login-visual {
  position: relative;
  background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
  color: #fff;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.visual-brand {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: #fff;
  font-weight: 600;
  font-size: 1.125rem;
  letter-spacing: 0.05em;
  align-self: flex-start;
  z-index: 2;
}

.brand-dot {
  font-size: 0.75rem;
  opacity: 0.8;
}

.visual-center {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.visual-plate {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffffff 0%, #f2ede6 55%, #ddd5c9 78%, #c9beae 100%);
  box-shadow:
    0 -6px 14px rgba(0, 0, 0, 0.12) inset,
    0 24px 50px rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: plateFloat 6s ease-in-out infinite;
  z-index: 2;
}

.visual-plate-rim {
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

.visual-plate-glyph {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  font-size: 2.5rem;
  color: #2c2c2c;
  opacity: 0.7;
}

.visual-orbit {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.15);
}

.orbit-a {
  width: 280px;
  height: 280px;
  animation: orbitSpin 40s linear infinite;
}

.orbit-b {
  width: 340px;
  height: 340px;
  animation: orbitSpin 60s linear infinite reverse;
}

@keyframes plateFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes orbitSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.visual-copy {
  position: relative;
  z-index: 2;
}

.visual-eyebrow {
  margin: 0 0 10px;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-style: italic;
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.03em;
}

.visual-heading {
  margin: 0 0 12px;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.visual-sub {
  margin: 0;
  max-width: 380px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.9375rem;
  line-height: 1.6;
}

/* ---------- Form side ---------- */
.login-form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.login-form-wrap {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 28px;
}

.form-title {
  margin: 0 0 8px;
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-subtitle {
  margin: 0;
  color: #666;
  font-size: 0.9375rem;
}

.google-btn-container {
  display: flex;
  justify-content: center;
  min-height: 44px;
  max-width: 100%;
  overflow: hidden;
}

.google-error {
  margin: 8px 0 0;
  color: #b3261e;
  font-size: 0.8125rem;
  text-align: center;
}

.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

.divider span {
  position: relative;
  background: #fff;
  padding: 0 14px;
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-row .form-group {
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #2c2c2c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.required {
  color: #b3261e;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 14px;
  font-size: 0.9375rem;
  color: #666;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 0.9375rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0;
  background: #fff;
  color: #2c2c2c;
  transition: border-color 0.2s;
  font-family: inherit;
}

.input-wrapper .form-input {
  padding-left: 42px;
}

.form-input:focus {
  outline: none;
  border-color: #2c2c2c;
}

.form-input:disabled {
  background: #fafafa;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-input::placeholder {
  color: #999;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #fdf1f0;
  border: 1px solid #f2c9c5;
  color: #b3261e;
  font-size: 0.8125rem;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 14px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  background: #2c2c2c;
  border: 1px solid #2c2c2c;
  border-radius: 0;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.2s;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  background: #000;
}

.submit-btn:disabled {
  background: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
}

.submit-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}

.loading-spinner svg {
  width: 100%;
  height: 100%;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.toggle-mode {
  margin-top: 24px;
  text-align: center;
}

.toggle-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
}

.toggle-btn strong {
  color: #2c2c2c;
  text-decoration: underline;
  font-weight: 600;
}

.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-visual {
    padding: 24px;
    min-height: 260px;
  }

  .visual-center {
    min-height: 140px;
  }

  .visual-plate {
    width: 120px;
    height: 120px;
  }

  .visual-plate-glyph {
    font-size: 1.5rem;
  }

  .orbit-a {
    width: 180px;
    height: 180px;
  }

  .orbit-b {
    width: 220px;
    height: 220px;
  }

  .visual-heading {
    font-size: 1.5rem;
  }

  .visual-sub {
    display: none;
  }

  .login-form-side {
    padding: 32px 20px 48px;
  }
}

@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-title {
    font-size: 1.5rem;
  }
}
</style>
