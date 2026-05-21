<script setup lang="ts">
import type { SimilarMeeting } from '@/types/meeting'

defineProps<{
  meetings: SimilarMeeting[]
  hasHistory: boolean
}>()
</script>

<template>
  <article class="rounded-2xl border border-slate-600 bg-slate-900/60 p-5">
    <h3 class="mb-3 text-base font-semibold text-slate-200">유사 회의</h3>

    <ul v-if="meetings.length" class="space-y-3">
      <li
        v-for="m in meetings"
        :key="m.id"
        class="rounded-xl border border-slate-700 bg-slate-950/50 p-4"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-medium text-white">{{ m.title }}</p>
            <p class="text-xs text-slate-500">{{ m.date }}</p>
          </div>
          <span
            class="shrink-0 rounded-full bg-brand-600/30 px-2.5 py-0.5 text-xs font-semibold text-brand-100"
          >
            유사도 {{ m.similarity }}%
          </span>
        </div>
        <p v-if="m.decision" class="mt-2 text-sm text-slate-400">결정: {{ m.decision }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ m.topics.slice(0, 3).join(' · ') }}</p>
      </li>
    </ul>

    <p v-else-if="hasHistory" class="text-sm text-slate-500">
      유사한 과거 회의가 없습니다. 키워드를 저장하면 다음부터 비교됩니다.
    </p>
    <p v-else class="text-sm text-slate-500">
      아직 저장된 회의가 없습니다. 분석 후 「히스토리에 저장」하면 유사 회의를 찾습니다.
    </p>
  </article>
</template>
