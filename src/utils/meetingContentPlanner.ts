function isGenericLine(text: string): boolean {
  return /관련\s*(확인|논의)|결정\s*필요\s*$/.test(text.trim()) && text.length < 28
}

export function buildConcreteTopics(keywords: string[]): string[] {
  const text = keywords.join(' ').toLowerCase()
  const topics: string[] = []

  if (/vm|생성|느림|spawn/.test(text)) topics.push('VM 생성·spawn 지연')
  if (/cpu|메모리|ram|리소스/.test(text)) topics.push('Compute CPU/메모리 리소스 병목')
  if (/nova|compute/.test(text)) topics.push('Nova/Compute 배치·스케줄 이슈')
  if (/api|지연|응답/.test(text)) topics.push('API 응답 지연')
  if (/사용자|불만|영향/.test(text)) topics.push('사용자 영향·서비스 품질')
  if (/권한|정책/.test(text)) topics.push('권한·정책 범위')
  if (/dashboard|ui/.test(text)) topics.push('Dashboard 사용성·성능')

  if (topics.length === 0) {
    return keywords.slice(0, 4).map((k) => `${k} 이슈 범위`)
  }

  return topics.slice(0, 5)
}

export function buildConcreteDecisions(keywords: string[], topics: string[]): string[] {
  const text = [...keywords, ...topics].join(' ').toLowerCase()
  const items: string[] = []

  if (/증설|cpu|메모리|리소스|용량/.test(text)) {
    items.push('Compute 노드 증설 규모(vCPU/RAM) 결정')
  }
  if (/느림|지연|vm|spawn|성능/.test(text)) {
    items.push('VM 생성 SLA 목표·허용 지연 시간 합의')
  }
  if (/nova|compute|스케줄|배치/.test(text)) {
    items.push('스케줄러·placement 실패 대응 우선순위 결정')
  }
  if (/allocation|ratio|과부하|핫스팟/.test(text) || /cpu|메모리/.test(text)) {
    items.push('hypervisor allocation ratio·밀집 호스트 분산 여부 결정')
  }
  if (/api|응답/.test(text)) items.push('API 지연 조사 범위·담당 컴포넌트 결정')
  if (/권한|정책/.test(text)) items.push('권한·정책 변경 범위 결정')

  if (items.length === 0) {
    return topics.slice(0, 4).map((t) => `${t}에 대한 회의 결론 도출`)
  }

  return items.slice(0, 6)
}

export function refineTopics(raw: string[], keywords: string[]): string[] {
  const valid = raw.filter((t) => t.trim() && !isGenericLine(t))
  const base = buildConcreteTopics(keywords)
  return [...new Set([...valid, ...base])].slice(0, 5)
}

export function refineDecisions(
  raw: string[],
  keywords: string[],
  topics: string[],
): string[] {
  const valid = raw.filter((t) => t.trim() && !isGenericLine(t))
  const base = buildConcreteDecisions(keywords, topics)
  return [...new Set([...valid, ...base])].slice(0, 6)
}
