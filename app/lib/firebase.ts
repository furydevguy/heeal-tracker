// app/lib/firebase.ts
import { getApps, initializeApp } from "firebase/app"
import {
  User,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  updateProfile
} from "firebase/auth"
import {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  WhereFilterOp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  initializeFirestore,
  limit,
  memoryLocalCache,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentSingleTabManager,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore"
import { getMessaging, getToken, onMessage } from "firebase/messaging"
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
  uploadBytesResumable
} from "firebase/storage"
import { Platform } from "react-native"

/**
 * Firebase Configuration
 * 
 * Using direct configuration from firebase.client.json
 * This ensures consistent configuration across all platforms
 */
const firebaseConfig = {
  apiKey: "AIzaSyBtdwyAt_AF-NCxe9LkHDscshbbvc-FBPk",
  authDomain: "aura-wellness-coach-d3f9f.firebaseapp.com",
  projectId: "aura-wellness-coach-d3f9f",
  storageBucket: "aura-wellness-coach-d3f9f.firebasestorage.app",
  messagingSenderId: "569248962119",
  appId: "1:569248962119:web:6fd94935ff7e2399414362",
  measurementId: "G-R13HZ46PGN"
}

if (!firebaseConfig?.apiKey) {
  console.warn("Firebase config missing. Check app.config.ts or environment variables")
}

/**
 * Initialize Firebase App
 * Only initialize once to avoid multiple app instances
 */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

/**
 * Firebase Auth Configuration
 * 
 * For React Native, Firebase v10+ automatically handles persistence with AsyncStorage
 * No need to manually configure getReactNativePersistence
 */
export const auth = Platform.OS === "web"
  ? getAuth(app)
  : (() => {
    try {
      // Try to initialize auth with React Native optimizations
      return initializeAuth(app, {
        // React Native auth automatically uses AsyncStorage for persistence in v10+
      })
    } catch (error) {
      // If initializeAuth fails (app already initialized), use getAuth
      console.warn("Auth already initialized, using existing instance")
      return getAuth(app)
    }
  })()

/**
 * Firestore Database Configuration
 * 
 * Optimized cache settings for each platform:
 * - Web: Persistent cache with tab management
 * - Mobile: Memory cache for better performance
 */
export const db = initializeFirestore(app, {
  localCache: Platform.OS === "web"
    ? persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
    : memoryLocalCache(),
  // Enable auto-detection for poor network conditions
  experimentalAutoDetectLongPolling: true,
})

/**
 * Firebase Storage Configuration
 * For file uploads (profile pictures, documents, etc.)
 */
export const storage = getStorage(app)

/**
 * Firebase Cloud Messaging Configuration
 * For push notifications (Web only - React Native uses Expo Notifications)
 */
export const messaging = Platform.OS === "web" ? getMessaging(app) : null

// ====================
// AUTH FUNCTIONS
// ====================

/**
 * Create a new user account with email and password
 * 
 * @param email - User's email address
 * @param password - User's password (minimum 6 characters)
 * @returns Promise<User> - The created user
 */
export const createAccount = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error('Create account error:', error)
    throw error
  }
}

/**
 * Sign in existing user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<User> - The authenticated user
 */
export const signInUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error('Sign in error:', error)
    throw error
  }
}

/**
 * Sign out the current user
 * 
 * @returns Promise<void>
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth)
  } catch (error: any) {
    console.error('Sign out error:', error)
    throw error
  }
}

/**
 * Send password reset email
 * 
 * @param email - User's email address
 * @returns Promise<void>
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error('Password reset error:', error)
    throw error
  }
}

/**
 * Update user profile information
 * 
 * @param updates - Object containing displayName and/or photoURL
 * @returns Promise<void>
 */
export const updateUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string
}): Promise<void> => {
  try {
    if (!auth.currentUser) throw new Error('No authenticated user')
    await updateProfile(auth.currentUser, updates)
  } catch (error: any) {
    console.error('Update profile error:', error)
    throw error
  }
}

/**
 * Update user password
 * 
 * @param newPassword - New password (minimum 6 characters)
 * @returns Promise<void>
 */
export const changePassword = async (newPassword: string): Promise<void> => {
  try {
    if (!auth.currentUser) throw new Error('No authenticated user')
    await updatePassword(auth.currentUser, newPassword)
  } catch (error: any) {
    console.error('Change password error:', error)
    throw error
  }
}

