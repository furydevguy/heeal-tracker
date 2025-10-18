// app/lib/firebaseHelpers.ts
/**
 * Firebase Helper Functions for Aura Wellness Coach
 *
 * This file contains pre-built functions for common Firebase operations
 * specific to the wellness app domain (users, habits, progress, etc.)
 */

import { MealPlanItem } from "@app/types";
import {
  createTimestamp,
  deleteAllDocumentsByUser,
  deleteDocument,
  getAllDocuments,
  getCurrentUserId,
  getDocument,
  listenToCollection,
  listenToDocument,
  queryDocuments,
  saveDocument,
  updateDocument,
  uploadFile,
} from "./firebase";
import { HabitKind, Weekday } from "@app/types/habit";

// ====================
// USER PROFILE FUNCTIONS
// ====================

// ====================
// USER PLANS FUNCTIONS
// ====================

/**
 * User plan data structure
 */
export interface UserPlan {
  id?: string;
  userId: string;
  mealPlan?: {
    strategy: string;
    dailyCalorieTarget: number;
    macronutrientSplit: string;
    meals: MealPlanItem[];
    dailyTotals: {
      calories: number;
      protein: number;
      fat: number;
      carbohydrates: number;
    };
    coachingTips: string[];
  };
  workoutPlan?: {
    weeklySchedule: Array<{
      day: string;
      focus: string;
      durationMinutes: number;
      warmUp: Array<{
        exercise: string;
        duration: string;
        notes: string;
      }>;
      mainSession: Array<{
        exercise: string;
        sets: number;
        reps: number;
        rpe: number;
        restSec: number;
        notes: string;
        alternativeForInjury?: string;
      }>;
      supersets?: Array<{
        name: string;
        exercises: Array<{
          exercise: string;
          sets: number;
          reps: number;
          rpe: number;
          restSec: number;
          notes: string;
          alternativeForInjury?: string;
        }>;
      }>;
      conditioning?: {
        protocol: string;
        work: string;
        rest: string;
        notes: string;
      };
      coolDown: Array<{
        exercise: string;
        duration: string;
        notes: string;
      }>;
    }>;
  };
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Save user plan to Firebase
 */
export async function saveUserPlan(plan: UserPlan): Promise<string> {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const planData = {
      ...plan,
      userId,
      updatedAt: createTimestamp(),
      createdAt: plan.createdAt || createTimestamp(),
    };

    const docId = await saveDocument(`users/${userId}/plans`, planData);
    return docId;
  } catch (error) {
    console.error("❌ Error saving user plan:", error);
    throw error;
  }
}

/**
 * Get user's current plan
 */
export async function getUserPlan(userId?: string): Promise<UserPlan | null> {
  try {
    const uid = userId || getCurrentUserId();
    if (!uid) throw new Error("User not authenticated");

    const plans = await getAllDocuments(`users/${uid}/plans`);
    const plan = plans?.length > 0 ? plans[0] : null;
    return plan as UserPlan | null;
  } catch (error) {
    console.error("❌ Error getting user plan:", error);
    return null;
  }
}

/**
 * Listen to user's plan changes
 */
export function listenToUserPlan(
  userId: string,
  callback: (plan: UserPlan | null) => void
) {
  if (!callback) throw new Error("Callback required");
  if (!userId) throw new Error("User ID required");

  try {
    return listenToDocument(`users/${userId}/plans`, 'current', (plan) => {
      callback(plan as UserPlan | null);
    });
  } catch (error) {
    console.error("❌ Error listening to user plan:", error);
    callback(null);
  }
}

/**
 * User profile data structure
 */
