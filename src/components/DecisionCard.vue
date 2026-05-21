<script setup lang="ts">
defineProps<{
  decisions: string[]
}>()
</script>

<template>
  <article class="rounded-2xl border border-amber-800/50 bg-amber-950/25 p-5">
    <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-amber-300">
      <span class="text-lg">☐</span> 결정 항목
    </h3>
    <ul class="space-y-2">
      <li
        v-for="(item, i) in decisions"
        :key="i"
        class="flex items-start gap-2 text-sm text-slate-200"
      >
        <span class="mt-0.5 text-amber-400">□</span>
        {{ item }}
      </li>
    </ul>
  </article>
</template>
