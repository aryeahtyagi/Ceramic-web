<template>
  <div class="page">
    <header class="page-header">
      <NuxtLink to="/admin/products" class="back-link">&larr; Products</NuxtLink>
      <h1 class="page-title">New product</h1>
      <p class="page-hint">Images, SEO, and reviews can be added once the product is created.</p>
    </header>

    <AdminProductForm @saved="handleSaved" />
  </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: 'admin' })
useHead({ title: 'New product', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const router = useRouter()

function handleSaved(product) {
  router.push(`/admin/products/${product.id}`)
}
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

.page-title {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.page-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted, #3f4f5f);
}
</style>