export interface UserProfile {
  id?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  age?: number;
  gender?: string;
  height?: { value: number, unit: string }; // in cm
  weight?: { value: number, unit: string }; // in kg
  fitnessLevel?: "beginner" | "intermediate" | "advanced";
  goals?: string;
  activityPreference?: string;
  daysPerWeek?: string;
  injuries?: string;
  foodDislikes?: string;
  profileCompleted?: boolean;
  token?: string;
  preferences?: {
    notifications?: boolean;
    privacy?: "public" | "friends" | "private";
    units?: "metric" | "imperial";
  };
  plans?: JSON;
  checkInHourLocal?: string; // "20" for 8 PM
  onboarded: boolean | false;
  onboardingStep: number;
  welcomed?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Save or update user profile
 *
 * @param profileData - User profile data
 * @returns Promise<string> - User ID
 */
export const saveUserProfile = async (
  profileData: Partial<UserProfile>
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  await saveDocument("users", profileData, userId);
  return userId;
};

/**
 * Get user profile by ID
 *
 * @param userId - User ID (optional, defaults to current user)
 * @returns Promise<UserProfile | null>
 */
export const getUserProfile = async (
  userId?: string
): Promise<UserProfile | null> => {
  const id = userId || getCurrentUserId();
  if (!id) throw new Error("User ID required");

  return await getDocument<UserProfile>("users", id);
};

/**
 * Update specific fields in user profile
 *
 * @param updates - Fields to update
 * @returns Promise<void>
 */
export const updateUserProfile = async (
  updates: Partial<UserProfile>
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  await updateDocument("users", userId, updates);
};

/**
 * Listen to real-time changes in user profile
 *
 * @param callback - Function called when profile changes
 * @param userId - User ID (optional, defaults to current user)
 * @returns Unsubscribe function
 */
export const listenToUserProfile = (
  callback: (profile: UserProfile | null) => void,
  userId?: string
) => {
  const id = userId || getCurrentUserId();
  if (!id) throw new Error("User ID required");

  return listenToDocument<UserProfile>("users", id, callback);
};

/**
 * Upload user profile picture
 *
 * @param file - Image file
 * @param onProgress - Progress callback
 * @returns Promise<string> - Image URL
 */
export const uploadProfilePicture = async (
  file: Blob | Uint8Array | ArrayBuffer,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const path = `users/${userId}/profile-picture.jpg`;
  const imageUrl = await uploadFile(file, path, onProgress);

  // Update user profile with new photo URL
  await updateUserProfile({ photoURL: imageUrl });

  return imageUrl;
};

// ====================
// HABITS FUNCTIONS
// ====================

/**
 * Habit data structure
 */
export interface Habit {
  id?: string;
  userId?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  kind: HabitKind;
  daysOfWeek: Weekday[]; // 0-6, Sunday-Saturday
  time?: string; // HH:MM format
  goal?: number;
  unit?: string;
  streak?: number;
  completedDates?: string[]; // YYYY-MM-DD format
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
  archived?: boolean;
}

/**
 * Create a new habit
 *
 * @param habitData - Habit data
 * @returns Promise<string> - Habit ID
 */
export const createHabit = async (
  habitData: Omit<Habit, "id" | "userId">
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const habit: Habit = {
    ...habitData,
    userId,
    streak: 0,
    completedDates: [],
    isActive: true,
    createdAt: createTimestamp(),
    archived: false,
  };

  return await saveDocument(`users/${userId}/habits`, habit);
};

/**
 * Get all habits for current user
 *
 * @param activeOnly - Only return active habits
 * @returns Promise<Habit[]>
 */
export const getUserHabits = async (
  activeOnly: boolean = true
): Promise<Habit[]> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");
  const filters: Array<{ field: string; operator: any; value: any }> = [];

  if (activeOnly) {
    filters.push({ field: "archived", operator: "==", value: false });
  };
  return await queryDocuments<Habit>(`users/${userId}/habits`, filters, "createdAt", "desc");
};

/**
 * Update habit
 *
 * @param habitId - Habit ID
 * @param updates - Fields to update
 * @returns Promise<void>
 */
export const updateHabit = async (
  habitId: string,
  updates: Partial<Habit>
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  await updateDocument(`users/${userId}/habits`, habitId, updates);
};

/**
 * Mark habit as completed for a specific date
 *
 * @param habitId - Habit ID
 * @param date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @param value - Value for metric habits (optional)
 * @returns Promise<void>
 */
