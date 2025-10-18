import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { darkTokens, lightTokens, type Tokens } from "../config/tokens";

type ThemeCtx = {
  tokens: Tokens;
  scheme: "light" | "dark";
  setScheme: (scheme: "light" | "dark") => void;
  toggleScheme: () => void;
}
const Ctx = createContext<ThemeCtx | null>(null)

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const osScheme = (useColorScheme() ?? "light") as "light" | "dark"
  const [scheme, setScheme] = useState<"light" | "dark">(osScheme)

  // Load persisted preference
  useEffect(() => {
    let mounted = true
    AsyncStorage.getItem("app.theme.scheme").then((stored) => {
      if (!mounted) return
      if (stored === "light" || stored === "dark") {
        setScheme(stored)
      }
    }).catch(() => {
      // ignore read errors, fall back to OS scheme
    })
    return () => { mounted = false }
  }, [])

  const persistScheme = async (next: "light" | "dark") => {
    try { await AsyncStorage.setItem("app.theme.scheme", next) } catch {}
  }

  const handleSetScheme = (next: "light" | "dark") => {
    setScheme(next)
    persistScheme(next)
  }

  const toggleScheme = () => {
    const next = scheme === "dark" ? "light" : "dark"
    handleSetScheme(next)
  }

  const tokens = useMemo(() => (scheme === "dark" ? darkTokens : lightTokens), [scheme])
  const value = useMemo(() => ({ tokens, scheme, setScheme: handleSetScheme, toggleScheme }), [tokens, scheme])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTokens() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useTokens must be used inside <AppThemeProvider>")
  return ctx.tokens
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useTheme must be used inside <AppThemeProvider>")
  return ctx
}
