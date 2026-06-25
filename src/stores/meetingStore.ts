import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MeetingAnalysis, MeetingKeyword } from '@/types/meeting'
import { useDecisionEngine } from '@/composables/useDecisionEngine'
import { useToast } from '@/composables/useToast'

function createId(): string {
  return crypto.randomUUID()
}

export const useMeetingStore = defineStore('meeting', () => {
  const keywords = ref<MeetingKeyword[]>([])
  const analysis = ref<MeetingAnalysis | null>(null)
  const error = ref<string | null>(null)
  const checkedDecisions = ref<Record<number, boolean>>({})
  const scrollToResults = ref(false)

  const { running, pipeline, useOfflineMode, currentStepLabel, runPipeline } =
    useDecisionEngine()
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
    checkedDecisions.value = {}
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
      analysis.value = await runPipeline(keywordTexts.value)
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
    const title = keywordTexts.value.slice(0, 2).join(' · ') || '회의'

    return [
      `# ${title}`,
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
    ].join('\n')
  }

  async function copySummary() {
    const text = buildSummaryText()
    if (!text) return
    await navigator.clipboard.writeText(text)
    toast.show('회의 요약이 클립보드에 복사되었습니다.')
  }

  function acknowledgeScroll() {
    scrollToResults.value = false
  }

  return {
    keywords,
    analysis,
    error,
    checkedDecisions,
    scrollToResults,
    running,
    pipeline,
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
    acknowledgeScroll,
  }
})
