function isGenericLine(text: string): boolean {
  return /관련\s*(확인|논의)|결정\s*필요\s*$/.test(text.trim()) && text.length < 28
}

function topicFromKeyword(kw: string): string {
  const k = kw.toLowerCase()
  if (/vm|생성|느림|spawn|인스턴스/.test(k)) return `「${kw}」— VM 생성·spawn 지연`
  if (/cpu/.test(k)) return `「${kw}」— Compute CPU 부하·할당`
  if (/메모리|ram|memory/.test(k)) return `「${kw}」— 메모리 리소스·스왑`
  if (/nova|compute|하이퍼/.test(k)) return `「${kw}」— Nova/Compute 배치·스케줄`
  if (/api|응답|지연|latency/.test(k)) return `「${kw}」— API 응답·지연`
  if (/네트워크|neutron|통신/.test(k)) return `「${kw}」— Neutron·네트워크`
  if (/스토리지|cinder|볼륨|디스크/.test(k)) return `「${kw}」— Cinder·스토리지`
  if (/권한|정책|keystone|role/.test(k)) return `「${kw}」— Keystone·권한`
  if (/dashboard|horizon|ui|화면/.test(k)) return `「${kw}」— Horizon/Dashboard`
  if (/사용자|불만|영향|장애/.test(k)) return `「${kw}」— 사용자·서비스 영향`
  if (/증설|용량|리소스/.test(k)) return `「${kw}」— 리소스·증설`
  return `「${kw}」— 회의 핵심 논의`
}

function decisionFromKeyword(kw: string): string {
  const k = kw.toLowerCase()
  if (/증설|용량|cpu|메모리|리소스/.test(k)) {
    return `「${kw}」— Compute 증설·할당 규모 결정`
  }
  if (/느림|지연|vm|spawn|성능/.test(k)) {
    return `「${kw}」— 허용 지연·SLA 목표 합의`
  }
  if (/nova|compute|스케줄|배치/.test(k)) {
    return `「${kw}」— placement·스케줄러 대응 우선순위`
  }
  if (/api|응답/.test(k)) return `「${kw}」— API 조사 범위·담당 결정`
  if (/권한|정책/.test(k)) return `「${kw}」— 권한·정책 변경 범위 결정`
  if (/dashboard|ui/.test(k)) return `「${kw}」— Dashboard 개선 범위 결정`
  if (/네트워크|neutron/.test(k)) return `「${kw}」— 네트워크 변경·조치 범위 결정`
  return `「${kw}」— 회의 결론·다음 단계 결정`
}

export function buildConcreteTopics(keywords: string[]): string[] {
  const topics = keywords.map(topicFromKeyword)
  return [...new Set(topics)].slice(0, 6)
}

export function buildConcreteDecisions(keywords: string[], _topics: string[]): string[] {
  const items = keywords.map(decisionFromKeyword)
  return [...new Set(items)].slice(0, 6)
}

export function refineTopics(raw: string[], keywords: string[]): string[] {
  const valid = raw.filter((t) => t.trim() && !isGenericLine(t))
  const keywordBased = buildConcreteTopics(keywords)

  if (valid.length === 0) return keywordBased

  const reflectsInput = valid.some((t) =>
    keywords.some((k) => t.includes(k) || k.includes(t.slice(0, Math.min(4, t.length)))),
  )

  if (reflectsInput && valid.length >= keywords.length) return valid.slice(0, 6)
  if (valid.length >= 2 && reflectsInput) return valid.slice(0, 6)

  return keywordBased
}

export function refineDecisions(
  raw: string[],
  keywords: string[],
  topics: string[],
): string[] {
  const valid = raw.filter((t) => t.trim() && !isGenericLine(t))
  const keywordBased = buildConcreteDecisions(keywords, topics)

  if (valid.length === 0) return keywordBased

  const reflectsInput = valid.some((t) =>
    keywords.some((k) => t.includes(k)),
  )

  if (reflectsInput) return valid.slice(0, 6)

  return keywordBased
}
