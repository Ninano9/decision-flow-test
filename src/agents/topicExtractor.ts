import { chatCompletion, SYSTEM_PROMPT, hasMistralKey } from '@/services/mistralService'
import { ANALYSIS_PROMPT_RULES } from '@/agents/promptConstants'
import { fallbackTopics, pickTopics } from '@/utils/meetingContentPlanner'

export async function extractTopics(keywords: string[]): Promise<string[]> {
  if (!hasMistralKey()) return fallbackTopics(keywords)

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n${ANALYSIS_PROMPT_RULES}` },
      {
        role: 'user',
        content: `키워드 맥락에 맞는 핵심 논의 3~5개를 작성하세요.

키워드:
${keywords.join('\n')}

JSON만:
{"topics":["주제1","주제2"]}`,
      },
    ],
  })

  return pickTopics(parseTopicsResponse(content), keywords)
}

function parseTopicsResponse(content: string): string[] {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { topics?: string[] }
      if (parsed.topics?.length) return parsed.topics
    }
  } catch {
    /* fallback */
  }

  return content
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}
