<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import MeetingInput from '@/components/MeetingInput.vue'
import TopicCard from '@/components/TopicCard.vue'
import DecisionCard from '@/components/DecisionCard.vue'
import FrameworkCard from '@/components/FrameworkCard.vue'
import ActionCard from '@/components/ActionCard.vue'
import PriorityCard from '@/components/PriorityCard.vue'
import AgentPipeline from '@/components/AgentPipeline.vue'
import AppToast from '@/components/AppToast.vue'
import { useMeetingStore } from '@/stores/meetingStore'

const store = useMeetingStore()
const resultsRef = ref<HTMLElement | null>(null)

watch(
  () => store.scrollToResults,
  async (shouldScroll) => {
    if (!shouldScroll) return
    await nextTick()
    resultsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    store.acknowledgeScroll()
  },
)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header class="mb-10 text-center">
      <p class="text-sm font-medium uppercase tracking-widest text-brand-100/80">
        OpenStack 회의 의사결정 보조
      </p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        DecisionFlow
      </h1>
      <p class="mx-auto mt-3 max-w-2xl text-slate-400">
        회의 중 키워드만으로 핵심 논의·결정·우선순위·의사결정 방식·액션을 즉시 정리합니다.
      </p>
    </header>

    <div class="grid gap-8 xl:grid-cols-2">
      <div class="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <MeetingInput />
        <AgentPipeline :steps="store.pipeline" />
      </div>

      <div ref="resultsRef" class="scroll-mt-6 space-y-4">
        <template v-if="store.hasAnalysis && store.analysis">
          <div
            class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-3 backdrop-blur"
          >
            <h2 class="text-sm font-semibold text-white">분석 결과</h2>
            <button
              type="button"
              class="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
              @click="store.copySummary"
            >
              요약 복사
            </button>
          </div>

          <TopicCard :topics="store.analysis.topics" />
          <PriorityCard :priorities="store.analysis.priorities" />
          <DecisionCard :decisions="store.analysis.decisions" />
          <FrameworkCard
            :framework="store.analysis.framework"
            :reason="store.analysis.frameworkReason"
          />
          <ActionCard :actions="store.analysis.actions" />
        </template>

        <div
          v-else
          class="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500"
        >
          키워드를 입력하고 「의사결정 분석」을 실행하세요.
        </div>
      </div>
    </div>

    <AppToast />
  </div>
</template>