export const markHabitComplete = async (
  habitId: string,
  date?: string,
  value?: number
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const completionDate = date || new Date().toISOString().split("T")[0];

  // Get current habit data
  const habit = await getDocument<Habit>(`users/${userId}/habits`, habitId);
  if (!habit) throw new Error("Habit not found");

  const completedDates = habit.completedDates || [];

  // Add date if not already completed
  if (!completedDates.includes(completionDate)) {
    completedDates.push(completionDate);

    // Calculate new streak
    const sortedDates = completedDates.sort();
    let streak = 1;

    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i + 1]);
      const previousDate = new Date(sortedDates[i]);
      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    await updateHabit(habitId, {
      completedDates,
      streak,
    });
  }

  // If it's a metric habit, also save the value
  if (habit.kind === "metric" && value !== undefined) {
    await saveHabitEntry(habitId, completionDate, value);
  }
};

/**
 * Remove habit completion for a specific date
 *
 * @param habitId - Habit ID
 * @param date - Date in YYYY-MM-DD format
 * @returns Promise<void>
 */
export const unmarkHabitComplete = async (
  habitId: string,
  date: string
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const habit = await getDocument<Habit>(`users/${userId}/habits`, habitId);
  if (!habit) throw new Error("Habit not found");

  const completedDates = (habit.completedDates || []).filter((d) => d !== date);

  // Recalculate streak
  const sortedDates = completedDates.sort();
  let streak = 0;

  if (sortedDates.length > 0) {
    streak = 1;
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = new Date(sortedDates[i + 1]);
      const previousDate = new Date(sortedDates[i]);
      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
  }

  await updateHabit(habitId, {
    completedDates,
    streak,
  });
};

/**
 * Delete habit
 *
 * @param habitId - Habit ID
 * @returns Promise<void>
 */
export const deleteHabit = async (habitId: string): Promise<void> => {
  await updateHabit(habitId, { isActive: false });
};

/**
 * Listen to real-time changes in user's habits
 *
 * @param callback - Function called when habits change
 * @param activeOnly - Only listen to active habits
 * @returns Unsubscribe function
 */
export const listenToUserHabits = (
  callback: (habits: Habit[]) => void,
  activeOnly: boolean = true
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [];

  if (activeOnly) {
    filters.push({ field: "isActive", operator: "==", value: true });
  }

  return listenToCollection<Habit>(
    `users/${userId}/habits`,
    callback,
    filters,
    "createdAt",
    "desc"
  );
};

// ====================
// HABIT ENTRIES FUNCTIONS
// ====================

/**
 * Habit entry for metric values
 */
export interface HabitEntry {
  id?: string;
  habitId: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  value: number;
  unit?: string;
  notes?: string;
  createdAt?: any;
  completed?: boolean | null;
}

/**
 * Save habit entry (for metric habits)
 *
 * @param habitId - Habit ID
 * @param date - Date in YYYY-MM-DD format
 * @param value - Metric value
 * @param notes - Optional notes
 * @returns Promise<string> - Entry ID
 */
export const saveHabitEntry = async (
  habitId: string,
  date: string,
  value: number,
  notes?: string
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const entry: HabitEntry = {
    habitId,
    userId,
    date,
    value,
    notes,
    createdAt: createTimestamp(),
  };

  return await saveDocument(`users/${userId}/habitLogs`, entry);
};

/**
 * Get habit entries for a specific habit and date range
 *
 * @param habitId - Habit ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Promise<HabitEntry[]>
 */
export const getHabitEntries = async (
  habitId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitEntry[]> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [
    { field: "habitId", operator: "==", value: habitId },
  ];

  if (startDate) {
    filters.push({ field: "date", operator: ">=", value: startDate });
  }

  if (endDate) {
    filters.push({ field: "date", operator: "<=", value: endDate });
  }

  return await queryDocuments<HabitEntry>(
    `users/${userId}/habitLogs`,
    filters,
    "date",
    "asc"
  );
};

// ====================
// WEIGHT LOG FUNCTIONS
// ====================

/**
 * Weight log data structure
 */
