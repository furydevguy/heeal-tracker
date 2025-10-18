import { db } from "@lib/firebase"
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore"

export type ChatRole = "assistant" | "user" | "system" | "event"
export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  createdAt: any
  meta: any
}

export function onUserMessages(uid: string, callback: (items: ChatMessage[]) => void) {
  if (!callback) throw new Error('Callback required')
  if (!uid) throw new Error('User ID required')

  try {
    const collectionPath = `users/${uid}/chatMessages`
    // Simple query - just get all user's messages ordered by time
    const q = query(collection(db, "users", uid, "chatMessages"), orderBy("createdAt", "asc"))
    return onSnapshot(q, 
      (snap) => {
        try {
          const messages : ChatMessage[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
          callback(messages)
        } catch (parseError) {
          console.error('❌ Error parsing messages:', parseError)
          callback([])
        }
      },
      (error) => {
        console.error('❌ Firebase listener error details:', {
          code: error.code,
          message: error.message,
          uid,
          collectionPath,
          timestamp: new Date().toISOString()
        })
        
        // Check specific error types and provide solutions
        if (error.code === 'permission-denied') {
          console.error('🚫 Permission denied - Firestore rules need updating!')
        } else if (error.code === 'unavailable') {
          console.error('🌐 Network unavailable - check connection')
        }
        
        callback([])
      }
    )
  } catch (setupError) {
    console.error('❌ Error setting up Firebase listener:', setupError)
    callback([])
    return () => {} // Return empty unsubscribe function
  }
}

export async function sendMessage(uid: string, role: ChatRole, text: string, meta: any = {}) {  
  const messageData = {
    role, 
    text, 
    meta, 
    createdAt: serverTimestamp(),
  }
  
  try {
    const docRef = await addDoc(collection(db, "users", uid, "chatMessages"), messageData)
    return docRef
  } catch (error: any) {
    console.error('❌ Failed to send message:', error)
    console.error('📋 Error details:', {
      code: error?.code,
      message: error?.message,
      uid,
      collection: `users/${uid}/chatMessages`
    })
    throw error
  }
}

export async function sendAura(uid: string, text: string, meta: any = {}) {
  return sendMessage(uid, "assistant", text, meta)
}

// For OpenAI API calls, threadId can be passed but is optional/meaningless for now
export async function sendUserMessage(uid: string, text: string, meta: any = {}) {
  return sendMessage(uid, "user", text, meta)
}

// Test function to verify Firebase connectivity
export async function testFirebaseConnection(uid: string) {
  try {
    const testMessage = await sendMessage(uid, "system", "🧪 Firebase connection test", { test: true })
    console.log('✅ Firebase connection test successful!')
    return true
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error)
    return false
  }
}
