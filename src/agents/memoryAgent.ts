import type { MeetingRecord, SimilarMeeting } from '@/types/meeting'

export function findSimilarMeetings(
  keywords: string[],
  history: MeetingRecord[],
  limit = 3,
): SimilarMeeting[] {
  if (history.length === 0) return []

  const currentSet = new Set(keywords.map(normalize))

  const scored = history.map((meeting) => {
    const pastSet = new Set(meeting.keywords.map(normalize))
    const intersection = [...currentSet].filter((k) => pastSet.has(k)).length
    const union = new Set([...currentSet, ...pastSet]).size
    const jaccard = union === 0 ? 0 : intersection / union

    const topicOverlap = meeting.analysis.topics.filter((t) =>
      keywords.some((k) => t.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(t.toLowerCase())),
    ).length

    const similarity = Math.round((jaccard * 0.7 + Math.min(topicOverlap / 3, 1) * 0.3) * 100)

    return {
      id: meeting.id,
      title: meeting.title,
      date: formatDate(meeting.createdAt),
      similarity,
      topics: meeting.analysis.topics,
      decision: meeting.decision,
    }
  })

  return scored
    .filter((s) => s.similarity >= 30)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/nova/g, 'compute')
    .replace(/horizon/g, 'dashboard')
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}
