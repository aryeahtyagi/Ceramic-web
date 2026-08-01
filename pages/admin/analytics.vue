<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1 class="dash-title">Blog &amp; newsletter analytics</h1>
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
        <label class="filter-field">
          <span>Event type</span>
          <select v-model="eventTypeFilter">
            <option value="">All</option>
            <option v-for="e in summary" :key="e.eventType" :value="e.eventType">{{ e.eventType }}</option>
          </select>
        </label>
        <button type="button" class="apply-btn" :disabled="loading" @click="applyFilters">Apply</button>
      </div>

      <!-- Funnel -->
      <section class="funnel" v-if="funnel">
        <div class="funnel-tile">
          <p class="tile-label">Popup shown</p>
          <p class="tile-value">{{ funnel.popupShown }}</p>
        </div>
        <div class="funnel-arrow">
          <span>{{ conversionPct(funnel.popupCtaClick, funnel.popupShown) }}</span>
        </div>
        <div class="funnel-tile">
          <p class="tile-label">Popup CTA clicked</p>
          <p class="tile-value">{{ funnel.popupCtaClick }}</p>
        </div>
        <div class="funnel-arrow">
          <span>{{ conversionPct(funnel.signupSuccess, funnel.popupCtaClick) }}</span>
        </div>
        <div class="funnel-tile funnel-tile--highlight">
          <p class="tile-label">Signups (from popup)</p>
          <p class="tile-value">{{ funnel.signupSuccess }}</p>
        </div>
        <div class="funnel-tile funnel-tile--muted">
          <p class="tile-label">Inline CTA clicked</p>
          <p class="tile-value">{{ funnel.inlineCtaClick }}</p>
        </div>
      </section>

      <!-- Event breakdown -->
      <section class="breakdown">
        <h2 class="section-title">Events by type</h2>
        <table class="table">
          <caption class="sr-only">Event counts by type</caption>
          <tbody>
            <tr v-for="e in summary" :key="e.eventType" class="bar-row">
              <th scope="row" class="bar-label">{{ e.eventType }}</th>
              <td class="bar-cell">
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: (e.count / maxEventCount) * 100 + '%' }"></div>
                </div>
              </td>
              <td class="bar-value">{{ e.count }}</td>
            </tr>
            <tr v-if="!summary.length">
              <td colspan="3" class="empty-row">No events in this range.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Blog engagement -->
      <section class="breakdown">
        <h2 class="section-title">Time spent per post <span class="section-hint">(quality signal — higher = more engaged reading)</span></h2>
        <table class="table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Views measured</th>
              <th>Avg. time on page</th>
              <th>Median</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in blogEngagement" :key="row.blogId">
              <td>{{ blogTitle(row.blogId) }}</td>
              <td>{{ row.views }}</td>
              <td>{{ formatDuration(row.avgSeconds) }}</td>
              <td>{{ formatDuration(row.medianSeconds) }}</td>
            </tr>
            <tr v-if="!blogEngagement.length">
              <td colspan="4" class="empty-row">No time-on-page data in this range yet.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Raw events -->
      <section class="raw-events">
        <h2 class="section-title">Raw events</h2>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Session</th>
                <th>User</th>
                <th>Page</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ev in events?.content || []" :key="ev.id">
                <td>{{ formatDate(ev.createdAt) }}</td>
                <td>{{ ev.eventType }}</td>
                <td class="mono">{{ (ev.sessionId || '').slice(0, 8) }}</td>
                <td>{{ ev.userId || '—' }}</td>
                <td class="mono">{{ ev.pagePath }}</td>
                <td class="mono">{{ JSON.stringify(parseMetadata(ev.metadata)) }}</td>
              </tr>
              <tr v-if="!events?.content?.length">
                <td colspan="6" class="empty-row">No events in this range.</td>
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
  title: 'Analytics',
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
const eventTypeFilter = ref('')

const funnel = ref(null)
const summary = ref([])
const events = ref(null)
const page = ref(0)
const pageSize = 50
const blogEngagement = ref([])
const blogTitlesById = ref({})

const maxEventCount = computed(() => summary.value.reduce((m, e) => Math.max(m, e.count), 0) || 1)

