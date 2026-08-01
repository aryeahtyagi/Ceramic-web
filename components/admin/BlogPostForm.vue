<template>
  <form class="blog-form" @submit.prevent="handleSubmit">
    <p v-if="submitError" class="form-error">{{ submitError }}</p>

    <section class="form-section">
      <h2 class="section-title">Basics</h2>
      <label class="field">
        <span class="field-label">Title *</span>
        <input v-model="form.title" type="text" required maxlength="255" />
      </label>
      <label class="field">
        <span class="field-label">H1 title <span class="field-hint">(defaults to title if left blank)</span></span>
        <input v-model="form.h1Title" type="text" />
      </label>
      <label class="field">
        <span class="field-label">
          Slug *
          <span class="field-hint">svrve.com/blog/{id}/{{ form.slug || '…' }}</span>
        </span>
        <input v-model="form.slug" type="text" required maxlength="255" @input="slugManuallyEdited = true" />
      </label>
      <div class="field-row">
        <label class="field">
          <span class="field-label">Category</span>
          <input v-model="form.category" type="text" placeholder="e.g. Craftsmanship" />
        </label>
        <label class="field">
          <span class="field-label">Collection category <span class="field-hint">(links to a product collection)</span></span>
          <input v-model="form.collectionCategory" type="text" placeholder="e.g. STOCKHOLM" />
        </label>
      </div>
      <label class="field">
        <span class="field-label">Tags <span class="field-hint">(comma-separated)</span></span>
        <input v-model="form.tags" type="text" placeholder="ceramics, glaze, technique" />
      </label>
    </section>

    <section class="form-section">
      <div class="section-title-row">
        <h2 class="section-title">Content</h2>
        <button type="button" class="ghost-btn" @click="previewOpen = !previewOpen">
          {{ previewOpen ? 'Edit HTML' : 'Preview' }}
        </button>
      </div>
      <div v-if="!previewOpen" class="field">
        <textarea v-model="form.content" rows="16" class="content-textarea" placeholder="<h2>...</h2><p>...</p>"></textarea>
      </div>
      <div v-else class="content-preview" v-html="form.content"></div>
    </section>

    <section class="form-section">
      <h2 class="section-title">Featured image</h2>
      <label class="field">
        <span class="field-label">Image URL</span>
        <input v-model="form.featuredImageUrl" type="text" placeholder="Paste a URL or upload below" />
      </label>
      <AdminImageUploadField v-model="form.featuredImageUrl" />
    </section>

    <section class="form-section">
      <h2 class="section-title">SEO</h2>
      <label class="field">
        <span class="field-label">
          SEO title *
          <span class="field-hint" :class="{ 'field-hint--over': form.seoTitle.length > 70 }">{{ form.seoTitle.length }}/70</span>
        </span>
        <input v-model="form.seoTitle" type="text" required maxlength="70" />
      </label>
      <label class="field">
        <span class="field-label">
          Meta description *
          <span class="field-hint" :class="{ 'field-hint--over': form.metaDescription.length > 180 }">{{ form.metaDescription.length }}/180</span>
        </span>
        <textarea v-model="form.metaDescription" rows="3" required maxlength="180"></textarea>
      </label>
      <div class="field-row">
        <label class="field">
          <span class="field-label">Primary keyword</span>
          <input v-model="form.primaryKeyword" type="text" />
        </label>
        <label class="field">
          <span class="field-label">Secondary keywords <span class="field-hint">(comma-separated)</span></span>
          <input v-model="form.secondaryKeywords" type="text" />
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
            <option value="Article">Article</option>
            <option value="BlogPosting">BlogPosting</option>
            <option value="NewsArticle">NewsArticle</option>
            <option value="WebPage">WebPage</option>
          </select>
        </label>
      </div>
    </section>

    <section class="form-section">
      <h2 class="section-title">Publishing</h2>
      <div class="field-row">
        <label class="field">
          <span class="field-label">Status</span>
          <select v-model="form.status">
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">Published at <span class="field-hint">(defaults to now if left blank)</span></span>
          <input v-model="form.publishedAt" type="datetime-local" />
        </label>
        <label class="field">
          <span class="field-label">Reading time <span class="field-hint">(minutes)</span></span>
          <input v-model.number="form.readingTime" type="number" min="0" />
        </label>
      </div>
    </section>

    <div class="form-actions">
      <NuxtLink to="/admin/blog" class="cancel-link">Cancel</NuxtLink>
      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create post' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'

