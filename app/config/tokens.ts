export type Tokens = {
  colors: {
    primary: string
    secondary: string
    bg: string
    card: string
    text: string
    muted: string
    border: string
    success: string
    danger: string
  }
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; "2xl": number }
  radius: { sm: number; md: number; lg: number; xl: number }
  fontSize: { xs: number; sm: number; md: number; lg: number; xl: number; "2xl": number }
  fontFamily: { regular: string; medium: string; bold: string }
  shadows: {
    small: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
    medium: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
    large: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
    none: {
      shadowColor: string
      shadowOffset: { width: number; height: number }
      shadowOpacity: number
      shadowRadius: number
      elevation: number
    }
  }
}

export const lightTokens: Tokens = {
  colors: {
    primary: "#2ECC71",
    secondary: "#3498DB",
    bg: "#FFFFFF",
    card: "#FFFFFF",
    text: "#111111",
    muted: "#888888",
    border: "#E6E6E6",
    success: "#2ECC71",
    danger: "#FF3B30",
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24 },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, "2xl": 32 },
  fontFamily: {
    regular: "Inter_400Regular",
    medium: "Inter_600SemiBold",
    bold: "Inter_600SemiBold",
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }
}

export const darkTokens: Tokens = {
  ...lightTokens,
  colors: {
    ...lightTokens.colors,
    bg: "#1A1A1A",
    card: "#2A2A2A",
    text: "#F2F2F2",
    muted: "#9B9B9B",
    border: "#3A3A3A",
    // keep primary the same for brand consistency
  },
  shadows: {
    small: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    medium: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    large: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }
}