export interface WeightLog {
  id?: string;
  userId?: string;
  weight: number; // Weight value
  unit: "kg" | "lbs" | "st"; // Weight unit
  date: string; // YYYY-MM-DD format
  notes?: string; // Optional notes
  bodyFat?: number; // Optional body fat percentage
  muscleMass?: number; // Optional muscle mass
  waterWeight?: number; // Optional water weight percentage
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Create a new weight log entry
 *
 * @param weightData - Weight log data
 * @returns Promise<string> - Weight log ID
 */
export const createWeightLog = async (
  weightData: Omit<WeightLog, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const weightLog: WeightLog = {
    ...weightData,
    userId,
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
  };

  return await saveDocument(`users/${userId}/weightLogs`, weightLog);
};

/**
 * Get all weight logs for current user
 *
 * @param limitCount - Number of logs to retrieve (optional)
 * @returns Promise<WeightLog[]>
 */
export const getUserWeightLogs = async (
  limitCount?: number
): Promise<WeightLog[]> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  return await queryDocuments<WeightLog>(
    `users/${userId}/weightLogs`,
    [],
    "updatedAt",
    "asc",
    limitCount
  );
};

/**
 * Get weight logs for a specific date range
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param limitCount - Number of logs to retrieve (optional)
 * @returns Promise<WeightLog[]>
 */
export const getWeightLogsByDateRange = async (
  startDate: string,
  endDate: string,
  limitCount?: number
): Promise<WeightLog[]> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [
    { field: "date", operator: ">=", value: startDate },
    { field: "date", operator: "<=", value: endDate },
  ];

  return await queryDocuments<WeightLog>(
    `users/${userId}/weightLogs`,
    filters,
    "date",
    "asc",
    limitCount
  );
};

/**
 * Get the most recent weight log entry
 *
 * @returns Promise<WeightLog | null>
 */
export const getLatestWeightLog = async (): Promise<WeightLog | null> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const logs = await getUserWeightLogs(1);
  return logs.length > 0 ? logs[0] : null;
};

/**
 * Get weight log by ID
 *
 * @param weightLogId - Weight log ID
 * @returns Promise<WeightLog | null>
 */
export const getWeightLogById = async (
  weightLogId: string
): Promise<WeightLog | null> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  return await getDocument<WeightLog>(`users/${userId}/weightLogs`, weightLogId);
};

/**
 * Update weight log entry
 *
 * @param weightLogId - Weight log ID
 * @param updates - Fields to update
 * @returns Promise<void>
 */
export const updateWeightLog = async (
  weightLogId: string,
  updates: Partial<WeightLog>
): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const updateData = {
    ...updates,
    updatedAt: createTimestamp(),
  };

  await updateDocument(`users/${userId}/weightLogs`, weightLogId, updateData);
};

/**
 * Delete weight log entry
 *
 * @param weightLogId - Weight log ID
 * @returns Promise<void>
 */
export const deleteWeightLog = async (weightLogId: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  // Note: Using updateDocument to mark as deleted instead of actual deletion
  // This preserves data integrity and allows for recovery if needed
  await updateDocument(`users/${userId}/weightLogs`, weightLogId, {
    deleted: true,
    updatedAt: createTimestamp(),
  });
};

/**
 * Listen to real-time changes in user's weight logs
 *
 * @param callback - Function called when weight logs change
 * @param limitCount - Number of logs to listen to
 * @returns Unsubscribe function
 */
export const listenToUserWeightLogs = (
  callback: (weightLogs: WeightLog[]) => void,
  limitCount: number = 50
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [];

  return listenToCollection<WeightLog>(
    `users/${userId}/weightLogs`,
    callback,
    filters,
    "date",
    "desc",
    limitCount
  );
};

/**
 * Listen to weight logs for a specific date range
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param callback - Function called when weight logs change
 * @param limitCount - Number of logs to listen to
 * @returns Unsubscribe function
 */
