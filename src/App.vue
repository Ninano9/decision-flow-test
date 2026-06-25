<script setup lang="ts">
import { onMounted, ref, watch, nextTick } from 'vue'
import MeetingInput from '@/components/MeetingInput.vue'
import TopicCard from '@/components/TopicCard.vue'
import DecisionCard from '@/components/DecisionCard.vue'
import FrameworkCard from '@/components/FrameworkCard.vue'
import ActionCard from '@/components/ActionCard.vue'
import PriorityCard from '@/components/PriorityCard.vue'
import SimilarMeetingCard from '@/components/SimilarMeetingCard.vue'
import AgentPipeline from '@/components/AgentPipeline.vue'
import AppToast from '@/components/AppToast.vue'
import { useMeetingStore } from '@/stores/meetingStore'

const store = useMeetingStore()
const resultsRef = ref<HTMLElement | null>(null)

onMounted(() => {
  store.loadHistory()
})

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
          <SimilarMeetingCard
            :meetings="store.similarMeetings"
            :has-history="store.history.length > 0"
          />

          <section class="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
            <h3 class="mb-3 text-sm font-semibold text-slate-300">회의 저장</h3>
            <input
              v-model="store.meetingTitle"
              type="text"
              placeholder="회의 제목"
              class="mb-2 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <input
              v-model="store.meetingDecision"
              type="text"
              placeholder="이번 회의에서 내린 결정 (선택)"
              class="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              @click="store.saveCurrentMeeting"
            >
              히스토리에 저장
            </button>
          </section>
        </template>

        <div
          v-else
          class="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500"
        >
          키워드를 입력하고 「의사결정 분석」을 실행하세요.
        </div>
      </div>
    </div>

    <section v-if="store.history.length" class="mt-12">
      <h2 class="mb-4 text-lg font-semibold text-white">회의 히스토리</h2>
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="item in store.history"
          :key="item.id"
          class="cursor-pointer rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-brand-500/50 hover:bg-slate-900"
          @click="store.loadMeeting(item)"
        >
          <p class="font-medium text-white">{{ item.title }}</p>
          <p class="text-xs text-slate-500">
            {{ new Date(item.createdAt).toLocaleDateString('ko-KR') }}
          </p>
          <p class="mt-2 line-clamp-2 text-sm text-slate-400">
            {{ item.keywords.join(' · ') }}
          </p>
          <p v-if="item.decision" class="mt-1 text-xs text-emerald-400/90">
            결정: {{ item.decision }}
          </p>
          <button
            type="button"
            class="mt-3 text-xs text-red-400/80 hover:text-red-300"
            @click.stop="store.removeFromHistory(item.id)"
          >
            삭제
          </button>
        </li>
      </ul>
    </section>

    <AppToast />
  </div>
</template>
