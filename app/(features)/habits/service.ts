import { auth, db } from '@lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import type { Habit, HabitLog } from "@app/types/habit"

// --- helpers ---
const uidOrThrow = () => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not signed in')
  return uid
}

const habitsCol = (uid: string) => collection(db, 'users', uid, 'habits')
const logsCol   = (uid: string) => collection(db, 'users', uid, 'habitLogs')

// --- API ---
export async function createHabit(input: Omit<Habit, 'createdAt'>) {
  const uid = uidOrThrow()
  return await addDoc(habitsCol(uid), {
    ...input,
    archived: false,
    createdAt: serverTimestamp(),
  })
}

export async function deleteHabit(habitId: string) {
  const uid = uidOrThrow()
  await deleteDoc(doc(habitsCol(uid), habitId))
}

export function onHabits(cb: (arr: Habit[]) => void) {
  const uid = uidOrThrow()
  // Firestore requires a field used with `!=` to also be indexed & ordered
  const q = query(
    habitsCol(uid),
    where('archived', '!=', true),
    orderBy('archived'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Habit[]
    cb(list)
  })
}

export async function setMetricProgress(habitId: string, date: string, value: number) {
  const uid = uidOrThrow()
  const id = `${date}:${habitId}`
  await setDoc(doc(logsCol(uid), id), {
    id, habitId, date, value,
    createdAt: serverTimestamp(),
  }, { merge: true })
}

export async function setTaskMinutes(habitId: string, date: string, minutes: number) {
  const uid = uidOrThrow()
  const id = `${date}:${habitId}`
  await setDoc(doc(logsCol(uid), id), {
    id, habitId, date, minutes,
    createdAt: serverTimestamp(),
  }, { merge: true })
}

export async function setTaskChecked(habitId: string, date: string, completed: boolean) {
  const uid = uidOrThrow()
  const id = `${date}:${habitId}`
  const ref = doc(logsCol(uid), id)
  if (!completed) {
    await deleteDoc(ref).catch(() => {})
  } else {
    await setDoc(ref, {
      id, habitId, date, completed: true,
      createdAt: serverTimestamp(),
    }, { merge: true })
  }
}

export async function getDayLogsMap(date: string) {
  const uid = uidOrThrow()
  const q = query(logsCol(uid), where('date', '==', date))
  const snap = await getDocs(q)
  const map: Record<string, HabitLog> = {}
  snap.forEach(d => {
    const row = d.data() as HabitLog
    map[row.habitId] = { id: d.id, ...row }
  })
  return map
}
