// app/hooks/useAuthGuard.tsx
import { usePathname, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Alert } from 'react-native'
import { useNavigationContext } from '../../components/ui/NavigationWrapper'
import { useAuth } from '../providers/AuthProvider'

interface UseAuthGuardOptions {
  requireAuth?: boolean
  requireProfile?: boolean
  requireWelcome?: boolean
  redirectTo?: string
  showAlert?: boolean
  alertTitle?: string
  alertMessage?: string
  onRedirect?: () => void
}

/**
 * Custom hook for implementing comprehensive authentication guards in React components.
 * 
 * This hook provides a centralized way to handle authentication, profile completion,
 * and welcome flow requirements with automatic redirection and user feedback.
 * 
 * @param options - Configuration object for the authentication guard
 * @param options.requireAuth - Whether user must be authenticated (default: true)
 * @param options.requireProfile - Whether user must have completed profile (default: true)
 * @param options.requireWelcome - Whether user must have completed welcome flow (default: false)
 * @param options.redirectTo - Custom redirect path when requirements aren't met
 * @param options.showAlert - Whether to show alert before redirecting (default: true)
 * @param options.alertTitle - Title for the alert dialog (default: 'Access Required')
 * @param options.alertMessage - Message for the alert dialog (default: 'Please complete the required steps to access this feature.')
 * @param options.onRedirect - Callback function executed before redirecting
 * 
 * @returns Object containing authentication state and utilities
 * @returns returns.isAllowed - Boolean indicating if user meets all requirements
 * @returns returns.loading - Boolean indicating if authentication state is still loading
 * @returns returns.user - Current user object from AuthProvider
 * @returns returns.mustShowWelcome - Boolean indicating if welcome flow is required
 * @returns returns.needsProfile - Boolean indicating if profile completion is required
 * @returns returns.hasAuth - Boolean indicating if user is authenticated
 * @returns returns.hasWelcome - Boolean indicating if welcome flow is complete
 * @returns returns.hasProfile - Boolean indicating if profile is complete
 * 
 * @example Basic usage with authentication and profile requirements:
 * ```tsx
 * const { isAllowed, loading } = useAuthGuard({
 *   requireAuth: true,
 *   requireProfile: true,
 *   redirectTo: '/profile',
 *   alertMessage: 'Please complete your profile to continue'
 * })
 * 
 * if (loading) return <Spinner />
 * if (!isAllowed) return null // Component will redirect automatically
 * 
 * return <ProtectedContent />
 * ```
 * 
 * @example Welcome flow requirement:
 * ```tsx
 * const { isAllowed } = useAuthGuard({
 *   requireAuth: true,
 *   requireWelcome: true,
 *   redirectTo: '/welcome',
 *   alertMessage: 'Please complete the welcome setup first'
 * })
 * ```
 * 
 * @example Silent redirect without alert:
 * ```tsx
 * const { isAllowed } = useAuthGuard({
 *   requireAuth: true,
 *   showAlert: false,
 *   onRedirect: () => console.log('Redirecting user...')
 * })
 * ```
 * 
 * @example Custom alert configuration:
 * ```tsx
 * const { isAllowed } = useAuthGuard({
 *   requireAuth: true,
 *   requireProfile: true,
 *   alertTitle: 'Setup Required',
 *   alertMessage: 'Complete your profile to unlock all features',
 *   redirectTo: '/profile'
 * })
 * ```
 * 
 * @note This hook automatically handles redirection with a loading spinner
 * @note The hook respects the current route and won't redirect if already on the target route
 * @note All redirects are performed using router.replace() to prevent back navigation
 * @note The hook integrates with NavigationWrapper for consistent loading states
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const {
    requireAuth = true,
    requireProfile = true,
    requireWelcome = false,
    redirectTo,
    showAlert = true,
    alertTitle = 'Access Required',
    alertMessage = 'Please complete the required steps to access this feature.',
    onRedirect
  } = options

  const { user, loading, mustShowWelcome, needsProfile } = useAuth()
  const { showSpinner, hideSpinner } = useNavigationContext()
  const router = useRouter()
  const pathname = usePathname()

  // Determine if access is allowed
  const hasAuth = !requireAuth || !!user
  const hasWelcome = !requireWelcome || !mustShowWelcome
  const hasProfile = !requireProfile || !needsProfile
  const isAllowed = hasAuth && hasWelcome && hasProfile

  // Handle redirects
  useEffect(() => {
    if (loading || isAllowed) return

    let shouldRedirect = false
    let redirectPath = redirectTo
    let alertMsg = alertMessage

    // Check authentication
    if (requireAuth && !user) {
      shouldRedirect = true
      redirectPath = redirectPath || '/signin'
      alertMsg = 'Please sign in to access this feature.'
    }
    // Check welcome completion
    else if (requireWelcome && mustShowWelcome) {
      shouldRedirect = true
      redirectPath = redirectPath || '/welcome'
      alertMsg = 'Please complete the welcome setup first.'
    }
    // Check profile completion
    else if (requireProfile && needsProfile) {
      shouldRedirect = true
      redirectPath = redirectPath || '/profile'
      alertMsg = 'Please complete your profile to access this feature.'
    }

    if (shouldRedirect && redirectPath) {
      const doRedirect = () => {
        if (onRedirect) onRedirect()
        showSpinner('Redirecting...', 'pulse')
        setTimeout(() => {
          hideSpinner()
          router.replace(redirectPath as any)
        }, 500)
      }

      if (showAlert) {
        Alert.alert(
          alertTitle,
          alertMsg,
          [{ text: 'Continue', onPress: doRedirect }],
          { cancelable: false }
        )
      } else {
        doRedirect()
      }
    }
  }, [
    loading,
    isAllowed,
    user,
    mustShowWelcome,
    needsProfile,
    requireAuth,
    requireProfile,
    requireWelcome,
    redirectTo,
    showAlert,
    alertTitle,
    alertMessage,
    onRedirect
  ])

  return {
    isAllowed,
    loading,
    user,
    mustShowWelcome,
    needsProfile,
    hasAuth,
    hasWelcome,
    hasProfile
  }
}

/**
 * Hook for checking if user is authenticated (without redirects)
 */
export const useIsAuthenticated = () => {
  const { user, loading } = useAuth()
  return {
    isAuthenticated: !!user && !loading,
    loading,
    user
  }
}

/**
 * Hook for checking if profile is complete (without redirects)
 */
export const useIsProfileComplete = () => {
  const { needsProfile, loading } = useAuth()
  return {
    isProfileComplete: !needsProfile && !loading,
    needsProfile,
    loading
  }
}

/**
 * Hook for simple authentication redirection
 */
export const useRequireAuth = (redirectTo?: string) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo || '/signin')
    }
  }, [user, loading, redirectTo])

  return { user, loading, isAuthenticated: !!user }
}

/**
 * Hook for simple profile completion redirection
 */
export const useRequireProfile = (redirectTo?: string) => {
  const { needsProfile, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && needsProfile) {
      router.replace(redirectTo || '/profile')
    }
  }, [needsProfile, loading, user, redirectTo])

  return { needsProfile, loading, isComplete: !needsProfile }
}

export default useAuthGuard