/**
 * Listen to authentication state changes
 * 
 * @param callback - Function called when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// ====================
// FIRESTORE FUNCTIONS
// ====================

/**
 * Get current user ID
 * 
 * @returns string | null - Current user ID or null if not authenticated
 */
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null
}

/**
 * Create or update a document in Firestore
 * 
 * @param collectionName - Name of the collection
 * @param docId - Document ID (optional, auto-generated if not provided)
 * @param data - Data to store
 * @returns Promise<string> - Document ID
 */
export const saveDocument = async (
  collectionName: string,
  data: Record<string, any>,
  docId?: string
): Promise<string> => {
  try {
    if (docId) {
      // Update existing document
      const docRef = doc(db, collectionName, docId)
      await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
      return docId
    } else {
      // Create new document
      const collectionRef = collection(db, collectionName)
      const docRef = await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() })
      return docRef.id
    }
  } catch (error: any) {
    console.error('Save document error:', error)
    throw error
  }
}

/**
 * Get a single document from Firestore
 * 
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @returns Promise<T | null> - Document data or null if not found
 */
export const getDocument = async <T = any>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T
    } else {
      return null
    }
  } catch (error: any) {
    console.error('Get document error:', error)
    throw error
  }
}

export const getAllDocuments = async <T = any>(
  collectionName: string
): Promise<T[]> => {
  const querySnapshot = await getDocs(collection(db, collectionName))
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T)
}

/**
 * Update specific fields in a document
 * 
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param updates - Fields to update
 * @returns Promise<void>
 */
export const updateDocument = async (
  collectionName: string,
  docId: string,
  updates: Record<string, any>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() })
  } catch (error: any) {
    console.error('Update document error:', error)
    throw error
  }
}

/**
 * Delete a document from Firestore
 * 
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @returns Promise<void>
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
  } catch (error: any) {
    console.error('Delete document error:', error)
    throw error
  }
}
export const deleteAllDocumentsDanOneCollection = async (
  collectionName: string
): Promise<void> => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName))
    querySnapshot.forEach((doc) => deleteDoc(doc.ref))
  } catch (error: any) {
    console.error('Delete all documents error:', error)
    throw error
  }
}

export async function deleteAllDocumentsByUser(userId: string, collectionName: string) {
  const messagesRef = collection(db, "users", userId, collectionName)
  const snapshot = await getDocs(messagesRef)

  const batchDeletes = snapshot.docs.map(d =>
    deleteDoc(doc(db, "users", userId, collectionName, d.id))
  )

  await Promise.all(batchDeletes)
}

/**
 * Query documents from a collection with optional filters
 * 
 * @param collectionName - Name of the collection
 * @param filters - Array of filter conditions
 * @param orderByField - Field to order by
 * @param orderDirection - Order direction ('asc' or 'desc')
 * @param limitCount - Maximum number of documents to return
 * @returns Promise<T[]> - Array of documents
 */
export const queryDocuments = async <T = any>(
  collectionName: string,
  filters: Array<{ field: string; operator: WhereFilterOp; value: any }> = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
): Promise<T[]> => {
  try {
    let queryRef = collection(db, collectionName) as any

    // Apply filters
    filters.forEach(filter => {
      queryRef = query(queryRef, where(filter.field, filter.operator, filter.value))
    })

    // Apply ordering
    if (orderByField) {
      queryRef = query(queryRef, orderBy(orderByField, orderDirection))
    }

    // Apply limit
    if (limitCount) {
      queryRef = query(queryRef, limit(limitCount))
    }

    const querySnapshot = await getDocs(queryRef)
    const documents: T[] = []

    querySnapshot.forEach((doc: any) => {
      documents.push({ id: doc.id, ...doc.data() } as T)
    })

    return documents
  } catch (error: any) {
    console.error('Query documents error:', error)
    throw error
  }
}

/**
 * Listen to real-time changes in a document
 * 
 * @param collectionName - Name of the collection
 * @param docId - Document ID
 * @param callback - Function called when document changes
 * @returns Unsubscribe function
 */
export const listenToDocument = <T = any>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
) => {
  const docRef = doc(db, collectionName, docId)

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as T)
    } else {
      callback(null)
    }
  }, (error) => {
    console.error('Listen to document error:', error)
    callback(null)
  })
}

/**
 * Listen to real-time changes in a collection with filters
 * 
 * @param collectionName - Name of the collection
 * @param callback - Function called when collection changes
 * @param filters - Array of filter conditions
 * @param orderByField - Field to order by
 * @param orderDirection - Order direction
 * @param limitCount - Maximum number of documents
 * @returns Unsubscribe function
 */
