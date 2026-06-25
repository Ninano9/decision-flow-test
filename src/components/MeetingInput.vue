<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMeetingStore } from '@/stores/meetingStore'

const store = useMeetingStore()
const input = ref('')

const canAnalyze = computed(() => input.value.trim().length > 0)

function onAnalyze() {
  if (!input.value.trim()) return
  store.clearKeywords()
  store.addKeywordsFromText(input.value)
  store.analyze()
}

function onClear() {
  input.value = ''
  store.clearKeywords()
}
</script>

<template>
  <section class="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-lg">
    <header class="mb-4">
      <h2 class="text-lg font-semibold text-white">회의 키워드 입력</h2>
      <p class="mt-1 text-sm text-slate-400">
        콤마 또는 줄바꿈으로 여러 키워드 입력 · 「의사결정 분석」 클릭
      </p>
    </header>

    <textarea
      v-model="input"
      rows="4"
      placeholder="키워드를 입력하세요(예: 출시 일정, 예산, 점심 메뉴)"
      class="w-full resize-none rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
    />

    <div class="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        :disabled="!canAnalyze || store.running"
        @click="onAnalyze"
      >
        {{ store.running ? '분석 중…' : '의사결정 분석' }}
      </button>
      <button
        type="button"
        class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        @click="onClear"
      >
        초기화
      </button>
    </div>

    <p
      v-if="store.running && store.currentStepLabel"
      class="mt-2 text-xs text-brand-200/90"
    >
      Agent 진행: {{ store.currentStepLabel }}
    </p>

    <p v-if="store.error" class="mt-3 text-sm text-red-400">{{ store.error }}</p>
    <p v-if="store.useOfflineMode" class="mt-2 text-xs text-amber-400/90">
      API 키 없음: 규칙 기반 오프라인 분석 모드
    </p>
  </section>
</template>
