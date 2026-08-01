<template>
  <div class="image-upload">
    <div class="image-upload-row">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="file-input"
        :multiple="multiple"
        @change="handleFileSelect"
      />
      <button
        type="button"
        class="upload-btn"
        :disabled="!pendingFiles.length || uploading"
        @click="handleUpload"
      >
        {{ uploading ? 'Uploading…' : multiple && pendingFiles.length > 1 ? `Upload ${pendingFiles.length} images` : 'Upload' }}
      </button>
    </div>

    <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>

    <!-- Pending (not-yet-uploaded) previews -->
    <div v-if="pendingPreviews.length" class="thumb-grid">
      <div v-for="p in pendingPreviews" :key="p.url" class="thumb">
        <img :src="p.url" alt="Pending upload" />
      </div>
    </div>

    <!-- Single-mode: uploaded URL preview + copy/clear -->
    <template v-if="!multiple">
      <div v-if="singleValue" class="preview-wrap">
        <img
          :src="singleValue"
          alt="Preview"
          class="preview-img"
          :class="{ 'preview-img--broken': previewBroken }"
          @error="previewBroken = true"
          @load="previewBroken = false"
        />
        <p v-if="previewBroken" class="preview-hint">
          Couldn't load a preview for this URL, but it may still be valid — try opening it directly.
        </p>
      </div>
      <div v-if="singleValue" class="url-row">
        <input type="text" class="url-input" :value="singleValue" readonly @focus="$event.target.select()" />
        <button type="button" class="copy-btn" @click="copyUrl(singleValue)">{{ copied ? 'Copied!' : 'Copy URL' }}</button>
        <button type="button" class="clear-btn" @click="clearSingle">Clear</button>
      </div>
    </template>

    <!-- Multi-mode: gallery of already-uploaded URLs -->
    <div v-else-if="multiValue.length" class="thumb-grid">
      <div v-for="url in multiValue" :key="url" class="thumb">
        <img :src="url" alt="Uploaded" />
        <button type="button" class="thumb-remove" title="Remove" @click="removeUrl(url)">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Array], default: null },
  multiple: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const { authHeaders } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const fileInputRef = ref(null)
const pendingFiles = ref([])
const pendingPreviews = ref([]) // [{ url }] local object URLs, mirrors pendingFiles
const uploading = ref(false)
const uploadError = ref('')
const previewBroken = ref(false)
const copied = ref(false)

const singleValue = computed(() => (typeof props.modelValue === 'string' ? props.modelValue : ''))
const multiValue = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []))

function clearPending() {
  pendingPreviews.value.forEach((p) => URL.revokeObjectURL(p.url))
  pendingPreviews.value = []
  pendingFiles.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function handleFileSelect(event) {
  uploadError.value = ''
  previewBroken.value = false
  // Don't call clearPending() here — it resets the input's .value, which (same DOM element as
  // event.target) would also wipe event.target.files before we get to read it below.
  pendingPreviews.value.forEach((p) => URL.revokeObjectURL(p.url))
  const files = Array.from(event.target.files || [])
  pendingFiles.value = props.multiple ? files : files.slice(0, 1)
  pendingPreviews.value = pendingFiles.value.map((f) => ({ url: URL.createObjectURL(f) }))
}

async function uploadOne(file) {
  const formData = new FormData()
  formData.append('file', file)
  const result = await $fetch(`${apiBase}/upload-native`, {
    method: 'POST',
    body: formData,
    headers: authHeaders()
  })
  const url = result?.url || (typeof result === 'string' ? result : '')
  if (!url) throw new Error('Upload succeeded but no URL was returned')
  return url
}

async function handleUpload() {
  if (!pendingFiles.value.length) return
  uploading.value = true
  uploadError.value = ''
  try {
    if (props.multiple) {
      const urls = await Promise.all(pendingFiles.value.map(uploadOne))
      emit('update:modelValue', [...multiValue.value, ...urls])
    } else {
      const url = await uploadOne(pendingFiles.value[0])
      emit('update:modelValue', url)
    }
    clearPending()
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    uploadError.value = status === 401 ? 'Admin key rejected — try logging out and back in.' : 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
  }
}

async function copyUrl(url) {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    /* clipboard access denied — user can still select+copy the readonly input manually */
  }
}

function clearSingle() {
  emit('update:modelValue', '')
}

function removeUrl(url) {
  emit('update:modelValue', multiValue.value.filter((u) => u !== url))
}

onUnmounted(clearPending)
</script>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.image-upload-row {
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

.upload-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.8rem;
}

.preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.preview-img {
  max-width: 220px;
  max-height: 160px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
}

.preview-img--broken {
  display: none;
}

.preview-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted, #3f4f5f);
  max-width: 360px;
}

.url-row {
  display: flex;
  gap: 0.5rem;
}

.url-input {
  flex: 1;
  padding: 0.5rem 0.6rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--text-muted, #3f4f5f);
  background: #fafafa;
}

.copy-btn,
.clear-btn {
  padding: 0.5rem 0.8rem;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
}

.thumb-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.thumb {
  position: relative;
  width: 84px;
  height: 84px;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.thumb-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background: #dc2626;
  color: #fff;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
