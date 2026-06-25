<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMeetingStore } from '@/stores/meetingStore'

const store = useMeetingStore()
const input = ref('')

const canAnalyze = computed(
  () => store.hasKeywords || input.value.trim().length > 0,
)

function onEnter() {
  if (!input.value.trim()) return
  store.addKeywordsFromText(input.value)
  input.value = ''
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text')
  if (text?.includes('\n') || text?.includes(',')) {
    event.preventDefault()
    store.addKeywordsFromText(text)
  }
}

function onAnalyze() {
  if (input.value.trim()) {
    store.addKeywordsFromText(input.value)
    input.value = ''
  }
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
        Enter 또는 「의사결정 분석」으로 입력 · 콤마/여러 줄 붙여넣기 지원
      </p>
    </header>

    <p
      v-if="store.termMappings.length"
      class="mb-2 text-xs text-slate-500"
    >
      OpenStack 용어:
      <span
        v-for="m in store.termMappings"
        :key="m.original"
        class="mr-2 text-brand-100/90"
      >
        {{ m.original }} → {{ m.standard }}
      </span>
    </p>

    <div
      class="mb-3 flex min-h-[120px] flex-wrap gap-2 rounded-xl border border-slate-600 bg-slate-950/60 p-3"
    >
      <span
        v-for="kw in store.keywords"
        :key="kw.id"
        class="inline-flex items-center gap-1 rounded-full bg-brand-600/20 px-3 py-1 text-sm text-brand-100 ring-1 ring-brand-500/40"
      >
        {{ kw.text }}
        <button
          type="button"
          class="ml-1 text-slate-400 hover:text-white"
          aria-label="키워드 삭제"
          @click="store.removeKeyword(kw.id)"
        >
          ×
        </button>
      </span>
      <span v-if="!store.keywords.length" class="text-sm text-slate-500">
        키워드를 입력하세요 (Enter 없이 분석 버튼만 눌러도 됩니다)
      </span>
    </div>

    <textarea
      v-model="input"
      rows="3"
      placeholder="예: vm생성 느림, cpu 메모리"
      class="w-full resize-none rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      @keydown.enter.exact.prevent="onEnter"
      @paste="onPaste"
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
