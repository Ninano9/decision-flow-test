<script setup lang="ts">
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
    <div class="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-500">
      <span class="rounded bg-slate-800 px-2 py-0.5">긴급도×영향도</span>
      <span class="rounded bg-slate-800 px-2 py-0.5">비용×효과</span>
      <span class="rounded bg-slate-800 px-2 py-0.5">장단점 비교</span>
      <span class="rounded bg-slate-800 px-2 py-0.5">우선순위</span>
      <span class="rounded bg-slate-800 px-2 py-0.5">리스크</span>
      <span class="rounded bg-slate-800 px-2 py-0.5">영향도 트리</span>
    </div>
  </article>
</template>
