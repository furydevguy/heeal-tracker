import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef } from 'react'
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native'
import { Spinner } from './Spinner'

const { width, height } = Dimensions.get('window')

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface CustomAlertProps {
  visible: boolean
  title: string
  message?: string
  type?: AlertType
  buttons?: AlertButton[]
  onClose: () => void
  loading?: boolean
}

const alertConfig = {
  info: {
    icon: 'information-circle' as const,
    iconColor: '#2196F3',
    gradientColors: ['#E3F2FD', '#BBDEFB']
  },
  success: {
    icon: 'checkmark-circle' as const,
    iconColor: '#4CAF50',
    gradientColors: ['#E8F5E8', '#C8E6C9']
  },
  warning: {
    icon: 'warning' as const,
    iconColor: '#FF9800',
    gradientColors: ['#FFF3E0', '#FFE0B2']
  },
  error: {
    icon: 'close-circle' as const,
    iconColor: '#f44336',
    gradientColors: ['#FFEBEE', '#FFCDD2']
  },
  confirm: {
    icon: 'help-circle' as const,
    iconColor: '#9C27B0',
    gradientColors: ['#F3E5F5', '#E1BEE7']
  }
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK' }],
  onClose,
  loading = false
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  const config = alertConfig[type]

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start()
    }
  }, [visible])

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress()
    }
    // Only close if not loading
    if (!loading) {
      onClose()
    }
  }

  const getButtonStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'cancel':
        return { backgroundColor: '#f5f5f5', textColor: '#666666' }
      case 'destructive':
        return { backgroundColor: '#f44336', textColor: '#ffffff' }
      default:
        return { backgroundColor: '#2196F3', textColor: '#ffffff' }
    }
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim }
        ]}
      >
        <Pressable 
          style={styles.backdrop} 
          onPress={() => {
            if (!loading) {
              onClose()
            }
          }}
        />
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={config.gradientColors as [string, string]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons
                  name={config.icon}
                  size={48}
                  color={config.iconColor}
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => {
                  const buttonStyle = getButtonStyle(button.style)
                  const isConfirmButton = button.style === 'default' && buttons.length > 1
                  const showSpinner = loading && isConfirmButton
                  
                  return (
                    <Pressable
                      key={index}
                      style={[
                        styles.button,
                        { backgroundColor: buttonStyle.backgroundColor },
                        buttons.length === 1 && styles.singleButton,
                        loading && styles.buttonDisabled
                      ]}
                      onPress={() => handleButtonPress(button)}
                      disabled={loading}
                    >
                      {showSpinner ? (
                        <View style={styles.buttonSpinnerContainer}>
                          <Spinner size={16} color={buttonStyle.textColor} type="dots" />
                          <Text
                            style={[
                              styles.buttonText,
                              { color: buttonStyle.textColor, marginLeft: 8 }
                            ]}
                          >
                            {button.text}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.buttonText,
                            { color: buttonStyle.textColor }
                          ]}
                        >
                          {button.text}
                        </Text>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  gradient: {
    padding: 0,
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  singleButton: {
    paddingHorizontal: 40,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonSpinnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