export const listenToWeightLogsByDateRange = (
  startDate: string,
  endDate: string,
  callback: (weightLogs: WeightLog[]) => void,
  limitCount?: number
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [
    { field: "date", operator: ">=", value: startDate },
    { field: "date", operator: "<=", value: endDate },
  ];

  return listenToCollection<WeightLog>(
    `users/${userId}/weightLogs`,
    callback,
    filters,
    "date",
    "asc",
    limitCount
  );
};

/**
 * Calculate weight change between two dates
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Promise<{ change: number; percentage: number; unit: string } | null>
 */
export const calculateWeightChange = async (
  startDate: string,
  endDate: string
): Promise<{ change: number; percentage: number; unit: string } | null> => {
  try {
    const logs = await getWeightLogsByDateRange(startDate, endDate);

    if (logs.length < 2) return null;

    // Sort by date to get chronological order
    const sortedLogs = logs.sort((a, b) => a.date.localeCompare(b.date));
    const startLog = sortedLogs[0];
    const endLog = sortedLogs[sortedLogs.length - 1];

    // Calculate change in the same unit (assuming all logs use the same unit as user profile)
    const change = endLog.weight - startLog.weight;
    const percentage = (change / startLog.weight) * 100;

    return {
      change: Math.round(change * 100) / 100, // Round to 2 decimal places
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      unit: endLog.unit,
    };
  } catch (error) {
    console.error("❌ Error calculating weight change:", error);
    return null;
  }
};

/**
 * Get weight trend over a period (average weekly change)
 *
 * @param days - Number of days to analyze (default: 30)
 * @returns Promise<{ trend: number; unit: string } | null>
 */
export const getWeightTrend = async (
  days: number = 30
): Promise<{ trend: number; unit: string } | null> => {
  try {
    const endDate = getTodayString();
    const startDate = getDateString(days);

    const logs = await getWeightLogsByDateRange(startDate, endDate);

    if (logs.length < 2) return null;

    // Sort by date
    const sortedLogs = logs.sort((a, b) => a.date.localeCompare(b.date));
    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];

    // Calculate days between first and last log
    const firstDate = new Date(firstLog.date);
    const lastDate = new Date(lastLog.date);
    const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return null;

    // Calculate trend in the same unit (assuming all logs use the same unit as user profile)
    const totalChange = lastLog.weight - firstLog.weight;
    const weeklyTrend = (totalChange / daysDiff) * 7; // Average change per week

    return {
      trend: Math.round(weeklyTrend * 100) / 100, // Round to 2 decimal places
      unit: lastLog.unit,
    };
  } catch (error) {
    console.error("❌ Error calculating weight trend:", error);
    return null;
  }
};


/**
 * Format weight value with appropriate decimal places based on unit
 *
 * @param weight - Weight value (can be undefined, null, number, or object with value and unit)
 * @param unit - Weight unit (used as fallback if weight is not an object)
 * @returns string - Formatted weight string
 */
export const formatWeight = (
  weight: number | undefined | null | { value: number; unit: string },
  unit: "kg" | "lbs" | "st"
): string => {
  // Handle undefined, null, NaN, or non-number values with more robust checking
  let safeWeight = 0;
  let actualUnit = unit;

  if (weight !== null && weight !== undefined) {
    // Check if weight is an object with value and unit properties
    if (typeof weight === 'object' && weight !== null && 'value' in weight && 'unit' in weight) {
      const weightObj = weight as { value: number; unit: string };
      const numWeight = Number(weightObj.value);
      if (!isNaN(numWeight) && isFinite(numWeight) && numWeight >= 0) {
        safeWeight = numWeight;
        actualUnit = weightObj.unit as "kg" | "lbs" | "st";
      } else {
        console.warn('formatWeight received invalid weight object:', weight, 'converted to:', numWeight);
        safeWeight = 0;
      }
    } else {
      // Handle regular number input
      const numWeight = Number(weight);
      // Check for valid finite number
      if (!isNaN(numWeight) && isFinite(numWeight) && numWeight >= 0) {
        safeWeight = numWeight;
      } else {
        // Log problematic values for debugging
        console.warn('formatWeight received invalid weight:', weight, 'converted to:', numWeight);
        safeWeight = 0;
      }
    }
  }

  // Final safety check - ensure we have a valid number before calling toFixed
  if (isNaN(safeWeight) || !isFinite(safeWeight) || safeWeight < 0) {
    console.warn('formatWeight: safeWeight is still invalid, defaulting to 0');
    safeWeight = 0;
  }

  // Ensure safeWeight is a valid number before calling toFixed
  const finalWeight = Number(safeWeight);
  if (isNaN(finalWeight) || !isFinite(finalWeight)) {
    console.warn('formatWeight: finalWeight is invalid, using 0');
    safeWeight = 0;
  } else {
    safeWeight = finalWeight;
  }

  return `${safeWeight} ${actualUnit}`;

};

