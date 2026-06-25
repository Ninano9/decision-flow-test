import { chatCompletion, SYSTEM_PROMPT, hasMistralKey } from '@/services/mistralService'
import { ANALYSIS_PROMPT_RULES } from '@/agents/promptConstants'
import { fallbackActions, pickActions } from '@/utils/meetingContentPlanner'

export async function generateActions(
  keywords: string[],
  topics: string[],
  decisions: string[],
): Promise<string[]> {
  if (!hasMistralKey()) return fallbackActions(keywords)

  try {
    const content = await chatCompletion({
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n${ANALYSIS_PROMPT_RULES}` },
        {
          role: 'user',
          content: `키워드 맥락에 맞는 실행 가능한 다음 액션 4~6개를 작성하세요.

키워드:
${keywords.join('\n')}

핵심 논의:
${topics.join('\n')}

결정 항목:
${decisions.join('\n')}

JSON만:
{"actions":["액션1","액션2"]}`,
        },
      ],
      temperature: 0.4,
    })

    return pickActions(parseActions(content), keywords)
  } catch {
    return fallbackActions(keywords)
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
    .filter((l) => l.length > 5)
    .slice(0, 6)
}
