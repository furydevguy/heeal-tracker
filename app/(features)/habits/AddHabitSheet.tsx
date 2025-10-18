import { useAuth } from '@app/providers/AuthProvider';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CreateHabitModal from './CreateHabitModal';
import { createHabit, deleteHabit, onHabits } from './service';
import { Habit } from '@app/types/habit';
import Spinner from '@ui/Spinner';
import { useTokens } from '@app/providers/ThemeProvider';
// Default habit templates that can be added
import { DEFAULT_HABITS } from '@app/(features)/chat/seed';

export default function AddHabitSheet({ visible, onClose, onCreateNew }: {
  visible: boolean; onClose: () => void; onCreateNew: (habit: Habit) => void
}) {
  const [showCreateHabit, setShowCreateHabit] = useState(false);
  const [existingHabits, setExistingHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const uid = user?.uid ?? '';
  const t = useTokens();
  // Fetch existing habits when modal opens
  useEffect(() => {
    if (visible && uid) {
      const unsubscribe = onHabits((habits: Habit[]) => {
        setExistingHabits(habits);
      });
      return () => unsubscribe();
    }
  }, [visible, uid]);

  // Check if a template habit already exists
  const habitExists = (templateName: string) => {
    return existingHabits.some(habit => habit.name === templateName);
  };

  // Add a template habit
  const addTemplateHabit = async (template: typeof DEFAULT_HABITS[0]) => {
    try {
      setLoading(true);
      const newHabit: Omit<Habit, 'createdAt'> = {
        name: template.name,
        description: template.description,
        icon: template.icon,
        kind: template.kind,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
        archived: false,
        ...(template.kind === 'metric' && {
          unit: template.unit,
          goal: template.goal,
        }),
      };

      const ref = await createHabit(newHabit);
      const createdHabit = { id: ref.id, ...newHabit } as Habit;
      onCreateNew(createdHabit);
    } catch (error) {
      console.error('Error adding habit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={[s.backdrop, { backgroundColor: t.colors.bg }]}>
        <View style={[s.sheet, { backgroundColor: t.colors.card }]}>
          <View style={s.header}>
            <Pressable onPress={onClose}><Text style={{ fontSize: 20, color: t.colors.text }}>✕</Text></Pressable>
            <Text style={[s.title, { color: t.colors.text }]}>Add New Habits</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {DEFAULT_HABITS.map((template, i) => {
              const exists = habitExists(template.name);
              return (
                <View key={i} style={[s.catRow, { borderColor: t.colors.muted }]}>
                  <Text style={{ fontSize: 18, color: t.colors.text }}>{template.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.catName, { color: t.colors.text }]}>{template.name}</Text>
                    <Text style={[s.catDescription, { color: t.colors.text }]}>{template.description}</Text>
                  </View>
                  <Pressable
                    key={i}
                    style={[s.plus, exists && s.removePlus]}
                    onPress={() => {
                      !exists && addTemplateHabit(template)
                    }}
                  >
                    {loading ? <Spinner size={16} color={t.colors.primary} type="dots" /> : (
                    <Text style={{ color: t.colors.text, fontWeight: '800' }}>
                        {exists ? '✓' : '＋'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })}

            {/* Custom Habit Creation */}
            <Pressable onPress={() => setShowCreateHabit(true)} style={[s.createRow, { borderColor: t.colors.muted }]}>
              <Text style={{ fontSize: 18, marginRight: 8, color: t.colors.text }}>＋</Text>
              <View>
                <Text style={{ fontWeight: '700', color: t.colors.text }}>Couldn't find anything?</Text>
                <Text style={{ color: t.colors.text }}>Create a custom habit</Text>
              </View>
            </Pressable>

            {showCreateHabit && (
              <CreateHabitModal
                visible={showCreateHabit}
                onClose={() => setShowCreateHabit(false)}
                onCreated={(habit: Habit) => onCreateNew(habit)}
              />
            )}

            <Pressable onPress={() => {
              setShowCreateHabit(false);
              onClose();
              router.push('/(tabs)/daily');
            }} style={s.done}>
              <Text style={[s.doneText, { color: t.colors.text }]}>Done</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '88%', backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 18, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },

  // Template habits styles
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, },
  catName: { flex: 1, fontSize: 16, fontWeight: '600' },
  catDescription: { fontSize: 14, marginTop: 2 },
  plus: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Disabled states
  disabledRow: { opacity: 0.6 },
  disabledPlus: { opacity: 0.6 },
  removePlus: { opacity: 0.6 },

  // Custom creation
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 6 },
  done: { marginTop: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  doneText: { fontWeight: '800' }
})
