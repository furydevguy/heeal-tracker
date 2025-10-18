import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, Platform, StyleSheet, Text, View } from 'react-native'

const { width } = Dimensions.get('window')

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  visible: boolean
  onHide: () => void
  duration?: number
  position?: 'top' | 'bottom'
}

const toastConfig = {
  success: {
    icon: 'checkmark-circle' as const,
    colors: ['#4CAF50', '#45a049'],
    textColor: '#ffffff'
  },
  error: {
    icon: 'close-circle' as const,
    colors: ['#f44336', '#d32f2f'],
    textColor: '#ffffff'
  },
  warning: {
    icon: 'warning' as const,
    colors: ['#ff9800', '#f57c00'],
    textColor: '#ffffff'
  },
  info: {
    icon: 'information-circle' as const,
    colors: ['#2196F3', '#1976D2'],
    textColor: '#ffffff'
  }
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  visible,
  onHide,
  duration = 3000,
  position = 'top'
}) => {
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -100 : 100)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  const config = toastConfig[type]

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        }),
        Animated.spring(opacityAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        })
      ]).start()

      // Auto hide
      const timer = setTimeout(() => {
        hideToast()
      }, duration)

      return () => clearTimeout(timer)
    } else {
      hideToast()
    }
  }, [visible, duration])

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(onHide)
  }

  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim
        }
      ]}
    >
      <LinearGradient
        colors={config.colors as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          <Ionicons
            name={config.icon}
            size={24}
            color={config.textColor}
            style={styles.icon}
          />
          <Text style={[styles.message, { color: config.textColor }]}>
            {message}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  topPosition: {
    top: Platform.OS === 'ios' ? 60 : 40,
  },
  bottomPosition: {
    bottom: Platform.OS === 'ios' ? 100 : 80,
  },
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
})
