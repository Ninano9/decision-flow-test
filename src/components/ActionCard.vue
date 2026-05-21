<script setup lang="ts">
defineProps<{
  actions: string[]
}>()
</script>

<template>
  <article class="rounded-2xl border border-sky-800/50 bg-sky-950/25 p-5">
    <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-sky-300">
      <span class="text-lg">→</span> 액션 아이템
    </h3>
    <ul class="space-y-2">
      <li
        v-for="(action, i) in actions"
        :key="i"
        class="flex items-start gap-2 text-sm text-slate-200"
      >
        <span class="mt-0.5 text-sky-400">□</span>
        {{ action }}
      </li>
    </ul>
  </article>
</template>
