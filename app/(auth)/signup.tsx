import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { Link, router } from "expo-router";
import { getAuth, updateProfile } from "firebase/auth";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useAlert } from "../../components/ui/AlertProvider";
import { useNavigationContext } from "../../components/ui/NavigationWrapper";
import { useAuth } from "../providers/AuthProvider";
import { useTokens } from "../providers/ThemeProvider";

export default function SignUp() {
  const { signUp } = useAuth()
  const { showSpinner, hideSpinner } = useNavigationContext()
  const { showSuccess } = useAlert()
  const [email, setEmail] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { colors } = useTheme()
  const t = useTokens()

  /**
   * Handle form submission for user registration
   * Validates input, creates account, and navigates on success
   */
  async function onSubmit() {
    // Basic validation
    if (!displayName.trim()) {
      setError("Please enter your name")
      return
    }

    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!password) {
      setError("Please enter a password")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      setBusy(true)
      setError(null)
      showSpinner("Creating your account...", "pulse")

      // Create the user account
      await signUp(email.trim(), password)

      const auth = getAuth()
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim(),
        })
      }

      // Show success and navigate
      showSpinner("Account created successfully!", "dots")
      setTimeout(() => {
        hideSpinner()
        setTimeout(() => router.replace("/welcome"), 1500)
      }, 2000)

    } catch (e: any) {
      hideSpinner()
      const msg = mapAuthError(e)
      setError(msg)
      console.error("Sign up error:", e)
    } finally {
      setBusy(false)
    }
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
          <Ionicons name="person-add" size={48} color={t.colors.primary} />
        </View>
        <Text style={{
          fontSize: 28,
          fontWeight: "700",
          color: t.colors.text,
          marginBottom: 8
        }}>
          Create Account
        </Text>
        <Text style={{
          fontSize: 16,
          color: t.colors.muted,
          textAlign: "center"
        }}>
          Join the Aura community and start your wellness journey
        </Text>
      </View>

      {/* Name Input */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="person" size={16} color={t.colors.text} style={{ marginRight: 6 }} />
          <Text style={{
            fontSize: 14,
            fontWeight: "600",
            color: t.colors.text
          }}>
            Name
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
          <Ionicons name="person-outline" size={20} color={t.colors.muted} style={{ marginRight: 12 }} />
          <TextInput
            autoCapitalize="none"
            autoComplete="name"
            keyboardType="name-phone-pad"
            placeholder="Enter your name"
            placeholderTextColor={t.colors.muted}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text)
              if (error) setError(null)
            }}
            style={{
              flex: 1,
              fontSize: 16,
              color: t.colors.text
            }}
          />
        </View>
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
              if (error) setError(null)
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
            autoComplete="password-new"
            placeholder="Create a password (min 6 characters)"
            placeholderTextColor={t.colors.muted}
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (error) setError(null)
            }}
            style={{
              flex: 1,
              fontSize: 16,
              color: t.colors.text
            }}
          />
        </View>
      </View>

      {/* Confirm Password Input */}
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="checkmark-circle" size={16} color={t.colors.text} style={{ marginRight: 6 }} />
          <Text style={{
            fontSize: 14,
            fontWeight: "600",
            color: t.colors.text
          }}>
            Confirm Password
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
          <Ionicons name="checkmark-circle-outline" size={20} color={t.colors.muted} style={{ marginRight: 12 }} />
          <TextInput
            secureTextEntry
            autoComplete="password-new"
            placeholder="Confirm your password"
            placeholderTextColor={t.colors.muted}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text)
              if (error) setError(null)
            }}
            style={{
              flex: 1,
              fontSize: 16,
              color: t.colors.text
            }}
          />
        </View>
      </View>

      {/* Sign Up Button */}
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
          <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 8 }} />
        )}
        <Text style={{
          color: "#fff",
          textAlign: "center",
          fontWeight: "700",
          fontSize: 16
        }}>
          {busy ? "Creating Account..." : "Create Account"}
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

      {/* Sign In Link */}
      <View style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
        gap: 4
      }}>
        <Text style={{ color: t.colors.muted, fontSize: 14 }}>
          Already have an account?
        </Text>
        <Link href="/(auth)/signin" asChild>
          <Pressable>
            <Text style={{
              color: colors.primary,
              fontSize: 14,
              fontWeight: "600"
            }}>
              Sign in
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
    case "auth/email-already-in-use":
      return "An account with that email already exists."
    case "auth/invalid-email":
      return "That email address is invalid."
    case "auth/operation-not-allowed":
      return "This operation is not allowed."
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters."
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again."
    default:
      return msg
  }
}
