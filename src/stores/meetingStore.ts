import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MeetingAnalysis, MeetingKeyword, MeetingRecord } from '@/types/meeting'
import { useDecisionEngine } from '@/composables/useDecisionEngine'
import { useMeetingHistory } from '@/composables/useMeetingHistory'

function createId(): string {
  return crypto.randomUUID()
}

export const useMeetingStore = defineStore('meeting', () => {
  const keywords = ref<MeetingKeyword[]>([])
  const analysis = ref<MeetingAnalysis | null>(null)
  const history = ref<MeetingRecord[]>([])
  const error = ref<string | null>(null)
  const meetingTitle = ref('')
  const meetingDecision = ref('')

  const { running, pipeline, similarMeetings, useOfflineMode, runPipeline } =
    useDecisionEngine()
  const { saveMeeting, getAllMeetings, deleteMeeting } = useMeetingHistory()

  const keywordTexts = computed(() => keywords.value.map((k) => k.text))

  const hasKeywords = computed(() => keywords.value.length > 0)
  const hasAnalysis = computed(() => analysis.value !== null)

  function addKeyword(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const exists = keywords.value.some(
      (k) => k.text.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exists) return
    keywords.value.push({ id: createId(), text: trimmed })
  }

  function addKeywordsFromText(raw: string) {
    raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach(addKeyword)
  }

  function removeKeyword(id: string) {
    keywords.value = keywords.value.filter((k) => k.id !== id)
  }

  function clearKeywords() {
    keywords.value = []
    analysis.value = null
    error.value = null
  }

  async function analyze() {
    if (!hasKeywords.value) {
      error.value = '회의 키워드를 하나 이상 입력하세요.'
      return
    }

    error.value = null

    try {
      analysis.value = await runPipeline(keywordTexts.value, history.value)
      if (!meetingTitle.value) {
        meetingTitle.value = keywordTexts.value.slice(0, 2).join(' · ')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.'
      error.value = msg
      analysis.value = null
    }
  }

  async function saveCurrentMeeting() {
    if (!analysis.value) return

    const record: MeetingRecord = {
      id: createId(),
      title: meetingTitle.value || keywordTexts.value.join(', '),
      keywords: [...keywordTexts.value],
      analysis: { ...analysis.value },
      createdAt: new Date().toISOString(),
      decision: meetingDecision.value || undefined,
    }

    await saveMeeting(record)
    await loadHistory()
  }

  async function loadHistory() {
    history.value = await getAllMeetings()
  }

  async function removeFromHistory(id: string) {
    await deleteMeeting(id)
    await loadHistory()
  }

  return {
    keywords,
    analysis,
    history,
    error,
    meetingTitle,
    meetingDecision,
    running,
    pipeline,
    similarMeetings,
    useOfflineMode,
    keywordTexts,
    hasKeywords,
    hasAnalysis,
    addKeyword,
    addKeywordsFromText,
    removeKeyword,
    clearKeywords,
    analyze,
    saveCurrentMeeting,
    loadHistory,
    removeFromHistory,
  }
})
