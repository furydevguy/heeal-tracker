import React, { ReactNode, createContext, useContext, useState } from 'react'
import { AlertType, CustomAlert } from './CustomAlert'

interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface AlertOptions {
  title: string
  message?: string
  type?: AlertType
  buttons?: AlertButton[]
  loading?: boolean
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void
  setAlertLoading: (loading: boolean) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

interface AlertState {
  visible: boolean
  title: string
  message?: string
  type: AlertType
  buttons: AlertButton[]
  loading: boolean
}

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    loading: false
  })

  const showAlert = ({ title, message, type = 'info', buttons = [{ text: 'OK' }], loading = false }: AlertOptions) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      buttons,
      loading
    })
  }

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }))
  }

  const setAlertLoading = (loading: boolean) => {
    setAlert(prev => ({ ...prev, loading }))
  }

  const showSuccess = (title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'success',
      buttons: [{ text: 'Great!' }]
    })
  }

  const showError = (title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'error',
      buttons: [{ text: 'OK' }]
    })
  }

  const showWarning = (title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [{ text: 'Understood' }]
    })
  }

  const showInfo = (title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'info',
      buttons: [{ text: 'OK' }]
    })
  }

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      type: 'confirm',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel
        },
        {
          text: 'Confirm',
          style: 'default',
          onPress: onConfirm
        }
      ]
    })
  }

  return (
    <AlertContext.Provider value={{
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm,
      setAlertLoading
    }}>
      {children}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        buttons={alert.buttons}
        onClose={hideAlert}
        loading={alert.loading}
      />
    </AlertContext.Provider>
  )
}

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}
