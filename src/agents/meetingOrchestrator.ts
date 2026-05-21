import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'
import { sanitizeList } from '@/services/outputGuard'
import { refineActions } from '@/utils/actionPlanner'
import { refineDecisions, refineTopics } from '@/utils/meetingContentPlanner'
import { buildPriorities } from '@/utils/priorityEngine'
import { recommendFramework } from '@/agents/frameworkAgent'
import type { MeetingAnalysis, PriorityItem } from '@/types/meeting'
import { STRICT_AGENT_RULES, ACTION_PROMPT_RULES } from '@/agents/promptConstants'

interface UnifiedResponse {
  topics?: string[]
  decisions?: string[]
  framework?: string
  frameworkReason?: string
  actions?: string[]
  priorities?: Array<{ label: string; level: string; reason: string }>
}

export async function analyzeMeetingUnified(
  keywords: string[],
): Promise<MeetingAnalysis | null> {
  if (!import.meta.env.VITE_MISTRAL_API_KEY) return null

  try {
    const content = await chatCompletion({
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n${STRICT_AGENT_RULES}\n${ACTION_PROMPT_RULES}` },
        {
          role: 'user',
          content: `회의 키워드로 분석하세요. 액션은 OpenStack 운영자가 즉시 수행할 구체 단계로 작성 (~관련 확인 금지).

키워드:
${keywords.join('\n')}

JSON만:
{
  "topics":["핵심논의1"],
  "decisions":["결정항목1"],
  "framework":"긴급도 × 영향도",
  "frameworkReason":"한 줄",
  "actions":["nova-compute 로그에서 spawn 지연 구간 측정"],
  "priorities":[{"label":"항목","level":"high","reason":"이유"}]
}`,
        },
      ],
      temperature: 0.1,
      maxTokens: 1200,
    })

    const parsed = parseUnified(content)
    if (!parsed) return null

    const keywordFramework = await recommendFramework(keywords, parsed.topics)
    const topics = refineTopics(
      sanitizeList(parsed.topics, keywords, [], 'relaxed'),
      keywords,
    )
    const decisions = refineDecisions(
      sanitizeList(parsed.decisions, keywords, topics, 'relaxed'),
      keywords,
      topics,
    )
    const actions = refineActions(
      sanitizeList(parsed.actions, keywords, topics, 'relaxed'),
      keywords,
      topics,
    )

    const priorities: PriorityItem[] =
      parsed.priorities.length > 0
        ? parsed.priorities
        : buildPriorities(keywords, topics)

    return {
      topics: topics.length ? topics : refineTopics([], keywords),
      decisions: decisions.length ? decisions : refineDecisions([], keywords, topics),
      framework: keywordFramework.framework,
      frameworkReason: keywordFramework.reason,
      actions: actions.length ? actions : refineActions([], keywords, topics),
      priorities,
    }
  } catch {
    return null
  }
}

function parseUnified(content: string): {
  topics: string[]
  decisions: string[]
  actions: string[]
  priorities: PriorityItem[]
} | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const raw = JSON.parse(jsonMatch[0]) as UnifiedResponse
    const levelMap: Record<string, PriorityItem['level']> = {
      high: 'high',
      medium: 'medium',
      low: 'low',
      높음: 'high',
      중간: 'medium',
      낮음: 'low',
    }

    const priorities: PriorityItem[] = (raw.priorities ?? [])
      .slice(0, 5)
      .map((p) => ({
        label: p.label,
        level: levelMap[p.level?.toLowerCase() ?? ''] ?? 'medium',
        reason: p.reason?.slice(0, 80) ?? '',
      }))

    return {
      topics: raw.topics ?? [],
      decisions: raw.decisions ?? [],
      actions: raw.actions ?? [],
      priorities,
    }
  } catch {
    return null
  }
}
