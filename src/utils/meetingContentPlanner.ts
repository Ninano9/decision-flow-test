export function fallbackTopics(keywords: string[]): string[] {
  return keywords.map((k) => `${k} — 논의할 핵심 포인트`)
}

export function fallbackDecisions(keywords: string[]): string[] {
  return keywords.map((k) => `${k} — 이번 회의에서 내릴 결정`)
}

export function fallbackActions(keywords: string[]): string[] {
  const actions: string[] = []
  for (const k of keywords) {
    actions.push(`${k} — 선택지·옵션 비교`)
    actions.push(`${k} — 담당·일정·다음 단계 합의`)
  }
  return actions.slice(0, 6)
}

export function pickTopics(raw: string[], keywords: string[]): string[] {
  const valid = raw.map((s) => s.trim()).filter(Boolean)
  return valid.length ? valid.slice(0, 6) : fallbackTopics(keywords)
}

export function pickDecisions(raw: string[], keywords: string[]): string[] {
  const valid = raw.map((s) => s.trim()).filter(Boolean)
  return valid.length ? valid.slice(0, 6) : fallbackDecisions(keywords)
}

export function pickActions(raw: string[], keywords: string[]): string[] {
  const valid = raw.map((s) => s.trim()).filter(Boolean)
  return valid.length ? valid.slice(0, 6) : fallbackActions(keywords)
}