export const listenToCollection = <T = any>(
  collectionName: string,
  callback: (data: T[]) => void,
  filters: Array<{ field: string; operator: WhereFilterOp; value: any }> = [],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount?: number
) => {
  let queryRef = collection(db, collectionName) as any

  // Apply filters
  filters.forEach(filter => {
    queryRef = query(queryRef, where(filter.field, filter.operator, filter.value))
  })

  // Apply ordering
  if (orderByField) {
    queryRef = query(queryRef, orderBy(orderByField, orderDirection))
  }

  // Apply limit
  if (limitCount) {
    queryRef = query(queryRef, limit(limitCount))
  }

  return onSnapshot(queryRef, (querySnapshot: any) => {
    const documents: T[] = []
    querySnapshot.forEach((doc: any) => {
      documents.push({ id: doc.id, ...doc.data() } as T)
    })
    callback(documents)
  }, (error: any) => {
    console.error('Listen to collection error:', error)
    callback([])
  })
}

// ====================
// STORAGE FUNCTIONS
// ====================

/**
 * Upload a file to Firebase Storage
 * 
 * @param file - File to upload (Blob, File, or Uint8Array)
 * @param path - Storage path for the file
 * @param onProgress - Optional progress callback
 * @returns Promise<string> - Download URL of uploaded file
 */
export const uploadFile = async (
  file: Blob | Uint8Array | ArrayBuffer,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const storageRef = ref(storage, path)

    if (onProgress) {
      // Use resumable upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file)

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress(progress)
          },
          (error) => {
            console.error('Upload error:', error)
            reject(error)
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(downloadURL)
            } catch (error) {
              reject(error)
            }
          }
        )
      })
    } else {
      // Simple upload without progress tracking
      const snapshot = await uploadBytes(storageRef, file)
      return await getDownloadURL(snapshot.ref)
    }
  } catch (error: any) {
    console.error('Upload file error:', error)
    throw error
  }
}

/**
 * Delete a file from Firebase Storage
 * 
 * @param path - Storage path of the file to delete
 * @returns Promise<void>
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  } catch (error: any) {
    console.error('Delete file error:', error)
    throw error
  }
}

/**
 * Get download URL for a file in storage
 * 
 * @param path - Storage path of the file
 * @returns Promise<string> - Download URL
 */
export const getFileUrl = async (path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path)
    return await getDownloadURL(storageRef)
  } catch (error: any) {
    console.error('Get file URL error:', error)
    throw error
  }
}

/**
 * List all files in a storage directory
 * 
 * @param path - Storage directory path
 * @returns Promise<string[]> - Array of file paths
 */
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const storageRef = ref(storage, path)
    const result = await listAll(storageRef)
    return result.items.map(item => item.fullPath)
  } catch (error: any) {
    console.error('List files error:', error)
    throw error
  }
}

// ====================
// FCM FUNCTIONS
// ====================

/**
 * Get FCM token for web platform
 * 
 * @returns Promise<string | null> - FCM token or null if not available
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== "web" || !messaging) {
      console.log("FCM only available on web platform")
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.EXPO_PUBLIC_FCM_VAPID_KEY // Replace with your actual VAPID key
    })

    if (token) {
      console.log("FCM token:", token)
      return token
    } else {
      console.log("No registration token available")
      return null
    }
  } catch (error: any) {
    console.error("Error getting FCM token:", error)
    return null
  }
}

/**
 * Listen to FCM messages (web only)
 * 
 * @param callback - Function called when message is received
 * @returns Unsubscribe function
 */
export const onFCMMessage = (callback: (payload: any) => void) => {
  if (Platform.OS !== "web" || !messaging) {
    console.log("FCM message listener only available on web platform")
    return () => { }
  }

  return onMessage(messaging, (payload) => {
    console.log("Message received:", payload)
    callback(payload)
  })
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Convert Firestore Timestamp to JavaScript Date
 * 
 * @param timestamp - Firestore Timestamp
 * @returns Date object
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate()
}

/**
 * Create a Firestore server timestamp
 * 
 * @returns Server timestamp placeholder
 */
export const createTimestamp = () => {
  return serverTimestamp()
}

/**
 * Get current timestamp as Firestore Timestamp
 * 
 * @returns Firestore Timestamp
 */
export const getCurrentTimestamp = (): Timestamp => {
  return Timestamp.now()
}

// Export the Firebase app instance
export default app

// Export types for TypeScript
export type {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp, User
}

