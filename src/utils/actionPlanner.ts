/** 키워드·논의 기반 OpenStack 운영 액션 (입력별로 달라짐) */

const GENERIC_PATTERNS = [
  /관련\s*확인\s*$/,
  /관련\s*데이터\s*수집/,
  /관련\s*논의\s*$/,
  /에\s*대한\s*결정\s*필요/,
  /^.+\s*확인\s*$/,
]

interface ActionRule {
  pattern: RegExp
  action: string
}

const EXTRA_RULES: ActionRule[] = [
  {
    pattern: /vm|생성|느림|spawn|인스턴스/,
    action: 'nova-compute 로그에서 instance spawn 단계별 소요 시간 측정',
  },
  {
    pattern: /cpu|메모리|ram|리소스|증설/,
    action: 'compute 노드별 CPU·메모리 사용률 및 allocation ratio 점검',
  },
  {
    pattern: /nova|compute/,
    action: 'nova-scheduler 필터·weight 로그로 배치 실패 원인 분류',
  },
  {
    pattern: /api|응답|지연/,
    action: 'Nova/Keystone API 엔드포인트별 p95 응답 시간 측정',
  },
  {
    pattern: /네트워크|neutron/,
    action: 'Neutron agent 상태 및 포트·security group 바인딩 확인',
  },
  {
    pattern: /스토리지|cinder|볼륨/,
    action: 'Cinder 백엔드 여유 용량 및 볼륨 생성 큐 지연 확인',
  },
  {
    pattern: /권한|keystone|정책/,
    action: 'policy.yaml 규칙과 사용자 role 매핑 대조',
  },
  {
    pattern: /dashboard|horizon|ui/,
    action: 'Horizon 요청 구간별 응답 시간 및 API 병목 분리',
  },
  {
    pattern: /사용자|불만|장애|영향/,
    action: '영향 프로젝트·테넌트 목록과 장애 시작 시각 기록',
  },
]

export function isGenericAction(text: string): boolean {
  const t = text.trim()
  if (t.length < 14) return true
  return GENERIC_PATTERNS.some((p) => p.test(t))
}

function deriveFromKeyword(kw: string): string[] {
  const k = kw.toLowerCase()
  const list: string[] = []

  if (/vm|생성|느림|spawn|인스턴스/.test(k)) {
    list.push(`「${kw}」— nova-compute spawn 로그에서 단계별 지연 구간 식별`)
    list.push(`「${kw}」— NO_VALID_HOST·스케줄 대기 빈도 집계`)
  } else if (/cpu/.test(k)) {
    list.push(`「${kw}」— 대상 hypervisor CPU steal time·load average 확인`)
    list.push(`「${kw}」— 과부하 compute 노드 running VM 밀집도 점검`)
  } else if (/메모리|ram|memory/.test(k)) {
    list.push(`「${kw}」— hypervisor 메모리 여유·스왑·ballooning 상태 확인`)
    list.push(`「${kw}」— flavor RAM 요구량 대비 호스트 가용량 대조`)
  } else if (/nova|compute/.test(k)) {
    list.push(`「${kw}」— nova-scheduler placement 실패 로그 원인 분류`)
  } else if (/api|응답|지연/.test(k)) {
    list.push(`「${kw}」— API p95 응답 시간 및 DB/큐 대기 시간 측정`)
  } else if (/네트워크|neutron/.test(k)) {
    list.push(`「${kw}」— Neutron agent·포트 상태 및 바인딩 오류 확인`)
  } else if (/권한|정책|keystone/.test(k)) {
    list.push(`「${kw}」— 403/401 API 로그로 policy 거부 지점 특정`)
  } else if (/dashboard|horizon|ui/.test(k)) {
    list.push(`「${kw}」— Horizon 백엔드 API 구간별 지연 분리 측정`)
  } else if (/사용자|불만|장애/.test(k)) {
    list.push(`「${kw}」— 영향 테넌트·VM 목록과 재현 조건 문서화`)
  } else if (/증설|용량/.test(k)) {
    list.push(`「${kw}」— 필요 vCPU/RAM 산정 및 증설 후보 노드 식별`)
  } else {
    list.push(`「${kw}」— 현상·재현 조건·영향 범위 3가지 회의 기록`)
  }

  return list
}

export function buildConcreteActions(
  keywords: string[],
  _topics: string[] = [],
): string[] {
  const actions: string[] = []
  const seen = new Set<string>()
  const context = keywords.join(' ').toLowerCase()

  for (const kw of keywords) {
    for (const action of deriveFromKeyword(kw)) {
      const key = action.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        actions.push(action)
      }
    }
  }

  if (actions.length < 4) {
    for (const rule of EXTRA_RULES) {
      if (rule.pattern.test(context) && actions.length < 6) {
        const key = rule.action.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          actions.push(rule.action)
        }
      }
    }
  }

  return actions.slice(0, 6)
}

export function refineActions(
  raw: string[],
  keywords: string[],
  topics: string[] = [],
): string[] {
  const valid = raw
    .map((s) => s.trim())
    .filter((s) => s && !isGenericAction(s))

  const reflectsInput =
    valid.length > 0 &&
    valid.some((t) => keywords.some((k) => t.includes(k) || t.includes('「')))

  if (valid.length >= 2 && reflectsInput) return valid.slice(0, 6)
  if (valid.length >= keywords.length && reflectsInput) return valid.slice(0, 6)

  return buildConcreteActions(keywords, topics)
}
