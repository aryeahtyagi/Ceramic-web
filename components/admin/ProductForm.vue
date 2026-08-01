<template>
  <form class="product-form" @submit.prevent="handleSubmit">
    <p v-if="submitError" class="form-error">{{ submitError }}</p>

    <section class="form-section">
      <h2 class="section-title">Basics</h2>
      <label class="field">
        <span class="field-label">Name *</span>
        <input v-model="form.name" type="text" required />
      </label>
      <label class="field">
        <span class="field-label">Price (₹) *</span>
        <input v-model.number="form.price" type="number" min="0" step="1" required />
      </label>
      <label class="field">
        <span class="field-label">Description *</span>
        <textarea v-model="form.description" rows="4" required></textarea>
      </label>
      <label class="field">
        <span class="field-label">About</span>
        <textarea v-model="form.about" rows="3"></textarea>
      </label>
    </section>

    <section class="form-section" v-if="referenceLoaded">
      <h2 class="section-title">Benefits</h2>
      <div class="chip-group">
        <button
          v-for="b in benefits"
          :key="b.id"
          type="button"
          class="chip"
          :class="{ 'chip--active': form.benefitIds.includes(b.id) }"
          @click="toggle(form.benefitIds, b.id)"
        >
          {{ b.value }}
        </button>
        <p v-if="!benefits.length" class="empty-hint">No benefits defined yet.</p>
      </div>
    </section>

    <section class="form-section" v-if="referenceLoaded">
      <h2 class="section-title">Love points</h2>
      <div class="chip-group">
        <button
          v-for="lp in lovePoints"
          :key="lp.id"
          type="button"
          class="chip"
          :class="{ 'chip--active': form.productLovePointIds.includes(lp.id) }"
          @click="toggle(form.productLovePointIds, lp.id)"
        >
          {{ lp.value }}
        </button>
        <p v-if="!lovePoints.length" class="empty-hint">No love points defined yet.</p>
      </div>
    </section>

    <section class="form-section" v-if="referenceLoaded">
      <h2 class="section-title">Product details</h2>
      <div class="chip-group">
        <button
          v-for="d in productDetails"
          :key="d.id"
          type="button"
          class="chip"
          :class="{ 'chip--active': form.productDetailIds.includes(d.id) }"
          @click="toggle(form.productDetailIds, d.id)"
        >
          {{ d.dimension?.name }}: {{ d.value }} {{ d.dimension?.unit }}
        </button>
        <p v-if="!productDetails.length" class="empty-hint">No product details defined yet.</p>
      </div>
    </section>

    <section class="form-section" v-if="referenceLoaded">
      <h2 class="section-title">Discount</h2>
      <div class="chip-group">
        <button
          v-for="d in enabledDiscounts"
          :key="d.id"
          type="button"
          class="chip"
          :class="{ 'chip--active': form.discountIds.includes(d.id) }"
          @click="toggle(form.discountIds, d.id)"
        >
          {{ d.discount }}% off
        </button>
        <p v-if="!enabledDiscounts.length" class="empty-hint">No active discounts.</p>
      </div>
    </section>

    <div class="form-actions">
      <NuxtLink to="/admin/products" class="cancel-link">Cancel</NuxtLink>
      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product' }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'

const props = defineProps({
  initialData: { type: Object, default: null }
})
const emit = defineEmits(['saved'])

const { authHeaders } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

const isEdit = computed(() => Boolean(props.initialData?.id))

function idsFrom(list) {
  return Array.isArray(list) ? list.map((x) => x.id) : []
}

const form = reactive({
  name: props.initialData?.name || '',
  price: props.initialData?.price ?? 0,
  description: props.initialData?.description || '',
  about: props.initialData?.about || '',
  benefitIds: idsFrom(props.initialData?.benefits),
  productLovePointIds: idsFrom(props.initialData?.productLovePoints),
  productDetailIds: idsFrom(props.initialData?.productDetails),
  // Ceremic/CeremicLight serialize `discounts` as a single object (or null), not an array — see getDiscounts().
  discountIds: props.initialData?.discounts?.id != null ? [props.initialData.discounts.id] : []
})

const benefits = ref([])
const lovePoints = ref([])
const productDetails = ref([])
const discounts = ref([])
const referenceLoaded = ref(false)
const submitting = ref(false)
const submitError = ref('')

const enabledDiscounts = computed(() => discounts.value.filter((d) => d.enable))

function toggle(arr, id) {
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

onMounted(async () => {
  try {
    const [b, lp, pd, d] = await Promise.all([
      $fetch(`${apiBase}/benefits`),
      $fetch(`${apiBase}/lovePoints`),
      $fetch(`${apiBase}/productDetails`),
      $fetch(`${apiBase}/discounts`)
    ])
    benefits.value = Array.isArray(b) ? b : []
    lovePoints.value = Array.isArray(lp) ? lp : []
    productDetails.value = Array.isArray(pd) ? pd : []
    discounts.value = Array.isArray(d) ? d : []
  } catch {
    // reference data is optional — form still works for core fields without it
  } finally {
    referenceLoaded.value = true
  }
})

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''
  try {
    const payload = {
      name: form.name,
      description: form.description,
      about: form.about,
      price: Number(form.price),
      benefitIds: form.benefitIds,
      productLovePointIds: form.productLovePointIds,
      productDetailIds: form.productDetailIds,
      discountIds: form.discountIds
    }

    const result = isEdit.value
      ? await $fetch(`${apiBase}/products/${props.initialData.id}`, { method: 'PUT', body: payload, headers: authHeaders() })
      : await $fetch(`${apiBase}/create`, { method: 'POST', body: payload, headers: authHeaders() })

    emit('saved', result)
  } catch (err) {
    const status = err?.response?.status || err?.statusCode
    submitError.value = status === 401
      ? 'Admin key rejected — try logging out and back in.'
      : (err?.data?.message || 'Failed to save this product. Please try again.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.product-form {
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

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-dark, #2c3e50);
}

.field input,
.field textarea {
  padding: 0.6rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 0.82rem;
  cursor: pointer;
  color: var(--text-dark, #2c3e50);
}

.chip--active {
  background: var(--primary-color, #8B4513);
  border-color: var(--primary-color, #8B4513);
  color: #fff;
}

.empty-hint {
  margin: 0;
  font-size: 0.82rem;
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
