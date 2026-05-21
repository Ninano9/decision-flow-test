<script setup lang="ts">
defineProps<{
  topics: string[]
}>()
</script>

<template>
  <article class="rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-5">
    <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-emerald-300">
      <span class="text-lg">◎</span> 핵심 논의
    </h3>
    <ol class="space-y-2">
      <li
        v-for="(topic, i) in topics"
        :key="i"
        class="flex gap-2 text-sm text-slate-200"
      >
        <span class="font-medium text-emerald-400/80">{{ i + 1 }}.</span>
        {{ topic }}
      </li>
    </ol>
  </article>
</template>
