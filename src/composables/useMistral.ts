import { ref } from 'vue'
import { chatCompletion, SYSTEM_PROMPT, type MistralMessage } from '@/services/mistralService'

export function useMistral() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const hasApiKey = Boolean(import.meta.env.VITE_MISTRAL_API_KEY)

  async function ask(messages: MistralMessage[]): Promise<string> {
    loading.value = true
    error.value = null
    try {
      return await chatCompletion({ messages })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Mistral 호출 실패'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function analyzeRaw(keywords: string[]): Promise<string> {
    return ask([
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `다음 회의 키워드를 분석하세요:\n${keywords.join('\n')}`,
      },
    ])
  }

  return {
    loading,
    error,
    hasApiKey,
    ask,
    analyzeRaw,
  }
}
