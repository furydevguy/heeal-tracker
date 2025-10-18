import { useAuth } from "@app/providers/AuthProvider"
import { useTokens } from "@app/providers/ThemeProvider"
import { Ionicons } from "@expo/vector-icons"
import { clearUserDataFromDatabase } from "@lib/firebaseHelpers"
import ConfirmModal from "@ui/ConfirmModal"
import Spinner from "@ui/Spinner"
import { router } from "expo-router"
import React from "react"
import { Pressable, Text, View } from "react-native"

export default function AccountModal() {
  const userId = useAuth().user?.uid!
  const [loading, setLoading] = React.useState(false)
  const [showResetConfirm, setShowResetConfirm] = React.useState(false)
  const t = useTokens()
  const { signOut } = useAuth()

  function Item({ title, onPress, children }: { title: string; onPress: () => void; children?: React.ReactNode }) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          paddingVertical: t.spacing.md,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginLeft: 32
        }}
      >
        <View>{children}</View>
        <Text style={{ fontSize: t.fontSize.md, color: t.colors.text }}>{title}</Text>
      </Pressable>
    )
  }

  const resetAllData = async () => {
    setLoading(true);
    await clearUserDataFromDatabase(userId);
    setLoading(false);
    router.back(); // optionally close modal
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const handleConfirmReset = async () => {
    setShowResetConfirm(false)
    setLoading(true)
    try {
      await resetAllData()
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReset = () => {
    setShowResetConfirm(false)
  }

  return (
    <>
      {/* Show confirm modal on top if needed */}
      {showResetConfirm && (
        <ConfirmModal
          message="Are you sure you want to reset all data? This action cannot be undone."
          show={showResetConfirm}
          onConfirm={handleConfirmReset}
          onCancel={handleCancelReset}
        />
      )}

      {/* Loading spinner if needed */}
      {loading ? (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.1)"
        }}>
          <Spinner />
        </View>
      ) : (
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.1)",
          justifyContent: "flex-end"
        }}>
          {/* Only capture tap to close if modal not shown */}
          {!showResetConfirm && (
            <Pressable style={{ flex: 1 }} onPress={() => router.back()} />
          )}

          {/* Bottom sheet */}
          <View style={{
            backgroundColor: t.colors.card,
            padding: t.spacing.lg,
            borderTopLeftRadius: t.radius.xl,
            borderTopRightRadius: t.radius.xl,
            borderTopWidth: 1,
            borderColor: t.colors.border,
            gap: t.spacing.sm,
          }}>
            <View style={{
              height: 4,
              width: 44,
              alignSelf: "center",
              borderRadius: 2,
              backgroundColor: t.colors.border,
              marginBottom: t.spacing.sm
            }} />
            <Item title="Profile" onPress={() => {
              router.back();
              router.push("/profile");
            }}>
              <Ionicons name="person-circle-outline" size={24} color={t.colors.text} style={{ paddingRight: 6 }} />
            </Item>
            <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.sm }} />
            <Item title="Reset all" onPress={handleReset}>
              <Ionicons name="refresh-outline" size={24} color={t.colors.text} style={{ paddingRight: 6 }} />
            </Item>
            <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.sm }} />
            <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.sm }} />
            <Item title="Sign out" onPress={async () => {
              router.back();
              await signOut();
            }}>
              <Ionicons name="log-out-outline" size={24} color={t.colors.text} style={{ paddingRight: 6 }} />
            </Item>
          </View>
        </View>
      )}
    </>
  )

}