const props = defineProps({
  initialData: { type: Object, default: null }
})
const emit = defineEmits(['saved'])

const { authHeaders } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const isEdit = computed(() => Boolean(props.initialData?.id))

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toDatetimeLocal(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function buildInitialForm(data) {
  return {
    title: data?.title || '',
    h1Title: data?.h1Title || '',
    slug: data?.slug || '',
    content: data?.content || '',
    seoTitle: data?.seoTitle || '',
    metaDescription: data?.metaDescription || '',
    primaryKeyword: data?.primaryKeyword || '',
    secondaryKeywords: data?.secondaryKeywords || '',
    featuredImageUrl: data?.featuredImageUrl || '',
    canonicalUrl: data?.canonicalUrl || '',
    indexStatus: data?.indexStatus || 'index',
    category: data?.category || '',
    collectionCategory: data?.collectionCategory || '',
    tags: data?.tags || '',
    status: data?.status || 'draft',
    publishedAt: toDatetimeLocal(data?.publishedAt),
    readingTime: data?.readingTime ?? null,
    schemaType: data?.schemaType || 'Article'
  }
}

const form = reactive(buildInitialForm(props.initialData))
const slugManuallyEdited = ref(isEdit.value) // existing posts already have a deliberate slug — never auto-overwrite it
const previewOpen = ref(false)
const submitting = ref(false)
const submitError = ref('')

watch(
  () => form.title,
  (title) => {
    if (!slugManuallyEdited.value) form.slug = slugify(title)
  }
)

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  try {
    const payload = {
      ...(isEdit.value ? { id: props.initialData.id } : {}),
      title: form.title,
      h1Title: form.h1Title.trim() || form.title,
      seoTitle: form.seoTitle,
      metaDescription: form.metaDescription,
      slug: form.slug,
      content: form.content,
      // Empty string, not null: the backend's update() treats a null field as "leave unchanged", so
      // sending null here would make clearing an optional field in the UI silently not take effect.
      primaryKeyword: form.primaryKeyword,
      secondaryKeywords: form.secondaryKeywords,
      featuredImageUrl: form.featuredImageUrl,
      canonicalUrl: form.canonicalUrl,
      indexStatus: form.indexStatus,
      category: form.category,
      collectionCategory: form.collectionCategory,
      tags: form.tags,
      status: form.status,
      publishedAt: new Date(form.publishedAt || Date.now()).toISOString(),
      readingTime: form.readingTime === null || form.readingTime === '' ? null : Number(form.readingTime),
      schemaType: form.schemaType
    }

    const result = isEdit.value
      ? await $fetch(`${apiBase}/blog/${props.initialData.id}`, { method: 'PUT', body: payload, headers: authHeaders() })
      : await $fetch(`${apiBase}/blog`, { method: 'POST', body: payload, headers: authHeaders() })

    emit('saved', result)
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    submitError.value = status === 401
      ? 'Admin key rejected — try logging out and back in.'
      : (err?.data?.message || 'Failed to save this post. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.blog-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 720px;
}

.form-error {
  margin: 0;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.85rem;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.field-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.field-row .field {
  min-width: 180px;
}

.field-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.field-hint {
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--text-muted, #3f4f5f);
}

.field-hint--over {
  color: #dc2626;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
}

.content-textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.83rem;
  resize: vertical;
}

.content-preview {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  max-height: 420px;
  overflow-y: auto;
  font-size: 0.9rem;
  line-height: 1.6;
}

.ghost-btn {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  cursor: pointer;
  color: var(--text-muted, #3f4f5f);
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-link {
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
  text-decoration: none;
}

.cancel-link:hover {
  text-decoration: underline;
}

.submit-btn {
  padding: 0.7rem 1.5rem;
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
