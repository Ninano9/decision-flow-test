/** OpenStack 용어 정규화 (표시용) */
const TERM_MAP: Record<string, string> = {
  nova: 'Compute',
  neutron: 'Network',
  cinder: 'Storage',
  keystone: 'Authentication',
  glance: 'Image',
  horizon: 'Dashboard',
  dashboard: 'Dashboard',
}

export interface TermMapping {
  original: string
  standard: string
}

export function normalizeOpenStackTerms(keywords: string[]): TermMapping[] {
  const seen = new Set<string>()
  const mappings: TermMapping[] = []

  for (const kw of keywords) {
    const lower = kw.toLowerCase()
    for (const [key, standard] of Object.entries(TERM_MAP)) {
      if (lower.includes(key) && !seen.has(key)) {
        seen.add(key)
        mappings.push({ original: key, standard })
      }
    }
  }

  return mappings
}

export function applyTermHints(text: string): string {
  let result = text
  for (const [key, standard] of Object.entries(TERM_MAP)) {
    const re = new RegExp(key, 'gi')
    if (re.test(result)) {
      result = result.replace(re, `${key}(${standard})`)
    }
  }
  return result
}
