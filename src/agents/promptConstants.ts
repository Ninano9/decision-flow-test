export const STRICT_AGENT_RULES = `
절대 규칙:
1. 입력에 없는 외부 도구(Ceilometer, Prometheus, Kubernetes 등) 신규 도입 금지
2. 회의 범위를 벗어난 신규 아키텍처 제안 금지
3. "~관련 확인" 같은 모호한 한 줄 액션 금지
4. 한국어, 항목당 20~80자
`

export const ACTION_PROMPT_RULES = `
액션 작성 규칙:
1. OpenStack 운영자가 오늘 바로 할 수 있는 구체 단계 (로그 확인, 메트릭 측정, 노드/VM 목록 작성, 배치 실패 원인 분류 등)
2. 입력 키워드·논의에서 유추 가능한 Nova, Compute, hypervisor, flavor, Neutron, Cinder 작업 명시
3. "vm생성 느림 관련 확인" 수준의 당연한 말 금지 — 무엇을, 어디서, 어떻게 볼지까지 적을 것
4. 입력에 없는 제3자 SaaS·신규 미들웨어 도입 금지
`
