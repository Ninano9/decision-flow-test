import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MeetingAnalysis, MeetingKeyword, MeetingRecord } from '@/types/meeting'
import { useDecisionEngine } from '@/composables/useDecisionEngine'
import { useMeetingHistory } from '@/composables/useMeetingHistory'
import { useToast } from '@/composables/useToast'
import { findSimilarMeetings } from '@/agents/memoryAgent'
import { buildPriorities } from '@/utils/priorityEngine'
import { normalizeOpenStackTerms, type TermMapping } from '@/utils/openstackTerms'

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
  const checkedDecisions = ref<Record<number, boolean>>({})
  const termMappings = ref<TermMapping[]>([])
  const scrollToResults = ref(false)

  const {
    running,
    pipeline,
    similarMeetings,
    useOfflineMode,
    currentStepLabel,
    runPipeline,
  } = useDecisionEngine()
  const { saveMeeting, getAllMeetings, deleteMeeting } = useMeetingHistory()
  const toast = useToast()

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
    termMappings.value = normalizeOpenStackTerms(keywordTexts.value)
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
    termMappings.value = normalizeOpenStackTerms(keywordTexts.value)
  }

  function clearKeywords() {
    keywords.value = []
    analysis.value = null
    error.value = null
    checkedDecisions.value = {}
    termMappings.value = []
    meetingTitle.value = ''
  }

  function toggleDecision(index: number) {
    checkedDecisions.value[index] = !checkedDecisions.value[index]
  }

  async function analyze() {
    if (!hasKeywords.value) {
      error.value = '회의 키워드를 하나 이상 입력하세요.'
      return
    }

    error.value = null
    checkedDecisions.value = {}

    try {
      analysis.value = await runPipeline(keywordTexts.value, history.value)
      if (!meetingTitle.value) {
        meetingTitle.value = keywordTexts.value.slice(0, 2).join(' · ')
      }
      scrollToResults.value = true
    } catch (e) {
      const msg = e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.'
      error.value = msg
      analysis.value = null
    }
  }

  function buildSummaryText(): string {
    if (!analysis.value) return ''
    const a = analysis.value
    const lines = [
      `# ${meetingTitle.value || '회의'}`,
      '',
      '## 키워드',
      keywordTexts.value.map((k) => `- ${k}`).join('\n'),
      '',
      '## 핵심 논의',
      ...a.topics.map((t, i) => `${i + 1}. ${t}`),
      '',
      '## 결정 항목',
      ...a.decisions.map((d, i) => `${checkedDecisions.value[i] ? '[x]' : '[ ]'} ${d}`),
      '',
      '## 추천 의사결정 방식',
      `${a.framework} — ${a.frameworkReason}`,
      '',
      '## 우선순위',
      ...a.priorities.map((p) => `- [${p.level}] ${p.label}: ${p.reason}`),
      '',
      '## 액션 아이템',
      ...a.actions.map((act) => `- [ ] ${act}`),
    ]
    if (meetingDecision.value) {
      lines.push('', '## 이번 회의 결정', meetingDecision.value)
    }
    return lines.join('\n')
  }

  async function copySummary() {
    const text = buildSummaryText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    toast.show('회의 요약이 클립보드에 복사되었습니다.')
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
    toast.show('회의가 히스토리에 저장되었습니다.')
  }

  async function loadHistory() {
    history.value = await getAllMeetings()
  }

  async function removeFromHistory(id: string) {
    if (!confirm('이 회의 기록을 삭제할까요?')) return
    await deleteMeeting(id)
    await loadHistory()
    toast.show('회의 기록이 삭제되었습니다.')
  }

  function loadMeeting(record: MeetingRecord) {
    keywords.value = record.keywords.map((text) => ({ id: createId(), text }))
    analysis.value = {
      ...record.analysis,
      priorities:
        record.analysis.priorities ??
        buildPriorities(record.keywords, record.analysis.topics),
    }
    meetingTitle.value = record.title
    meetingDecision.value = record.decision ?? ''
    checkedDecisions.value = {}
    termMappings.value = normalizeOpenStackTerms(record.keywords)
    scrollToResults.value = true
    similarMeetings.value = findSimilarMeetings(keywordTexts.value, history.value)
    toast.show('저장된 회의를 불러왔습니다.')
  }

  function acknowledgeScroll() {
    scrollToResults.value = false
  }

  return {
    keywords,
    analysis,
    history,
    error,
    meetingTitle,
    meetingDecision,
    checkedDecisions,
    termMappings,
    scrollToResults,
    running,
    pipeline,
    similarMeetings,
    useOfflineMode,
    currentStepLabel,
    keywordTexts,
    hasKeywords,
    hasAnalysis,
    toastMessage: toast.message,
    toastVisible: toast.visible,
    addKeyword,
    addKeywordsFromText,
    removeKeyword,
    clearKeywords,
    toggleDecision,
    analyze,
    copySummary,
    saveCurrentMeeting,
    loadHistory,
    removeFromHistory,
    loadMeeting,
    acknowledgeScroll,
  }
})
