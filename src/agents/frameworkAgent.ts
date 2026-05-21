import type { DecisionFramework } from '@/types/meeting'
import { DECISION_FRAMEWORKS } from '@/types/meeting'
import { chatCompletion, SYSTEM_PROMPT } from '@/services/mistralService'

export interface FrameworkRecommendation {
  framework: DecisionFramework
  reason: string
}

export async function recommendFramework(
  keywords: string[],
  topics: string[],
): Promise<FrameworkRecommendation> {
  if (!import.meta.env.VITE_MISTRAL_API_KEY) {
    return fallbackFramework(keywords)
  }

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `키워드와 논의에 맞는 의사결정 방식 하나를 추천하세요.
지원 방식: ${DECISION_FRAMEWORKS.join(', ')}

키워드:
${keywords.join('\n')}

핵심 논의:
${topics.join('\n')}

출력 형식 (JSON만):
{"framework":"긴급도 × 영향도","reason":"한 줄 이유"}`,
      },
    ],
  })

  return parseFramework(content, keywords)
}

function parseFramework(content: string, keywords: string[]): FrameworkRecommendation {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        framework?: string
        reason?: string
      }
      const match = DECISION_FRAMEWORKS.find((f) => parsed.framework?.includes(f))
      if (match) {
        return { framework: match, reason: parsed.reason ?? '입력 키워드 기반 추천' }
      }
    }
  } catch {
    /* fallback */
  }

  return fallbackFramework(keywords)
}

function fallbackFramework(keywords: string[]): FrameworkRecommendation {
  const text = keywords.join(' ').toLowerCase()

  if (/장애|긴급|영향|사용자 불만/.test(text)) {
    return {
      framework: '긴급도 × 영향도',
      reason: '긴급·영향 키워드가 포함되어 긴급도×영향도 매트릭스가 적합합니다.',
    }
  }
  if (/일정|기능|추가|비용/.test(text)) {
    return {
      framework: '비용 × 효과',
      reason: '일정·기능 관련 키워드로 비용×효과 분석이 적합합니다.',
    }
  }
  if (/ui|dashboard|의견|충돌/.test(text)) {
    return {
      framework: '장단점 비교',
      reason: 'UI·의견 충돌 키워드로 장단점 비교가 적합합니다.',
    }
  }
  if (/리스크|보안|정책/.test(text)) {
    return {
      framework: '리스크 평가',
      reason: '리스크·정책 관련 키워드가 감지되었습니다.',
    }
  }
  if (/우선|순위|여러/.test(text)) {
    return {
      framework: '우선순위 매트릭스',
      reason: '복수 이슈 우선순위 정리가 필요해 보입니다.',
    }
  }

  return {
    framework: '영향도 트리',
    reason: '입력 범위를 영향도 트리로 구조화하는 것을 추천합니다.',
  }
}
