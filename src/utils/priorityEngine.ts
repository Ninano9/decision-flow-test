import type { PriorityItem } from '@/types/meeting'

export function buildPriorities(
  keywords: string[],
  _topics: string[] = [],
): PriorityItem[] {
  const levels: PriorityItem['level'][] = ['high', 'medium', 'low']

  return keywords.slice(0, 5).map((kw, i) => ({
    label: kw,
    level: levels[Math.min(i, levels.length - 1)] ?? 'low',
    reason: `입력 키워드 「${kw}」 기준 우선 검토`,
  }))
}
