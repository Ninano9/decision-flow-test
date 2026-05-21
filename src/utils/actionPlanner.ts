/** 키워드·논의 기반 OpenStack 운영 액션 (구체적·실행 가능) */

const GENERIC_PATTERNS = [
  /관련\s*확인\s*$/,
  /관련\s*데이터\s*수집/,
  /관련\s*논의\s*$/,
  /에\s*대한\s*결정\s*필요/,
  /^.+\s*확인\s*$/,
]

interface ActionRule {
  pattern: RegExp
  actions: string[]
}

const ACTION_RULES: ActionRule[] = [
  {
    pattern: /vm|생성|느림|spawn|인스턴스|배포/,
    actions: [
      'nova-compute 로그에서 instance spawn 단계별 소요 시간 측정',
      '스케줄러 placement 대기·NO_VALID_HOST 발생 빈도 확인',
      '요청 flavor의 vCPU/RAM과 대상 hypervisor 가용량 대조',
      '이미지/볼륨 다운로드·부팅 구간 병목 여부 분리 측정',
    ],
  },
  {
    pattern: /cpu|메모리|ram|리소스|증설|용량/,
    actions: [
      'compute 노드별 CPU·메모리 사용률 및 allocation ratio 점검',
      '과부하 hypervisor 식별 후 인스턴스 밀집 호스트 분산 검토',
      '핫스팟 노드의 running VM 수·리소스 합산으로 증설 필요량 산정',
    ],
  },
  {
    pattern: /nova|compute|하이퍼바이저|hypervisor/,
    actions: [
      'nova-scheduler 필터·weight 로그로 배치 실패 원인 분류',
      '장애·과부하 compute 노드 비활성화 및 워크로드 evacuate 계획 수립',
    ],
  },
  {
    pattern: /api|응답|지연|latency|timeout/,
    actions: [
      'Nova/Keystone API 엔드포인트별 p95 응답 시간 측정',
      '동시 요청 구간과 DB/메시지큐 대기 시간 상관 확인',
    ],
  },
  {
    pattern: /네트워크|neutron|통신|패킷/,
    actions: [
      'Neutron agent 상태 및 네트워크 노드 리소스 사용률 점검',
      '문제 VM의 security group·포트 바인딩 오류 로그 확인',
    ],
  },
  {
    pattern: /스토리지|cinder|볼륨|디스크|io/,
    actions: [
      'Cinder 백엔드 풀 여유 용량 및 볼륨 생성 큐 지연 확인',
      '문제 VM 볼륨의 IOPS·latency 메트릭과 백엔드 상태 대조',
    ],
  },
  {
    pattern: /권한|정책|keystone|인증|role/,
    actions: [
      '해당 작업의 policy.yaml 규칙과 사용자 role 매핑 대조',
      '실패 API 호출의 403/401 응답 로그로 거부 지점 특정',
    ],
  },
  {
    pattern: /dashboard|horizon|ui|화면/,
    actions: [
      'Horizon 요청 구간별 응답 시간 및 백엔드 API 병목 분리',
      '브라우저·프록시 구간 제외 후 API 레이어 지연만 재측정',
    ],
  },
  {
    pattern: /사용자|불만|영향|장애|긴급/,
    actions: [
      '영향 받는 프로젝트·테넌트 목록과 장애 시작 시각 기록',
      '우선 복구 대상 VM/서비스 tier 기준 합의',
    ],
  },
  {
    pattern: /로그|에러|error|실패/,
    actions: [
      '해당 시간대 nova/compute/neutron ERROR 로그 패턴 집계',
      '반복 예외 스택트레이스 1건 확보 후 담당 컴포넌트 매핑',
    ],
  },
]

export function isGenericAction(text: string): boolean {
  const t = text.trim()
  if (t.length < 14) return true
  return GENERIC_PATTERNS.some((p) => p.test(t))
}

export function buildConcreteActions(
  keywords: string[],
  topics: string[] = [],
): string[] {
  const context = [...keywords, ...topics].join(' ').toLowerCase()
  const actions: string[] = []
  const seen = new Set<string>()

  for (const rule of ACTION_RULES) {
    if (rule.pattern.test(context)) {
      for (const action of rule.actions) {
        const key = action.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          actions.push(action)
        }
      }
    }
  }

  if (actions.length < 3) {
    for (const kw of keywords) {
      const derived = deriveFromSingleKeyword(kw)
      for (const a of derived) {
        const key = a.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          actions.push(a)
        }
      }
    }
  }

  return actions.slice(0, 6)
}

function deriveFromSingleKeyword(kw: string): string[] {
  const k = kw.toLowerCase()
  const list: string[] = []

  if (/느림|지연|느린/.test(k)) {
    list.push(`「${kw}」 구간 시간 측정 후 병목 단계(스케줄·스폰·네트워크) 분리`)
  }
  if (/cpu/.test(k)) {
    list.push(`「${kw}」 대상 compute 노드 CPU steal time·load average 확인`)
  }
  if (/메모리|memory|ram/.test(k)) {
    list.push(`「${kw}」 기준 hypervisor 메모리 여유·스왑 사용량 점검`)
  }
  if (/vm|가상/.test(k)) {
    list.push(`「${kw}」 영향 VM 목록 추출 후 flavor·호스트 매핑표 작성`)
  }

  if (list.length === 0) {
    list.push(`「${kw}」 이슈의 현상·재현 조건·영향 범위 3가지를 회의에 기록`)
  }

  return list
}

/** AI·가드 결과를 구체 액션으로 보강 */
export function refineActions(
  raw: string[],
  keywords: string[],
  topics: string[] = [],
): string[] {
  const concrete = buildConcreteActions(keywords, topics)
  const valid = raw
    .map((s) => s.trim())
    .filter((s) => s && !isGenericAction(s))

  const merged: string[] = []
  const seen = new Set<string>()

  for (const item of [...valid, ...concrete]) {
    const key = item.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(item)
    }
  }

  return merged.slice(0, 6)
}
