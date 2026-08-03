<template>
  <form class="seo-form" @submit.prevent="handleSubmit">
    <p v-if="loading" class="loading-text">Loading…</p>
    <template v-else>
      <p v-if="submitError" class="form-error">{{ submitError }}</p>
      <p v-if="savedFlash" class="saved-flash">Saved.</p>

      <label class="field">
        <span class="field-label">
          SEO title
          <span class="field-hint">{{ form.seoTitle.length }}/70</span>
        </span>
        <input v-model="form.seoTitle" type="text" maxlength="70" :placeholder="defaultTitle" />
      </label>
      <label class="field">
        <span class="field-label">
          Meta description
          <span class="field-hint">{{ form.metaDescription.length }}/180</span>
        </span>
        <textarea v-model="form.metaDescription" rows="3" maxlength="180" :placeholder="defaultDescription"></textarea>
      </label>
      <div class="field-row">
        <label class="field">
          <span class="field-label">Primary keyword</span>
          <input v-model="form.primaryKeyword" type="text" />
        </label>
        <label class="field">
          <span class="field-label">Secondary keywords</span>
          <input v-model="form.secondaryKeywords" type="text" placeholder="comma-separated" />
        </label>
      </div>
      <div class="field-row">
        <label class="field">
          <span class="field-label">Canonical URL</span>
          <input v-model="form.canonicalUrl" type="text" :placeholder="defaultCanonical" />
        </label>
        <label class="field">
          <span class="field-label">Index status</span>
          <select v-model="form.indexStatus">
            <option value="index">index</option>
            <option value="noindex">noindex</option>
            <option value="noindex, nofollow">noindex, nofollow</option>
          </select>
        </label>
      </div>

      <h3 class="subsection-title">Social preview</h3>
      <label class="field">
        <span class="field-label">OG title</span>
        <input v-model="form.ogTitle" type="text" :placeholder="form.seoTitle || defaultTitle" />
      </label>
      <label class="field">
        <span class="field-label">OG description</span>
        <textarea v-model="form.ogDescription" rows="2" :placeholder="form.metaDescription || defaultDescription"></textarea>
      </label>
      <label class="field">
        <span class="field-label">OG image URL</span>
        <input v-model="form.ogImageUrl" type="text" />
      </label>

      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="submitting">
          {{ submitting ? 'Saving…' : 'Save SEO' }}
        </button>
      </div>
    </template>
  </form>
</template>

<script setup>
import { reactive, ref, onMounted, watch } from 'vue'

const props = defineProps({
  pageKey: { type: String, required: true },
  defaultTitle: { type: String, default: '' },
  defaultDescription: { type: String, default: '' },
  defaultCanonical: { type: String, default: '' }
})

const { authHeaders } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

function emptyForm() {
  return {
    seoTitle: '',
    metaDescription: '',
    primaryKeyword: '',
    secondaryKeywords: '',
    canonicalUrl: '',
    indexStatus: 'index',
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: ''
  }
}

const form = reactive(emptyForm())
const loading = ref(true)
const submitting = ref(false)
const submitError = ref('')
const savedFlash = ref(false)

function applyExisting(seo) {
  form.seoTitle = seo.seoTitle || ''
  form.metaDescription = seo.metaDescription || ''
  form.primaryKeyword = seo.primaryKeyword || ''
  form.secondaryKeywords = seo.secondaryKeywords || ''
  form.canonicalUrl = seo.canonicalUrl || ''
  form.indexStatus = seo.indexStatus || 'index'
  form.ogTitle = seo.ogTitle || ''
  form.ogDescription = seo.ogDescription || ''
  form.ogImageUrl = seo.ogImageUrl || ''
}

async function load() {
  loading.value = true
  Object.assign(form, emptyForm())
  try {
    const seo = await $fetch(`${apiBase}/page-seo/${props.pageKey}`)
    applyExisting(seo)
  } catch {
    // no SEO record yet — form stays blank, placeholders show the current hardcoded defaults
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.pageKey, load)

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  savedFlash.value = false
  try {
    // POST is an upsert on the backend (deletes any existing row for this pageKey, then inserts) —
    // no separate update endpoint, so create and edit both go through here.
    const payload = { pageKey: props.pageKey, ...form }
    await $fetch(`${apiBase}/page-seo`, { method: 'POST', body: payload, headers: authHeaders() })
    savedFlash.value = true
    setTimeout(() => {
      savedFlash.value = false
    }, 2000)
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    submitError.value = status === 401 ? 'Admin key rejected — try logging out and back in.' : 'Failed to save SEO. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.seo-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
}

.form-error {
  margin: 0;
  padding: 0.6rem 0.9rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.82rem;
}

.saved-flash {
  margin: 0;
  padding: 0.5rem 0.9rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
}

.subsection-title {
  margin: 0.5rem 0 -0.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted, #3f4f5f);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.field-row .field {
  flex: 1;
  min-width: 160px;
}

.field-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.field-hint {
  font-weight: 400;
  font-size: 0.72rem;
  color: var(--text-muted, #3f4f5f);
}

.field input,
.field select,
.field textarea {
  padding: 0.55rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: 0.6rem 1.3rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
