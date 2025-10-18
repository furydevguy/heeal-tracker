import { useRouter } from 'expo-router'
import React from 'react'
import { View } from 'react-native'
import CreateHabitModal from '../(features)/habits/CreateHabitModal'
import { Habit } from '../(features)/habits/types'
import { useAuth } from '../providers/AuthProvider'

export default function CreateHabitModalRoute() {
  const router = useRouter()
  const { user } = useAuth()
  
  const handleClose = () => {
    router.back()
  }
  
  const handleCreated = (habit: Habit) => {
    // Optionally refresh the habits list or show success message
    router.back()
  }

  if (!user) {
    return null
  }

  return (
    <View style={{ flex: 1 }}>
      <CreateHabitModal
        visible={true}
        onClose={handleClose}
        onCreated={handleCreated}
      />
    </View>
  )
}
