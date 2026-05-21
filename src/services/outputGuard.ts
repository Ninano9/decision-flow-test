/** 입력 키워드에 없는 외부 도구·기술 제안 차단 */
const EXTERNAL_TERMS = [
  'ceilometer',
  'prometheus',
  'grafana',
  'kubernetes',
  'k8s',
  'heat',
  'magnum',
  'barbican',
  'trove',
  'manila',
  'redis',
  'rabbitmq',
]

const EXPANSION_PATTERNS = [
  /\(예:[^)]+\)/g,
  /예:\s*[^,)]+/g,
  /쿼리\s*최적화/g,
  /인덱스\s*재구성/g,
  /오버커밋/g,
  /튜닝/g,
  /시스템\s*구축/g,
  /정책\s*검토/g,
]

function buildVocabulary(keywords: string[], topics: string[] = []): Set<string> {
  const vocab = new Set<string>()
  const sources = [...keywords, ...topics]

  for (const src of sources) {
    const lower = src.toLowerCase()
    vocab.add(lower)
    lower.split(/[\s,/·]+/).forEach((t) => {
      if (t.length >= 2) vocab.add(t)
    })
  }

  return vocab
}

function keywordOverlap(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some(
    (k) =>
      lower.includes(k.toLowerCase()) ||
      k.toLowerCase().split(/\s+/).some((part) => part.length >= 2 && lower.includes(part)),
  )
}

function containsExternalTerm(text: string, vocab: Set<string>): boolean {
  const lower = text.toLowerCase()
  return EXTERNAL_TERMS.some((term) => lower.includes(term) && !vocab.has(term))
}

function simplifyLine(text: string): string {
  let line = text.trim()
  for (const pattern of EXPANSION_PATTERNS) {
    line = line.replace(pattern, '').trim()
  }
  line = line.replace(/\s{2,}/g, ' ')
  if (line.length > 90) line = `${line.slice(0, 87)}…`
  return line
}

function overlapsContext(text: string, keywords: string[], topics: string[]): boolean {
  return keywordOverlap(text, keywords) || keywordOverlap(text, topics)
}

export function sanitizeList(
  items: string[],
  keywords: string[],
  topics: string[] = [],
  mode: 'strict' | 'relaxed' = 'strict',
): string[] {
  const vocab = buildVocabulary(keywords, topics)
  const seen = new Set<string>()

  const sanitized = items
    .map((item) => simplifyLine(item))
    .map((item) => {
      if (!item) return ''
      if (containsExternalTerm(item, vocab)) return ''
      if (mode === 'strict' && !overlapsContext(item, keywords, topics)) return ''
      return item
    })
    .filter(Boolean)

  const unique: string[] = []
  for (const line of sanitized) {
    const key = line.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(line)
    }
  }

  if (unique.length >= 2) return unique.slice(0, 6)

  return []
}
