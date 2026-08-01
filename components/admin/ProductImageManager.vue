<template>
  <div class="image-manager">
    <p v-if="loadError" class="load-error">{{ loadError }}</p>

    <div class="upload-row">
      <input ref="fileInputRef" type="file" accept="image/*" multiple class="file-input" @change="handleFileSelect" />
      <button type="button" class="upload-btn" :disabled="!pendingFiles.length || uploading" @click="handleUpload">
        {{ uploading ? 'Uploading…' : pendingFiles.length > 1 ? `Upload ${pendingFiles.length} images` : 'Upload' }}
      </button>
    </div>
    <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>

    <div v-if="pendingPreviews.length" class="thumb-grid">
      <div v-for="p in pendingPreviews" :key="p.url" class="thumb thumb--pending">
        <img :src="p.url" alt="Pending upload" />
      </div>
    </div>

    <p v-if="loading" class="loading-text">Loading images…</p>
    <div v-else class="thumb-grid">
      <div v-for="img in images" :key="img.id" class="thumb">
        <img :src="img.imageUrl" :alt="img.fileName" />
        <span v-if="img.catalogImage" class="feature-badge">★ Feature</span>
        <button v-else type="button" class="set-feature-btn" :disabled="settingCatalogId === img.id" @click="handleSetCatalog(img.id)">
          {{ settingCatalogId === img.id ? 'Setting…' : 'Set as feature' }}
        </button>
      </div>
      <p v-if="!images.length" class="empty-hint">No images uploaded yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  productId: { type: [Number, String], required: true }
})

const { authHeaders } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const images = ref([])
const loading = ref(false)
const loadError = ref('')

const fileInputRef = ref(null)
const pendingFiles = ref([])
const pendingPreviews = ref([])
const uploading = ref(false)
const uploadError = ref('')
const settingCatalogId = ref(null)

async function loadImages() {
  loading.value = true
  loadError.value = ''
  try {
    images.value = await $fetch(`${apiBase}/products/${props.productId}/images`, { headers: authHeaders() })
  } catch {
    loadError.value = 'Failed to load images for this product.'
  } finally {
    loading.value = false
  }
}

function clearPending() {
  pendingPreviews.value.forEach((p) => URL.revokeObjectURL(p.url))
  pendingPreviews.value = []
  pendingFiles.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleFileSelect(event) {
  uploadError.value = ''
  // Don't call clearPending() here — it resets the input's .value, which (same DOM element as
  // event.target) would also wipe event.target.files before we get to read it below.
  pendingPreviews.value.forEach((p) => URL.revokeObjectURL(p.url))
  pendingFiles.value = Array.from(event.target.files || [])
  pendingPreviews.value = pendingFiles.value.map((f) => ({ url: URL.createObjectURL(f) }))
}

async function handleUpload() {
  if (!pendingFiles.value.length) return
  uploading.value = true
  uploadError.value = ''
  try {
    for (const file of pendingFiles.value) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('ceremicId', String(props.productId))
      await $fetch(`${apiBase}/upload`, { method: 'POST', body: formData, headers: authHeaders() })
    }
    clearPending()
    await loadImages()
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    uploadError.value = status === 401 ? 'Admin key rejected — try logging out and back in.' : 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

async function handleSetCatalog(imageId) {
  settingCatalogId.value = imageId
  try {
    await $fetch(`${apiBase}/products/${props.productId}/images/${imageId}/catalog`, { method: 'PUT', headers: authHeaders() })
    await loadImages()
  } catch {
    uploadError.value = 'Failed to set feature image. Please try again.'
  } finally {
    settingCatalogId.value = null
  }
}

onMounted(loadImages)
</script>

<style scoped>
.image-manager {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.upload-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.file-input {
  flex: 1;
  font-size: 0.85rem;
}

.upload-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: var(--primary-color, #8B4513);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-error,
.load-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.82rem;
}

.loading-text,
.empty-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
}

.thumb-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.thumb {
  position: relative;
  width: 120px;
}

.thumb img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: block;
}

.thumb--pending img {
  opacity: 0.6;
}

.feature-badge {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--primary-color, #8B4513);
  text-align: center;
}

.set-feature-btn {
  display: block;
  width: 100%;
  margin-top: 0.35rem;
  padding: 0.3rem 0.4rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 6px;
  font-size: 0.72rem;
  cursor: pointer;
  color: var(--text-muted, #3f4f5f);
}

.set-feature-btn:hover:not(:disabled) {
  background: #f3f0ec;
}

.set-feature-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