function conversionPct(numerator, denominator) {
  if (!denominator) return '—'
  return `${Math.round((numerator / denominator) * 100)}%`
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

function parseMetadata(m) {
  try {
    return m ? JSON.parse(m) : {}
  } catch {
    return {}
  }
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function blogTitle(blogId) {
  return blogTitlesById.value[blogId] || `Blog #${blogId}`
}

async function loadFunnel() {
  funnel.value = await $fetch(`${apiBase}/analytics/funnel`, {
    headers: authHeaders(),
    params: { from: from.value, to: to.value }
  })
}

async function loadSummary() {
  summary.value = await $fetch(`${apiBase}/analytics/summary`, {
    headers: authHeaders(),
    params: { from: from.value, to: to.value }
  })
}

async function loadEvents() {
  events.value = await $fetch(`${apiBase}/analytics/events`, {
    headers: authHeaders(),
    params: {
      from: from.value,
      to: to.value,
      page: page.value,
      size: pageSize,
      eventType: eventTypeFilter.value || undefined
    }
  })
}

async function loadBlogEngagement() {
  blogEngagement.value = await $fetch(`${apiBase}/analytics/blog-engagement`, {
    headers: authHeaders(),
    params: { from: from.value, to: to.value }
  })
}

// Public endpoint, no admin key needed — just used to resolve blogId -> title for display.
async function loadBlogTitles() {
  if (Object.keys(blogTitlesById.value).length) return
  try {
    const blogs = await $fetch(`${apiBase}/blogs`)
    const map = {}
    for (const b of Array.isArray(blogs) ? blogs : []) {
      map[String(b.id)] = b.title || `Blog #${b.id}`
    }
    blogTitlesById.value = map
  } catch {
    // titles are a display nicety — fall back to "Blog #id" if this fails
  }
}

async function tryLoad() {
  loading.value = true
  loadError.value = ''
  try {
    await Promise.all([loadFunnel(), loadSummary(), loadEvents(), loadBlogEngagement(), loadBlogTitles()])
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    if (status === 401) {
      // Key was valid at layout-level verification but got rejected here (e.g. rotated server-side) — re-gate.
      adminLogout()
    } else {
      loadError.value = 'Failed to load analytics data.'
    }
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 0
  tryLoad()
}

async function nextPage() {
  if (events.value && page.value < events.value.totalPages - 1) {
    page.value++
    await loadEvents()
  }
}

async function prevPage() {
  if (page.value > 0) {
    page.value--
    await loadEvents()
  }
}

watch(isAuthorized, (v) => {
  if (v) tryLoad()
}, { immediate: true })
</script>

<style scoped>
/* Dashboard */
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

/* Filters */
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

.filter-field input,
.filter-field select {
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

/* Funnel */
.funnel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.funnel-tile {
  flex: 1 1 160px;
  background: #fff;
  border-radius: 12px;
  padding: 1.1rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.funnel-tile--highlight {
  background: var(--primary-color, #8B4513);
  color: #fff;
}

.funnel-tile--muted {
  opacity: 0.75;
}

.tile-label {
  margin: 0 0 0.35rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: inherit;
  opacity: 0.75;
}

.tile-value {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.funnel-arrow {
  flex: 0 0 auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted, #3f4f5f);
}

/* Sections */
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.section-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted, #3f4f5f);
  text-transform: none;
  letter-spacing: normal;
}

.breakdown {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.bar-row {
  height: 2.2rem;
}

.bar-label {
  text-align: left;
  font-weight: 500;
  font-size: 0.85rem;
  width: 160px;
  white-space: nowrap;
}

.bar-cell {
  width: 100%;
}

.bar-track {
  background: #f1eee9;
  border-radius: 4px;
  height: 10px;
  overflow: hidden;
}

.bar-fill {
  background: var(--primary-color, #8B4513);
  height: 100%;
  border-radius: 4px;
  min-width: 2px;
}

.bar-value {
  text-align: right;
  font-variant-numeric: tabular-nums;
  padding-left: 0.75rem;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Raw events table */
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

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  color: var(--text-muted, #3f4f5f);
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
