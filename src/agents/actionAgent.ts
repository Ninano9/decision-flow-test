import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'
import { STRICT_AGENT_RULES, ACTION_PROMPT_RULES } from '@/agents/promptConstants'
import { refineActions } from '@/utils/actionPlanner'

export async function generateActions(
  keywords: string[],
  topics: string[],
  decisions: string[],
): Promise<string[]> {
  const concrete = () => refineActions([], keywords, topics)

  if (!import.meta.env.VITE_MISTRAL_API_KEY) {
    return concrete()
  }

  try {
    const content = await chatCompletion({
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n${STRICT_AGENT_RULES}\n${ACTION_PROMPT_RULES}` },
        {
          role: 'user',
          content: `키워드·논의·결정 항목을 바탕으로 실행 가능한 OpenStack 운영 액션 4~6개를 작성하세요.

키워드:
${keywords.join('\n')}

핵심 논의:
${topics.join('\n')}

결정 항목:
${decisions.join('\n')}

JSON만:
{"actions":["nova-compute 로그에서 spawn 단계별 소요 시간 측정", "..."]}`,
        },
      ],
      temperature: 0.25,
    })

    const raw = parseActions(content)
    return refineActions(raw, keywords, topics)
  } catch {
    return concrete()
  }
}

function parseActions(content: string): string[] {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { actions?: string[] }
      if (parsed.actions?.length) return parsed.actions
    }
  } catch {
    /* fallback */
  }

  return content
    .split('\n')
    .map((l) => l.replace(/^[-*•□\d.]+\s*/, '').trim())
    .filter((l) => l.length > 10)
    .slice(0, 6)
}
