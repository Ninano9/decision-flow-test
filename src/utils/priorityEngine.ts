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
  { pattern: /cpu|nova|compute|증설|리소스|메모리/, level: 'medium', label: '리소스·Compute' },
  { pattern: /권한|정책|keystone/, level: 'medium', label: '권한·정책' },
  { pattern: /dashboard|horizon|ui/, level: 'low', label: 'Dashboard·UI' },
]

function findMatchingKeyword(keywords: string[], pattern: RegExp): string | undefined {
  return keywords.find((k) => pattern.test(k.toLowerCase()))
}

export function buildPriorities(
  keywords: string[],
  _topics: string[] = [],
): PriorityItem[] {
  const items: PriorityItem[] = []
  const usedKeywords = new Set<string>()

  for (const rule of RULES) {
    const matchedKw = findMatchingKeyword(keywords, rule.pattern)
    if (matchedKw && !usedKeywords.has(matchedKw)) {
      usedKeywords.add(matchedKw)
      items.push({
        label: `${matchedKw}`,
        level: rule.level,
        reason: `「${matchedKw}」— ${rule.label} 관점에서 우선 검토`,
      })
    }
  }

  for (const kw of keywords) {
    if (usedKeywords.has(kw)) continue
    items.push({
      label: kw,
      level: items.length === 0 ? 'high' : items.length === 1 ? 'medium' : 'low',
      reason: `입력 키워드 「${kw}」 기준 우선순위`,
    })
    if (items.length >= 5) break
  }

  const order = { high: 0, medium: 1, low: 2 }
  return items.sort((a, b) => order[a.level] - order[b.level]).slice(0, 5)
}
