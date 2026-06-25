import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'
import { pickActions, pickDecisions, pickTopics } from '@/utils/meetingContentPlanner'
import { buildPriorities } from '@/utils/priorityEngine'
import { parseFrameworkFromText, recommendFramework } from '@/agents/frameworkAgent'
import type { MeetingAnalysis, PriorityItem } from '@/types/meeting'
import { ANALYSIS_PROMPT_RULES } from '@/agents/promptConstants'

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
        { role: 'system', content: `${SYSTEM_PROMPT}\n${ANALYSIS_PROMPT_RULES}` },
        {
          role: 'user',
          content: `아래 키워드의 **실제 맥락**을 파악해 회의 의사결정을 돕는 분석을 작성하세요.
기술 회의가 아니면 일상·기획·조직 등 해당 맥락에 맞게 작성하세요.

키워드:
${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

JSON만:
{
  "topics":["맥락에 맞는 핵심 논의"],
  "decisions":["결정해야 할 항목"],
  "framework":"장단점 비교",
  "frameworkReason":"왜 이 방식인지 한 줄",
  "actions":["실행 가능한 다음 액션"],
  "priorities":[{"label":"항목","level":"high","reason":"이유"}]
}`,
        },
      ],
      temperature: 0.45,
      maxTokens: 1400,
    })

    const parsed = parseUnified(content)
    if (!parsed) return null

    const topics = pickTopics(parsed.topics, keywords)
    const decisions = pickDecisions(parsed.decisions, keywords)
    const actions = pickActions(parsed.actions, keywords)

    const fromAi = parseFrameworkFromText(parsed.frameworkRaw)
    const frameworkInfo =
      fromAi && parsed.frameworkReason
        ? { framework: fromAi.framework, reason: parsed.frameworkReason }
        : fromAi ?? (await recommendFramework(keywords, topics))

    const priorities: PriorityItem[] =
      parsed.priorities.length > 0
        ? parsed.priorities
        : buildPriorities(keywords, topics)

    return {
      topics,
      decisions,
      framework: frameworkInfo.framework,
      frameworkReason: parsed.frameworkReason || frameworkInfo.reason,
      actions,
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
  frameworkRaw?: string
  frameworkReason?: string
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
        reason: p.reason?.slice(0, 100) ?? '',
      }))

    return {
      topics: raw.topics ?? [],
      decisions: raw.decisions ?? [],
      actions: raw.actions ?? [],
      priorities,
      frameworkRaw: raw.framework,
      frameworkReason: raw.frameworkReason,
    }
  } catch {
    return null
  }
}
