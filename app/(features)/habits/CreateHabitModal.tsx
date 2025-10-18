import { useTokens } from "@app/providers/ThemeProvider";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { createHabit } from "./service";
import { Habit, HabitKind, Weekday } from "@app/types/habit";
import EnhancedDropdown from "@app/components/EnhancedDropdown"
import {useTheme} from "@app/providers/ThemeProvider";
/**
 * CreateHabitModal (Expo React Native)
 * - Medium modal for creating a personal habit
 * - Direct emoji input via native keyboard
 * - Radio buttons for Reminders (Off / On)
 * - Safe Firestore write using emoji characters
 * - Minimal, dependency-free UI (no extra icon libs needed)
 *
 * How to use:
 * <CreateHabitModal visible={modalOpen} onClose={() => setModalOpen(false)} uid={user.uid} onCreated={(id) => {...}} />
 */

// 2) Icon registry (1000+ items). Store the  identifier in Firestore. Use emoji at render-time.
export type HabitInput = {
  kind: HabitKind;
  name: string;
  description?: string;
  goal?: number;
  unit?: string;
  increaseAmount?: number;
  icon?: string; // emoji character directly
  reminders: boolean;
  daysOfWeek: Weekday[];
};

export function validateHabit(h: HabitInput) {
  if (!h.name?.trim()) throw new Error("Habit name is required");
  if (!(h.reminders === false || h.reminders === true))
    throw new Error("Invalid reminders value");
}

async function createHabitFromInput(data: HabitInput): Promise<Habit> {
  validateHabit(data);

  const habitData: Omit<Habit, "createdAt"> = {
    name: data.name.trim(),
    description: data.description?.trim() ?? "",
    icon: data.icon,
    kind: data.kind,
    daysOfWeek: data.daysOfWeek,
    time: "",
    reminders: data.reminders,
    goal: 0,
    unit: "",
    archived: false,
  };

  const ref = await createHabit(habitData);
  return { id: ref.id, ...habitData } as Habit;
}

function Toggle({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTokens();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: selected }}
    >
      <View style={[styles.toggleTrack, selected && styles.toggleTrackActive]}>
        <View
          style={[
            styles.toggleThumb,
            selected && styles.toggleThumbActive,
            t.shadows.small,
          ]}
        />
      </View>
    </Pressable>
  );
}

