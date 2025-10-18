// app/(screens)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Localization from "expo-localization";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  Text as RNText,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { useAlert } from "@components/ui/AlertProvider";
import {
  createWeightLog,
  getUserProfile,
  updateUserProfile,
} from "@lib/firebaseHelpers";
import { registerForPushNotifications } from "@lib/notifications";
import { seedForNewUser } from "../(features)/chat/seed";
import { useNavigationContext } from "../../components/ui/NavigationWrapper";
import { useAuth } from "../providers/AuthProvider";
import { useTokens } from "../providers/ThemeProvider";
import EnhancedDropdown from "@app/components/EnhancedDropdown";


type HeightUnit = "cm" | "ft" | "in";
type WeightUnit = "kg" | "lb" | "st";

interface ProfileFormData {
  name: string;
  age: string;
  gender: string;
  activityPreference: string;
  daysPerWeek: string;
  heightValue: string;
  heightUnit: HeightUnit;
  weightValue: string;
  weightUnit: WeightUnit;
  goals: string;
  injuries: string;
  foodDislikes: string;
  checkInHourLocal: string;
  notifications: boolean;
  token: string;
}

interface FormErrors {
  [key: string]: string;
}

const activityPreferences = [
  { value: "gym", label: "Gym" },
  { value: "home", label: "Home" },
  { value: "walking", label: "Walking" },
  { value: "running", label: "Running" },
  { value: "mixed", label: "Mixed" },
];

const daysPerWeek = [
  { value: "1", label: "1 day" },
  { value: "2", label: "2 days" },
  { value: "3", label: "3 days" },
  { value: "4", label: "4 days" },
  { value: "5", label: "5 days" },
  { value: "6", label: "6 days" },
  { value: "7", label: "7 days" },
];
const wellnessGoals = [
  { value: "fat_loss", label: "Fat Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "general_health", label: "General Health" },
  { value: "increase_energy_vitality", label: "Increase Energy & Vitality" },
  {
    value: "improve_mobility_flexibility",
    label: "Improve Mobility & Flexibility",
  },
  { value: "enhance_mental_wellbeing", label: "Enhance Mental Well-Being" },
  { value: "build_healthy_habits", label: "Build Healthy Habits" },
];

function Label({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  const t = useTokens();
  return (
    <RNText
      style={{
        fontWeight: "600",
        color: t.colors.text,
        marginBottom: t.spacing.xs,
        fontSize: 16,
      }}
    >
      {children}
      {required && <RNText style={{ color: t.colors.danger }}> *</RNText>}
    </RNText>
  );
}

function Text({ children, style }: any) {
  const t = useTokens();
  return (
    <RNText style={[{ color: t.colors.text, fontSize: t.fontSize.md }, style]}>
      {children}
    </RNText>
  );
}

function ErrorText({ error }: { error?: string }) {
  const t = useTokens();
  if (!error) return null;
  return (
    <Text
      style={{
        color: t.colors.danger,
        fontSize: 14,
        marginTop: 4,
        marginBottom: 8,
      }}
    >
      {error}
    </Text>
  );
}

function UnitSelector<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: "row", gap: t.spacing.sm }}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={({ pressed }: { pressed: boolean }) => ({
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.sm,
            borderRadius: t.radius.md,
            borderWidth: 1,
            borderColor: value === o ? t.colors.primary : t.colors.border,
            backgroundColor: value === o ? t.colors.primary : t.colors.card,
            opacity: pressed ? 0.85 : 1,
            justifyContent: "center",
            alignItems: "center",
          })}
        >
          <RNText
            style={{
              color: value === o ? "#fff" : t.colors.text,
              fontWeight: value === o ? "700" : "600",
            }}
          >
            {o}
          </RNText>
        </Pressable>
      ))}
    </View>
  );
}

