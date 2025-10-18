import React, { ReactNode, createContext, useContext, useState } from 'react'
import { Toast, ToastType } from './Toast'

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number, position?: 'top' | 'bottom') => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
  duration: number
  position: 'top' | 'bottom'
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
    duration: 3000,
    position: 'top'
  })

  const showToast = (
    message: string, 
    type: ToastType, 
    duration = 3000, 
    position: 'top' | 'bottom' = 'top'
  ) => {
    setToast({
      message,
      type,
      visible: true,
      duration,
      position
    })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  const showSuccess = (message: string, duration = 3000) => {
    showToast(message, 'success', duration)
  }

  const showError = (message: string, duration = 4000) => {
    showToast(message, 'error', duration)
  }

  const showWarning = (message: string, duration = 3500) => {
    showToast(message, 'warning', duration)
  }

  const showInfo = (message: string, duration = 3000) => {
    showToast(message, 'info', duration)
  }

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
        duration={toast.duration}
        position={toast.position}
      />
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
