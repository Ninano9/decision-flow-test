<script setup lang="ts">
import { useMeetingStore } from '@/stores/meetingStore'

const store = useMeetingStore()
</script>

<template>
  <Transition name="toast">
    <div
      v-if="store.toastVisible"
      class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 text-sm text-white shadow-xl"
      role="status"
    >
      {{ store.toastMessage }}
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
