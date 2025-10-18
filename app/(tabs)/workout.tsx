import { useTokens } from "@app/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { UserPlan, getUserPlan } from "../lib/firebaseHelpers";
const { width } = Dimensions.get('window');

export default function Workout() {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTokens();
  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const plan = await getUserPlan();
      setUserPlan(plan);
    } catch (err) {
      console.error("Error fetching user plan:", err);
      setError("Failed to load workout plan");
    } finally {
      setLoading(false);
    }
  };

  const renderWorkoutPlan = () => {
    if (!userPlan?.workoutPlan?.weeklySchedule || userPlan.workoutPlan.weeklySchedule.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: t.colors.card }]}>
          <LinearGradient
            colors={[t.colors.primary, t.colors.secondary]}
            style={styles.emptyStateGradient}
          >
            <View style={styles.emptyStateContent}>
              <Ionicons name="fitness-outline" size={64} color="white" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No Workout Plan Available</Text>
              <Text style={styles.emptySubtext}>
                Complete onboarding to generate your personalized workout plan
              </Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <ScrollView style={styles.workoutContainer} showsVerticalScrollIndicator={false}>
        {userPlan.workoutPlan.weeklySchedule.map((dayPlan, index) => (
          <View key={index} style={[styles.dayCard, { backgroundColor: t.colors.card }, t.shadows.medium]}>
            <View style={[styles.dayCardGradient, { backgroundColor: t.colors.card }]}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayIconContainer, { backgroundColor: t.colors.primary + '20' }]}>
                  <Ionicons name="calendar" size={24} color={t.colors.primary} />
                </View>
                <View style={styles.dayHeaderInfo}>
                  <Text style={[styles.dayName, { color: t.colors.text }]}>Day {dayPlan.day}</Text>
                  <Text style={[styles.dayFocus, { color: t.colors.muted }]}>{dayPlan.focus}</Text>
                  <Text style={[styles.dayDuration, { color: t.colors.muted }]}>{dayPlan.durationMinutes} minutes</Text>
                </View>
              </View>
              
              {/* Warm Up Section */}
              {dayPlan.warmUp && dayPlan.warmUp.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="play-circle" size={16} color={t.colors.muted} />
                    <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Warm Up</Text>
                  </View>
                  {dayPlan.warmUp.map((exercise, exerciseIndex) => (
                    <View key={exerciseIndex} style={[styles.exerciseRow, { backgroundColor: t.colors.bg }, t.shadows.small]}>
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exerciseName, { color: t.colors.text }]}>{exercise.exercise}</Text>
                        <Text style={[styles.exerciseDetails, { color: t.colors.muted }]}>
                          {exercise.duration}
                        </Text>
                      </View>
                      {exercise.notes && (
                        <View style={[styles.exerciseNotesContainer, { backgroundColor: t.colors.primary + '20' }]}>
                          <Text style={[styles.exerciseNotes, { color: t.colors.primary }]}>{exercise.notes}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Main Session Section */}
              {dayPlan.mainSession && dayPlan.mainSession.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="barbell" size={16} color={t.colors.muted} />
                    <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Main Session</Text>
                  </View>
                  {dayPlan.mainSession.map((exercise, exerciseIndex) => (
                    <View key={exerciseIndex} style={[styles.exerciseRow, { backgroundColor: t.colors.bg }, t.shadows.small]}>
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exerciseName, { color: t.colors.text }]}>{exercise.exercise}</Text>
                        <Text style={[styles.exerciseDetails, { color: t.colors.muted }]}>
                          {exercise.sets} sets × {exercise.reps} reps @ RPE {exercise.rpe} | {exercise.restSec}s rest
                        </Text>
                      </View>
                      {exercise.notes && (
                        <View style={[styles.exerciseNotesContainer, { backgroundColor: t.colors.primary + '20' }]}>
                          <Text style={[styles.exerciseNotes, { color: t.colors.primary }]}>{exercise.notes}</Text>
                        </View>
                      )}
                      {exercise.alternativeForInjury && (
                        <View style={[styles.alternativeContainer, { backgroundColor: t.colors.primary + '10' }]}>
                          <Text style={[styles.alternativeLabel, { color: t.colors.primary }]}>Alternative:</Text>
                          <Text style={[styles.alternativeText, { color: t.colors.muted }]}>{exercise.alternativeForInjury}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Supersets Section */}
              {dayPlan.supersets && dayPlan.supersets.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="swap-horizontal" size={16} color={t.colors.muted} />
                    <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Supersets</Text>
                  </View>
                  {dayPlan.supersets.map((superset, supersetIndex) => (
                    <View key={supersetIndex} style={[styles.supersetContainer, { backgroundColor: t.colors.bg }, t.shadows.small]}>
                      <Text style={[styles.supersetName, { color: t.colors.text }]}>{superset.name}</Text>
                      {superset.exercises.map((exercise, exerciseIndex) => (
                        <View key={exerciseIndex} style={styles.supersetExercise}>
                          <View style={styles.exerciseInfo}>
                            <Text style={[styles.exerciseName, { color: t.colors.text }]}>{exercise.exercise}</Text>
                            <Text style={[styles.exerciseDetails, { color: t.colors.muted }]}>
                              {exercise.sets} sets × {exercise.reps} reps @ RPE {exercise.rpe} | {exercise.restSec}s rest
                            </Text>
                          </View>
                          {exercise.notes && (
                            <View style={[styles.exerciseNotesContainer, { backgroundColor: '#FF6B35' + '20' }]}>
                              <Text style={[styles.exerciseNotes, { color: '#FF6B35' }]}>{exercise.notes}</Text>
                            </View>
                          )}
                          {exercise.alternativeForInjury && (
                            <View style={[styles.alternativeContainer, { backgroundColor: '#FF6B35' + '10' }]}>
                              <Text style={[styles.alternativeLabel, { color: '#FF6B35' }]}>Alternative:</Text>
                              <Text style={[styles.alternativeText, { color: t.colors.muted }]}>{exercise.alternativeForInjury}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {/* Conditioning Section */}
              {dayPlan.conditioning && (
                <View style={[styles.conditioningContainer, { backgroundColor: t.colors.primary + '20' }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flash" size={16} color={t.colors.muted} />
                    <Text style={[styles.conditioningLabel, { color: t.colors.text }]}>Conditioning</Text>
                  </View>
                  <View style={styles.conditioningRow}>
                    <View style={styles.conditioningInfo}>
                      <Text style={[styles.conditioningProtocol, { color: t.colors.text }]}>{dayPlan.conditioning.protocol}</Text>
                      <Text style={[styles.conditioningWork, { color: t.colors.text }]}>{dayPlan.conditioning.work}</Text>
                      <Text style={[styles.conditioningRest, { color: t.colors.muted }]}>Rest: {dayPlan.conditioning.rest}</Text>
                      {dayPlan.conditioning.notes && (
                        <Text style={[styles.conditioningNotes, { color: t.colors.muted }]}>{dayPlan.conditioning.notes}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Cool Down Section */}
              {dayPlan.coolDown && dayPlan.coolDown.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="pause-circle" size={16} color={t.colors.muted} />
                    <Text style={[styles.sectionLabel, { color: t.colors.text }]}>Cool Down</Text>
                  </View>
                  {dayPlan.coolDown.map((exercise, exerciseIndex) => (
                    <View key={exerciseIndex} style={[styles.exerciseRow, { backgroundColor: t.colors.bg }, t.shadows.small]}>
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exerciseName, { color: t.colors.text }]}>{exercise.exercise}</Text>
                        <Text style={[styles.exerciseDetails, { color: t.colors.muted }]}>
                          {exercise.duration}
                        </Text>
                      </View>
                      {exercise.notes && (
                        <View style={[styles.exerciseNotesContainer, { backgroundColor: t.colors.primary + '20' }]}>
                          <Text style={[styles.exerciseNotes, { color: t.colors.primary }]}>{exercise.notes}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[t.colors.primary, t.colors.secondary]} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading your workout plan...</Text>
          <Text style={styles.loadingSubtext}>Preparing your personalized fitness guide</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={[t.colors.danger, '#ee5a24']} style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="alert-circle" size={48} color="white" />
          <Text style={styles.errorText}>Oops! Something went wrong</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.colors.bg }]}>
      {renderWorkoutPlan()}
    </View>
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
  loadingContent: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContent: {
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    margin: 20,
  },
  emptyStateContent: {
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  workoutContainer: {
    flex: 1,
    padding: 20,
  },
  dayCard: {
    marginBottom: 20,
    borderRadius: 20,
  },
  dayCardGradient: {
    borderRadius: 20,
    padding: 24,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dayIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  dayName: {
    fontSize: 22,
    fontWeight: "700",
  },
  dayHeaderInfo: {
    flex: 1,
  },
  dayFocus: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  dayDuration: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  exerciseRow: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseInfo: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    fontWeight: "500",
  },
  exerciseNotesContainer: {
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  exerciseNotes: {
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "500",
  },
  conditioningContainer: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  conditioningLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  conditioningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  conditioningInfo: {
    flex: 1,
  },
  conditioningExercise: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  conditioningNotes: {
    fontSize: 14,
    fontStyle: "italic",
  },
  conditioningProtocol: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  conditioningWork: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  conditioningRest: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  supersetContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  supersetName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  supersetExercise: {
    marginBottom: 12,
  },
  alternativeContainer: {
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  alternativeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  alternativeText: {
    fontSize: 12,
    fontStyle: "italic",
  },
});