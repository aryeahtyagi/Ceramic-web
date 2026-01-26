<template>
  <div class="account-dropdown-wrapper" ref="dropdownRef">
    <button
      class="account-btn"
      type="button"
      aria-label="Account menu"
      @click.stop="toggleDropdown"
    >
      👤
    </button>

    <div v-if="showDropdown" class="account-dropdown" @click.stop>
      <div v-if="auth.isAuthenticated.value" class="dropdown-content">
        <div class="user-info">
          <div class="user-name">{{ auth.user.value?.username || 'User' }}</div>
          <div class="user-phone">{{ auth.user.value?.phoneNumber || '' }}</div>
        </div>
        <div class="dropdown-divider"></div>
        <NuxtLink to="/orders" class="dropdown-item" @click="closeDropdown">
          📦 My Orders
        </NuxtLink>
        <button class="dropdown-item logout-btn" type="button" @click="handleLogout">
          🚪 Logout
        </button>
      </div>
      <div v-else class="dropdown-content">
        <div class="login-prompt">
          <p class="login-message">Login to view account</p>
          <NuxtLink to="/login" class="login-link" @click="closeDropdown">
            Go to Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const auth = useAuth()
const router = useRouter()
const showDropdown = ref(false)
const dropdownRef = ref(null)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = () => {
  showDropdown.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

const handleLogout = async () => {
  const cart = useCart()
  // Clear cart when logging out
  await cart.clear()
  auth.logout()
  closeDropdown()
  // Redirect to home or collections page after logout
  router.push('/collections')
}

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.account-dropdown-wrapper {
  position: relative;
  display: inline-block;
}

.account-btn {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-dark);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  font-size: 1.25rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.account-btn:hover {
  background: rgba(255, 255, 255, 1);
}

.account-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-content {
  padding: 0;
}

.user-info {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.user-phone {
  font-size: 0.8125rem;
  color: #666;
}

.dropdown-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 0;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  text-decoration: none;
  color: #333;
  font-size: 0.9375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.logout-btn {
  color: #d32f2f;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.logout-btn:hover {
  background: #ffebee;
}

.login-prompt {
  padding: 16px;
  text-align: center;
}

.login-message {
  font-size: 0.9375rem;
  color: #666;
  margin-bottom: 12px;
}

.login-link {
  display: inline-block;
  background: #007bff;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s;
}

.login-link:hover {
  background: #0056b3;
}
</style>
