/**
 * AURA AI CHAT SCREEN
 *
 * This screen implements a sophisticated AI-powered chat interface with the following features:
 *
 * 🤖 AI INTEGRATION ARCHITECTURE:
 * ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
 * │   React Native  │───▶│ Cloudflare Worker│───▶│   OpenAI API    │
 * │   Chat UI       │    │ (aura-ai.workers │    │   (GPT-4o)      │
 * │                 │    │  .dev)           │    │                 │
 * └─────────────────┘    └──────────────────┘    └─────────────────┘
 *         │                        │                        │
 *         ▼                        ▼                        ▼
 * ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
 * │ Firebase        │    │ Authentication   │    │ AI Responses    │
 * │ (Chat History)  │    │ & Rate Limiting  │    │ & Context       │
 * └─────────────────┘    └──────────────────┘    └─────────────────┘
 *
 * 🔄 CHAT FLOW:
 * 1. User types message → Firebase (persistence)
 * 2. Health check → Cloudflare Worker availability
 * 3. AI request → OpenAI via Cloudflare Worker
 * 4. AI response → Firebase (chat history)
 * 5. UI update → Display conversation
 *
 * 🛡️ ERROR HANDLING:
 * - Graceful fallbacks when AI service is unavailable
 * - User-friendly error messages
 * - Comprehensive logging for debugging
 *
 * 🧪 DEBUG FEATURES:
 * - Health check monitoring
 * - Firebase connectivity testing
 * - Onboarding flow testing
 * - Chat history management
 */

import { deleteAllDocumentsByUser } from "@app/lib/firebase";
import { useAuth } from "@app/providers/AuthProvider";
import { useTokens } from "@app/providers/ThemeProvider";
// AI Chat Integration - Modularized Cloudflare Worker Communication
import { askAuraCF, checkCloudflareHealth } from "@chat/ai";
// Chat data management and Firebase integration
import {
  ChatMessage,
  onUserMessages,
  sendAura,
  sendUserMessage,
} from "@chat/data";
// Onboarding flow management
import {
  completeOnboarding,
  doesCurrentStepRequireAnswer,
  progressOnboardingStep,
  sendNextOnboardingQuestion,
} from "@chat/onboardingFlow";
import {
  TOTAL_ONBOARDING_STEPS,
  onboardingQuestions,
} from "@chat/onboardingQuestions";
import { FullyAuthenticated } from "@components/common/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  UserPlan,
  UserProfile,
  getUserPlan,
  getUserProfile,
  saveUserPlan,
} from "@app/lib/firebaseHelpers";
import { cloudflareApi } from "@chat/cloudflareApi";
import Spinner from "@ui/Spinner";
import { router } from "expo-router";
import { Svg, Image as SvgImage } from "react-native-svg";

/**
 * Cloudflare Worker Configuration
 *
 * The AI chat functionality uses a modularized approach with the following architecture:
 *
 * 1. CloudflareApiService (cloudflareApi.ts) - Handles direct communication with Cloudflare Worker
 * 2. AI Service Layer (ai.ts) - Provides high-level chat functions with health checks
 * 3. Chat UI (this file) - Manages user interaction and message display
 *
 * The Cloudflare Worker (aura-ai.maesantos713.workers.dev) acts as a secure proxy to OpenAI,
 * handling authentication and providing a consistent API interface.
 */

// Using ChatMessage type from data.ts

