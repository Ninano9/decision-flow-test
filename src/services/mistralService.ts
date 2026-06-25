const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const DEFAULT_MODEL = 'mistral-small-latest'

export const SYSTEM_PROMPT = `너는 회의 의사결정 보조 AI다.

역할:
1. 입력 키워드의 맥락(업무, 기술, 일정, 메뉴 선택, 조직 이슈 등)을 먼저 파악한다
2. 그 맥락에 맞는 핵심 논의, 결정 항목, 우선순위, 의사결정 방식, 실행 액션을 제안한다
3. 입력과 무관한 다른 도메인 용어를 억지로 끼워 넣지 않는다 (예: 점심 메뉴 논의에 서버/VM 용어 사용 금지)

규칙:
- 구체적이고 실행 가능하게 작성한다
- "~관련 확인" 같은 모호한 한 줄은 쓰지 않는다
- 한국어로 작성한다`

export interface MistralMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface MistralChatOptions {
  messages: MistralMessage[]
  temperature?: number
  maxTokens?: number
}

export async function chatCompletion(options: MistralChatOptions): Promise<string> {
  const apiKey = import.meta.env.VITE_MISTRAL_API_KEY as string | undefined

  if (!apiKey) {
    throw new Error('VITE_MISTRAL_API_KEY가 설정되지 않았습니다.')
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 1200,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mistral API 오류: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

export function hasMistralKey(): boolean {
  return Boolean(import.meta.env.VITE_MISTRAL_API_KEY)
}
