<template>
  <div class="page">
    <header class="page-header">
      <NuxtLink to="/admin/blog" class="back-link">&larr; Blog posts</NuxtLink>
      <div class="title-row">
        <h1 class="page-title">Edit post</h1>
        <a v-if="post" :href="storefrontUrl" target="_blank" rel="noopener" class="view-link">View on site &#8599;</a>
      </div>
    </header>

    <p v-if="savedFlash" class="saved-flash">Saved.</p>
    <p v-if="loadError" class="load-error">{{ loadError }}</p>
    <p v-else-if="loading" class="loading-text">Loading…</p>

    <AdminBlogPostForm v-else-if="post" :initial-data="post" @saved="handleSaved" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })
useHead({ title: 'Edit post', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const { isAuthorized } = useAdminAuth()
const config = useRuntimeConfig()
const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
const siteUrl = String(config.public.siteUrl || 'https://svrve.com').replace(/\/$/, '')
const route = useRoute()

const post = ref(null)
const loading = ref(false)
const loadError = ref('')
const savedFlash = ref(false)

// Matches the slugify in pages/blog/index.vue exactly — the title segment is cosmetic/SEO only
// (the storefront looks the post up by id), but should still resolve to the real canonical URL.
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
const storefrontUrl = computed(() => post.value ? `${siteUrl}/blog/${post.value.id}/${slugify(post.value.title)}` : '')

async function loadPost() {
  loading.value = true
  loadError.value = ''
  try {
    post.value = await $fetch(`${apiBase}/blog/${route.params.id}`)
  } catch {
    loadError.value = 'Failed to load this post — it may not exist.'
  } finally {
    loading.value = false
  }
}

function handleSaved(saved) {
  post.value = saved
  savedFlash.value = true
  setTimeout(() => { savedFlash.value = false }, 2000)
}

watch(isAuthorized, (v) => {
  if (v) loadPost()
}, { immediate: true })
</script>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.back-link {
  font-size: 0.8rem;
  color: var(--text-muted, #3f4f5f);
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.view-link {
  font-size: 0.85rem;
  color: var(--primary-color, #8B4513);
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}

.saved-flash {
  margin: 0 0 1rem;
  padding: 0.6rem 1rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

.load-error {
  color: #dc2626;
  font-size: 0.9rem;
}

.loading-text {
  color: var(--text-muted, #3f4f5f);
  font-size: 0.9rem;
}
</style>
