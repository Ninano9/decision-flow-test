import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MeetingRecord } from '@/types/meeting'

const DB_NAME = 'decision-flow-db'
const STORE_NAME = 'meetings'
const LS_KEY = 'decision-flow:last-meeting-id'

interface DecisionFlowDB extends DBSchema {
  meetings: {
    key: string
    value: MeetingRecord
    indexes: { 'by-date': string }
  }
}

let dbPromise: Promise<IDBPDatabase<DecisionFlowDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<DecisionFlowDB>(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('by-date', 'createdAt')
      },
    })
  }
  return dbPromise
}

export function useMeetingHistory() {
  async function saveMeeting(record: MeetingRecord): Promise<void> {
    const db = await getDb()
    await db.put(STORE_NAME, record)
    localStorage.setItem(LS_KEY, record.id)
  }

  async function getAllMeetings(): Promise<MeetingRecord[]> {
    const db = await getDb()
    const list = await db.getAll(STORE_NAME)
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  async function getMeeting(id: string): Promise<MeetingRecord | undefined> {
    const db = await getDb()
    return db.get(STORE_NAME, id)
  }

  async function deleteMeeting(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORE_NAME, id)
    if (localStorage.getItem(LS_KEY) === id) {
      localStorage.removeItem(LS_KEY)
    }
  }

  function getLastMeetingId(): string | null {
    return localStorage.getItem(LS_KEY)
  }

  return {
    saveMeeting,
    getAllMeetings,
    getMeeting,
    deleteMeeting,
    getLastMeetingId,
  }
}
