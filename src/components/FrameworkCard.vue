<script setup lang="ts">
import DecisionMatrix from '@/components/DecisionMatrix.vue'

defineProps<{
  framework: string
  reason: string
}>()
</script>

<template>
  <article class="rounded-2xl border border-violet-800/50 bg-violet-950/25 p-5">
    <h3 class="mb-2 text-base font-semibold text-violet-300">추천 의사결정 방식</h3>
    <p class="text-xl font-bold text-white">{{ framework }}</p>
    <p class="mt-2 text-sm text-slate-400">{{ reason }}</p>
    <DecisionMatrix :framework="framework" />
  </article>
</template>
