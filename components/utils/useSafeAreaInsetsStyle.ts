import { ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type ExtendedEdge = "top" | "bottom" | "left" | "right"

/**
 * A hook that can be used to create a safe-area-aware style object that can be passed directly to a View.
 */
export function useSafeAreaInsetsStyle(
  safeAreaEdges: ExtendedEdge[] = [],
  property: "padding" | "margin" = "padding",
): ViewStyle {
  const insets = useSafeAreaInsets()

  return safeAreaEdges.reduce((acc, edge) => {
    const value = insets[edge]
    if (value) {
      const key = `${property}${edge.charAt(0).toUpperCase()}${edge.slice(1)}` as keyof ViewStyle
      return { ...acc, [key]: value }
    }
    return acc
  }, {})
}
