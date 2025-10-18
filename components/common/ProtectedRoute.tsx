// components/common/ProtectedRoute.tsx
import { usePathname, useRouter } from "expo-router"
import React, { ReactNode, useEffect } from "react"
import { ActivityIndicator, Alert, Text, View } from "react-native"
import { useAuth } from "../../app/providers/AuthProvider"
import { useTokens } from "../../app/providers/ThemeProvider"
import { useNavigationContext } from "../ui/NavigationWrapper"

interface ProtectedRouteProps {
  children?: ReactNode
  requireAuth?: boolean
  requireProfile?: boolean
  requireWelcome?: boolean
  fallbackComponent?: ReactNode
  redirectTo?: string
  showAlert?: boolean
  alertTitle?: string
  alertMessage?: string
}

/**
 * Protected Route Component
 * 
 * A flexible component for protecting routes based on various conditions:
 * - Authentication status
 * - Profile completion
 * - Welcome flow completion
 * 
 * Usage:
 * <ProtectedRoute requireAuth requireProfile>
 *   <YourComponent />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireProfile = true,
  requireWelcome = false,
  fallbackComponent,
  redirectTo,
  showAlert = true,
  alertTitle = "Access Required",
  alertMessage = "Please complete the required steps to access this feature."
}) => {
  const { user, loading, mustShowWelcome, needsProfile } = useAuth()
  const { showSpinner, hideSpinner } = useNavigationContext()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTokens()

  // Handle redirects and alerts
  useEffect(() => {
    if (loading) return

    let shouldRedirect = false
    let redirectPath = redirectTo
    let alertMsg = alertMessage

    // Check authentication
    if (requireAuth && !user) {
      shouldRedirect = true
      redirectPath = redirectPath || '/signin'
      alertMsg = "Please sign in to access this feature."
    }
    // Check welcome completion
    else if (requireWelcome && mustShowWelcome) {
      shouldRedirect = true
      redirectPath = redirectPath || '/welcome'
      alertMsg = "Please complete the welcome setup first."
    }
    // Check profile completion
    

    if (shouldRedirect && redirectPath) {
      if (showAlert) {
        Alert.alert(
          alertTitle,
          alertMsg,
          [
            {
              text: "Continue",
              onPress: () => {
                showSpinner("Redirecting...", "pulse")
                setTimeout(() => {
                  hideSpinner()
                  router.replace(redirectPath as any)
                }, 500)
              }
            }
          ],
          { cancelable: false }
        )
      } else {
        router.replace(redirectPath)
      }
    }
  }, [
    loading, 
    user, 
    mustShowWelcome, 
    needsProfile, 
    requireAuth, 
    requireProfile, 
    requireWelcome,
    redirectTo,
    showAlert,
    alertTitle,
    alertMessage
  ])

  // Show loading state
  if (loading) {
    return fallbackComponent || (
      <View style={{ 
        flex: 1, 
        backgroundColor: t.colors.bg,
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 16
      }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Text style={{ 
          color: t.colors.text, 
          fontSize: 16,
          fontWeight: '600'
        }}>
          Checking access...
        </Text>
      </View>
    )
  }

  // Check access conditions
  const hasAuth = !requireAuth || user
  const hasWelcome = !requireWelcome || !mustShowWelcome
  const hasProfile = !requireProfile || !needsProfile

  // Render children if all conditions are met
  if (hasAuth && hasWelcome && hasProfile) {
    return <>{children}</>
  }

  // Show access denied or fallback
  return fallbackComponent || (
    <View style={{
      flex: 1,
      backgroundColor: t.colors.bg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      gap: 20
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: t.colors.text,
        textAlign: 'center'
      }}>
        Access Required
      </Text>
      <Text style={{
        fontSize: 16,
        color: t.colors.muted,
        textAlign: 'center',
        lineHeight: 24
      }}>
        You need to complete additional steps to access this feature.
      </Text>
    </View>
  )
}

/**
 * Simplified components for common protection scenarios
 */

export const AuthenticatedOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute 
    requireAuth={true} 
    requireProfile={false} 
    requireWelcome={false}
    fallbackComponent={fallback}
    showAlert={false}
  >
    {children}
  </ProtectedRoute>
)

export const ProfileRequired: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute 
    requireAuth={true} 
    requireProfile={true} 
    requireWelcome={false}
    fallbackComponent={fallback}
    alertTitle="Profile Required"
    alertMessage="Please complete your profile to access all app features."
  >
    {children}
  </ProtectedRoute>
)

export const WelcomeRequired: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute 
    requireAuth={true} 
    requireProfile={false} 
    requireWelcome={true}
    fallbackComponent={fallback}
    alertTitle="Welcome Setup"
    alertMessage="Please complete the welcome setup first."
  >
    {children}
  </ProtectedRoute>
)

export const FullyAuthenticated: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <ProtectedRoute 
    requireAuth={true} 
    requireProfile={true} 
    requireWelcome={false}
    fallbackComponent={fallback}
    alertTitle="Setup Required"
    alertMessage="Please complete your account setup to access this feature."
  >
    {children}
  </ProtectedRoute>
)

export default ProtectedRoute
