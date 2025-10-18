import { capitalizeWords } from "@app/utils/stringUtils"
import { db } from "@lib/firebase"
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"
import type { Habit } from "@app/types/habit"

// Default habits to create for new users
export const DEFAULT_HABITS: Omit<Habit, 'id' | 'createdAt'>[] = [
  {
    name: 'Daily reflection',
    description: 'Reflect on your day',
    icon: '✍️',
    kind: 'task',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    archived: false,
  },
  {
    name: '8k steps',
    description: 'Walk 8,000 steps',
    icon: '🚶‍♂️',
    kind: 'metric',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    unit: 'steps',
    goal: 8000,
    increaseAmount: 1000,
    archived: false,
  },
  {
    name: 'Eat protein',
    description: 'Eat 100g of protein',
    icon: '🍗',
    kind: 'metric',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    unit: 'grams',
    goal: 100,
    increaseAmount: 10,
    archived: false,
  },
  {
    name: 'Complete workout',
    description: 'Complete a workout',
    icon: '🧘',
    kind: 'task',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    archived: false,
  },
  {
    name: 'Sleep 7+ hours',
    description: 'Sleep 7+ hours',
    icon: '🛌',
    kind: 'metric',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    unit: 'hours',
    goal: 7,
    increaseAmount: 1,
    archived: false,
  },
  {
    name: 'Drink 2L water',
    description: 'Drink 2L of water',
    icon: '💧',
    kind: 'metric',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    unit: 'liters',
    goal: 2,
    increaseAmount: 0.5,
    archived: false,
  },
  {
    name: 'Track meals',
    description: 'Track your meals',
    icon: '🥗',
    kind: 'task',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    archived: false,
  },
]

async function createDefaultHabits(uid: string) {
  const habitsCollection = collection(db, "users", uid, "habits")
  
  // Create all default habits
  const habitPromises = DEFAULT_HABITS.map(habit => 
    addDoc(habitsCollection, {
      ...habit,
      createdAt: serverTimestamp(),
    })
  )
  
  await Promise.all(habitPromises)
  console.log(`Created ${DEFAULT_HABITS.length} default habits for user ${uid}`)
}

export async function seedForNewUser(uid: string, displayNameOrEmailPart = "there") {
  const userRef = doc(db, "users", uid)
  const snap = await getDoc(userRef)

  if (!snap.exists()) {
    // create a minimal user doc that your guards can read
    await setDoc(userRef, {
      onboarded: false,
      onboardingStep: 0,
      welcomed: false,          // Welcome gate will still show until user taps Get started
      createdAt: serverTimestamp(),
    })
    // Create default habits for the new user
    await createDefaultHabits(uid)
    const displayNameCapitalized = displayNameOrEmailPart === "there"? "there": capitalizeWords(displayNameOrEmailPart)
    // seed first chat message
    await addDoc(collection(db, "users", uid, "chatMessages"), {
      role: "assistant",
      text: `Hi ${displayNameCapitalized}, welcome 🎉 Before we start, let me quickly show you around! This chat is your home for our daily check-ins. You'll find your workouts and meal plans in the TABS below, your stats in the Progress tab, and your daily habits in the Habits tab. I've seen your profile, so I have a great starting point. Now, let's make your plan truly powerful by understanding your 'Why'.`,
      createdAt: serverTimestamp(),
      meta: { kind: "welcome" },
    })
  }
}
