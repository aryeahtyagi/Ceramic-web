<template>
  <div class="reviews-manager">
    <p v-if="loadError" class="load-error">{{ loadError }}</p>
    <p v-else-if="loading" class="loading-text">Loading reviews…</p>

    <div v-else class="review-list">
      <div v-for="r in reviews" :key="r.id" class="review-row">
        <div class="review-row-top">
          <div>
            <span class="review-author">{{ reviewerDisplayName(r.user) }}</span>
            <span class="review-stars">
              <span v-for="i in 5" :key="i" class="star" :class="{ 'star--filled': i <= r.rating }">★</span>
            </span>
          </div>
          <div class="review-row-actions">
            <button type="button" class="link-btn" @click="startEdit(r)">Edit</button>
            <button type="button" class="link-btn link-btn--danger" @click="handleDelete(r.id)">Delete</button>
          </div>
        </div>
        <p v-if="r.description" class="review-text">{{ r.description }}</p>
        <div v-if="(r.images || []).length" class="review-images">
          <img v-for="url in r.images" :key="url" :src="url" alt="Review photo" />
        </div>
      </div>
      <p v-if="!reviews.length" class="empty-hint">No reviews yet.</p>
    </div>

    <div class="add-review">
      <button v-if="!formOpen" type="button" class="add-btn" @click="openCreate">+ Add review</button>

      <form v-else class="review-form" @submit.prevent="handleSubmit">
        <p v-if="submitError" class="form-error">{{ submitError }}</p>

        <label class="field">
          <span class="field-label">Rating</span>
          <span class="rating-picker">
            <button
              v-for="i in 5"
              :key="i"
              type="button"
              class="star star--pick"
              :class="{ 'star--filled': i <= form.rating }"
              @click="form.rating = i"
            >★</button>
          </span>
        </label>

        <label class="field">
          <span class="field-label">Review text</span>
          <textarea v-model="form.description" rows="3"></textarea>
        </label>

        <label class="field">
          <span class="field-label">Attribute to a customer <span class="field-hint">(optional — shows "Verified buyer" if left blank)</span></span>
          <input v-model="userSearch" type="text" class="user-search" placeholder="Search by name or phone…" />
          <select v-model="form.userId">
            <option :value="null">— None —</option>
            <option v-for="u in filteredUsers" :key="u.id" :value="u.id">{{ u.username || u.phoneNumber }}</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Photos</span>
          <AdminImageUploadField v-model="form.images" multiple />
        </label>

        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="closeForm">Cancel</button>
          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add review' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'

const props = defineProps({
  productId: { type: [Number, String], required: true }
})

const { authHeaders } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const reviews = ref([])
const loading = ref(false)
const loadError = ref('')
const users = ref([])

const formOpen = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const submitError = ref('')
const userSearch = ref('')

const form = reactive({ rating: 5, description: '', userId: null, images: [] })

const filteredUsers = computed(() => {
  const q = userSearch.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) =>
    String(u.username || '').toLowerCase().includes(q) || String(u.phoneNumber || '').includes(q)
  )
})

// Mirrors pages/product/[slug].vue's reviewerDisplayName exactly, so the admin preview matches the storefront.
function reviewerDisplayName(user) {
  if (!user || typeof user !== 'object') return 'Verified buyer'
  const raw = user.username || user.email || ''
  const s = String(raw).trim()
  if (!s) return 'Verified buyer'
  if (s.includes('@')) {
    const local = s.split('@')[0]
    return local || 'Verified buyer'
  }
  return s.length > 36 ? `${s.slice(0, 33)}…` : s
}

async function loadReviews() {
  loading.value = true
  loadError.value = ''
  try {
    reviews.value = await $fetch(`${apiBase}/products/${props.productId}/reviews`, { headers: authHeaders() })
  } catch {
    loadError.value = 'Failed to load reviews.'
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  try {
    users.value = await $fetch(`${apiBase}/users`, { headers: authHeaders() })
  } catch {
    users.value = []
  }
}

function openCreate() {
  editingId.value = null
  form.rating = 5
  form.description = ''
  form.userId = null
  form.images = []
  submitError.value = ''
  formOpen.value = true
}

function startEdit(review) {
  editingId.value = review.id
  form.rating = review.rating || 0
  form.description = review.description || ''
  form.userId = review.user?.id ?? null
  form.images = Array.isArray(review.images) ? [...review.images] : []
  submitError.value = ''
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
}

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  try {
    const payload = {
      rating: form.rating,
      description: form.description,
      userId: form.userId,
      images: form.images
    }
    if (editingId.value) {
      await $fetch(`${apiBase}/reviews/${editingId.value}`, { method: 'PUT', body: payload, headers: authHeaders() })
    } else {
      await $fetch(`${apiBase}/products/${props.productId}/reviews`, { method: 'POST', body: payload, headers: authHeaders() })
    }
    formOpen.value = false
    await loadReviews()
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    submitError.value = status === 401 ? 'Admin key rejected — try logging out and back in.' : 'Failed to save this review. Please try again.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(reviewId) {
  if (!confirm('Delete this review? This cannot be undone.')) return
  try {
    await $fetch(`${apiBase}/products/${props.productId}/reviews/${reviewId}`, { method: 'DELETE', headers: authHeaders() })
    await loadReviews()
  } catch {
    loadError.value = 'Failed to delete review.'
  }
}

onMounted(() => {
  loadReviews()
  loadUsers()
})
</script>

<style scoped>
.reviews-manager {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.load-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.85rem;
}

.loading-text,
.empty-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-row {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 0.9rem 1rem;
}

.review-row-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.review-author {
  font-weight: 600;
  font-size: 0.88rem;
  margin-right: 0.6rem;
}

.star {
  color: #e5e7eb;
  font-size: 0.85rem;
}

.star--filled {
  color: #f5a524;
}

.star--pick {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  padding: 0 0.1rem;
}

.review-row-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.78rem;
  color: var(--text-muted, #3f4f5f);
  cursor: pointer;
  text-decoration: underline;
}

.link-btn--danger {
  color: #dc2626;
}

.review-text {
  margin: 0.5rem 0 0;
  font-size: 0.88rem;
  line-height: 1.5;
}

.review-images {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.6rem;
  flex-wrap: wrap;
}

.review-images img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.add-review {
  border-top: 1px solid #f0f0f0;
  padding-top: 1rem;
}

.add-btn {
  padding: 0.55rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-dark, #2c3e50);
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
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

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.field-hint {
  font-weight: 400;
  color: var(--text-muted, #3f4f5f);
}

.rating-picker {
  display: flex;
  gap: 0.2rem;
}

.field textarea,
.field select,
.user-search {
  padding: 0.55rem 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.cancel-btn {
  padding: 0.55rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--text-muted, #3f4f5f);
}

.submit-btn {
  padding: 0.55rem 1.2rem;
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
