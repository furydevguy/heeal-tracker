  // app/_layout.tsx
  import { ThemeProvider as NavThemeProvider } from "@react-navigation/native"
import { Stack, usePathname, useRouter } from "expo-router"
import React, { useEffect } from "react"
import { ActivityIndicator, Text as RNText, View as RNView, useColorScheme } from "react-native"
import { AlertProvider } from "../components/ui/AlertProvider"
import { NavigationProvider } from "../components/ui/NavigationWrapper"
import { ToastProvider } from "../components/ui/ToastProvider"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { navDark, navLight } from "./config/theme"
import { AuthProvider, useAuth } from "./providers/AuthProvider"
import { AppThemeProvider, useTheme } from "./providers/ThemeProvider"
  // app/_layout.tsx (top of file)
  import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter"
import * as SplashScreen from "expo-splash-screen"
  SplashScreen.preventAutoHideAsync()

  // Some environments bring in `fontfaceobserver` which can throw in certain web bundlers.
  // Provide a minimal safe fallback for window.FontFaceObserver on web to avoid runtime errors.
  if (typeof window !== "undefined" && !(window as any).FontFaceObserver) {
    // Minimal shim that uses the newer FontFaceSet API when available, or resolves immediately.
    (window as any).FontFaceObserver = function (family: string) {
      return {
        load: (text?: string, timeout = 3000) => {
          return new Promise<void>((resolve, reject) => {
            if (document && (document as any).fonts && (document as any).fonts.load) {
              ;(document as any).fonts
                .load(`1em ${family}`, text || "BESbswy")
                .then(() => resolve())
                .catch(() => resolve()) // don't block if webfonts fail
              // fallback: still resolve after timeout
              setTimeout(() => resolve(), timeout)
            } else {
              // No font API: resolve quickly
              setTimeout(() => resolve(), 0)
            }
          })
        },
      }
    }
  }

  function Guard({ children }: { children: React.ReactNode }) {
    const { user, loading, mustShowWelcome, needsProfile } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
      
      if (loading) return

      const inAuth = pathname.startsWith("/(auth)") || pathname.includes("/signin") || pathname.includes("/signup")
      const inWelcome = pathname.includes("/welcome") || pathname === ""
      const inProfile = pathname.includes("/profile")


      if (!user) {
        if (!inAuth) {
          router.replace("/signin")
        }
        return
      }

      // Signed-in users:
      if (mustShowWelcome && !(inWelcome || inProfile)) {
        router.replace("/welcome")
        return
      }

      if (!mustShowWelcome && needsProfile && !(inProfile || inWelcome)) {
        // Force profile completion - redirect to enhanced profile
        router.replace("/profile")
        return
      }

      // If they're in auth screens while signed-in and nothing else blocks, send them to app
      if (!mustShowWelcome && !needsProfile && inAuth) {
        router.replace("/(tabs)/chat")
      }
    }, [user, loading, mustShowWelcome, needsProfile, pathname])

    if (loading) {
      return (
        <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <RNText style={{ fontSize: 16, color: '#666666', marginTop: 16 }}>Checking authentication...</RNText>
        </RNView>
      )
    }

    return <>{children}</>
  }

  function NavThemeBridge({ children }: { children: React.ReactNode }) {
    const { scheme } = useTheme()
    return (
      <NavThemeProvider value={scheme === "dark" ? navDark : navLight}>
        {children}
      </NavThemeProvider>
    )
  }

  export default function RootLayout() {
    const scheme = useColorScheme()
    const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold })

    useEffect(() => {
      console.log('RootLayout - Fonts loaded:', fontsLoaded)
      if (fontsLoaded) {
        SplashScreen.hideAsync()
        console.log('Splash screen hidden')
      }
    }, [fontsLoaded])

    useEffect(() => {
      console.log('RootLayout - App starting with color scheme:', scheme)
    }, [])

    if (!fontsLoaded) {
      console.log('RootLayout - Waiting for fonts to load...')
      return (
        <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <RNText style={{ fontSize: 16, color: '#666666', marginTop: 16 }}>Loading fonts...</RNText>
        </RNView>
      )
    }

    console.log('RootLayout - Rendering main app structure')

        return (
          <ErrorBoundary>
            <AuthProvider>
              <AppThemeProvider>
                <ToastProvider>
                  <AlertProvider>
                    <NavThemeBridge>
                      <NavigationProvider>
                        <Guard>
                          <Stack screenOptions={{ headerShown: false }} />
                        </Guard>
                      </NavigationProvider>
                    </NavThemeBridge>
                  </AlertProvider>
                </ToastProvider>
              </AppThemeProvider>
            </AuthProvider>
          </ErrorBoundary>
        )
  }
