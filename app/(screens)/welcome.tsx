import { useAuth } from "@app/providers/AuthProvider";
import { useTokens } from "@app/providers/ThemeProvider";
import { capitalizeWords } from "@app/utils/stringUtils";
import { db } from "@lib/firebase";
import { router } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

export const options = { headerShown: false }; // full-bleed

export default function Welcome() {
  const { user } = useAuth();
  const t = useTokens();
  const name = user?.displayName || user?.email?.split("@")[0] || "there";
  const { width, height } = useWindowDimensions();
  const [showConfetti, setShowConfetti] = useState(true);

  // optional: mark "welcomed" so we don’t show this again
  async function markWelcomed() {
    if (!user?.uid) return;
    await setDoc(
      doc(db, "users", user.uid),
      { welcomed: true, displayName: name },
      { merge: true }
    );

  }

  function goToSetup() {
    markWelcomed();
    router.replace("/profile");
  }

  useEffect(() => {
    // auto stop confetti after a moment
    const id = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(id);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.colors.bg,
        paddingHorizontal: t.spacing.lg,
        justifyContent: "center",
      }}
    >
      {/* Confetti bursts (fallback / in addition) */}
      {showConfetti && (
        <>
          <ConfettiCannon
            count={80}
            origin={{ x: width * 0.15, y: -10 }}
            fadeOut
            explosionSpeed={350}
            fallSpeed={2400}
          />
          <ConfettiCannon
            count={100}
            origin={{ x: width * 0.5, y: -10 }}
            fadeOut
            explosionSpeed={350}
            fallSpeed={2400}
          />
          <ConfettiCannon
            count={80}
            origin={{ x: width * 0.85, y: -10 }}
            fadeOut
            explosionSpeed={350}
            fallSpeed={2400}
          />
        </>
      )}

      <View style={{ gap: t.spacing.md }}>
        <Image
          source={require("@assets/images/logo.png")}
          style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            alignSelf: "center",
            marginBottom: 40,
          }}
        />
        <Text
          style={{
            fontSize: t.fontSize["2xl"],
            fontWeight: "800",
            color: t.colors.text,
          }}
        >
          Hi {capitalizeWords(name)}, welcome aboard! 🎉
        </Text>
        <Text style={{ fontSize: t.fontSize.md, color: t.colors.text }}>
          It's great to have you here. I'm Aura, your AI health buddy.
        </Text>
        <Text style={{ fontSize: t.fontSize.md, color: t.colors.text }}>
          To make sure everything is perfectly customised to your goals, we just
          need you to complete a quick profile setup.
        </Text>

        <Pressable
          onPress={goToSetup}
          style={{
            marginTop: t.spacing.lg,
            backgroundColor: t.colors.primary,
            paddingVertical: t.spacing.md,
            borderRadius: t.radius.lg,
          }}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "700",
              textAlign: "center",
              fontSize: t.fontSize.md,
            }}
          >
            Get started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
