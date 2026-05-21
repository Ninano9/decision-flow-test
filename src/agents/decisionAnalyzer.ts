import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'
import { sanitizeList } from '@/services/outputGuard'
import { STRICT_AGENT_RULES } from '@/agents/promptConstants'

export async function analyzeDecisions(
  keywords: string[],
  topics: string[],
): Promise<string[]> {
  if (!import.meta.env.VITE_MISTRAL_API_KEY) {
    return fallbackDecisions(keywords, topics)
  }

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n${STRICT_AGENT_RULES}` },
      {
        role: 'user',
        content: `키워드와 핵심 논의를 바탕으로 결정이 필요한 항목만 3~6개 생성하세요. 새 해결책 금지.

키워드:
${keywords.join('\n')}

핵심 논의:
${topics.join('\n')}

출력 형식 (JSON만):
{"decisions":["항목1","항목2"]}`,
      },
    ],
  })

  const raw = parseListResponse(content, 'decisions', () => fallbackDecisions(keywords, topics))
  return sanitizeList(raw, keywords, topics)
}

function parseListResponse(
  content: string,
  key: string,
  fallback: () => string[],
): string[] {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, string[]>
      if (parsed[key]?.length) return parsed[key]
    }
  } catch {
    /* fallback */
  }

  const lines = content
    .split('\n')
    .map((l) => l.replace(/^[-*•□\d.]+\s*/, '').trim())
    .filter((l) => l.length > 2)

  return lines.length ? lines.slice(0, 6) : fallback()
}

function fallbackDecisions(keywords: string[], topics: string[]): string[] {
  const items: string[] = []
  const text = [...keywords, ...topics].join(' ').toLowerCase()

  if (/증설|nova|compute|cpu/.test(text)) items.push('Compute 증설 여부')
  if (/병목|성능|느림|지연/.test(text)) items.push('병목 분석 우선순위')
  if (/권한|정책/.test(text)) items.push('권한 수정 범위')
  if (/api|응답/.test(text)) items.push('API 지연 원인 확인 범위')
  if (/dashboard|ui/.test(text)) items.push('Dashboard 개선 범위 결정')

  if (items.length === 0) {
    return topics.map((t) => `${t}에 대한 결정 필요`)
  }

  return items
}
