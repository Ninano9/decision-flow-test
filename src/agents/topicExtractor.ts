import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'
import { sanitizeList } from '@/services/outputGuard'
import { STRICT_AGENT_RULES } from '@/agents/promptConstants'

export async function extractTopics(keywords: string[]): Promise<string[]> {
  if (!import.meta.env.VITE_MISTRAL_API_KEY) {
    return fallbackTopics(keywords)
  }

  const input = keywords.join('\n')

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n${STRICT_AGENT_RULES}` },
      {
        role: 'user',
        content: `다음 회의 키워드에서 핵심 논의 주제만 3~5개 bullet로 추출하세요. 입력 외 내용 금지.

키워드:
${input}

출력 형식 (JSON만):
{"topics":["주제1","주제2"]}`,
      },
    ],
  })

  return sanitizeList(parseTopicsResponse(content, keywords), keywords, [], 'relaxed')
}

function parseTopicsResponse(content: string, keywords: string[]): string[] {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { topics?: string[] }
      if (parsed.topics?.length) return parsed.topics
    }
  } catch {
    /* fallback */
  }

  const lines = content
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
    .filter(Boolean)

  if (lines.length) return lines.slice(0, 5)

  return fallbackTopics(keywords)
}

function fallbackTopics(keywords: string[]): string[] {
  const groups = new Set<string>()
  const text = keywords.join(' ').toLowerCase()

  if (/느림|지연|성능|응답|속도/.test(text)) groups.add('성능 문제')
  if (/cpu|nova|compute|증설|리소스/.test(text)) groups.add('리소스 문제')
  if (/사용자|불만|영향/.test(text)) groups.add('사용자 영향도')
  if (/권한|정책|keystone|인증/.test(text)) groups.add('권한·정책')
  if (/dashboard|horizon|ui/.test(text)) groups.add('Dashboard 이슈')
  if (/api|network|neutron/.test(text)) groups.add('API·네트워크')

  if (groups.size === 0) {
    return keywords.slice(0, 3).map((k) => `${k} 관련 논의`)
  }

  return [...groups]
}
