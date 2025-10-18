import { getCurrentUserId } from "@app/lib/firebase";
import { usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import {
  Habit,
  WeightLog,
  createWeightLog,
  getHabitEntries,
  getUserHabits,
  getUserProfile,
  getUserWeightLogs
} from "../lib/firebaseHelpers";
import { useTokens } from "../providers/ThemeProvider";
import StrikeCalendarModal from "@app/(features)/habits/StrikeCalendarModal";

const screenWidth = Dimensions.get("window").width;

export default function Progress() {
  const pathname = usePathname();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileCompletionDate, setProfileCompletionDate] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [habitEntryData, setHabitEntryData] = useState<{ habitId: string | undefined, entries: number }[]>([]);
  const [weightInput, setWeightInput] = useState<string>("");
  const [isSubmittingWeight, setIsSubmittingWeight] = useState<boolean>(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const userId = getCurrentUserId();
  const t = useTokens();
  const loadData = async () => {
    try {
      const [profileData, habitData] = await Promise.all([
        getUserProfile(),
        getUserHabits(true), // Get active habits only

      ]);

      setHabits(habitData);

      setProfile(profileData);
      const Entries = await Promise.all(habitData.map(async habit => {
        let habitId = habit.id;
        let entries = await getHabitEntries(habit.id || '0');
        return { habitId, entries: Object.keys(entries).length };
      }))

      setHabitEntryData(Entries);
      if (profileData?.createdAt) {
        // Convert Firebase timestamp to date string
        const completionDate = profileData.createdAt.toDate ?
          profileData.createdAt.toDate().toISOString().split("T")[0] :
          new Date(profileData.createdAt).toISOString().split("T")[0];

        setProfileCompletionDate(completionDate);

        // Get weight logs from profile completion to today
        const today = new Date().toISOString().split("T")[0];
        const weightData = await getUserWeightLogs();
        
        setWeightLogs(weightData);
      } else {
        // Fallback: get last 30 days if no profile completion date
        const weightData = await getUserWeightLogs(30);
        setWeightLogs(weightData);
      }
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

  }, [pathname]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleHabitPress = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedHabit(null);
  };

  const handleWeightSubmit = async () => {
    if (!weightInput.trim()) {
      Alert.alert("Error", "Please enter your weight");
      return;
    }

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert("Error", "Please enter a valid weight");
      return;
    }

    setIsSubmittingWeight(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const userWeightUnit = profile?.weight?.unit || 'kg';

      await createWeightLog({
        weight: weight,
        unit: userWeightUnit,
        date: today,
        notes: ""
      });

      // Clear input and refresh data
      setWeightInput("");
      await loadData();
      Alert.alert("Success", `Weight logged successfully in ${userWeightUnit}!`);
    } catch (error) {
      console.error("Error submitting weight:", error);
      Alert.alert("Error", "Failed to log weight. Please try again.");
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  // Prepare chart data from profile completion to today
  const prepareChartData = () => {
    // Initialize chart data arrays
    const chartWeights: number[] = [];
    const chartLabels: string[] = [];

    // Get the user's preferred weight unit from profile
    const userWeightUnit = profile?.weight?.unit || 'kg';

    // Add profile weight as first data point if available
    if (profile?.weight?.value) {
      chartWeights.push(profile.weight.value); // Use weight value in original unit

      // Use createdAt if available, otherwise use updatedAt
      const profileDate = profile.createdAt || profile.updatedAt;
      if (profileDate) {
        let dateString: string;

        // Handle Firebase Timestamp format
        if (profileDate.toDate && typeof profileDate.toDate === 'function') {
          dateString = profileDate.toDate().toISOString().split("T")[0];
        }
        // Handle regular Date object
        else if (profileDate instanceof Date) {
          dateString = profileDate.toISOString().split("T")[0];
        }
        // Handle string or number timestamp
        else {
          dateString = new Date(profileDate).toISOString().split("T")[0];
        }

        chartLabels.push(dateString);
      }
    }

    // Sort weight logs by date chronologically
    const sortedLogs = weightLogs
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Add weight logs in their original units
    const weightsInOriginalUnit = sortedLogs.map(log => log.weight);
    chartWeights.push(...weightsInOriginalUnit);

    // Create labels for weight logs - show every 3rd date to avoid crowding
    const weightLogLabels = sortedLogs.map((log, index) => {
      const date = new Date(log.date);
      // Show every 3rd date or first/last date
      if (index === 0 || index === sortedLogs.length - 1 || index % 3 === 0) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return "";
    });

    chartLabels.push(...weightLogLabels);

    // Handle single data point case (only profile weight)
    if (chartWeights.length === 1) {
      const singleWeight = chartWeights[0];
      const padding = Math.max(singleWeight * 0.1, 5); // 10% or 5 unit padding
      const minWeight = singleWeight - padding;
      const maxWeight = singleWeight + padding;

      return {
        labels: ["", chartLabels[0] || "", ""],
        datasets: [{
          data: [minWeight, singleWeight, maxWeight],
          color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
          strokeWidth: 3
        }]
      };
    }

    return {
      labels: chartLabels,
      datasets: [{
        data: chartWeights,
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 3
      }]
    };
  };

  // Calculate habit completion rate
  const getHabitCompletionRate = (habit: Habit): number => {
    const today = new Date();
    const profileDate = profile.createdAt || profile.updatedAt;
    const days = profileDate ? Math.floor((today.getTime() - new Date(profileDate.toDate ? profileDate.toDate() : profileDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;

    const completedDays = (habitEntryData.find(entry => entry.habitId == habit.id)?.entries || 0);

    return Math.round((completedDays / days) * 100);
  };

  const chartData = prepareChartData();
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.colors.bg }]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Text style={[styles.loadingText, { color: t.colors.muted }]}>Loading your progress...</Text>
      </View>
    );
  }
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: t.colors.bg }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Weight Progress Section */}
      <View style={[styles.section, { backgroundColor: t.colors.card }, t.shadows.medium]}>
        <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Weight Progress</Text>

        {chartData.datasets[0].data.length > 0 ? (
          <>
            <View style={styles.chartContainer}>
              <Text style={[styles.chartTitle, { color: t.colors.text }]}>
                Weight Progress from Profile Completion to Today
              </Text>
              <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={280}
                yAxisSuffix={profile?.weight?.unit || 'kg'}
                chartConfig={{
                  backgroundColor: t.colors.card,
                  backgroundGradientFrom: t.colors.card,
                  backgroundGradientTo: t.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(${t.colors.text === '#F2F2F2' ? '242, 242, 242' : '0, 0, 0'}, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: chartData.datasets[0].data.length === 3 ? "8" : "5", // Larger dot for single point (padded to 3)
                    strokeWidth: "2",
                    stroke: "#8641f4"
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: "5,5",
                    stroke: t.colors.border
                  }
                }}
                bezier={chartData.datasets[0].data.length > 3} // Only use bezier for multiple real points
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
              />
              {/* <Text style={[styles.chartSubtitle, { color: t.colors.muted }]}>
                {chartData.datasets[0].data.length === 3 
                  ? `Starting weight: ${formatWeight(profile?.weight, profile?.weight?.unit || 'kg')}`
                  : `Y-axis: 5${profile?.weight?.unit || 'kg'} intervals • X-axis: From ${profileCompletionDate} to today`
                }
              </Text> */}
            </View>

            {/* Weight Trend - only show if more than 1 real data point
            {weightTrend && chartData.datasets[0].data.length > 3 && (
              <View style={[styles.trendContainer, { backgroundColor: t.colors.bg }]}>
                <Text style={[styles.trendLabel, { color: t.colors.muted }]}>Weekly Trend:</Text>
                <Text style={[
                  styles.trendValue,
                  { color: weightTrend.trend >= 0 ? t.colors.danger : t.colors.success }
                ]}>
                  {weightTrend.trend >= 0 ? "+" : ""}{weightTrend.trend.toFixed(1)} {weightTrend.unit}/week
                </Text>
              </View>
            )} */}

            {/* Latest Weight */}
            <View style={[styles.latestWeightContainer, { backgroundColor: t.colors.primary + '20' }]}>
              <Text style={[styles.latestWeightLabel, { color: t.colors.primary }]}>
                {chartData.datasets[0].data.length === 3
                  ? "Starting Weight:"
                  : "Current Weight:"
                }
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.latestWeightValue, { color: t.colors.primary }]}>
                  {
                    weightLogs[weightLogs.length - 1]?.weight
                  }
                </Text>
                <Text style={[styles.latestWeightLabel, { color: t.colors.primary, fontSize: 14 }]}>{profile?.weight?.unit || 'kg'}</Text>
              </View>
            </View>

            {/* Single point message */}
            {chartData.datasets[0].data.length === 3 && (
              <View style={[styles.singlePointMessage, { backgroundColor: t.colors.success + '20' }]}>
                <Text style={[styles.singlePointText, { color: t.colors.success }]}>
                  📊 This is your starting weight from profile completion
                </Text>
                <Text style={[styles.singlePointSubtext, { color: t.colors.success }]}>
                  Log more weights to see your progress over time
                </Text>
              </View>
            )}

            {/* Weight Input Section */}
            <View style={[styles.weightInputContainer, { backgroundColor: t.colors.bg, borderColor: t.colors.border }]}>
              <Text style={[styles.weightInputTitle, { color: t.colors.text }]}>
                Log Current Weight
              </Text>
              <Text style={[styles.weightInputSubtitle, { color: t.colors.muted }]}>
                Enter weight in {profile?.weight?.unit || 'kg'} (same unit as your profile)
              </Text>
              <View style={styles.weightInputRow}>
                <TextInput
                  style={[styles.weightInput, {
                    backgroundColor: t.colors.card,
                    color: t.colors.text,
                    borderColor: t.colors.border
                  }]}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  placeholder={`Enter weight`}
                  placeholderTextColor={t.colors.muted}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={handleWeightSubmit}
                />
                <View style={[styles.unitIndicator, { backgroundColor: t.colors.primary + '20' }]}>
                  <Text style={[styles.unitText, { color: t.colors.primary }]}>
                    {profile?.weight?.unit || 'kg'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: isSubmittingWeight ? t.colors.muted : t.colors.primary
                    }
                  ]}
                  onPress={handleWeightSubmit}
                  disabled={isSubmittingWeight}
                >
                  {isSubmittingWeight ? (
                    <ActivityIndicator size="small" color={t.colors.bg} />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: t.colors.bg }]}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: t.colors.muted }]}>No weight data available</Text>
            <Text style={[styles.emptyStateSubtext, { color: t.colors.muted }]}>
              {profileCompletionDate
                ? `Start logging your weight since ${profileCompletionDate} to see progress`
                : "Start logging your weight to see progress"
              }
            </Text>
          </View>
        )}

      </View>

      {/* Habit Progress Section */}
      <View style={[styles.section, { backgroundColor: t.colors.card }, t.shadows.medium]}>
        <Text style={[styles.sectionTitle, { color: t.colors.text }]}>Habit Progress</Text>
        <Text style={[styles.weightInputSubtitle, { color: t.colors.muted }]}>
          Habit completion rates since profile creation
        </Text>
        {habits.length > 0 ? (
          <View style={styles.habitsContainer}>
            {habits.map((habit) => {
              const completionRate = getHabitCompletionRate(habit);
              return (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => handleHabitPress(habit)}
                  style={[styles.section, styles.habitItem, { backgroundColor: t.colors.bg, borderLeftColor: t.colors.primary, margin: 0 }, t.shadows.small]}
                >
                  <View style={styles.habitIcon}>
                    <Text style={[styles.habitName, { color: t.colors.text }]}>{habit.icon}</Text>
                  </View>
                  <View style={styles.habitInfo}>
                    <Text style={[styles.habitName, { color: t.colors.text }]}>{habit.name}</Text>
                    <Text style={[styles.habitDescription, { color: t.colors.muted }]}>
                      {habitEntryData.find(entry => entry.habitId == habit.id)?.entries || 0} days streak
                    </Text>
                  </View>
                  <View style={styles.habitStats}>
                    <View style={[{
                      shadowColor: t.colors.primary,
                      backgroundColor: 'transparent'
                    }]}>
                      {/* <ProgressRing
                        size={56}
                        stroke={8}
                        progress={completionRate / 100}
                        track={t.colors.border}
                        color={t.colors.primary}
                        center={(
                          <Text style={[{ color: t.colors.text }]}>
                            {completionRate}%
                          </Text>
                        )}
                      /> */}
                    </View>
                  </View>

                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: t.colors.muted }]}>No active habits</Text>
            <Text style={[styles.emptyStateSubtext, { color: t.colors.muted }]}>Create habits to track your progress</Text>
          </View>
        )}
      </View>

      {/* Strike Calendar Modal */}
      <StrikeCalendarModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        habit={selectedHabit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  section: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  trendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  trendValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  latestWeightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
  },
  latestWeightLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  latestWeightValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  habitsContainer: {
    gap: 12,
  },
  habitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
  },
  habitIcon: {
    alignItems: "flex-start",
    minWidth: 30,
    marginRight: 12,
  },
  habitStats: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  completionRate: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  singlePointMessage: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  singlePointText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  singlePointSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  weightInputContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  weightInputTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  weightInputSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  weightInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  weightInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minWidth: 64,
  },
  unitIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 50,
    alignItems: "center",
  },
  unitText: {
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});