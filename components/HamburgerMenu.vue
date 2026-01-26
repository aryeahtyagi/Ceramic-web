<template>
  <div>
    <!-- Menu Overlay -->
    <div
      v-if="isOpen"
      class="menu-overlay"
      @click="closeMenu"
    ></div>

    <!-- Menu Sidebar -->
    <div
      class="menu-sidebar"
      :class="{ open: isOpen }"
    >
      <div class="menu-header">
        <h2 class="menu-title">Menu</h2>
        <button class="close-btn" type="button" @click="closeMenu" aria-label="Close menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <nav class="menu-nav">
        <NuxtLink to="/" class="menu-item" @click="closeMenu">
          <span class="menu-icon">🏠</span>
          <span class="menu-label">Home</span>
        </NuxtLink>

        <div class="menu-section">
          <button
            class="menu-item menu-item-expandable"
            :class="{ expanded: collectionsExpanded }"
            type="button"
            @click="toggleCollections"
          >
            <span class="menu-icon">📦</span>
            <span class="menu-label">Collections</span>
            <span class="expand-icon">{{ collectionsExpanded ? '−' : '+' }}</span>
          </button>
          <div v-if="collectionsExpanded" class="menu-subitems">
            <NuxtLink
              v-for="type in collectionTypes"
              :key="type.id"
              :to="type.path"
              class="menu-subitem"
              @click="closeMenu"
            >
              {{ type.name }}
            </NuxtLink>
          </div>
        </div>

        <NuxtLink to="/cart" class="menu-item" @click="closeMenu">
          <span class="menu-icon">🛒</span>
          <span class="menu-label">Cart</span>
        </NuxtLink>

        <NuxtLink v-if="auth.isAuthenticated.value" to="/orders" class="menu-item" @click="closeMenu">
          <span class="menu-icon">📋</span>
          <span class="menu-label">Orders</span>
        </NuxtLink>

        <div class="menu-divider"></div>

        <button
          v-if="auth.isAuthenticated.value"
          class="menu-item menu-item-logout"
          type="button"
          @click="handleLogout"
        >
          <span class="menu-icon">🚪</span>
          <span class="menu-label">Logout</span>
        </button>

        <NuxtLink
          v-else
          to="/login"
          class="menu-item"
          @click="closeMenu"
        >
          <span class="menu-icon">🔐</span>
          <span class="menu-label">Login</span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const router = useRouter()
const auth = useAuth()
const collectionsExpanded = ref(false)

const collectionTypes = [
  { id: 'all', name: 'All', path: '/collections' },
  { id: 'plates', name: 'Plates', path: '/collections/plates' },
  { id: 'mugs', name: 'Mugs', path: '/collections/mugs' },
  { id: 'bowls', name: 'Bowls', path: '/collections/bowls' },
  { id: 'vases', name: 'Vases', path: '/collections/vases' }
]

const toggleCollections = () => {
  collectionsExpanded.value = !collectionsExpanded.value
}

const closeMenu = () => {
  emit('close')
  collectionsExpanded.value = false
}

const handleLogout = async () => {
  const cart = useCart()
  await cart.clear()
  auth.logout()
  closeMenu()
  router.push('/collections')
}

// Close menu when route changes
watch(() => router.currentRoute.value.path, () => {
  closeMenu()
})
</script>

<style scoped>
.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  animation: fadeIn 0.2s ease;
}

.menu-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  max-width: 85vw;
  background: #fff;
  z-index: 201;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.menu-sidebar.open {
  transform: translateX(0);
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafafa;
}

.menu-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.menu-nav {
  flex: 1;
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  text-decoration: none;
  color: #2c2c2c;
  font-size: 0.9375rem;
  font-weight: 400;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item-expandable {
  justify-content: space-between;
}

.menu-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.menu-label {
  flex: 1;
}

.expand-icon {
  font-size: 1.25rem;
  font-weight: 300;
  color: #666;
  transition: transform 0.2s;
}

.menu-item-expandable.expanded .expand-icon {
  transform: rotate(0deg);
}

.menu-subitems {
  background: #fafafa;
  padding: 4px 0;
}

.menu-subitem {
  display: block;
  padding: 10px 16px 10px 52px;
  text-decoration: none;
  color: #666;
  font-size: 0.875rem;
  transition: background 0.2s, color 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.menu-subitem:hover {
  background: #f0f0f0;
  color: #2c2c2c;
}

.menu-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 8px 0;
}

.menu-item-logout {
  color: #d32f2f;
}

.menu-item-logout:hover {
  background: #ffebee;
  color: #c62828;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
