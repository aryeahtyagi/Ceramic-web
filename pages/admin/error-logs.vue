<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1 class="dash-title">Error logs</h1>
      <p v-if="loadError" class="load-error">{{ loadError }}</p>
    </header>

    <template v-if="isAuthorized">
      <!-- Filters -->
      <div class="filters">
        <label class="filter-field">
          <span>From</span>
          <input v-model="from" type="date" />
        </label>
        <label class="filter-field">
          <span>To</span>
          <input v-model="to" type="date" />
        </label>
        <button type="button" class="apply-btn" :disabled="loading" @click="applyFilters">Apply</button>
        <span class="count-pill">{{ events?.totalElements ?? 0 }} error{{ events?.totalElements === 1 ? '' : 's' }} in range</span>
      </div>

      <!-- Errors table -->
      <section class="raw-events">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Exception</th>
                <th>Message</th>
                <th>Method</th>
                <th>Path</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="ev in events?.content || []" :key="ev.id">
                <tr class="event-row" @click="toggleExpanded(ev.id)">
                  <td class="mono">{{ formatDate(ev.createdAt) }}</td>
                  <td><span class="status-pill" :class="statusClass(ev.statusCode)">{{ ev.statusCode }}</span></td>
                  <td class="mono exception-cell">{{ shortClassName(ev.exceptionClass) }}</td>
                  <td class="message-cell">{{ ev.message }}</td>
                  <td class="mono">{{ ev.httpMethod }}</td>
                  <td class="mono">{{ ev.requestPath }}</td>
                  <td class="expand-toggle">{{ expandedId === ev.id ? '▲' : '▼' }}</td>
                </tr>
                <tr v-if="expandedId === ev.id" class="trace-row">
                  <td colspan="7">
                    <div class="trace-meta">
                      <span><strong>Query:</strong> {{ ev.queryString || '—' }}</span>
                      <span><strong>IP:</strong> {{ ev.ip || '—' }}</span>
                      <span><strong>User-Agent:</strong> {{ ev.userAgent || '—' }}</span>
                    </div>
                    <pre class="stack-trace">{{ ev.stackTrace }}</pre>
                  </td>
                </tr>
              </template>
              <tr v-if="!events?.content?.length">
                <td colspan="7" class="empty-row">No errors in this range. That's a good thing.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pager" v-if="events">
          <button type="button" :disabled="page <= 0" @click="prevPage">Previous</button>
          <span>Page {{ page + 1 }} of {{ Math.max(events.totalPages, 1) }}</span>
          <button type="button" :disabled="page >= events.totalPages - 1" @click="nextPage">Next</button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })

useHead({
  title: 'Error Logs',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const { isAuthorized, authHeaders, logout: adminLogout } = useAdminAuth()
const loading = ref(false)
const loadError = ref('')

function toDateInputValue(d) {
  return d.toISOString().slice(0, 10)
}
const from = ref(toDateInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
const to = ref(toDateInputValue(new Date()))

const events = ref(null)
const page = ref(0)
const pageSize = 50
const expandedId = ref(null)

function toggleExpanded(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

function shortClassName(fqcn) {
  if (!fqcn) return ''
  const parts = fqcn.split('.')
  return parts[parts.length - 1]
}

function statusClass(status) {
  if (status >= 500) return 'status-pill--error'
  if (status >= 400) return 'status-pill--warn'
  return 'status-pill--ok'
}

async function loadEvents() {
  events.value = await $fetch(`${apiBase}/admin/sys-events`, {
    headers: authHeaders(),
    params: { from: from.value, to: to.value, page: page.value, size: pageSize }
  })
}

async function tryLoad() {
  loading.value = true
  loadError.value = ''
  try {
    await loadEvents()
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    if (status === 401) {
      adminLogout()
    } else {
      loadError.value = 'Failed to load error logs.'
    }
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 0
  expandedId.value = null
  tryLoad()
}

async function nextPage() {
  if (events.value && page.value < events.value.totalPages - 1) {
    page.value++
    expandedId.value = null
    await loadEvents()
  }
}

async function prevPage() {
  if (page.value > 0) {
    page.value--
    expandedId.value = null
    await loadEvents()
  }
}

watch(isAuthorized, (v) => {
  if (v) tryLoad()
}, { immediate: true })
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
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

.count-pill {
  margin-left: auto;
  font-size: 0.82rem;
  color: var(--text-muted, #3f4f5f);
}

.raw-events {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
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
}

.event-row {
  cursor: pointer;
}

.event-row:hover {
  background: #fafafa;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: var(--text-muted, #3f4f5f);
}

.exception-cell {
  color: #b91c1c;
  font-weight: 600;
}

.message-cell {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-toggle {
  text-align: center;
  color: var(--text-muted, #3f4f5f);
  width: 24px;
}

.status-pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.status-pill--error {
  background: #fee2e2;
  color: #b91c1c;
}

.status-pill--warn {
  background: #fef3c7;
  color: #92400e;
}

.status-pill--ok {
  background: #dcfce7;
  color: #15803d;
}

.trace-row td {
  background: #0f172a;
  padding: 0;
}

.trace-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  padding: 0.75rem 1rem 0;
  color: #cbd5e1;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.stack-trace {
  margin: 0;
  padding: 0.75rem 1rem 1rem;
  color: #e2e8f0;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 420px;
  overflow-y: auto;
}

.empty-row {
  text-align: center;
  color: var(--text-muted, #3f4f5f);
  padding: 1.5rem 0;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.85rem;
}

.pager button {
  padding: 0.4rem 0.9rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
