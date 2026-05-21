import type { PriorityItem } from '@/types/meeting'

interface PriorityRule {
  pattern: RegExp
  level: PriorityItem['level']
  label: string
}

const RULES: PriorityRule[] = [
  { pattern: /장애|긴급|down/, level: 'high', label: '긴급 대응' },
  { pattern: /사용자|불만|영향/, level: 'high', label: '사용자 영향' },
  { pattern: /느림|지연|성능|응답|속도/, level: 'high', label: '성능 이슈' },
  { pattern: /api|네트워크|neutron/, level: 'medium', label: 'API·네트워크' },
  { pattern: /cpu|nova|compute|증설|리소스/, level: 'medium', label: '리소스·Compute' },
  { pattern: /권한|정책|keystone/, level: 'medium', label: '권한·정책' },
  { pattern: /dashboard|horizon|ui/, level: 'low', label: 'Dashboard·UI' },
]

export function buildPriorities(
  keywords: string[],
  topics: string[],
): PriorityItem[] {
  const text = [...keywords, ...topics].join(' ').toLowerCase()
  const items: PriorityItem[] = []

  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      items.push({
        label: rule.label,
        level: rule.level,
        reason: `입력 키워드·논의에서 "${rule.label}" 관련 내용이 감지됨`,
      })
    }
  }

  if (items.length === 0) {
    return keywords.slice(0, 3).map((kw, i) => ({
      label: kw,
      level: (['high', 'medium', 'low'] as const)[i] ?? 'low',
      reason: '입력 키워드 순서 기반 우선순위',
    }))
  }

  const order = { high: 0, medium: 1, low: 2 }
  return items.sort((a, b) => order[a.level] - order[b.level]).slice(0, 5)
}