export default function CreateHabitModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated?: (habit: Habit) => void;
}) {
  const t = useTokens();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string>("🙂");
  const [kind, setKind] = useState<HabitKind>("task");
  const [reminders, setReminders] = useState<boolean>(false);
  const [daysOfWeek, setDaysOfWeek] = useState<Weekday[]>([0]);
  const [goals, setGoals] = useState<number>(0);
  const [unit, setUnit] = useState<string>("");
  const [increaseAmount, setIncreaseAmount] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const titleFont = Platform.select({
    ios: "System",
    android: "sans-serif-medium",
  });

  async function handleCreate() {
    try {
      setSaving(true);
      const habit = await createHabitFromInput({
        name,
        description,
        icon,
        reminders: reminders,
        kind,
        daysOfWeek,
      });
      onCreated?.(habit);
      // reset and close
      setName("");
      setDescription("");
      setIcon("🙂");
      setReminders(false);
      onClose();
    } catch (e: any) {
      alert(e?.message || "Failed to create habit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: t.colors.bg }]}>
        <SafeAreaView>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            style={[styles.card, t.shadows.large, { backgroundColor: t.colors.card }]}
          >
            <Text style={[styles.title, { fontFamily: titleFont, color: t.colors.text }]}>
              Create Personal Habit
            </Text>

            <View style={styles.field}>
              <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Habit Icon</Text>
              <TextInput
                value={icon}
                onChangeText={setIcon}
                placeholder="Tap to select emoji 🎯"
                placeholderTextColor={t.colors.muted}
                style={[styles.input, { color: t.colors.text }]}
                maxLength={10}
                keyboardType="default"
                textContentType="none"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Habit Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Daily reflection"
                placeholderTextColor={t.colors.muted}
                style={[styles.input, { color: t.colors.text }]}
                maxLength={60}
              />
            </View>

            {/* Kind */}
            <View style={styles.field}>
              <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Type</Text>
              <EnhancedDropdown
                placeholder="Select Type"
                options={[
                  { value: "metric", label: "Metric" },
                  { value: "counter", label: "Counter" },
                  { value: "task", label: "Task" },
                ]}
                value={kind}
                onChange={(v) => setKind(v as HabitKind)}
              />
            </View>
            {/* Goals */}
            <View style={styles.field}>
              <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Goals</Text>
              <TextInput
                keyboardType="numeric"
                value={goals.toString()}
                onChangeText={(v) => setGoals(Number(v))}
                placeholder="e.g. 100"
                style={[styles.input, { color: t.colors.text }]}
              />
            </View>
            {/* Unit */}
            <View style={styles.field}>
              <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Unit</Text>
              <EnhancedDropdown
                placeholder="Select Unit"
                options={[
                  { value: "glass", label: "Glass" },
                  { value: "hours", label: "Hours" },
                  { value: "min", label: "Minutes" },
                ]}
                value={unit}
                onChange={(v) => setUnit(v as string)}
              />
            </View>

            {/* Increase Amount */}
            {kind === "metric" && (
              <View style={styles.field}>
                <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Increase Amount</Text>
                <TextInput
                  style={[styles.input, { color: t.colors.text }]}
                  keyboardType="numeric"
                  value={increaseAmount.toString()}
                  onChangeText={(v) => setIncreaseAmount(Number(v))}
                  placeholder="e.g. 1"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Description</Text>
              <TextInput
                multiline={true}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a short note"
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
                style={[styles.textarea, { height: 120, color: t.colors.text }]}
              />
            </View>

            <View style={styles.toggleField}>
              <View>
                <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Reminders</Text>
              </View>
              <View>
                <Toggle
                  selected={reminders}
                  onPress={() => setReminders(!reminders)}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={onClose}
                style={styles.cancelBtn}
                disabled={saving}
              >
                <Text style={[styles.cancelText, { color: t.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={styles.createBtn}
                disabled={saving || !name.trim()}
              >
                <Text style={[styles.createText, { color: t.colors.text }]}>
                  {saving ? "Creating…" : "Create Habit"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 800,
    height: "auto",
    maxHeight: "100%",
    alignSelf: "center",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  radioLabel: { fontSize: 16, lineHeight: 20 },
  toggleField: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 9,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 15, opacity: 0.7, marginBottom: 8 },
  field: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  input: {
    minWidth: 300,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
  },
  textarea: {
    minWidth: 300,
    maxWidth: 330,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 20,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleTrackActive: { backgroundColor: "#10B981" },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  toggleThumbActive: { transform: [{ translateX: 22 }] },
  radioOuterActive: { borderColor: "#10B981" },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    height: 48,
    width: 150,
    borderRadius: 12,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  cancelText: { fontSize: 16, textAlign: "center" },
  createBtn: {
    backgroundColor: "#10B981",
    width: 150,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
  },
  createText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  iconCell: {
    width: (800 - 20 * 2 - 8 * 5) / 6, // responsive-ish for maxWidth 800
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconCellActive: { borderColor: "#10B981", borderWidth: 2 },
  iconEmoji: { fontSize: 24 },
  selectedText: { fontSize: 12, opacity: 0.8 },
  iconGrid: { gap: 8 },
});

// Optional: Firestore Rules sketch
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     function isSignedIn() { return request.auth != null; }
//     match /users/{userId}/habits/{habitId} {
//       allow create, update: if isSignedIn() && request.auth.uid == userId
//         && request.resource.data.icon is string
//         && request.resource.data.name is string;
//     }
//   }
// }
