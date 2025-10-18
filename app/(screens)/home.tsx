// app/(app)/home.tsx
import React from "react"
import { Pressable, Text, View } from "react-native"
import { useAuth } from "../providers/AuthProvider"

export default function Home() {
  const { user, signOut } = useAuth()
  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", gap:12 }}>
      <Text style={{ fontSize:18 }}>Hello {user?.email}</Text>
      <Pressable onPress={signOut} style={{ padding:12, borderRadius:10, borderWidth:1 }}>
        <Text>Sign out</Text>
      </Pressable>
    </View>
  )
}

import { auth, db } from "@lib/firebase"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"

export async function smokeTest() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Sign in first")
  await setDoc(doc(db, "users", uid), { pingAt: serverTimestamp() }, { merge: true })
  alert("Firestore write OK ✅")
}

