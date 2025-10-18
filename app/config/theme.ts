import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native"
import { darkTokens, lightTokens } from "./tokens"

export const navLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightTokens.colors.primary,
    background: lightTokens.colors.bg,
    card: lightTokens.colors.card,
    text: lightTokens.colors.text,
    border: lightTokens.colors.border,
    notification: lightTokens.colors.primary,
  },
}

export const navDark: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkTokens.colors.primary,
    background: darkTokens.colors.bg,
    card: darkTokens.colors.card,
    text: darkTokens.colors.text,
    border: darkTokens.colors.border,
    notification: darkTokens.colors.primary,
  },
}