/**
 * Get weight unit display name
 *
 * @param unit - Weight unit
 * @returns string - Display name for the unit
 */
export const getWeightUnitDisplayName = (
  unit: "kg" | "lbs" | "st"
): string => {
  switch (unit) {
    case "kg":
      return "Kilograms";
    case "lbs":
      return "Pounds";
    case "st":
      return "Stone";
    default:
      return unit;
  }
};

/**
 * Get weight logs for a specific month
 *
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns Promise<WeightLog[]>
 */
export const getWeightLogsByMonth = async (
  year: number,
  month: number
): Promise<WeightLog[]> => {
  const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // Last day of month

  return await getWeightLogsByDateRange(startDate, endDate);
};

/**
 * Get weight logs for a specific week
 *
 * @param date - Any date within the week (YYYY-MM-DD)
 * @returns Promise<WeightLog[]>
 */
export const getWeightLogsByWeek = async (
  date: string
): Promise<WeightLog[]> => {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  // Calculate start of week (Sunday)
  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - dayOfWeek);

  // Calculate end of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const startDate = startOfWeek.toISOString().split("T")[0];
  const endDate = endOfWeek.toISOString().split("T")[0];

  return await getWeightLogsByDateRange(startDate, endDate);
};

// ====================
// CHAT/AI FUNCTIONS
// ====================

/**
 * Chat message structure
 */
export interface ChatMessage {
  id?: string;
  userId?: string;
  content: string;
  role: "user" | "assistant";
  timestamp?: any;
  metadata?: {
    tokens?: number;
    model?: string;
    context?: string[];
  };
}

/**
 * Save chat message
 *
 * @param message - Chat message data
 * @returns Promise<string> - Message ID
 */
export const saveChatMessage = async (
  message: Omit<ChatMessage, "id" | "userId" | "timestamp">
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const chatMessage: ChatMessage = {
    ...message,
    userId,
    timestamp: createTimestamp(),
  };

  return await saveDocument(`users/${userId}/chatMessages`, chatMessage);
};

/**
 * Get chat history for current user
 *
 * @param limitCount - Number of messages to retrieve
 * @returns Promise<ChatMessage[]>
 */
export const getChatHistory = async (
  limitCount: number = 50
): Promise<ChatMessage[]> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [];

  return await queryDocuments<ChatMessage>(
    `users/${userId}/chatMessages`,
    filters,
    "timestamp",
    "desc",
    limitCount
  );
};

/**
 * Listen to real-time chat messages
 *
 * @param callback - Function called when messages change
 * @param limitCount - Number of messages to listen to
 * @returns Unsubscribe function
 */
export const listenToChatMessages = (
  callback: (messages: ChatMessage[]) => void,
  limitCount: number = 50
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [];

  return listenToCollection<ChatMessage>(
    `users/${userId}/chatMessages`,
    callback,
    filters,
    "timestamp",
    "desc",
    limitCount
  );
};

// ====================
// NOTIFICATION FUNCTIONS
// ====================

/**
 * Notification data structure
 */
export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'habit_reminder' | 'goal_achievement' | 'motivation' | 'general';
  data?: Record<string, any>;
  scheduledFor?: any; // Firestore timestamp
  sentAt?: any; // Firestore timestamp
  readAt?: any; // Firestore timestamp
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Save notification to user's notification history
 */
