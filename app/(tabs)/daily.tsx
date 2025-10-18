import { FullyAuthenticated } from "@components/common/ProtectedRoute";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addDays, format, startOfWeek, subDays } from "date-fns";
import AddHabitSheet from "../(features)/habits/AddHabitSheet";
import { Spinner } from "@components/ui/Spinner";
import { useAlert } from "@components/ui/AlertProvider";

import {
  deleteHabit,
  getDayLogsMap,
  onHabits,
  setTaskChecked,
  setMetricProgress,
} from "../(features)/habits/service";
import { useTokens } from "../providers/ThemeProvider";
import { useAuth } from "../providers/AuthProvider";
import { getUserHabits } from "@app/lib/firebaseHelpers";
import { getCurrentUserId } from "@app/lib/firebase";
import { Habit } from "@app/lib/firebaseHelpers";
import DailyMetricCard from "@app/(features)/habits/DailyMetricCard";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function HabitsTabContent() {
  const r = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(new Date());
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true);
  const t = useTokens();
  const { user } = useAuth();
  const date = useMemo(() => todayStr(), []);
  const [selectedDateStr, setSelectedDateStr] = useState(date);
  const today = new Date();
  const userId = getCurrentUserId();
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [loadingMetrics, setLoadingMetrics] = useState<Set<string>>(new Set()); // Track metric habit loading states
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [taskLength, setTaskLength] = useState<number>(0);
  const { showConfirm } = useAlert();
  const [alertLoading, setAlertLoading] = useState<boolean>(false);
  // Function to fetch logs for a specific date
  const fetchLogsForDate = async (dateStr: string) => {
    setLoadingLogs(true);
    try {
      const dayLogs = await getDayLogsMap(dateStr);
      setCompletedTasks(
        Object.values(dayLogs).filter((log) => log.completed).length
      );
      setLogs(dayLogs);
    } catch (error) {
      console.error("Error fetching habit logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    getUserHabits(userId as any).then((habits: Habit[]) => {
      setHabits(habits);
      setTaskLength(habits.filter((h) => h.kind === "task" && !h.archived).length);
    });

    // Fetch today's habit logs initially
    fetchLogsForDate(date);

    return () => {};
  }, []);

  const taskHabits = habits.filter((h) => {
    return !h.archived;
  });

  const s = createStyles(t);
  const handleDeleteHabit = async (habitId: string) => {
    try {
      setDeletingHabitId(habitId);
      setAlertLoading(true);
      await deleteHabit(habitId);
      setHabits(habits.filter((h) => h.id !== habitId));
      setTimeout(() => {
        setAlertLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error deleting habit:", error);
      alert("Failed to delete habit");
    } finally {
      setDeletingHabitId(null);
      setAlertLoading(false);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek =
      direction === "prev" ? subDays(currentWeek, 7) : addDays(currentWeek, 7);
    setCurrentWeek(newWeek);
  };

  /**
   * Handler for incrementing metric habit value
   * 
   * Features implemented:
   * - Increments by 20% of the habit's goal
   * - Caps at 100% (goal value) - prevents over-incrementing
   * - Updates Firestore with new value
   * - Updates local state for immediate UI feedback
   * - Loading state management with spinner
   * - Error handling for failed updates
   */
  const handleMetricIncrement = async (habitId: string, goal: number) => {
    const currentValue = logs[habitId]?.value ?? 0;
    const incrementUnit = Math.floor(goal * 0.2); // 20% of goal as increment unit
    
    // If incrementUnit is 0, use decimal increment (up to 1 decimal place)
    const actualIncrement = incrementUnit === 0 ? Math.round((goal * 0.2) * 10) / 10 : incrementUnit;
    const newValue = incrementUnit === 0 
      ? Math.round(Math.min(goal, currentValue + actualIncrement) * 10) / 10
      : Math.floor(Math.min(goal, currentValue + incrementUnit)); // Cap at goal (100%)
    // Only update if we haven't reached the goal
    if (newValue > currentValue) {
      // Set loading state for this specific habit
      setLoadingMetrics((prev) => new Set(prev).add(habitId));
      
      try {
        await setMetricProgress(habitId, selectedDateStr, newValue);
        setLogs({
          ...logs,
          [habitId]: { ...logs[habitId], value: newValue },
        });
      } catch (error) {
        console.error("Error updating metric habit:", error);
      } finally {
        // Remove loading state
        setLoadingMetrics((prev) => {
          const newSet = new Set(prev);
          newSet.delete(habitId);
          return newSet;
        });
      }
    }
  };

  /**
   * Handler for decrementing metric habit value
   * 
   * Features implemented:
   * - Decrements by 20% of the habit's goal
   * - Floors at 0% - prevents negative values
   * - Updates Firestore with new value
   * - Updates local state for immediate UI feedback
   * - Loading state management with spinner
   * - Error handling for failed updates
   */
  const handleMetricDecrement = async (habitId: string, goal: number) => {
    const currentValue = logs[habitId]?.value ?? 0;
    const decrementUnit = Math.floor(goal * 0.2); // 20% of goal as decrement unit
    
    // If decrementUnit is 0, use decimal decrement (up to 1 decimal place)
    const actualDecrement = decrementUnit === 0 ? Math.round((goal * 0.2) * 10) / 10 : decrementUnit;
    const newValue = decrementUnit === 0 
      ? Math.round(Math.max(0, currentValue - actualDecrement) * 10) / 10
      : Math.floor(Math.max(0, currentValue - decrementUnit)); // Floor at 0
    
    // Only update if we haven't reached the minimum
    if (newValue < currentValue) {
      // Set loading state for this specific habit
      setLoadingMetrics((prev) => new Set(prev).add(habitId));
      
      try {
        await setMetricProgress(habitId, selectedDateStr, newValue);
        setLogs({
          ...logs,
          [habitId]: { ...logs[habitId], value: newValue },
        });
      } catch (error) {
        console.error("Error updating metric habit:", error);
      } finally {
        // Remove loading state
        setLoadingMetrics((prev) => {
          const newSet = new Set(prev);
          newSet.delete(habitId);
          return newSet;
        });
      }
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Start on Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const isToday = (date: Date) => {
    return format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  };

  const isPastDay = (date: Date) => {
    return date < today && !isToday(date);
  };

  const isFutureDay = (date: Date) => {
    return date > today;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Weekly Calendar */}

        <View style={s.weeklyCalendar}>
          <View style={s.weekNavigation}>
            <Pressable onPress={() => navigateWeek("prev")} style={s.navButton}>
              <Text style={s.navArrow}>‹</Text>
            </Pressable>
            <Text style={s.weekTitle}>This week</Text>
            <Pressable onPress={() => navigateWeek("next")} style={s.navButton}>
              <Text style={s.navArrow}>›</Text>
            </Pressable>
          </View>

          <View style={[s.dayCircles]}>
            {getWeekDays().map((day, index) => {
              const dayAbbr = format(day, "EEE").slice(0, 2);
              const dayNum = format(day, "d");
              const month = format(day, "M");
              const isCurrentDay = isToday(day);
              const isPast = isPastDay(day);
              const isFuture = isFutureDay(day);
              const isSelectedDay =
                format(day, "yyyy-MM-dd") === selectedDateStr;
              return (
                <View key={index} style={s.dayContainer}>
                  {isCurrentDay ? (
                    <Text style={[s.dayText, { color: "#00D4AA" }]}>
                      {month + "/" + dayNum}
                    </Text>
                  ) : (
                    <Text style={s.dayText}>{dayNum}</Text>
                  )}
                  <View
                    style={[
                      s.dayCircle,
                      isCurrentDay && s.dayCircleToday,
                      isPast && s.dayCirclePast,
                      isFuture && s.dayCircleFuture,
                      isSelectedDay && !isCurrentDay && s.dayCircleSelected,
                      {
                        borderWidth: 2,
                        borderRadius: "100%",
                        borderColor:
                          isSelectedDay && !isCurrentDay
                            ? t.colors.primary // Primary color for selected day (not today)
                            : isPast
                            ? t.colors.secondary // Secondary color for past days
                            : isCurrentDay
                            ? t.colors.success // Success color for today
                            : t.colors.muted, // Muted color for future days
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.dayText,
                        isCurrentDay && s.dayTextToday,
                        isPast && s.dayTextPast,
                        isFuture && s.dayTextFuture,
                        isSelectedDay && !isCurrentDay && s.dayTextSelected,
                      ]}
                      onPress={() => {
                        const selectedDay = getWeekDays()[index];
                        setCurrentDay(selectedDay);
                        // Convert Date to YYYY-MM-DD format for database queries
                        const formattedDate = format(selectedDay, "yyyy-MM-dd");
                        setSelectedDateStr(formattedDate);
                        // Fetch logs for the selected day
                        fetchLogsForDate(formattedDate);
                      }}
                    >
                      {dayAbbr}
                    </Text>
                  </View>
                  {/* Workout status indicators */}
                  <View style={s.workoutIndicator}>
                    {isPast && (
                      <View style={s.workoutIcon}>
                        <Text style={s.dumbbellIcon}>🏋️</Text>
                        <Text style={s.checkIcon}>✓</Text>
                      </View>
                    )}
                    {isCurrentDay && (
                      <View style={s.workoutIcon}>
                        <Text style={s.dumbbellIcon}>🏋️</Text>
                        <Text style={s.xIcon}>✗</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Greeting */}
        <View style={s.greetingSection}>
          <Text style={s.greeting}>Morning, {user?.displayName}!</Text>
        </View>
        {/* Daily Metrics */}
        <View style={s.dailyMetricsSection}>
          <Text style={s.bonusGoalTitle}>
            Daily Metrics : <Text style={{ fontSize:25, fontWeight:'800', color: t.colors.muted}}>{taskHabits.length - taskLength}</Text> active
          </Text>

          <ScrollView horizontal style={s.dailyMetricsContainer}>
            {taskHabits
              .filter((h) => h.kind === "metric")
              .map((h) => {
                const goal = h.goal ?? 1;
                const currentValue = logs[h.id!]?.value ?? 0;
                // Boundary logic: prevent incrementing at 100% and decrementing at 0%
                const canIncrement = currentValue < goal; // Can't increment if at 100%
                const canDecrement = currentValue > 0; // Can't decrement if at 0%
                const isLoading = loadingMetrics.has(h.id!); // Check if this habit is loading
                
                return (
                
                  <DailyMetricCard
                    key={h.id}
                    habit={h as Habit}
                    onInc={() => handleMetricIncrement(h.id!, goal)}
                    onDec={() => handleMetricDecrement(h.id!, goal)}
                    value={currentValue}
                    canIncrement={canIncrement}
                    canDecrement={canDecrement}
                    isLoading={isLoading}
                  />
                );
              })}
          </ScrollView>
        </View>
        {/* Yesterday's Checklist */}
        <View style={s.checklistSection}>
          <Pressable
            onPress={() => setIsChecklistExpanded(!isChecklistExpanded)}
            style={s.checklistHeader}
          >
            <Text style={s.checklistTitle}>
              {selectedDateStr === date
                ? "Today's tasks"
                : `${format(
                    new Date(selectedDateStr + "T00:00:00"),
                    "EEEE, MMM d"
                  )}'s tasks`}
            </Text>
            <Text style={s.checklistCount}>
              {completedTasks}/{taskLength} completed
            </Text>
            <Text style={s.expandIcon}>{isChecklistExpanded ? "⌄" : "⌃"}</Text>
          </Pressable>

          {isChecklistExpanded && (
            <View style={s.checklistItems}>
              {loadingLogs || alertLoading ? (
                <View style={s.loadingContainer}>
                  <Spinner size={24} color={t.colors.muted} type="dots" />
                  <Text style={s.loadingText}>Loading tasks...</Text>
                </View>
              ) : (
                taskHabits.filter((h) => h.kind === "task").map((h) => {
                  const checked = !!logs[h.id!]?.completed;
                  return (
                    <View key={h.id} style={s.taskCard}>
                      <View style={s.taskIcon}>
                        <Text style={s.taskEmoji}>{h.icon ?? "🏋️"}</Text>
                      </View>
                      <View style={s.taskContent}>
                        <Text style={[s.taskTitle, checked && s.taskCompleted]}>
                          {h.name}
                        </Text>
                        {h.description && (
                          <Text style={s.taskDescription}>{h.description}</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => {
                          showConfirm(
                            "Delete Habit",
                            "Are you sure you want to delete this habit?",
                            () => {
                              setAlertLoading(true);
                              handleDeleteHabit(h.id!);
                              setTimeout(() => {
                                setAlertLoading(false);
                              }, 500);
                            },
                            () => {
                              setAlertLoading(false);
                            }
                          );
                        }}
                        style={s.deleteIconContainer}
                      >
                        <Text style={s.deleteIcon}>🗑️</Text>
                      </Pressable>
                      <View style={s.taskAction}>
                        {checked ? (
                          <View style={s.checkmarkContainer}>
                            <Text style={s.checkmark}>✓</Text>
                          </View>
                        ) : loadingTasks.has(h.id!) ? (
                          <View style={s.spinnerContainer}>
                            <Spinner
                              size={16}
                              color={t.colors.muted}
                              type="dots"
                            />
                          </View>
                        ) : (
                          <Pressable
                            onPress={async () => {
                              const next = !checked;
                              setLoadingTasks((prev) =>
                                new Set(prev).add(h.id!)
                              );
                              try {
                                await setTaskChecked(
                                  h.id!,
                                  selectedDateStr,
                                  next
                                );
                                setLogs({
                                  ...logs,
                                  [h.id!]: { ...logs[h.id!], completed: next },
                                });
                                setCompletedTasks(
                                  completedTasks + (next ? 1 : -1)
                                );
                              } catch (error) {
                                console.error("Error updating task:", error);
                              } finally {
                                setLoadingTasks((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(h.id!);
                                  return newSet;
                                });
                              }
                            }}
                            style={s.taskArrow}
                          >
                            <Text style={s.arrowIcon}>›</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Bonus Goal */}
        <View style={s.bonusGoalSection}>
          <Text style={s.bonusGoalTitle}>Bonus Goal</Text>
          <Text style={s.stepsText}>
            You've reached your steps goal! Synced from Apple Health a few
            seconds ago
          </Text>
          <View style={s.progressContainer}>
            <View style={s.progressBar}>
              <View style={s.progressFill} />
            </View>
            <View style={s.progressText}>
              <Text style={s.stepsCount}>8,440 / 5,000 steps</Text>
              <Text style={s.stepsPercentage}>100%</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setShowAdd(true)}
        style={[s.fab, { backgroundColor: t.colors.primary }]}
      >
        <Text style={s.fabText}>＋</Text>
      </Pressable>
      <AddHabitSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onCreateNew={(habit: Habit) => {
          setHabits([...habits, habit]);
          setShowAdd(false);
          r.push("/(tabs)/daily");
        }}
      />
    </SafeAreaView>
  );
}

export default function HabitsTab() {
  return (
    <FullyAuthenticated>
      <HabitsTabContent />
    </FullyAuthenticated>
  );
}

function to12h(hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => Number(n));
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )} ${ampm}`;
}

const createStyles = (t: any) =>
  StyleSheet.create({
    // Daily Summary
    dailySummary: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    streakContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    flameIcon: {
      fontSize: 20,
    },
    streakNumber: {
      fontSize: 18,
      fontWeight: "700",
      color: t.colors.text,
    },
    todayDate: {
      fontSize: 16,
      fontWeight: "500",
      color: t.colors.muted,
      marginTop: 8,
    },

    // Weekly Calendar
    weeklyCalendar: {
      paddingHorizontal: 6,
      marginHorizontal: 14,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: 16,
      paddingVertical: 15,
      marginBottom: 16,
    },
    weekNavigation: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    navButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    navArrow: {
      fontSize: 24,
      color: t.colors.muted,
      fontWeight: "600",
    },
    weekTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: t.colors.text,
    },
    dayCircles: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    dayContainer: {
      alignItems: "center",
      gap: 8,
    },
    dayCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "white",
    },
    dayCircleToday: {
      backgroundColor: "white",
    },
    dayCirclePast: {
      backgroundColor: "white",
    },
    dayCircleFuture: {
      backgroundColor: "white",
    },
    dayCircleSelected: {
      backgroundColor: "white",
    },
    dayText: {
      fontSize: 14,
      fontWeight: "600",
      color: t.colors.muted,
    },
    dayTextToday: {
      color: t.colors.success, // Match the border color for today
      fontWeight: "700", // Make it bolder
    },
    dayTextPast: {
      color: t.colors.secondary, // Match the border color for past days
      fontWeight: "600",
    },
    dayTextFuture: {
      color: t.colors.muted,
    },
    dayTextSelected: {
      color: t.colors.primary, // Match the border color for selected days
      fontWeight: "700",
    },
    workoutIndicator: {
      height: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    workoutIcon: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    dumbbellIcon: {
      fontSize: 12,
    },
    checkIcon: {
      fontSize: 10,
      color: t.colors.success,
      fontWeight: "bold",
    },
    xIcon: {
      fontSize: 10,
      color: t.colors.danger,
      fontWeight: "bold",
    },
    deleteIcon: {
      fontSize: 16,
      color: t.colors.danger,
      fontWeight: "bold",
      opacity: 0.5,
    },
    // Greeting
    greetingSection: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    greeting: {
      fontSize: 24,
      fontWeight: "700",
      color: t.colors.text,
    },

    // Daily Metrics
    dailyMetricsSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginHorizontal: 16,
    },
    dailyMetricsContainer: {
      flex: 1,
      flexDirection: "row",
      // flexWrap: "wrap",
      gap: 12,
    },
    // Checklist
    checklistSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    checklistHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    checklistTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: t.colors.text,
    },
    checklistCount: {
      fontSize: 14,
      color: t.colors.muted,
    },
    deleteIconContainer: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    expandIcon: {
      fontSize: 16,
      color: t.colors.muted,
    },
    checklistItems: {
      gap: 12,
    },
    taskCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.colors.card,
      borderRadius: 12,
      padding: 16,
      ...t.shadows.small,
    },
    taskIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: t.colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    taskEmoji: {
      fontSize: 18,
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: t.colors.text,
    },
    taskCompleted: {
      textDecorationLine: "line-through",
      color: t.colors.muted,
    },
    taskDescription: {
      fontSize: 14,
      color: t.colors.muted,
      marginTop: 2,
    },
    taskAction: {
      marginLeft: 12,
    },
    checkmarkContainer: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: t.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    checkmark: {
      fontSize: 14,
      color: t.colors.bg,
      fontWeight: "bold",
    },
    taskArrow: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    arrowIcon: {
      fontSize: 16,
      color: t.colors.muted,
    },
    spinnerContainer: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: t.colors.muted,
      fontWeight: "500",
    },

    // Bonus Goal
    bonusGoalSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 32,
    },
    bonusGoalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: t.colors.text,
      marginBottom: 8,
    },
    metricNumber: {
      fontSize: 16,
      color: "#999999", // Light gray color
    },
    stepsText: {
      fontSize: 14,
      color: t.colors.muted,
      marginBottom: 12,
    },
    progressContainer: {
      gap: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: t.colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      width: "100%",
      backgroundColor: t.colors.success,
      borderRadius: 4,
    },
    progressText: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    stepsCount: {
      fontSize: 14,
      fontWeight: "600",
      color: t.colors.text,
    },
    stepsPercentage: {
      fontSize: 14,
      fontWeight: "600",
      color: t.colors.success,
    },

    // FAB
    fab: {
      position: "absolute",
      right: 18,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      ...t.shadows.medium,
    },
    fabText: {
      color: "white",
      fontSize: 28,
      lineHeight: 30,
      fontWeight: "900",
    },
  });
