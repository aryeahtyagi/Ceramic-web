<template>
  <div class="page">
    <header class="page-header">
      <NuxtLink to="/admin/blog" class="back-link">&larr; Blog posts</NuxtLink>
      <h1 class="page-title">New post</h1>
    </header>

    <AdminBlogPostForm @saved="handleSaved" />
  </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: 'admin' })
useHead({ title: 'New post', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const router = useRouter()

function handleSaved(post) {
  router.push(`/admin/blog/${post.id}`)
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
  margin: 0.5rem 0 0;
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
