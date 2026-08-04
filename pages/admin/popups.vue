<template>
  <div class="dashboard">
    <header class="dash-header">
      <h1 class="dash-title">Blog Popups</h1>
      <p v-if="loadError" class="load-error">{{ loadError }}</p>
    </header>

    <div class="popups-layout">
      <!-- List -->
      <section class="list-panel">
        <div class="list-panel-header">
          <h2 class="panel-title">All Popups</h2>
          <button type="button" class="new-btn" @click="startNew">+ New</button>
        </div>

        <p v-if="loading" class="empty-state">Loading…</p>
        <p v-else-if="!popups.length" class="empty-state">No popups yet — create one to get started.</p>
        <div v-else class="popup-list">
          <div v-for="p in popups" :key="p.id" class="popup-row" :class="{ selected: p.id === editingId }">
            <button type="button" class="popup-row-main" @click="editPopup(p)">
              <span class="popup-row-name">{{ p.name || 'Untitled Popup' }}</span>
              <span v-if="p.active" class="active-badge">● Live</span>
            </button>
            <button
              v-if="!p.active"
              type="button"
              class="activate-btn"
              :disabled="activatingId === p.id"
              @click="activate(p)"
            >{{ activatingId === p.id ? '…' : 'Set Active' }}</button>
            <button type="button" class="delete-btn" aria-label="Delete popup" @click="removePopup(p)">✕</button>
          </div>
        </div>
      </section>

      <!-- Editor -->
      <section class="editor-panel">
        <h2 class="panel-title">{{ editingId ? 'Edit Popup' : 'New Popup' }}</h2>

        <label class="field">
          <span class="field-label">Name (internal only, not shown to visitors)</span>
          <input v-model="form.name" type="text" placeholder="e.g. Free Mug Offer V2" />
        </label>

        <label class="field">
          <span class="field-label">CTA button text</span>
          <input v-model="form.ctaText" type="text" maxlength="100" placeholder="Sign up &amp; claim free mug" />
        </label>

        <div class="editor-tabs">
          <button type="button" class="tab-btn" :class="{ active: !showPreview }" @click="showPreview = false">Edit HTML</button>
          <button type="button" class="tab-btn" :class="{ active: showPreview }" @click="showPreview = true">Preview</button>
        </div>

        <textarea
          v-if="!showPreview"
          v-model="form.htmlContent"
          class="html-textarea"
          rows="12"
          placeholder="&lt;img src=&quot;...&quot; /&gt;&#10;&lt;h2&gt;Headline&lt;/h2&gt;&#10;&lt;p&gt;Body copy…&lt;/p&gt;"
        ></textarea>

        <div v-else class="preview-wrap">
          <div class="preview-overlay">
            <div class="preview-modal">
              <button type="button" class="preview-close" aria-label="Close">✕</button>
              <div class="preview-content" v-html="form.htmlContent || '<p class=\'preview-empty\'>Nothing to preview yet — add some HTML.</p>'"></div>
              <div class="preview-actions">
                <span class="preview-cta">{{ form.ctaText || 'Sign up & claim free mug' }}</span>
                <div v-if="form.showGoogleButton" ref="previewGoogleButtonRef" class="preview-google-btn"></div>
                <p v-if="previewGoogleError" class="preview-google-error">{{ previewGoogleError }}</p>
                <span class="preview-later">Maybe later</span>
              </div>
            </div>
          </div>
        </div>

        <label class="checkbox-field">
          <input type="checkbox" v-model="form.showGoogleButton" @change="onGoogleToggle" />
          <span>Show "Sign in with Google" button in this popup</span>
        </label>

        <div class="editor-actions">
          <button type="button" class="save-btn" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save Popup' }}
          </button>
          <p v-if="saveError" class="form-error">{{ saveError }}</p>
          <p v-if="savedFlash" class="saved-flash">Saved.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, nextTick, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })

