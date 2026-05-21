import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'
import { sanitizeList } from '@/services/outputGuard'
import { buildPriorities } from '@/utils/priorityEngine'
import { recommendFramework } from '@/agents/frameworkAgent'
import type { MeetingAnalysis, PriorityItem } from '@/types/meeting'
import { STRICT_AGENT_RULES } from '@/agents/promptConstants'

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
        { role: 'system', content: `${SYSTEM_PROMPT}\n${STRICT_AGENT_RULES}` },
        {
          role: 'user',
          content: `다음 회의 키워드만 사용해 분석하세요. 입력에 없는 단어 사용 금지.

키워드:
${keywords.join('\n')}

JSON만 출력:
{
  "topics":["핵심논의1"],
  "decisions":["결정항목1"],
  "framework":"긴급도 × 영향도",
  "frameworkReason":"한 줄",
  "actions":["액션1"],
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
    const topics = sanitizeList(parsed.topics, keywords, [], 'relaxed')
    const decisions = sanitizeList(parsed.decisions, keywords, topics)
    const actions = sanitizeList(parsed.actions, keywords, topics)

    const priorities: PriorityItem[] =
      parsed.priorities.length > 0
        ? parsed.priorities
        : buildPriorities(keywords, topics)

    return {
      topics: topics.length ? topics : keywords.slice(0, 3),
      decisions: decisions.length ? decisions : keywords.map((k) => `${k} 결정 필요`),
      framework: keywordFramework.framework,
      frameworkReason: keywordFramework.reason,
      actions: actions.length ? actions : keywords.map((k) => `${k} 관련 확인`),
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