export const saveNotification = async (
  notificationData: Omit<NotificationData, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const notification: NotificationData = {
      ...notificationData,
      userId,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    };

    return await saveDocument(`users/${userId}/notifications`, notification);
  } catch (error) {
    console.error("❌ Error saving notification:", error);
    throw error;
  }
};

/**
 * Get user's notification history
 */
export const getUserNotifications = async (
  limitCount: number = 50
): Promise<NotificationData[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const filters: Array<{ field: string; operator: any; value: any }> = [];

    return await queryDocuments<NotificationData>(
      `users/${userId}/notifications`,
      filters,
      "createdAt",
      "desc",
      limitCount
    );
  } catch (error) {
    console.error("❌ Error getting user notifications:", error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    await updateDocument(`users/${userId}/notifications`, notificationId, {
      readAt: createTimestamp(),
      updatedAt: createTimestamp(),
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const filters: Array<{ field: string; operator: any; value: any }> = [
      { field: "readAt", operator: "==", value: null },
    ];

    const notifications = await queryDocuments<NotificationData>(
      `users/${userId}/notifications`,
      filters
    );

    return notifications.length;
  } catch (error) {
    console.error("❌ Error getting unread notification count:", error);
    return 0;
  }
};

/**
 * Listen to user's notifications
 */
export const listenToUserNotifications = (
  callback: (notifications: NotificationData[]) => void,
  limitCount: number = 50
) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated");

  const filters: Array<{ field: string; operator: any; value: any }> = [];

  return listenToCollection<NotificationData>(
    `users/${userId}/notifications`,
    callback,
    filters,
    "createdAt",
    "desc",
    limitCount
  );
};

/**
 * Schedule habit reminder notification
 */
export const scheduleHabitReminder = async (
  habitId: string,
  habitName: string,
  scheduledTime: Date
): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const notificationData: Omit<NotificationData, "id" | "userId" | "createdAt" | "updatedAt"> = {
      title: "Habit Reminder",
      body: `Time to complete your habit: ${habitName}`,
      type: "habit_reminder",
      data: {
        habitId,
        habitName,
      },
      scheduledFor: scheduledTime,
    };

    return await saveNotification(notificationData);
  } catch (error) {
    console.error("❌ Error scheduling habit reminder:", error);
    throw error;
  }
};

/**
 * Send goal achievement notification
 */
export const sendGoalAchievementNotification = async (
  goalType: string,
  achievement: string
): Promise<string> => {
  try {
    const notificationData: Omit<NotificationData, "id" | "userId" | "createdAt" | "updatedAt"> = {
      title: "🎉 Goal Achieved!",
      body: `Congratulations! You've achieved: ${achievement}`,
      type: "goal_achievement",
      data: {
        goalType,
        achievement,
      },
      sentAt: createTimestamp(),
    };

    return await saveNotification(notificationData);
  } catch (error) {
    console.error("❌ Error sending goal achievement notification:", error);
    throw error;
  }
};

/**
 * Send motivational notification
 */