useHead({
  title: 'Blog Popups',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const { isAuthorized, authHeaders, logout: adminLogout } = useAdminAuth()
const { renderGoogleButton } = useGoogleSignIn()

const popups = ref([])
const loading = ref(false)
const loadError = ref('')
const activatingId = ref(null)

const editingId = ref(null)
const showPreview = ref(false)
const saving = ref(false)
const saveError = ref('')
const savedFlash = ref(false)

function emptyForm() {
  return { name: '', htmlContent: '', ctaText: '', showGoogleButton: false }
}
const form = reactive(emptyForm())

async function loadPopups() {
  loading.value = true
  loadError.value = ''
  try {
    popups.value = await $fetch(`${apiBase}/admin/popups`, { headers: authHeaders() })
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    if (status === 401) {
      adminLogout()
    } else {
      loadError.value = 'Failed to load popups.'
    }
  } finally {
    loading.value = false
  }
}

function startNew() {
  editingId.value = null
  Object.assign(form, emptyForm())
  showPreview.value = false
  saveError.value = ''
  savedFlash.value = false
}

function editPopup(p) {
  editingId.value = p.id
  form.name = p.name || ''
  form.htmlContent = p.htmlContent || ''
  form.ctaText = p.ctaText || ''
  form.showGoogleButton = !!p.showGoogleButton
  showPreview.value = false
  saveError.value = ''
  savedFlash.value = false
}

async function save() {
  saving.value = true
  saveError.value = ''
  savedFlash.value = false
  try {
    const payload = {
      name: form.name.trim() || 'Untitled Popup',
      htmlContent: form.htmlContent,
      ctaText: form.ctaText.trim(),
      showGoogleButton: form.showGoogleButton
    }
    if (editingId.value) {
      await $fetch(`${apiBase}/admin/popups/${editingId.value}`, { method: 'PUT', body: payload, headers: authHeaders() })
    } else {
      const created = await $fetch(`${apiBase}/admin/popups`, { method: 'POST', body: payload, headers: authHeaders() })
      editingId.value = created.id
    }
    savedFlash.value = true
    setTimeout(() => { savedFlash.value = false }, 2000)
    await loadPopups()
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    saveError.value = status === 401 ? 'Admin key rejected — try logging out and back in.' : 'Failed to save popup.'
  } finally {
    saving.value = false
  }
}

async function activate(p) {
  activatingId.value = p.id
  try {
    await $fetch(`${apiBase}/admin/popups/${p.id}/activate`, { method: 'PUT', headers: authHeaders() })
    await loadPopups()
  } catch {
    loadError.value = 'Could not set that popup active. Please try again.'
  } finally {
    activatingId.value = null
  }
}

async function removePopup(p) {
  try {
    await $fetch(`${apiBase}/admin/popups/${p.id}`, { method: 'DELETE', headers: authHeaders() })
    if (editingId.value === p.id) startNew()
    await loadPopups()
  } catch {
    loadError.value = 'Could not delete that popup. Please try again.'
  }
}

// --- Live Google button preview (real GIS button, same as the public one) ---
const previewGoogleButtonRef = ref(null)
const previewGoogleError = ref('')

async function mountPreviewGoogleButton() {
  if (!form.showGoogleButton || !showPreview.value) return
  await nextTick()
  const clientId = config.public.googleClientId
  if (!clientId || !previewGoogleButtonRef.value) return
  previewGoogleError.value = ''
  try {
    // No real credential ever reaches admin-preview context — this is purely visual.
    await renderGoogleButton(previewGoogleButtonRef.value, clientId, () => {})
  } catch {
    previewGoogleError.value = 'Could not load the Google button preview.'
  }
}

function onGoogleToggle() {
  if (form.showGoogleButton && showPreview.value) mountPreviewGoogleButton()
}

watch(showPreview, (v) => {
  if (v) mountPreviewGoogleButton()
})

watch(isAuthorized, (v) => {
  if (v) loadPopups()
}, { immediate: true })
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.dash-header {
  margin-bottom: 1.5rem;
}

.dash-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.load-error {
  margin: 0.5rem 0 0;
  color: #dc2626;
  font-size: 0.85rem;
}

.popups-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.list-panel,
.editor-panel {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.list-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.new-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.empty-state {
  color: var(--text-muted, #3f4f5f);
  font-size: 0.85rem;
  font-style: italic;
}

.popup-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.popup-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.4rem;
}

.popup-row.selected {
  border-color: var(--primary-color, #8B4513);
}

.popup-row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
}

.popup-row-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #166534;
}

.activate-btn {
  padding: 0.3rem 0.55rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.delete-btn {
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.2rem 0.35rem;
}

.delete-btn:hover {
  color: #dc2626;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.field input[type="text"] {
  padding: 0.55rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
}

.editor-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tab-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted, #3f4f5f);
  cursor: pointer;
}

.tab-btn.active {
  background: var(--primary-color, #8B4513);
  border-color: var(--primary-color, #8B4513);
  color: #fff;
}

.html-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  resize: vertical;
}

.preview-wrap {
  margin-bottom: 1rem;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: #fafafa;
}

.preview-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-modal {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 26px 22px 22px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  text-align: center;
}

.preview-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: #666;
  cursor: default;
  font-size: 1.1rem;
}

.preview-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.preview-empty {
  color: #999;
  font-style: italic;
  font-size: 0.85rem;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.preview-cta {
  display: block;
  padding: 14px 18px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  background: #111;
  border-radius: 999px;
}

.preview-google-btn {
  display: flex;
  justify-content: center;
  min-height: 40px;
}

.preview-google-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.78rem;
}

.preview-later {
  font-size: 0.875rem;
  color: #666;
  text-decoration: underline;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-dark, #2c3e50);
  margin-bottom: 1.25rem;
  cursor: pointer;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-btn {
  padding: 0.6rem 1.3rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.82rem;
}

.saved-flash {
  margin: 0;
  padding: 0.4rem 0.8rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

@media (max-width: 800px) {
  .popups-layout {
    grid-template-columns: 1fr;
  }
}
</style>
