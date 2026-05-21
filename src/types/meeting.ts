export interface MeetingKeyword {
  id: string
  text: string
}

export interface MeetingAnalysis {
  topics: string[]
  decisions: string[]
  framework: string
  frameworkReason: string
  actions: string[]
}

export interface SimilarMeeting {
  id: string
  title: string
  date: string
  similarity: number
  topics: string[]
  decision?: string
}

export interface MeetingRecord {
  id: string
  title: string
  keywords: string[]
  analysis: MeetingAnalysis
  createdAt: string
  decision?: string
}

export type DecisionFramework =
  | '긴급도 × 영향도'
  | '비용 × 효과'
  | '장단점 비교'
  | '우선순위 매트릭스'
  | '리스크 평가'
  | '영향도 트리'

export const DECISION_FRAMEWORKS: DecisionFramework[] = [
  '긴급도 × 영향도',
  '비용 × 효과',
  '장단점 비교',
  '우선순위 매트릭스',
  '리스크 평가',
  '영향도 트리',
]

export interface AgentPipelineStep {
  id: string
  label: string
  status: 'idle' | 'running' | 'done' | 'error'
}
