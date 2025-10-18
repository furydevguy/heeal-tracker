// app/middleware/AuthMiddleware.tsx
import { usePathname, useRouter } from "expo-router"
import React, { ReactNode } from "react"
import { ActivityIndicator, Alert, Text, View } from "react-native"
import { useNavigationContext } from "../../components/ui/NavigationWrapper"
import { useAuth } from "../providers/AuthProvider"
import { useTokens } from "../providers/ThemeProvider"

interface AuthMiddlewareProps {
  children: ReactNode
  fallback?: ReactNode
  requireAuth?: boolean
  requireProfile?: boolean
  allowedRoles?: string[]
}

/**
 * Authentication Middleware Component
 * 
 * Handles authentication state, profile completion, and role-based access
 * Automatically redirects users based on their authentication status
 */
export const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({
  children,
  fallback,
  requireAuth = true,
  requireProfile = true,
  allowedRoles = []
}) => {
  const { user, loading, mustShowWelcome, needsProfile } = useAuth()
  const { showSpinner, hideSpinner } = useNavigationContext()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTokens()

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/(auth)/signin',
    '/(auth)/signup',
    '/signin',
    '/signup',
    '/',
    '/welcome'
  ]

  // Define profile setup routes
  const profileRoutes = [
    '/(screens)/profile',
    '/profile',
    '/(screens)/setup',
    '/setup'
  ]

  // Define auth-related routes
  const authRoutes = [
    '/(auth)/signin',
    '/(auth)/signup', 
    '/signin',
    '/signup'
  ]

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  const isProfileRoute = profileRoutes.some(route => pathname === route || pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname === route || pathname.startsWith(route))

  // Show loading spinner during authentication check
  if (loading) {
    return fallback || (
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
          Loading...
        </Text>
      </View>
    )
  }

  // Handle unauthenticated users
  if (requireAuth && !user) {
    if (!isPublicRoute) {
      // Redirect to signin if trying to access protected route
      router.replace('/signin')
      return null
    }
    // Allow access to public routes
    return <>{children}</>
  }

  // Handle authenticated users
  if (user) {
    // Redirect authenticated users away from auth pages
    if (isAuthRoute && !mustShowWelcome && !needsProfile) {
      router.replace('/(tabs)/chat')
      return null
    }

    // Handle welcome flow
    if (mustShowWelcome && !pathname.includes('/welcome') && !isProfileRoute) {
      router.replace('/welcome')
      return null
    }

    // Handle profile completion requirement
    if (requireProfile && needsProfile && !isProfileRoute && !pathname.includes('/welcome')) {
      // Show profile completion alert only once
      if (!pathname.includes('/profile')) {
        Alert.alert(
          "Complete Your Profile",
          "Please complete your profile to access all features of the app.",
          [
            {
              text: "Complete Profile",
              onPress: () => router.replace('/profile')
            }
          ],
          { cancelable: false }
        )
      }
      router.replace('/profile')
      return null
    }

    // Handle role-based access (if roles are implemented in the future)
    if (allowedRoles.length > 0) {
      // TODO: Implement role checking when user roles are added to the system
      // const userRoles = user.customClaims?.roles || []
      // const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role))
      // if (!hasRequiredRole) {
      //   return <UnauthorizedAccess />
      // }
    }
  }

  // Allow access to the requested content
  return <>{children}</>
}

/**
 * Higher-Order Component for protecting routes
 * 
 * @param WrappedComponent - Component to protect
 * @param options - Protection options
 */
export const withAuthProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<AuthMiddlewareProps, 'children'> = {}
) => {
  return (props: P) => (
    <AuthMiddleware {...options}>
      <WrappedComponent {...props} />
    </AuthMiddleware>
  )
}

/**
 * Hook for checking authentication status in components
 */
export const useAuthGuard = () => {
  const { user, loading, mustShowWelcome, needsProfile } = useAuth()
  const router = useRouter()

  const redirectToAuth = () => router.replace('/signin')
  const redirectToProfile = () => router.replace('/profile')
  const redirectToWelcome = () => router.replace('/welcome')
  const redirectToApp = () => router.replace('/(tabs)/chat')

  const isAuthenticated = !!user && !loading
  const isProfileComplete = !needsProfile
  const hasCompletedWelcome = !mustShowWelcome

  return {
    user,
    loading,
    isAuthenticated,
    isProfileComplete,
    hasCompletedWelcome,
    redirectToAuth,
    redirectToProfile, 
    redirectToWelcome,
    redirectToApp,
    mustShowWelcome,
    needsProfile
  }
}

/**
 * Component for displaying unauthorized access message
 */
export const UnauthorizedAccess: React.FC = () => {
  const t = useTokens()
  const router = useRouter()

  return (
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
        Access Denied
      </Text>
      <Text style={{
        fontSize: 16,
        color: t.colors.muted,
        textAlign: 'center',
        lineHeight: 24
      }}>
        You don't have permission to access this page. Please contact support if you believe this is an error.
      </Text>
      <View style={{
        backgroundColor: t.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
      }}>
        <Text 
          style={{ color: '#fff', fontWeight: '600' }}
          onPress={() => router.replace('/(tabs)/chat')}
        >
          Go Back to App
        </Text>
      </View>
    </View>
  )
}

export default AuthMiddleware
