<template>
  <form class="seo-form" @submit.prevent="handleSubmit">
    <p v-if="loading" class="loading-text">Loading…</p>
    <template v-else>
      <p v-if="submitError" class="form-error">{{ submitError }}</p>
      <p v-if="savedFlash" class="saved-flash">Saved.</p>

      <label class="field">
        <span class="field-label">
          SEO title *
          <span class="field-hint">{{ form.seoTitle.length }}/70</span>
        </span>
        <input v-model="form.seoTitle" type="text" required maxlength="70" />
      </label>
      <label class="field">
        <span class="field-label">
          Meta description *
          <span class="field-hint">{{ form.metaDescription.length }}/180</span>
        </span>
        <textarea v-model="form.metaDescription" rows="3" required maxlength="180"></textarea>
      </label>
      <label class="field">
        <span class="field-label">SEO slug *</span>
        <input v-model="form.seoSlug" type="text" required />
      </label>
      <div class="field-row">
        <label class="field">
          <span class="field-label">Primary keyword *</span>
          <input v-model="form.primaryKeyword" type="text" required />
        </label>
        <label class="field">
          <span class="field-label">Secondary keywords</span>
          <input v-model="form.secondaryKeywords" type="text" placeholder="comma-separated" />
        </label>
      </div>
      <div class="field-row">
        <label class="field">
          <span class="field-label">Canonical URL</span>
          <input v-model="form.canonicalUrl" type="text" />
        </label>
        <label class="field">
          <span class="field-label">Index status</span>
          <select v-model="form.indexStatus">
            <option value="index">index</option>
            <option value="noindex">noindex</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Schema type</span>
          <select v-model="form.schemaType">
            <option value="Product">Product</option>
            <option value="ItemPage">ItemPage</option>
            <option value="WebPage">WebPage</option>
            <option value="Article">Article</option>
          </select>
        </label>
      </div>
      <label class="field">
        <span class="field-label">Breadcrumb title</span>
        <input v-model="form.breadcrumbTitle" type="text" />
      </label>

      <h3 class="subsection-title">Social preview</h3>
      <label class="field">
        <span class="field-label">OG title</span>
        <input v-model="form.ogTitle" type="text" />
      </label>
      <label class="field">
        <span class="field-label">OG description</span>
        <textarea v-model="form.ogDescription" rows="2"></textarea>
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
import { reactive, ref, onMounted } from 'vue'

const props = defineProps({
  productId: { type: [Number, String], required: true },
  product: { type: Object, default: null }
})

const { authHeaders } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const slugify = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const form = reactive({
  seoTitle: '',
  metaDescription: '',
  seoSlug: '',
  primaryKeyword: '',
  secondaryKeywords: '',
  canonicalUrl: '',
  indexStatus: 'index',
  schemaType: 'Product',
  ogTitle: '',
  ogDescription: '',
  ogImageUrl: '',
  breadcrumbTitle: ''
})

const loading = ref(true)
const submitting = ref(false)
const submitError = ref('')
const savedFlash = ref(false)

function prefillFromProduct() {
  const name = props.product?.name || ''
  const desc = String(props.product?.description || '').slice(0, 160)
  form.seoTitle = name.slice(0, 70)
  form.metaDescription = desc
  form.seoSlug = slugify(name)
  form.ogTitle = name
  form.ogDescription = desc
  form.breadcrumbTitle = name
}

function applyExisting(seo) {
  form.seoTitle = seo.seoTitle || ''
  form.metaDescription = seo.metaDescription || ''
  form.seoSlug = seo.seoSlug || ''
  form.primaryKeyword = seo.primaryKeyword || ''
  form.secondaryKeywords = seo.secondaryKeywords || ''
  form.canonicalUrl = seo.canonicalUrl || ''
  form.indexStatus = seo.indexStatus || 'index'
  form.schemaType = seo.schemaType || 'Product'
  form.ogTitle = seo.ogTitle || ''
  form.ogDescription = seo.ogDescription || ''
  form.ogImageUrl = seo.ogImageUrl || ''
  form.breadcrumbTitle = seo.breadcrumbTitle || ''
}

onMounted(async () => {
  try {
    const seo = await $fetch(`${apiBase}/product-seo/${props.productId}`)
    applyExisting(seo)
  } catch {
    // no SEO record yet — start from product-derived defaults
    prefillFromProduct()
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  savedFlash.value = false
  try {
    // No `id` here even when editing: the backend's upsert always deletes any existing row for this
    // productId before inserting a fresh one, so sending the old id back makes it try to UPDATE a row
    // that was just deleted (500). Always a plain insert from the client's point of view.
    const payload = {
      productId: Number(props.productId),
      ...form
    }
    // POST is an upsert on the backend (deletes any existing row for this productId, then inserts) —
    // there's no separate update endpoint, so both create and edit go through here.
    await $fetch(`${apiBase}/product-seo`, { method: 'POST', body: payload, headers: authHeaders() })
    savedFlash.value = true
    setTimeout(() => { savedFlash.value = false }, 2000)
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
