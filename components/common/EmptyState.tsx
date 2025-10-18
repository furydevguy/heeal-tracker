import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface EmptyStateProps {
  title?: string
  message?: string
  icon?: keyof typeof Ionicons.glyphMap
  iconSize?: number
  iconColor?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data",
  message = "There's nothing to show here yet.",
  icon = "folder-outline",
  iconSize = 64,
  iconColor = "#999999"
}) => {
  return (
    <View style={styles.container}>
      <Ionicons 
        name={icon} 
        size={iconSize} 
        color={iconColor} 
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
})
