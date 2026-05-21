<script setup lang="ts">
import { onMounted } from 'vue'
import MeetingInput from '@/components/MeetingInput.vue'
import TopicCard from '@/components/TopicCard.vue'
import DecisionCard from '@/components/DecisionCard.vue'
import FrameworkCard from '@/components/FrameworkCard.vue'
import ActionCard from '@/components/ActionCard.vue'
import SimilarMeetingCard from '@/components/SimilarMeetingCard.vue'
import AgentPipeline from '@/components/AgentPipeline.vue'
import { useMeetingStore } from '@/stores/meetingStore'

const store = useMeetingStore()

onMounted(() => {
  store.loadHistory()
})
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
        회의 중 키워드만으로 핵심 논의·결정 항목·의사결정 방식·액션을 즉시 정리합니다.
      </p>
    </header>

    <div class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-6">
        <MeetingInput />
        <AgentPipeline :steps="store.pipeline" />
      </div>

      <div v-if="store.hasAnalysis && store.analysis" class="space-y-4">
        <TopicCard :topics="store.analysis.topics" />
        <DecisionCard :decisions="store.analysis.decisions" />
        <FrameworkCard
          :framework="store.analysis.framework"
          :reason="store.analysis.frameworkReason"
        />
        <ActionCard :actions="store.analysis.actions" />
        <SimilarMeetingCard :meetings="store.similarMeetings" />

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
      </div>

      <div
        v-else
        class="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500"
      >
        키워드를 입력하고 「의사결정 분석」을 실행하세요.
      </div>
    </div>

    <section v-if="store.history.length" class="mt-12">
      <h2 class="mb-4 text-lg font-semibold text-white">회의 히스토리</h2>
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="item in store.history"
          :key="item.id"
          class="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
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
            @click="store.removeFromHistory(item.id)"
          >
            삭제
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
