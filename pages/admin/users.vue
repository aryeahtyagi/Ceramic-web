<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1 class="dash-title">Users</h1>
      <p v-if="loadError" class="load-error">{{ loadError }}</p>
    </header>

    <div class="filters">
      <label class="filter-field filter-field--grow">
        <span>Search</span>
        <input v-model="search" type="text" placeholder="Search by name, phone, or email" />
      </label>
      <button type="button" class="apply-btn" :disabled="loading" @click="loadUsers">Refresh</button>
    </div>

    <section class="breakdown">
      <div class="users-summary">
        {{ filteredUsers.length }} of {{ users.length }} user{{ users.length === 1 ? '' : 's' }}
      </div>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Pincode</th>
              <th>Sign-in</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id">
              <td class="mono">{{ u.id }}</td>
              <td>{{ u.username || '—' }}</td>
              <td class="mono">{{ u.phoneNumber || '—' }}</td>
              <td>{{ u.email || '—' }}</td>
              <td>{{ u.address || '—' }}</td>
              <td>{{ u.pincode || '—' }}</td>
              <td>
                <span class="badge" :class="u.googleId ? 'badge--google' : 'badge--phone'">
                  {{ u.googleId ? 'Google' : 'Phone' }}
                </span>
              </td>
            </tr>
            <tr v-if="!loading && !filteredUsers.length">
              <td colspan="7" class="empty-row">No users found.</td>
            </tr>
            <tr v-if="loading">
              <td colspan="7" class="empty-row">Loading…</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })

useHead({
  title: 'Users',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const { isAuthorized, authHeaders, logout: adminLogout } = useAdminAuth()

const users = ref([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) =>
    [u.username, u.phoneNumber, u.email, u.address, u.pincode].some((field) =>
      String(field || '').toLowerCase().includes(q)
    )
  )
})

async function loadUsers() {
  loading.value = true
  loadError.value = ''
  try {
    users.value = await $fetch(`${apiBase}/admin/users`, { headers: authHeaders() })
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    if (status === 401) {
      // Key was valid at layout-level verification but got rejected here (e.g. rotated server-side) — re-gate.
      adminLogout()
    } else {
      loadError.value = 'Failed to load users.'
    }
  } finally {
    loading.value = false
  }
}

watch(
  isAuthorized,
  (v) => {
    if (v) loadUsers()
  },
  { immediate: true }
)
</script>

<style scoped>
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.dash-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.load-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.85rem;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;
  background: #fff;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-muted, #3f4f5f);
}

.filter-field--grow {
  flex: 1;
  min-width: 220px;
}

.filter-field input {
  padding: 0.5rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
}

.apply-btn {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.apply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.breakdown {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.users-summary {
  font-size: 0.8rem;
  color: var(--text-muted, #3f4f5f);
  margin-bottom: 0.75rem;
}

.table-scroll {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}

.table th,
.table td {
  text-align: left;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: var(--text-muted, #3f4f5f);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.badge--google {
  background: #e8f0fe;
  color: #1a73e8;
}

.badge--phone {
  background: #f1eee9;
  color: var(--text-muted, #3f4f5f);
}

.empty-row {
  text-align: center;
  color: var(--text-muted, #3f4f5f);
  padding: 1.5rem 0;
}
</style>
