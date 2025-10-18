// app/providers/AuthProvider.tsx
import React, { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { seedForNewUser } from "../(features)/chat/seed"
import {
  auth,
  createAccount,
  listenToDocument,
  onAuthChange,
  signInUser,
  signOutUser,
  type User
} from "../lib/firebase"
import { getNotificationService } from "../lib/notificationService"
import { initializeNotifications, setupNotificationListeners } from "../lib/notifications"
import isProfileComplete from "../lib/profile"

type AuthCtx = {
  user: User | null
  loading: boolean
  setAuthReady?: (ready: boolean) => void
  mustShowWelcome: boolean     // true if users/{uid}.welcomed !== true
  needsProfile: boolean        // true if profile is incomplete
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [mustShowWelcome, setMustShowWelcome] = useState(false)
  const [needsProfile, setNeedsProfile] = useState(false)
  const seededFor = useRef<string | null>(null)
  const notificationInitialized = useRef<boolean>(false)

  useEffect(() => onAuthChange((u) => { setUser(u ?? null); setAuthReady(true) }), [])

  // Initialize notifications when user signs in
  useEffect(() => {
    if (!user?.uid || notificationInitialized.current) return

    const initializeUserNotifications = async () => {
      try {
        console.log('🔔 Initializing notifications for user:', user.uid)

        // Initialize notification service
        const initialized = await initializeNotifications()
        if (initialized) {
          console.log('✅ Notifications initialized successfully')

          // Set up notification listeners
          const unsubscribe = setupNotificationListeners(
            (notification) => {
              console.log('📱 Notification received:', notification)
              // Handle notification received
            },
            (response) => {
              console.log('👆 Notification tapped:', response)
              // Handle notification tap
            }
          )

          // Store unsubscribe function for cleanup
          notificationInitialized.current = true

          // Schedule habit reminders
          const notificationService = getNotificationService()
          await notificationService.scheduleHabitReminders()

          console.log('🎯 Notification setup complete')
        } else {
          console.log('⚠️ Notifications not available')
        }
      } catch (error) {
        console.error('❌ Error initializing notifications:', error)
      }
    }

    initializeUserNotifications()
  }, [user?.uid])

  useEffect(() => {
    setProfileLoaded(false)
    setMustShowWelcome(false)
    setNeedsProfile(false)
    if (!user?.uid) return
    if (seededFor.current === user.uid) return       // only once per uid per session
    seededFor.current = user.uid
    const nameGuess = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "there"
    seedForNewUser(user.uid, nameGuess).catch(console.warn)

    return listenToDocument("users", user.uid, (userData) => {
      const u = userData || {}
      setMustShowWelcome(u?.welcomed !== true)
      setNeedsProfile(!isProfileComplete(u))
      setProfileLoaded(true)
    })
  }, [user?.uid])

  // Cleanup notifications when user signs out
  useEffect(() => {
    if (!user?.uid) {
      notificationInitialized.current = false
      console.log('🔔 Notifications cleaned up for signed out user')
    }
  }, [user?.uid])

  const value: AuthCtx = useMemo(() => {
    const loading = !authReady || (!!user && !profileLoaded)

    return {
      user,
      loading,
      setAuthReady,
      mustShowWelcome,
      needsProfile,
      async signIn(e: string, p: string) { await signInUser(e, p) },
      async signUp(e: string, p: string) { await createAccount(e, p) },
      async signOut() { await signOutUser() },
    }
  }, [user, authReady, profileLoaded, mustShowWelcome, needsProfile])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useAuth must be inside AuthProvider")
  return v
}
