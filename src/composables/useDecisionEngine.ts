import { ref, computed } from 'vue'
import { extractTopics } from '@/agents/topicExtractor'
import { analyzeDecisions } from '@/agents/decisionAnalyzer'
import { recommendFramework } from '@/agents/frameworkAgent'
import { generateActions } from '@/agents/actionAgent'
import { analyzeMeetingUnified } from '@/agents/meetingOrchestrator'
import { pickActions, pickDecisions, pickTopics } from '@/utils/meetingContentPlanner'
import { buildPriorities } from '@/utils/priorityEngine'
import type { AgentPipelineStep, MeetingAnalysis } from '@/types/meeting'

const PIPELINE_STEPS: AgentPipelineStep[] = [
  { id: 'topic', label: 'Topic Extractor', status: 'idle' },
  { id: 'decision', label: 'Decision Analyzer', status: 'idle' },
  { id: 'framework', label: 'Framework Recommender', status: 'idle' },
  { id: 'action', label: 'Action Generator', status: 'idle' },
]

export function useDecisionEngine() {
  const running = ref(false)
  const pipeline = ref<AgentPipelineStep[]>(PIPELINE_STEPS.map((s) => ({ ...s })))
  const currentStepLabel = ref('')
  const useOfflineMode = ref(!import.meta.env.VITE_MISTRAL_API_KEY)

  const activeStep = computed(() =>
    pipeline.value.find((s) => s.status === 'running'),
  )

  function setStepStatus(id: string, status: AgentPipelineStep['status']) {
    const step = pipeline.value.find((s) => s.id === id)
    if (step) {
      step.status = status
      if (status === 'running') currentStepLabel.value = step.label
    }
  }

  function setAllDone() {
    pipeline.value.forEach((s) => {
      s.status = 'done'
    })
    currentStepLabel.value = '완료'
  }

  function resetPipeline() {
    pipeline.value = PIPELINE_STEPS.map((s) => ({ ...s, status: 'idle' }))
    currentStepLabel.value = ''
  }

  async function finalizeAnalysis(
    keywords: string[],
    partial: Omit<MeetingAnalysis, 'priorities'> & { priorities?: MeetingAnalysis['priorities'] },
  ): Promise<MeetingAnalysis> {
    return {
      topics: pickTopics(partial.topics, keywords),
      decisions: pickDecisions(partial.decisions, keywords),
      actions: pickActions(partial.actions, keywords),
      framework: partial.framework,
      frameworkReason: partial.frameworkReason,
      priorities: partial.priorities ?? buildPriorities(keywords, partial.topics),
    }
  }

  async function runPipeline(keywords: string[]): Promise<MeetingAnalysis> {
    running.value = true
    resetPipeline()

    try {
      setStepStatus('topic', 'running')

      const unified = await analyzeMeetingUnified(keywords)
      if (unified) {
        setAllDone()
        return unified
      }

      const topics = await extractTopics(keywords)
      setStepStatus('topic', 'done')

      setStepStatus('decision', 'running')
      const decisions = await analyzeDecisions(keywords, topics)
      setStepStatus('decision', 'done')

      setStepStatus('framework', 'running')
      const { framework, reason } = await recommendFramework(keywords, topics)
      setStepStatus('framework', 'done')

      setStepStatus('action', 'running')
      const actions = await generateActions(keywords, topics, decisions)
      setStepStatus('action', 'done')

      return finalizeAnalysis(keywords, {
        topics,
        decisions,
        framework,
        frameworkReason: reason,
        actions,
      })
    } catch (error) {
      const failed = pipeline.value.find((s) => s.status === 'running')
      if (failed) failed.status = 'error'
      throw error
    } finally {
      running.value = false
    }
  }

  return {
    running,
    pipeline,
    useOfflineMode,
    currentStepLabel,
    activeStep,
    runPipeline,
    resetPipeline,
  }
}
