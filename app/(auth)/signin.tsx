import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "@react-navigation/native"
import { Link, router } from "expo-router"
import React, { useState } from "react"
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native"
import { useNavigationContext } from "../../components/ui/NavigationWrapper"
import { useAuth } from "../providers/AuthProvider"
import { useTokens } from "../providers/ThemeProvider"

export default function SignIn() {
  const { signIn } = useAuth()
  const { showSpinner, hideSpinner } = useNavigationContext()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { colors } = useTheme()
  const t = useTokens()

  /**
   * Handle form submission for user sign in
   * Validates input, attempts authentication, and navigates on success
   */
  async function onSubmit() {
    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }
    
    if (!password) {
      setError("Please enter your password")
      return
    }

    try {
      setBusy(true)
      setError(null)
      showSpinner("Signing you in...", "pulse")

      // Attempt to sign in the user
      await signIn(email.trim(), password)
      
      // Show success message and navigate
      showSpinner("Welcome back!", "dots")
      setTimeout(() => {
        hideSpinner()
        try { 
          router.replace("/(tabs)/chat") 
        } catch (err) { 
          console.warn("Navigation failed:", err)
          router.push("/chat")
        }
      }, 2000)

    } catch (e: any) {
      hideSpinner()
      const msg = mapAuthError(e)
      setError(msg)
      console.error("Sign in error:", e)
    } finally {
      setBusy(false)
    }
  }

  /**
   * Handle password reset
   */
  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert("Email Required", "Please enter your email address first")
      return
    }

    Alert.alert(
      "Reset Password",
      `Send password reset email to ${email}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send", 
          onPress: async () => {
            try {
              showSpinner("Sending reset email...", "wave")
              // Import the resetPassword function when needed
              const { resetPassword } = await import("../lib/firebase")
              await resetPassword(email.trim())
              hideSpinner()
              Alert.alert("Email Sent", "Check your email for password reset instructions")
            } catch (error: any) {
              hideSpinner()
              Alert.alert("Error", mapAuthError(error))
            }
          }
        }
      ]
    )
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      {/* Header */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: t.colors.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <Ionicons name="person-circle" size={48} color={t.colors.primary} />
        </View>
        <Text style={{ 
          fontSize: 28, 
          fontWeight: "700", 
          color: t.colors.text,
          marginBottom: 8
        }}>
          Welcome back
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: t.colors.muted,
          textAlign: "center"
        }}>
          Sign in to continue your wellness journey
        </Text>
      </View>

      {/* Email Input */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="mail" size={16} color={t.colors.text} style={{ marginRight: 6 }} />
          <Text style={{ 
            fontSize: 14, 
            fontWeight: "600", 
            color: t.colors.text
          }}>
            Email Address
          </Text>
        </View>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          borderWidth: 1, 
          borderColor: error ? "#ef4444" : t.colors.border,
          borderRadius: 12, 
          backgroundColor: t.colors.card,
          paddingHorizontal: 16,
          paddingVertical: 16
        }}>
          <Ionicons name="mail-outline" size={20} color={t.colors.muted} style={{ marginRight: 12 }} />
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="Enter your email"
            placeholderTextColor={t.colors.muted}
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              if (error) setError(null) // Clear error when user types
            }}
            style={{ 
              flex: 1,
              fontSize: 16,
              color: t.colors.text
            }}
          />
        </View>
      </View>

      {/* Password Input */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="lock-closed" size={16} color={t.colors.text} style={{ marginRight: 6 }} />
          <Text style={{ 
            fontSize: 14, 
            fontWeight: "600", 
            color: t.colors.text
          }}>
            Password
          </Text>
        </View>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          borderWidth: 1, 
          borderColor: error ? "#ef4444" : t.colors.border,
          borderRadius: 12, 
          backgroundColor: t.colors.card,
          paddingHorizontal: 16,
          paddingVertical: 16
        }}>
          <Ionicons name="lock-closed-outline" size={20} color={t.colors.muted} style={{ marginRight: 12 }} />
          <TextInput
            secureTextEntry
            autoComplete="password"
            placeholder="Enter your password"
            placeholderTextColor={t.colors.muted}
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (error) setError(null) // Clear error when user types
            }}
            style={{ 
              flex: 1,
              fontSize: 16,
              color: t.colors.text
            }}
          />
        </View>
      </View>

      {/* Forgot Password */}
      <Pressable onPress={handleForgotPassword} style={{ alignSelf: "flex-end", flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="help-circle-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
        <Text style={{ 
          color: colors.primary, 
          fontSize: 14, 
          fontWeight: "600" 
        }}>
          Forgot password?
        </Text>
      </Pressable>

      {/* Sign In Button */}
      <Pressable 
        onPress={onSubmit} 
        disabled={busy} 
        style={{ 
          padding: 16, 
          borderRadius: 12, 
          backgroundColor: colors.primary, 
          opacity: busy ? 0.7 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          marginTop: 8
        }}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="log-in" size={20} color="#fff" style={{ marginRight: 8 }} />
        )}
        <Text style={{ 
          color: "#fff", 
          textAlign: "center", 
          fontWeight: "700",
          fontSize: 16
        }}>
          {busy ? "Signing in..." : "Sign In"}
        </Text>
      </Pressable>

      {/* Error Message */}
      {error ? (
        <View style={{ 
          backgroundColor: "#fef2f2", 
          padding: 12, 
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: "#ef4444"
        }}>
          <Text style={{ 
            color: "#dc2626", 
            textAlign: "center",
            fontSize: 14,
            fontWeight: "500"
          }}>
            {error}
          </Text>
        </View>
      ) : null}

      {/* Sign Up Link */}
      <View style={{ 
        flexDirection: "row", 
        justifyContent: "center", 
        alignItems: "center",
        marginTop: 20,
        gap: 4
      }}>
        <Text style={{ color: t.colors.muted, fontSize: 14 }}>
          Don't have an account?
        </Text>
        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <Text style={{ 
              color: colors.primary, 
              fontSize: 14, 
              fontWeight: "600" 
            }}>
              Sign up
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  )
}

function mapAuthError(e: any) {
  const code: string | undefined = e?.code || e?.nativeError?.code
  const msg = e?.message ?? String(e)
  if (!code) return msg
  switch (code) {
    case "auth/invalid-credential":
      return "Please check your email and password and try again."
    case "auth/user-not-found":
      return "No account found with that email."
    case "auth/wrong-password":
      return "Incorrect password. Try again or reset your password."
    case "auth/invalid-email":
      return "The email address is invalid."
    case "auth/too-many-requests":
      return "Too many attempts. Try again later."
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again."
    default:
      return msg
  }
}