<template>
  <div class="login-page">
    <div class="login-background">
      <div class="login-background-pattern"></div>
    </div>
    
    <div class="login-wrapper">
      <div class="login-container">
        <div class="login-header">
          <div class="login-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 class="login-title">{{ isSignup ? 'Create Account' : 'Welcome Back' }}</h1>
          <p class="login-subtitle">
            {{ isSignup ? 'Join us to discover handcrafted ceramics' : 'Enter your phone number to continue shopping' }}
          </p>
        </div>

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

            <div class="form-group">
              <label for="address" class="form-label">
                <span class="label-text">Address</span>
              </label>
              <input
                id="address"
                v-model="form.address"
                type="text"
                class="form-input"
                placeholder="Enter your address"
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
                placeholder="Enter your pincode"
                :disabled="loading"
                autocomplete="postal-code"
                maxlength="6"
              />
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
          <div class="toggle-divider">
            <span></span>
          </div>
          <button type="button" class="toggle-btn" @click="toggleMode" :disabled="loading">
            <span v-if="isSignup">Already have an account?</span>
            <span v-else>Don't have an account?</span>
            <strong>{{ isSignup ? 'Login' : 'Sign up' }}</strong>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const auth = useAuth()

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
      })
    } else {
      const user = await auth.login(form.value.phoneNumber)
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

// If already logged in, redirect
if (auth.isAuthenticated.value) {
  await router.push(redirectTo.value)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow: hidden;
}

.login-background {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #f5f1eb 0%, #e8ddd4 50%, #f5f1eb 100%);
  z-index: 0;
}

.login-background-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(210, 105, 30, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(244, 164, 96, 0.02) 0%, transparent 50%);
  background-size: 100% 100%;
  animation: patternMove 20s ease-in-out infinite;
}

@keyframes patternMove {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-2%, -2%) scale(1.05); }
}

.login-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
}

.login-container {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.25rem;
  color: var(--primary-color, #8B4513);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(210, 105, 30, 0.1) 100%);
  border-radius: 16px;
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.login-icon svg {
  width: 32px;
  height: 32px;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-dark, #2c3e50);
  margin: 0 0 0.5rem;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 0.9375rem;
  color: var(--text-muted, #3f4f5f);
  margin: 0;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.label-text {
  letter-spacing: 0.01em;
}

.required {
  color: #dc2626;
  font-weight: 700;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 1rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text-muted, #3f4f5f);
  pointer-events: none;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-dark, #2c3e50);
  transition: all 0.2s ease;
  font-family: inherit;
}

.input-wrapper .form-input {
  padding-left: 3.5rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #8B4513);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
  background: #ffffff;
}

.form-input:disabled {
  background: #f9fafb;
  border-color: #e5e7eb;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-input::placeholder {
  color: #9ca3af;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 500;
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--primary-color, #8B4513) 0%, var(--secondary-color, #D2691E) 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
}

.submit-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--secondary-color, #D2691E) 0%, var(--primary-color, #8B4513) 100%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.submit-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.submit-btn span {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
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
  margin-top: 2rem;
}

.toggle-divider {
  position: relative;
  margin-bottom: 1.5rem;
  text-align: center;
}

.toggle-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
}

.toggle-btn {
  width: 100%;
  background: none;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  color: var(--text-dark, #2c3e50);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: inherit;
}

.toggle-btn strong {
  color: var(--primary-color, #8B4513);
  font-weight: 600;
}

.toggle-btn:hover:not(:disabled) {
  border-color: var(--primary-color, #8B4513);
  background: rgba(139, 69, 19, 0.02);
}

.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .login-container {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .login-icon {
    width: 56px;
    height: 56px;
  }

  .login-icon svg {
    width: 28px;
    height: 28px;
  }

  .input-wrapper .form-input {
    padding-left: 3.25rem;
  }
  
  .form-input {
    padding: 0.75rem 0.875rem;
  }

  .submit-btn {
    padding: 0.875rem 1.25rem;
  }
}
</style>
