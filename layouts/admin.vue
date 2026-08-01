<template>
  <div class="admin-shell">
    <div v-if="!isAuthorized" class="key-gate">
      <form class="key-card" @submit.prevent="handleSubmit">
        <h1 class="key-title">SVRVE Admin</h1>
        <p class="key-subtitle">Enter the admin key to continue.</p>
        <input
          v-model="keyInput"
          type="password"
          class="key-input"
          placeholder="Admin key"
          autocomplete="off"
          :disabled="verifying"
        />
        <p v-if="authError" class="key-error">{{ authError }}</p>
        <button type="submit" class="key-submit" :disabled="verifying || !keyInput.trim()">
          {{ verifying ? 'Checking…' : 'Continue' }}
        </button>
      </form>
    </div>

    <template v-else>
      <header class="admin-topbar">
        <div class="admin-topbar-inner">
          <span class="admin-brand">SVRVE Admin</span>
          <nav class="admin-nav">
            <NuxtLink to="/admin/products" class="admin-nav-link">Products</NuxtLink>
            <NuxtLink to="/admin/blog" class="admin-nav-link">Blog</NuxtLink>
            <NuxtLink to="/admin/analytics" class="admin-nav-link">Analytics</NuxtLink>
          </nav>
          <button type="button" class="logout-btn" @click="logout">Log out</button>
        </div>
      </header>
      <main class="admin-main">
        <slot />
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const { isAuthorized, verifying, authError, verify, logout, tryAutoVerify } = useAdminAuth()
const keyInput = ref('')

async function handleSubmit() {
  await verify(keyInput.value.trim())
}

onMounted(() => {
  tryAutoVerify()
})
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  background: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-dark, #2c3e50);
}

/* Key gate */
.key-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.key-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.key-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.key-subtitle {
  margin: 0 0 0.5rem;
  color: var(--text-muted, #3f4f5f);
  font-size: 0.9rem;
}

.key-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
}

.key-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.85rem;
}

.key-submit {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.key-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Topbar */
.admin-topbar {
  background: #fff;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  position: sticky;
  top: 0;
  z-index: 50;
}

.admin-topbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.admin-brand {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.02em;
}

.admin-nav {
  display: flex;
  gap: 0.25rem;
  flex: 1;
}

.admin-nav-link {
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted, #3f4f5f);
  text-decoration: none;
}

.admin-nav-link:hover {
  background: #f3f0ec;
}

.admin-nav-link.router-link-active {
  background: var(--primary-color, #8B4513);
  color: #fff;
}

.logout-btn {
  background: none;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
}

.admin-main {
  min-height: calc(100vh - 56px);
}
</style>