function Section({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: string;
}) {
  const t = useTokens();

  const getIconName = (sectionTitle: string) => {
    switch (sectionTitle) {
      case "Basic Information":
        return "person";
      case "Physical Information":
        return "body";

      case "Your Goals":
        return "flag";
      default:
        return "information-circle";
    }
  };

  return (
    <View style={{ marginBottom: t.spacing.xl }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: t.spacing.md,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.colors.primary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: t.spacing.sm,
          }}
        >
          <Ionicons
            name={getIconName(title) as any}
            size={20}
            color={t.colors.primary}
          />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: t.colors.text,
            flex: 1,
          }}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function EnhancedProfileScreen() {
  const t = useTokens();
  const { user, needsProfile } = useAuth();
  const { showSpinner, hideSpinner } = useNavigationContext();
  const { showError, showSuccess } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeValue, setTimeValue] = useState(new Date());
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    age: "",
    gender: "",
    activityPreference: "",
    daysPerWeek: "",
    heightValue: "",
    heightUnit: "cm",
    weightValue: "",
    weightUnit: "kg",
    goals: "",
    checkInHourLocal: "20",
    notifications: true,
    token: "",
    injuries: "",
    foodDislikes: "",
  });

  const timezone = Localization.getCalendars()[0]?.timeZone ?? "UTC";

  // Function to get push notification token
  const getPushToken = async (): Promise<string> => {
    try {
      // Use the proper notification registration function that handles permissions and platform differences
      const token = await registerForPushNotifications();
      return token || "";
    } catch (error) {
      console.error("Failed to get push token:", error);
      // Return empty string instead of throwing to prevent profile save failure
      return "";
    }
  };

  // Load existing profile
  useEffect(() => {
    loadProfile();

  }, [user?.uid]);

  // Sync time picker with saved hour
  useEffect(() => {
    const h = Number(formData.checkInHourLocal) || 20;
    const base = new Date();
    base.setHours(h, 0, 0, 0);
    setTimeValue(base);
  }, [formData.checkInHourLocal]);

  const loadProfile = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const profile = await getUserProfile();

      // Get push notification token
      let pushToken = "";
      if (Platform.OS !== 'web') {
        pushToken = await getPushToken();
      }

      if (profile) {
        setFormData({
          name: profile.displayName || user.email?.split("@")[0] || "",
          age: profile.age ? String(profile.age) : "",
          gender: (profile as any).gender || "", // Profile interface will be enhanced
          activityPreference: (profile as any).activityPreference || "",
          daysPerWeek: (profile as any).daysPerWeek || "",
          injuries: (profile as any).injuries || "",
          foodDislikes: (profile as any).foodDislikes || "",
          heightValue: profile.height ? String(profile.height.value) : "",
          heightUnit: (profile.height
            ? profile.height.unit
            : "cm") as HeightUnit, // Will be enhanced with unit support
          weightValue: profile.weight ? String(profile.weight.value) : "",
          weightUnit: (profile.weight
            ? profile.weight.unit
            : "kg") as WeightUnit, // Will be enhanced with unit support
          goals: Array.isArray(profile.goals)
            ? profile.goals.join(", ")
            : profile.goals || "",
          checkInHourLocal: profile.checkInHourLocal || "20", // Will be enhanced
          notifications: profile.preferences?.notifications ?? true,
          token: pushToken || (profile as any).token || "", // Use fresh push token or fallback to existing
        });
      } else {
        // Set default name from email and push token
        setFormData((prev) => ({
          ...prev,
          name: user.email?.split("@")[0] || "",
          token: pushToken,
        }));
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      showError("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.age.trim()) newErrors.age = "Age is required";
    if (!formData.gender.trim()) newErrors.gender = "Gender is required";
    if (!formData.activityPreference.trim())
      newErrors.activityPreference = "Activity preference is required";
    if (!formData.daysPerWeek.trim())
      newErrors.daysPerWeek = "Days per week is required";
    if (!formData.injuries.trim())
      newErrors.injuries = "Injuries are required";
    if (!formData.foodDislikes.trim())
      newErrors.foodDislikes = "Food dislikes are required";
    if (!formData.heightValue.trim())
      newErrors.heightValue = "Height is required";
    if (!formData.weightValue.trim())
      newErrors.weightValue = "Weight is required";
    if (!formData.goals.trim()) newErrors.goals = "Goals are required";

    // Age validation
    const age = Number(formData.age);
    if (formData.age && (isNaN(age) || age < 10 || age > 120)) {
      newErrors.age = "Age must be between 10 and 120";
    }

    // Height validation
    const height = Number(formData.heightValue);
    if (formData.heightValue && (isNaN(height) || height <= 0)) {
      newErrors.heightValue = "Enter a valid height";
    }

    // Weight validation
    const weight = Number(formData.weightValue);
    if (formData.weightValue && (isNaN(weight) || weight <= 0)) {
      newErrors.weightValue = "Enter a valid weight";
    }

    // Goals validation
    if (!formData.goals || formData.goals === "") {
      newErrors.goals = "Please select your primary goal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showError("Validation Error", "Please fix the highlighted fields");
      return;
    }

    if (!user?.uid) {
      showError("Error", "User not authenticated");
      return;
    }

    try {
      setSaving(true);
      showSpinner("Saving your profile...", "pulse");

      // Get fresh push token before saving
      let pushToken = "";
      if (Platform.OS !== 'web') {
        pushToken = await getPushToken();
      }

      const profileData = {
        displayName: formData.name.trim(),
        age: Number(formData.age),
        activityPreference: formData.activityPreference.trim(),
        daysPerWeek: formData.daysPerWeek.trim(),
        injuries: formData.injuries.trim(),
        foodDislikes: formData.foodDislikes.trim(),
        height: {
          value: Number(formData.heightValue),
          unit: formData.heightUnit,
        }, // in cm
        weight: {
          value: Number(formData.weightValue),
          unit: formData.weightUnit,
        }, // in kg
        goals: formData.goals.trim(),
        preferences: {
          notifications: formData.notifications,
          units: "metric" as "metric" | "imperial",
        },
        checkInHourLocal: (formData.checkInHourLocal
          ? Number(formData.checkInHourLocal)
          : 20
        ).toString(),
        welcomed: true,
        profileCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        habits: [],
        // Additional fields that will be handled by the save function
        ...(formData.gender.trim() && { gender: formData.gender.trim() }),
        ...(pushToken && { token: pushToken }), // Always save the fresh push token
      };

      await updateUserProfile(profileData);


      await createWeightLog({
        weight: Number(formData.weightValue),
        unit: formData.weightUnit as "kg" | "lbs" | "st",
        date: new Date().toISOString(),
        notes: "Initial weight log",
        bodyFat: 0,
        muscleMass: 0,
        waterWeight: 0,
      });

      showSpinner("Profile saved successfully! 🎉", "dots");

      await seedForNewUser(user.uid, formData.name.trim());
      hideSpinner();
      showSuccess(
        "Profile Complete!",
        "Your profile has been saved. Welcome to Aura Wellness Coach!"
      );
      router.replace("/(tabs)/chat");

    } catch (error: any) {
      hideSpinner();
      console.error("Profile save error:", error);
      showError("Error", error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (_: any, selected?: Date) => {
    if (Platform.OS !== "ios") setShowTimePicker(false);
    if (!selected) return;

    setTimeValue(selected);
    updateField("checkInHourLocal", String(selected.getHours()));
  };

  const formattedTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timeValue);

  const completionPercentage = (() => {
    const requiredFields = [
      "name",
      "age",
      "gender",
      "activityPreference",
      "daysPerWeek",
      "injuries",
      "foodDislikes",
      "heightValue",
      "weightValue",
      "goals",
    ];
    const completedFields = requiredFields.filter((field) =>
      formData[field as keyof ProfileFormData]?.toString().trim()
    ).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  })();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.colors.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.bg }}
      contentContainerStyle={{ padding: t.spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: t.spacing.xl }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: t.colors.primary + "15",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginBottom: t.spacing.lg,
          }}
        >
          <Ionicons name="person-circle" size={60} color={t.colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            marginBottom: t.spacing.sm,
            textAlign: "center",
          }}
        >
          Complete Your Profile
        </Text>
        <Text
          style={{
            color: t.colors.muted,
            fontSize: 16,
            lineHeight: 24,
            textAlign: "center",
          }}
        >
          Help us personalize your wellness journey
        </Text>

        {/* Progress indicator */}
        <View
          style={{
            marginTop: t.spacing.md,
            backgroundColor: t.colors.card,
            padding: t.spacing.md,
            borderRadius: t.radius.lg,
            borderWidth: 1,
            borderColor: needsProfile ? t.colors.danger : t.colors.primary,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "600" }}>Profile Completion</Text>
            <Text
              style={{
                fontWeight: "700",
                color:
                  completionPercentage === 100
                    ? t.colors.primary
                    : t.colors.muted,
              }}
            >
              {completionPercentage}%
            </Text>
          </View>
          <View
            style={{
              height: 6,
              backgroundColor: t.colors.border,
              borderRadius: 3,
              marginTop: t.spacing.xs,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${completionPercentage}%`,
                backgroundColor:
                  completionPercentage === 100
                    ? t.colors.primary
                    : t.colors.muted,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>

      {/* Basic Information */}
      <Section title="Basic Information">
        <Label required>Full Name</Label>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: errors.name ? t.colors.danger : t.colors.border,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.card,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
          }}
        >
          <Ionicons
            name="person-outline"
            size={20}
            color={t.colors.muted}
            style={{ marginRight: 12 }}
          />
          <TextInput
            placeholder="Enter your full name"
            placeholderTextColor={t.colors.muted}
            value={formData.name}
            onChangeText={(v) => updateField("name", v)}
            autoCapitalize="words"
            style={{
              flex: 1,
              fontSize: 16,
              color: t.colors.text,
            }}
          />
        </View>
        <ErrorText error={errors.name} />

        <View style={{ flexDirection: "row", gap: t.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Label required>Age</Label>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: errors.age ? t.colors.danger : t.colors.border,
                borderRadius: t.radius.md,
                backgroundColor: t.colors.card,
                paddingHorizontal: t.spacing.md,
                paddingVertical: t.spacing.md,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={t.colors.muted}
                style={{ marginRight: 12 }}
              />
              <TextInput
                placeholder="25"
                keyboardType="number-pad"
                value={formData.age}
                placeholderTextColor={t.colors.muted}
                onChangeText={(v) => updateField("age", v)}
                style={{
                  flex: 1,
                  fontSize: 16,
                  color: t.colors.text,
                }}
              />
            </View>
            <ErrorText error={errors.age} />
          </View>

          <View style={{ flex: 1 }}>
            <Label required>Gender</Label>
            <EnhancedDropdown
              value={formData.gender}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              onChange={(v) => updateField("gender", v)}
              placeholder="Select ..."
              error={!!errors.gender}
            />
            <ErrorText error={errors.gender} />
          </View>
        </View>
      </Section>

      {/* Physical Information */}
      <Section title="Physical Information">
        <Label required>Height</Label>
        <View
          style={{
            flexDirection: "row",
            gap: t.spacing.md,
            marginBottom: t.spacing.md,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: errors.heightValue
                ? t.colors.danger
                : t.colors.border,
              borderRadius: t.radius.md,
              backgroundColor: t.colors.card,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.md,
            }}
          >
            <Ionicons
              name="resize-outline"
              size={20}
              color={t.colors.muted}
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="170"
              placeholderTextColor={t.colors.muted}
              keyboardType="decimal-pad"
              value={formData.heightValue}
              onChangeText={(v) => updateField("heightValue", v)}
              style={{
                flex: 1,
                fontSize: 16,
                color: t.colors.text,
              }}
            />
          </View>
          <UnitSelector
            value={formData.heightUnit}
            options={["cm", "ft", "in"]}
            onChange={(v) => updateField("heightUnit", v)}
          />
        </View>
        <ErrorText error={errors.heightValue} />

        <Label required>Weight</Label>
        <View
          style={{
            flexDirection: "row",
            gap: t.spacing.md,
            marginBottom: t.spacing.md,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: errors.weightValue
                ? t.colors.danger
                : t.colors.border,
              borderRadius: t.radius.md,
              backgroundColor: t.colors.card,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.md,
            }}
          >
            <Ionicons
              name="barbell-outline"
              size={20}
              color={t.colors.muted}
              style={{ marginRight: 12 }}
            />
            <TextInput
              placeholder="70"
              placeholderTextColor={t.colors.muted}
              keyboardType="decimal-pad"
              value={formData.weightValue}
              onChangeText={(v) => updateField("weightValue", v)}
              style={{
                flex: 1,
                fontSize: 16,
                color: t.colors.text,
              }}
            />
          </View>
          <UnitSelector
            value={formData.weightUnit}
            options={["kg", "lb", "st"]}
            onChange={(v) => updateField("weightUnit", v)}
          />
        </View>
        <ErrorText error={errors.weightValue} />
      </Section>



      {/* Goals */}
      <Section title="Primary Goals">
        <EnhancedDropdown
          value={formData.goals}
          options={wellnessGoals.filter((goal) => goal.value !== "")}
          onChange={(v) => updateField("goals", v)}
          placeholder="Select your primary goal"
          error={!!errors.goals}
        />
        <ErrorText error={errors.goals} />
      </Section>
      {/* Activity Preference */}
      <Section title="Activity Preference">
        <EnhancedDropdown
          value={formData.activityPreference}
          options={activityPreferences.filter(
            (activity) => activity.value !== ""
          )}
          onChange={(v) => updateField("activityPreference", v)}
          placeholder="Select your activity preference"
          error={!!errors.activityPreference}
        />
        <ErrorText error={errors.activityPreference} />
      </Section>

      {/* Days Per Week */}
      <Section title="Days Per Week">
        <EnhancedDropdown
          value={formData.daysPerWeek}
          options={daysPerWeek}
          onChange={(v) => updateField("daysPerWeek", v)}
          placeholder="Select your days per week"
          error={!!errors.daysPerWeek}
        />
        <ErrorText error={errors.daysPerWeek} />
      </Section>
      {/* Injuries */}
      <Section title="Injuries">
        <TextInput
          placeholder="e.g., bad knee, lower back pain, none"
          value={formData.injuries}
          onChangeText={(v) => updateField("injuries", v)}
          style={{
            borderWidth: 1,
            borderColor: errors.injuries ? t.colors.danger : t.colors.border,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.card,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
            color: t.colors.text,
            fontSize: 16,
          }}
          placeholderTextColor={t.colors.muted}
        />
        <ErrorText error={errors.injuries} />
      </Section>

      {/* Food Dislikes */}
      <Section title="Food Dislikes">
        <TextInput
          placeholder="e.g., seafood, eggs, none"
          value={formData.foodDislikes}
          onChangeText={(v) => updateField("foodDislikes", v)}
          style={{
            borderWidth: 1,
            borderColor: errors.foodDislikes ? t.colors.danger : t.colors.border,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.card,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
            color: t.colors.text,
            fontSize: 16,
          }}
          placeholderTextColor={t.colors.muted}
        />
        <ErrorText error={errors.foodDislikes} />
      </Section>
      {/* Notification Settings */}
      <Section title="Notification Settings">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: t.colors.card,
            padding: t.spacing.md,
            borderRadius: t.radius.md,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={t.colors.muted}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontWeight: "600",
                  color: t.colors.text,
                  fontSize: 16,
                }}
              >
                Active Notify
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: t.colors.muted,
                  marginTop: 2,
                }}
              >
                Receive wellness reminders and updates
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              updateField("notifications", !formData.notifications)
            }
            style={({ pressed }) => ({
              width: 50,
              height: 30,
              borderRadius: 15,
              backgroundColor: formData.notifications
                ? t.colors.primary
                : t.colors.border,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.6 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
              transition: "all 0.15s ease",
            })}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#fff",
                transform: [{ translateX: formData.notifications ? 10 : -10 }],
                ...t.shadows.small,
              }}
            />
          </Pressable>
        </View>
      </Section>
      {/* <Section title="Notification Settings">
        <Text>Only for settings</Text>
        <Settings />
      </Section> */}
      {/* Save Button */}
      <Pressable
        onPress={handleSave}
        disabled={saving || completionPercentage < 100}
        style={{
          backgroundColor:
            completionPercentage === 100 ? t.colors.primary : t.colors.muted,
          paddingVertical: t.spacing.lg,
          borderRadius: t.radius.lg,
          alignItems: "center",
          marginVertical: t.spacing.xl,
          opacity: saving ? 0.7 : 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ marginRight: 8 }}
            />
          ) : (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              fontSize: 18,
            }}
          >
            {saving
              ? "Saving..."
              : completionPercentage === 100
                ? "Complete Profile"
                : `Complete Profile (${completionPercentage}%)`}
          </Text>
        </View>
      </Pressable>

      {/* Footer message */}
      <View
        style={{
          padding: t.spacing.md,
          backgroundColor: t.colors.card,
          borderRadius: t.radius.md,
          marginBottom: t.spacing.xl,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: t.colors.muted,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {needsProfile
            ? "Complete your profile to unlock all features and get personalized recommendations"
            : "Your profile is complete! You can update this information anytime."}
        </Text>
      </View>
    </ScrollView>
  );
}
