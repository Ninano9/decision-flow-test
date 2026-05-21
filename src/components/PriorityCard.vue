<script setup lang="ts">
import type { PriorityItem } from '@/types/meeting'

defineProps<{
  priorities: PriorityItem[]
}>()

const levelStyle: Record<PriorityItem['level'], string> = {
  high: 'bg-red-500/20 text-red-300 ring-red-500/40',
  medium: 'bg-amber-500/20 text-amber-200 ring-amber-500/40',
  low: 'bg-slate-500/20 text-slate-300 ring-slate-500/40',
}

const levelLabel: Record<PriorityItem['level'], string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
}
</script>

<template>
  <article class="rounded-2xl border border-rose-800/50 bg-rose-950/20 p-5">
    <h3 class="mb-3 text-base font-semibold text-rose-300">우선순위 제안</h3>
    <ul class="space-y-3">
      <li
        v-for="(item, i) in priorities"
        :key="i"
        class="rounded-lg border border-slate-700/80 bg-slate-950/40 p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium text-white">{{ item.label }}</span>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1"
            :class="levelStyle[item.level]"
          >
            {{ levelLabel[item.level] }}
          </span>
        </div>
        <p class="mt-1 text-xs text-slate-400">{{ item.reason }}</p>
      </li>
    </ul>
  </article>
</template>
