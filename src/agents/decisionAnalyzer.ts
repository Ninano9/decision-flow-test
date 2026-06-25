import { chatCompletion, SYSTEM_PROMPT, hasMistralKey } from '@/services/mistralService'
import { ANALYSIS_PROMPT_RULES } from '@/agents/promptConstants'
import { fallbackDecisions, pickDecisions } from '@/utils/meetingContentPlanner'

export async function analyzeDecisions(
  keywords: string[],
  topics: string[],
): Promise<string[]> {
  if (!hasMistralKey()) return fallbackDecisions(keywords)

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n${ANALYSIS_PROMPT_RULES}` },
      {
        role: 'user',
        content: `키워드·논의 맥락에서 결정이 필요한 항목 3~6개를 작성하세요.

키워드:
${keywords.join('\n')}

핵심 논의:
${topics.join('\n')}

JSON만:
{"decisions":["항목1","항목2"]}`,
      },
    ],
  })

  return pickDecisions(parseList(content, 'decisions'), keywords)
}

function parseList(content: string, key: string): string[] {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, string[]>
      if (parsed[key]?.length) return parsed[key]
    }
  } catch {
    /* fallback */
  }

  return content
    .split('\n')
    .map((l) => l.replace(/^[-*•□\d.]+\s*/, '').trim())
    .filter((l) => l.length > 2)
    .slice(0, 6)
}
