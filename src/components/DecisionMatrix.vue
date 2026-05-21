<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  framework: string
}>()

const isUrgencyImpact = computed(() => props.framework.includes('긴급도'))
const isCostBenefit = computed(() => props.framework.includes('비용'))
const isProsCons = computed(() => props.framework.includes('장단점'))
</script>

<template>
  <div class="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
    <p class="mb-2 text-xs font-medium text-slate-400">의사결정 매트릭스</p>

    <div v-if="isUrgencyImpact" class="grid grid-cols-2 gap-1 text-center text-xs">
      <div class="rounded bg-slate-800 p-2 text-slate-500" />
      <div class="rounded bg-slate-800 p-1.5 text-slate-400">영향 ↑</div>
      <div class="rounded bg-slate-800 p-1.5 text-slate-400">긴급 ↑</div>
      <div class="rounded bg-red-900/40 p-2 font-medium text-red-200 ring-1 ring-red-500/30">
        즉시 결정
      </div>
      <div class="rounded bg-amber-900/30 p-2 text-amber-200">우선 검토</div>
      <div class="rounded bg-slate-800/80 p-2 text-slate-400">모니터링</div>
      <div class="rounded bg-slate-800/60 p-2 text-slate-500">보류</div>
    </div>

    <div v-else-if="isCostBenefit" class="grid grid-cols-2 gap-2 text-xs">
      <div class="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-2 text-emerald-200">
        효과 높음 · 비용 낮음 → 우선
      </div>
      <div class="rounded-lg border border-amber-800/50 bg-amber-950/30 p-2 text-amber-200">
        효과 높음 · 비용 높음 → 검토
      </div>
      <div class="rounded-lg border border-slate-700 p-2 text-slate-400">
        효과 낮음 · 비용 낮음 → 여유 시
      </div>
      <div class="rounded-lg border border-slate-700 p-2 text-slate-500">
        효과 낮음 · 비용 높음 → 보류
      </div>
    </div>

    <div v-else-if="isProsCons" class="grid grid-cols-2 gap-2 text-xs">
      <div class="rounded-lg border border-violet-700/50 bg-violet-950/20 p-2">
        <p class="font-medium text-violet-200">장점</p>
        <p class="mt-1 text-slate-400">입력 키워드 기준 이점 정리</p>
      </div>
      <div class="rounded-lg border border-violet-700/50 bg-violet-950/20 p-2">
        <p class="font-medium text-violet-200">단점</p>
        <p class="mt-1 text-slate-400">입력 키워드 기준 리스크 정리</p>
      </div>
    </div>

    <div v-else class="text-xs text-slate-400">
      {{ framework }} 기준으로 항목을 배치해 결정하세요.
    </div>
  </div>
</template>