// Helper function to format message timestamps
function formatMessageTimestamp(ts: any): string {
  if (!ts) return "";
  const date: Date = ts?.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();

  // Start of "today" and "yesterday"
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const isToday = date >= startOfToday;
  const isYesterday = date >= startOfYesterday && date < startOfToday;
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (isThisYear) {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const AuraIcon20 = () => {
  const base64Png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAFUElEQVR4nGWUa2yUdRbGn/N/33ln3rm2ZYaWoqVcFNSlNsV6wUtsQBRRRAk0cXdjiB82WVc3iKL7gbxONibegkYlaqLZSBbU1rgLxgsiIrWI2iJaammnygC9TO1lOtPpzLzX/9kPiwnq7/PJL3lOznkIF8DMgogkAJRGuuus4IImk+UyhuJXmE1Znu6Ts+bg/GUN/b+d/wX1AhkRkRw++OYcali9NRuqbM3bYokLBR4IqkJgn45ILUb7hzNHMh0f7CSiboNZJC+Q0v9lhiBKygNtLy78wy33tc34oled/GkInutJIsHMEgxADwREUA9QvDKG4s9Dpcz3X21vbW3dZRiGSCaTDIBVwzAE8AT2PJyKhxesfHfY1ZtO9adc6TnCtizoekAhUiEUgbHhIRaC5HisQkaisWCiYeXL7e/829vU+qdXz8dn0XfFE0REUlt8zfYJi5uOdn7hKIpQI7GYqKiqEsxg17FAgjAxNoLxzAgpqqqOnEt7Y6bH6oLG53dse6hZCCE3bWpTCABm0n33dE96uzu/6wnoFVEKBCspdfIkiqYJ6dggKSE0H8IhHXAcKJqGUDiMWDzhLm1Y4ZvsO96+5e61rQYzqVtee2PtvmJwTyyiB4QvIJ3pHP1399s4NzoOtksQ0QRICGhaAOXRFIZPdUNVVPg1DdUX1SuNN67mprrE2rYXn63fTJRWB0XF5uLpTODO6io3GNSVVO8JnOrqhBACEBouqrsEM9NZuBNpZM/0Q5CA9FwUyy5OD/ZRsViWvCARbnx0+z+Z+X4119vX4HzXw9l1q0maJqxyCdmxs4hU1eCOB7bCJ10609fLHV/uhwCBhAArPjSv3ohYPI4v332ThhRL5ovOH48NpPcL17LnOlOTNDXQS14hD9uyQERobLmdZkfTtPvJbXxp41WorKkHA/Ckh6VXr8Kc+RcjFNBwzYZ7KZUZl5PTOf4+PdQkQEpeahorZhGwTTiuC2ZGMZdj13VwefNKhGIVcGzr/NUC/nAUHf/Zi1NdnaitX0TQNJBZwpmvPi+J6hVX/lh3/fVkT025tlnCvHm1CEei+PbQeyjMlPnmTffTJ3v/hdlsBprPDyEERgd6sG7L37Dhr4/h6Af7OKbrFJUW8Y+9Z+m+k0N/XjH47eviWIeW8ce8YDgixibGcbzrGwwO9KNQmIFZKuC3VMxbDDAhN5aWWzZuUO5uXjr76Rdd1xEA5etn/n51To2+MlgOXpkxHUfXA6rPF0DRLGMqm0VhJofpfA6FmQJs24RkBkmHQqGwXLJoKa+/Yr6il0f/0fLIC0/R+T+UbcaDl0tFf78Yql6ULnpSWmWp+X1C+FkIFRBMIAKgeBBkS0+xJXkaLXQDSrA0um39jl072TCESCaT8rBhqJuTL/WZE6k1TTXiYFN1WMRjUZUUTTgOc1Ezka+Y5elIlnPqqDeBYTL9tloTTiiilH96/Y5dOw3DEJRMMjGzaG9vp0TiB2ppSbrMUI6+/Pi6s3lx77ki3TpLWkyp1FnMFST9HlGhgHDZtut8if7a2kufvPGuu9qYWQBgImL63bYB8OHn4rg5ld967ccvHZ0Qf5n1V9gRv67Vx2PTq1qan0n4qo5s3L71GP+6nImIoKbT6WUjI2duyPccG4tUJaZD8eqHDqUGbpvsWWKacy9TTnx9AO75Ii5XBtWG0g/3uDXVK05/tOutgCgdqFnzCIZ7Pq8komEAoEOpkZGy7dT+3HscWveHpdKcRcFSXQMsy4QLoOvwQT7R8Rksy4IqFFpe5cNNyy/B7Q8+ipp5wSOZj9rJt/yWGmfu4s5QMfX4/wDF8ZZQYPAw2QAAAABJRU5ErkJggg=="; // truncated

  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      preserveAspectRatio="xMidYMid meet"
    >
      <SvgImage
        href={base64Png} // or xlinkHref for older versions
        width={20}
        height={20}
        x={0}
        y={0}
      />
    </Svg>
  );
};

export const AuraIcon30 = () => {
  const base64Png =
    "data:image/png;base64,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"; // truncated

  return (
    <Svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      preserveAspectRatio="xMidYMid meet"
    >
      <SvgImage
        href={base64Png} // or xlinkHref for older versions
        width={30}
        height={30}
        x={0}
        y={0}
      />
    </Svg>
  );
};

function ChatScreenContent() {
  const t = useTokens();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [onboardingStep, setOnboardingStep] = useState<number | undefined>(0);
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    getUserProfile(user.uid).then((p: UserProfile | null) => {
      setOnboardingStep(p?.onboardingStep ?? 0);
      setOnboarded(p?.onboarded ?? false);
      setProfile(p as UserProfile);
    });
    return onUserMessages(user.uid, (items: ChatMessage[]) => {
      setMessages(items);
      if (onboardingStep !== undefined && !onboarded) {
        console.log("➡️  Sending next onboarding question:", onboardingStep);
        sendNextOnboardingQuestion(user.uid, onboardingStep, items);
      }

      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    });
  }, []);

  // Auto-scroll to bottom when messages are loaded
  useEffect(() => {
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true })
    );
  }, [messages]);
  // Handle onboarding flow when screen is focused

  /**
   * Main message sending function with AI integration
   *
   * This function handles two distinct modes:
   * 1. Onboarding Mode: Guides users through initial setup questions
   * 2. AI Chat Mode: Provides AI-powered health coaching via Cloudflare Worker
   *
   * The AI integration uses a modularized approach:
   * - Health checks ensure Cloudflare Worker is available
   * - Graceful fallbacks handle service unavailability
   * - Error handling provides user-friendly messages
   */
  async function send() {
    const text = input.trim();
    if (!text || !user?.uid || busy) return;

    try {
      setInput("");
      setBusy(true);

      // Always save user message to Firebase first
      await sendUserMessage(user.uid, text, { onboardingStep: onboardingStep });
      if (!onboarded) {
        // ===== ONBOARDING MODE =====
        // Handle user responses during the onboarding flow
        // Only progress if the current step requires a user answer
        // Auto-progression steps are handled by sendNextOnboardingQuestion
        if (
          onboardingStep !== undefined &&
          doesCurrentStepRequireAnswer(onboardingStep)
        ) {
          await progressOnboardingStep(user.uid, onboardingStep!);
        } else {
          console.info("ℹ️  Step doesn't require answer - ignoring user input");
        }

        // Update local state and check for completion
        setOnboardingStep(onboardingStep! + 1);
        if (onboardingStep == TOTAL_ONBOARDING_STEPS - 2) {
          setLoading(true);
          setOnboarded(true);
          await completeOnboarding(user.uid);
          const text = messages.filter(msg => msg.role === 'user').map((m) => onboardingQuestions[m.meta.onboardingStep].shortQuestion + m.text).join("\n");
          const coreMotivation = messages.filter(msg => msg.role === 'user' && msg.meta.onboardingStep == 0).map((m) => m.text).join("\n");
          const plan = await cloudflareApi.createPlan(text, profile as UserProfile, coreMotivation);

          let planData;
          try {
            planData = JSON.parse(plan);
          } catch (parseError) {
            console.error("❌ Error parsing plan JSON:", parseError);
            throw new Error("Failed to parse plan response");
          }

          const mealPlan = planData.mealPlan;
          const workoutPlan = planData.workoutPlan;

          // Store plans in Firebase
          try {
            const userPlan: UserPlan = {
              userId: user.uid,
              mealPlan,
              workoutPlan,
            };
            await saveUserPlan(userPlan);
          } catch (error) {
            console.error("❌ Error saving plans to Firebase:", error);
            throw error;
          }
          setLoading(false);
          await sendAura(
            user.uid,
            "🎉 Congratulations! Your onboarding is complete. I now have everything I need to create your personalized wellness plan. Welcome to your journey with Aura!",
            {
              onboardingCompleted: true,
            }
          );
          // Check if user has a meal plan
          const userPlan = await getUserPlan(user.uid);
          if (userPlan) {
            router.replace("/(tabs)/meal");
          } else {
            router.replace("/(tabs)/workout");
          }
        }
      } else {
        // ===== AI CHAT MODE =====
        // Use modularized Cloudflare API for AI-powered responses

        try {
          // Step 1: Health Check
          // Verify Cloudflare Worker is available before making AI requests
          const isHealthy = await checkCloudflareHealth();
          if (isHealthy) {
            // Step 2: AI Request
            // Send user message to OpenAI via Cloudflare Worker
            const { reply } = await askAuraCF({
              userText: text,
              userData: profile as UserProfile,
            });

            // Step 3: Save AI Response
            // Store the AI response in Firebase for chat history
            await sendAura(user.uid, reply);
          } else {
            // Fallback: Service Unavailable
            // Provide helpful message when Cloudflare Worker is down
            await sendAura(
              user.uid,
              "I'm currently experiencing some technical difficulties. Please try again in a moment, or explore the other tabs to see your plan and track your progress!"
            );
          }
        } catch (error) {
          // Fallback: API Error
          // Handle any errors in the AI request process
          console.error("Cloudflare API error:", error);
          await sendAura(
            user.uid,
            "Thanks for your message! I'm currently being set up to provide you with personalized health advice. For now, explore the other tabs to see your plan and track your progress!"
          );
        }
      }
    } catch (e: any) {
      // Global Error Handler
      // Catch any unexpected errors and provide user feedback
      console.error("Error in send() function:", e);
      await sendAura(
        user.uid,
        "Hmm, I hit a snag reaching my brain. Please try again in a moment.",
        { error: String(e?.message ?? e) }
      );
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  const renderItem = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const mine = item.role === "user";
    const isNotification = item.meta?.kind === "notification";
    const isConsecutive = index > 0 && messages[index - 1]?.role === item.role;
    return (
      <View
        style={{
          paddingHorizontal: t.spacing.lg,
          marginVertical: isConsecutive ? 2 : 8,
          alignItems: mine ? "flex-end" : "flex-start",
        }}
      >
        {/* Avatar for Aura messages */}
        <View
          style={{
            flexDirection: mine ? "row-reverse" : "row",
            alignItems: "flex-end",
            maxWidth: "85%",
          }}
        >
          {!mine && (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: t.colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
                marginBottom: 4,
              }}
            >
              <AuraIcon20 />
            </View>
          )}

          {/* Message bubble */}
          <View
            style={{
              backgroundColor: mine
                ? t.colors.primary
                : isNotification
                  ? t.colors.success + 10
                  : t.colors.card,
              paddingHorizontal: t.spacing.md,
              paddingVertical: t.spacing.sm,
              borderRadius: 20,
              borderBottomRightRadius: mine ? 6 : 20,
              borderBottomLeftRadius: mine ? 20 : 6,
              maxWidth: "100%",
              ...t.shadows.small,
            }}
          >
            {isNotification && (
              <Text
                style={{
                  color: t.colors.primary,
                  fontSize: 16,
                  lineHeight: 22,
                  textAlign: "right",
                }}
              >
                <Ionicons name="notifications-outline" />
              </Text>
            )}

            <Text
              style={{
                color: mine ? "#fff" : t.colors.text,
                fontSize: 16,
                lineHeight: 22,
              }}
            >
              {item.text}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        {!isConsecutive && (
          <Text
            style={{
              fontSize: 11,
              color: t.colors.muted,
              marginTop: 4,
              marginHorizontal: mine ? 0 : 40,
            }}
          >
            {item.createdAt ? formatMessageTimestamp(item.createdAt) : ""}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {/* Chat Header */}
      <View
        style={{
          paddingTop: Platform.OS === "ios" ? 60 : 20,
          paddingBottom: 16,
          paddingHorizontal: t.spacing.lg,
          backgroundColor: t.colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: t.colors.border,
          ...t.shadows.small,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: t.colors.primary + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AuraIcon30 />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: t.colors.text,
              }}
            >
              Aura
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: t.colors.muted,
              }}
            >
              {busy ? "Typing..." : "Your AI wellness coach"}
            </Text>
          </View>
          {busy && (
            <View style={{ flexDirection: "row", gap: 4 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: t.colors.primary,
                }}
              />
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: t.colors.primary,
                  opacity: 0.6,
                }}
              />
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: t.colors.primary,
                  opacity: 0.3,
                }}
              />
            </View>
          )}
          {/* ===== DEBUG & TESTING SECTION ===== */}
          {/* 
            Development-only debug buttons for testing AI chat functionality:
            - Clear chat history
            - Test Firebase connectivity  
            - Test onboarding flow
            - Test Cloudflare Worker health
          */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Clear Chat History Button */}
            <Pressable
              onPress={async () => {
                if (!user?.uid) return;
                try {
                  await deleteAllDocumentsByUser(user.uid, "chatMessages");
                } catch (error) {
                  console.error("❌ Manual test failed:", error);
                }
              }}
              style={{
                padding: 8,
                borderRadius: 16,
                backgroundColor: t.colors.danger + "20",
              }}
            >
              <Ionicons name="refresh" size={16} color={t.colors.danger} />
            </Pressable>
          </View>
        </View>

        {/* Status messages */}
        {!onboarded && (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: t.colors.primary + "10",
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: t.colors.primary,
            }}
          >
            <Text style={{ color: t.colors.text, fontSize: 14 }}>
              🎯 Onboarding Progress: Step {onboardingStep! + 1}/
              {TOTAL_ONBOARDING_STEPS} - Building your personalized plan
            </Text>
          </View>
        )}
      </View>
      {loading ? (<View style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <AuraIcon30 />
        <Spinner />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: '600', color: t.colors.primary }}>Setting up your personalized plan...</Text>
        </View>
      </View>) :
        (<KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          />

          {/* ===== AI CHAT INPUT AREA ===== */}
          {/* 
          Modern input interface that handles both onboarding and AI chat modes:
          - Dynamic placeholder text based on current state
          - Real-time typing indicators
          - Integrated send button with loading states
          - Automatic message processing via send() function
        */}
          <View
            style={{
              paddingHorizontal: t.spacing.lg,
              paddingVertical: t.spacing.md,
              backgroundColor: t.colors.bg,
              borderTopWidth: 1,
              borderTopColor: t.colors.border,
              ...t.shadows.small,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: t.spacing.sm,
                paddingBottom: Platform.OS === "ios" ? 8 : 0,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: t.colors.card,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: input.trim() ? t.colors.primary : t.colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  maxHeight: 120,
                }}
              >
                <TextInput
                  multiline={true}
                  placeholder={
                    busy
                      ? "Processing..."
                      : !onboarded
                        ? "Type your answer..."
                        : "Message Aura..."
                  }
                  placeholderTextColor={t.colors.muted}
                  value={input}
                  onChangeText={setInput}
                  editable={!busy}
                  style={{
                    color: t.colors.text,
                    fontSize: 16,
                    lineHeight: 20,
                    textAlignVertical: "top",
                  }}
                  scrollEnabled={false}
                />
              </View>

              {/* AI Chat Send Button */}
              {/* 
              Triggers the send() function which handles:
              - Onboarding mode: Progress through setup questions
              - AI chat mode: Send to OpenAI via Cloudflare Worker
              - Error handling: Graceful fallbacks for service issues
            */}
              <Pressable
                onPress={send}
                disabled={busy || !input.trim()}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor:
                    busy || !input.trim() ? t.colors.muted : t.colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: t.colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: busy || !input.trim() ? 0 : 0.3,
                  shadowRadius: 4,
                  elevation: busy || !input.trim() ? 0 : 3,
                }}
              >
                {busy ? (
                  <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>)}
    </View>
  );
}

export default function ChatScreen() {
  return (
    <FullyAuthenticated>
      <ChatScreenContent />
    </FullyAuthenticated>
  );
}
