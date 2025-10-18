import { getNext8AmTrigger } from "@lib/notificationService"
import { PrimaryButton } from "@ui/PrimaryButton"
import { Text as ThemedText } from "@ui/Text"
import * as Notifications from 'expo-notifications'
import React, { useCallback } from "react"
import { View, StyleSheet } from "react-native"
import { DarkModeToggle } from "../components/DarkModeToggle"
import { useTheme } from "../providers/ThemeProvider"

export default function Settings() {
  const { tokens } = useTheme()
  
  const sendImmediate = useCallback(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Local test',
        body: 'This is an immediate local notification',
        data: { test: 'immediate' },
        categoryIdentifier: 'AURA_DAILY',
      },
      trigger: null,
    })
  }, [])

  const scheduleFiveSeconds = useCallback(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Scheduled test',
        body: 'This will appear ~5 seconds later',
        categoryIdentifier: 'AURA_DAILY',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false },
    })
  }, [])

  const scheduleEightAm = useCallback(async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '8:00 test',
        body: 'This uses the Calendar trigger for 8 AM daily',
        categoryIdentifier: 'AURA_DAILY',
      },
      trigger: getNext8AmTrigger() as any,
    })
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      <View style={styles.header}>
        <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>Settings</ThemedText>
        <DarkModeToggle />
      </View>
      <ThemedText style={{ marginTop: 4, opacity: 0.8 }}>
        Notification testing utilities
      </ThemedText>

      <View style={{ height: 16 }} />

      <View
        style={[
          styles.card,
          {
            backgroundColor: tokens.colors.card,
            borderColor: tokens.colors.border,
          }
        ]}
      >
        <ThemedText style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Notification Tests
        </ThemedText>
        <ThemedText style={{ opacity: 0.85, marginBottom: 16 }}>
          Quickly verify that local notifications work on this device.
        </ThemedText>

        <View>
          <View>
            <ThemedText style={{ fontWeight: "700", marginBottom: 6 }}>Immediate</ThemedText>
            <ThemedText style={{ opacity: 0.8, marginBottom: 8 }}>
              Sends a notification right away.
            </ThemedText>
            <PrimaryButton title="Send now" onPress={sendImmediate} />
          </View>

          <View style={{ height: 8 }} />

          <View>
            <ThemedText style={{ fontWeight: "700", marginBottom: 6 }}>In 5 seconds</ThemedText>
            <ThemedText style={{ opacity: 0.8, marginBottom: 8 }}>
              Schedules a one-time notification for ~5s later.
            </ThemedText>
            <PrimaryButton title="Schedule (5s)" onPress={scheduleFiveSeconds} />
          </View>

          <View style={{ height: 8 }} />

        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
});
