<template>
  <div class="support-fab-root">
    <Transition name="support-fab-actions">
      <div
        v-show="open"
        id="support-fab-menu"
        class="support-fab-actions"
        role="group"
        aria-label="Contact options"
      >
        <a
          class="support-fab-chip support-fab-chip--call"
          href="tel:+919548955457"
          @click="open = false"
        >
          <svg class="support-fab-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>Call</span>
        </a>
        <a
          class="support-fab-chip support-fab-chip--email"
          href="mailto:svrve.ceramic@gmail.com"
          @click="open = false"
        >
          <svg class="support-fab-chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <path d="m22 6-10 7L2 6"/>
          </svg>
          <span>Email</span>
        </a>
      </div>
    </Transition>

    <button
      type="button"
      class="support-fab-main"
      :aria-expanded="open"
      aria-controls="support-fab-menu"
      aria-label="Support — contact us"
      @click="open = !open"
    >
      <svg v-if="!open" class="support-fab-main-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 14v3a2 2 0 0 0 2 2h1v-4H4z"/>
        <path d="M20 14v3a2 2 0 0 1-2 2h-1v-4h3z"/>
        <path d="M4 14v-3a8 8 0 0 1 16 0v3"/>
      </svg>
      <svg v-else class="support-fab-main-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const open = ref(false)

const onKeydown = (e) => {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<style scoped>
.support-fab-root {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(20px, calc(16px + env(safe-area-inset-bottom)));
  z-index: 240;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.support-fab-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.support-fab-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  color: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.support-fab-chip:active {
  transform: scale(0.98);
}

.support-fab-chip--call {
  background: linear-gradient(135deg, #1f7a5c, #2aa87d);
}

.support-fab-chip--email {
  background: linear-gradient(135deg, #2c3e50, #3d5266);
}

.support-fab-chip-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.support-fab-main {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.support-fab-main:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  transform: scale(1.04);
}

.support-fab-main:focus-visible {
  outline: 3px solid rgba(42, 168, 125, 0.6);
  outline-offset: 2px;
}

.support-fab-main-icon {
  width: 26px;
  height: 26px;
}

.support-fab-actions-enter-active,
.support-fab-actions-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.support-fab-actions-enter-from,
.support-fab-actions-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
