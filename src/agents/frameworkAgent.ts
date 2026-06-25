import type { DecisionFramework } from '@/types/meeting'
import { DECISION_FRAMEWORKS } from '@/types/meeting'
import { chatCompletion, SYSTEM_PROMPT, hasMistralKey } from '@/services/mistralService'
import { ANALYSIS_PROMPT_RULES } from '@/agents/promptConstants'

export interface FrameworkRecommendation {
  framework: DecisionFramework
  reason: string
}

export async function recommendFramework(
  keywords: string[],
  topics: string[],
): Promise<FrameworkRecommendation> {
  if (!hasMistralKey()) {
    return fallbackFramework(keywords)
  }

  const content = await chatCompletion({
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n${ANALYSIS_PROMPT_RULES}` },
      {
        role: 'user',
        content: `키워드와 논의 맥락에 맞는 의사결정 방식 하나를 추천하세요.
지원 방식: ${DECISION_FRAMEWORKS.join(', ')}

키워드:
${keywords.join('\n')}

핵심 논의:
${topics.join('\n')}

JSON만:
{"framework":"장단점 비교","reason":"한 줄 이유"}`,
      },
    ],
  })

  return parseFramework(content, keywords)
}

export function parseFrameworkFromText(text?: string): FrameworkRecommendation | null {
  if (!text) return null
  const match = DECISION_FRAMEWORKS.find((f) => text.includes(f))
  if (!match) return null
  return { framework: match, reason: '입력 맥락에 맞는 의사결정 방식' }
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
        return { framework: match, reason: parsed.reason ?? '입력 맥락 기반 추천' }
      }
    }
  } catch {
    /* fallback */
  }

  return fallbackFramework(keywords)
}

function fallbackFramework(keywords: string[]): FrameworkRecommendation {
  const text = keywords.join(' ').toLowerCase()

  if (/장애|긴급|deadline|마감/.test(text)) {
    return {
      framework: '긴급도 × 영향도',
      reason: '시간·긴급성이 중요해 보여 긴급도×영향도가 적합합니다.',
    }
  }
  if (/예산|비용|일정|리소스|인력/.test(text)) {
    return {
      framework: '비용 × 효과',
      reason: '자원·일정 트레이드오프가 있어 비용×효과 분석이 적합합니다.',
    }
  }
  if (/의견|충돌|찬반|메뉴|선택|고민|먹/.test(text)) {
    return {
      framework: '장단점 비교',
      reason: '선택지 비교가 필요해 장단점 비교가 적합합니다.',
    }
  }
  if (/리스크|보안|법|규정/.test(text)) {
    return {
      framework: '리스크 평가',
      reason: '리스크·제약 검토가 필요해 보입니다.',
    }
  }
  if (/우선|순위|여러|복수/.test(text)) {
    return {
      framework: '우선순위 매트릭스',
      reason: '복수 항목의 우선순위 정리가 필요합니다.',
    }
  }

  return {
    framework: '영향도 트리',
    reason: '논의 범위를 영향도 트리로 정리하는 것을 추천합니다.',
  }
}
