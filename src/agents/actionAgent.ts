import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'

export async function generateActions(
  keywords: string[],
  topics: string[],
  decisions: string[],
): Promise<string[]> {
  if (!import.meta.env.VITE_MISTRAL_API_KEY) {
    return fallbackActions(keywords)
  }

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `입력 내용만 사용해 실행 가능한 다음 액션 3~6개를 생성하세요. 새 기술 제안 금지.

키워드:
${keywords.join('\n')}

핵심 논의:
${topics.join('\n')}

결정 항목:
${decisions.join('\n')}

출력 형식 (JSON만):
{"actions":["액션1","액션2"]}`,
      },
    ],
  })

  return parseActions(content, keywords)
}

function parseActions(content: string, keywords: string[]): string[] {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as { actions?: string[] }
      if (parsed.actions?.length) return parsed.actions
    }
  } catch {
    /* fallback */
  }

  const lines = content
    .split('\n')
    .map((l) => l.replace(/^[-*•□\d.]+\s*/, '').trim())
    .filter((l) => l.length > 2)

  return lines.length ? lines.slice(0, 6) : fallbackActions(keywords)
}

function fallbackActions(keywords: string[]): string[] {
  const text = keywords.join(' ').toLowerCase()
  const actions: string[] = []

  if (/nova|compute|vm/.test(text)) actions.push('Nova/Compute 로그 확인')
  if (/cpu|리소스/.test(text)) actions.push('CPU 사용률 분석')
  if (/api|응답|지연/.test(text)) actions.push('API 응답속도 측정')
  if (/권한|keystone/.test(text)) actions.push('권한 정책 변경 범위 문서화')
  if (/dashboard|horizon/.test(text)) actions.push('Dashboard 성능 프로파일링')

  if (actions.length === 0) {
    return keywords.slice(0, 4).map((k) => `${k} 관련 데이터 수집`)
  }

  return actions
}
