<template>
  <div class="page">
    <header class="page-header">
      <div>
        <NuxtLink to="/admin/blog" class="back-link">&larr; Blog posts</NuxtLink>
        <h1 class="page-title">Upload image</h1>
        <p class="page-subtitle">
          Upload an image to get a hosted URL — paste it into a blog post's featured image or content.
        </p>
      </div>
    </header>

    <div class="card">
      <AdminImageUploadField v-model="uploadedUrl" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({ ssr: false, layout: 'admin' })
useHead({ title: 'Upload image', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const uploadedUrl = ref('')
</script>

<style scoped>
.page {
  max-width: 700px;
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

.page-title {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.page-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted, #3f4f5f);
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
</style>
