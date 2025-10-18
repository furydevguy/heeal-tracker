import { useAuth } from "@app/providers/AuthProvider"
import { useTheme, useTokens } from "@app/providers/ThemeProvider"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React from "react"
import { Image, Pressable, Text, View } from "react-native"

export function HeaderAvatar() {
  const { user } = useAuth()
  const t = useTokens()
  const { scheme, toggleScheme } = useTheme()
  const photo = (user as any)?.photoURL as string | undefined
  const initials = (user?.email || user?.displayName || "U").slice(0, 1).toUpperCase()

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Pressable
        onPress={toggleScheme}
        hitSlop={8}
        style={{ marginRight: t.spacing.md }}
        accessibilityRole="button"
        accessibilityLabel="Toggle theme"
      >
        <Ionicons
          name={scheme === "dark" ? "moon" : "sunny"}
          size={22}
          color={t.colors.text}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push("/(modal)/account")}
        hitSlop={8}
        style={{ marginRight: t.spacing.md }}
        accessibilityRole="button"
        accessibilityLabel="Account"
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
        ) : (
          <View
            style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center"
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>{initials}</Text>
          </View>
        )}
      </Pressable>
    </View>
  )
}