export const sendMotivationalNotification = async (
  message: string
): Promise<string> => {
  try {
    const motivationalMessages = [
      "Keep up the great work! 💪",
      "You're making amazing progress! 🌟",
      "Every step counts! 🚀",
      "You've got this! 💯",
      "Consistency is key! 🔑",
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    const notificationData: Omit<NotificationData, "id" | "userId" | "createdAt" | "updatedAt"> = {
      title: "Daily Motivation",
      body: message || randomMessage,
      type: "motivation",
      data: {
        isMotivational: true,
      },
      sentAt: createTimestamp(),
    };

    return await saveNotification(notificationData);
  } catch (error) {
    console.error("❌ Error sending motivational notification:", error);
    throw error;
  }
};

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Get today's date in YYYY-MM-DD format
 *
 * @returns string - Today's date
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Get date string for a specific number of days ago
 *
 * @param daysAgo - Number of days ago
 * @returns string - Date in YYYY-MM-DD format
 */
export const getDateString = (daysAgo: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
};

/**
 * Calculate streak from completed dates array
 *
 * @param completedDates - Array of completion dates (YYYY-MM-DD)
 * @returns number - Current streak
 */
export const calculateStreak = (completedDates: string[]): number => {
  if (completedDates.length === 0) return 0;

  const sortedDates = completedDates.sort();
  let streak = 1;

  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const currentDate = new Date(sortedDates[i + 1]);
    const previousDate = new Date(sortedDates[i]);
    const daysDiff = Math.floor(
      (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Check if habit should be shown today
 *
 * @param habit - Habit object
 * @param date - Date to check (optional, defaults to today)
 * @returns boolean - Whether habit should be shown
 */
export const isHabitActiveToday = (habit: Habit, date?: Date): boolean => {
  const checkDate = date || new Date();
  const dayOfWeek = checkDate.getDay(); // 0-6, Sunday-Saturday

  return (habit.isActive ?? true) && habit.daysOfWeek.includes(dayOfWeek as Weekday);
};

/**
 * Get habit completion percentage for a date range
 *
 * @param habit - Habit object
 * @param startDate - Start date
 * @param endDate - End date
 * @returns number - Completion percentage (0-100)
 */
export const getHabitCompletionRate = (
  habit: Habit,
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const completedDates = habit.completedDates || [];

  let expectedDays = 0;
  let completedDays = 0;

  // Count expected days based on habit schedule
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (habit.daysOfWeek.includes(dayOfWeek as Weekday)) {
      expectedDays++;

      const dateString = d.toISOString().split("T")[0];
      if (completedDates.includes(dateString)) {
        completedDays++;
      }
    }
  }

  return expectedDays === 0
    ? 0
    : Math.round((completedDays / expectedDays) * 100);
};

export const clearUserDataFromDatabase = async (userId: string) => {
  try {
    if (!userId) throw new Error("User ID required");
    // Reset user profile
    await updateDocument("users", userId, {
      age: null,
      height: null,
      weight: null,
      photoURL: null,
      goals: null,
      onboarded: false,
      profileCompleted: false,
      gender: "male",
      fitnessLevel: "beginner",
      onboardingStep: 0,
    });
    // Delete user subdoc
    await deleteAllDocumentsByUser(userId, 'habits');
    await deleteAllDocumentsByUser(userId, 'habitLogs');
    await deleteAllDocumentsByUser(userId, 'weightLogs');
    await deleteAllDocumentsByUser(userId, 'chatMessages');

  } catch (error) {
    console.error("❌ Error clearing user data:", error);
  }
};
export const deleteUserDoc = async (userId: string) => {
  await deleteDocument("users", userId);
}

export default {
  // User Profile
  deleteUserDoc,
  saveUserProfile,
  getUserProfile,
  updateUserProfile,
  listenToUserProfile,
  uploadProfilePicture,

  // User Plans
  saveUserPlan,
  getUserPlan,
  listenToUserPlan,

  // Habits
  createHabit,
  getUserHabits,
  updateHabit,
  markHabitComplete,
  unmarkHabitComplete,
  deleteHabit,
  listenToUserHabits,

  // Habit Entries
  saveHabitEntry,
  getHabitEntries,

  // Weight Logs
  createWeightLog,
  getUserWeightLogs,
  getWeightLogsByDateRange,
  getLatestWeightLog,
  getWeightLogById,
  updateWeightLog,
  deleteWeightLog,
  listenToUserWeightLogs,
  listenToWeightLogsByDateRange,
  calculateWeightChange,
  getWeightTrend,
  formatWeight,
  getWeightUnitDisplayName,
  getWeightLogsByMonth,
  getWeightLogsByWeek,

  // Chat
  saveChatMessage,
  getChatHistory,
  listenToChatMessages,

  // Notifications
  saveNotification,
  getUserNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
  listenToUserNotifications,
  scheduleHabitReminder,
  sendGoalAchievementNotification,
  sendMotivationalNotification,

  // Utilities
  getTodayString,
  getDateString,
  calculateStreak,
  isHabitActiveToday,
  getHabitCompletionRate,

  // Reset All
  clearUserDataFromDatabase,
};
