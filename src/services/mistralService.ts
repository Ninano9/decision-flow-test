const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'
const DEFAULT_MODEL = 'mistral-small-latest'

export const SYSTEM_PROMPT = `너는 회의 의사결정 보조 시스템이다.

규칙:
1. 새로운 해결책을 생성하지 않는다
2. 입력된 내용만 사용한다
3. 회의를 확장하지 않는다
4. 핵심만 정리한다

반드시 아래 형식으로 출력한다

출력:
[핵심 논의]
[결정 항목]
[추천 의사결정 방식]
[액션 아이템]`

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
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1024,
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
