import { useTokens } from "@app/providers/ThemeProvider"
import { Text as RNText, TextProps } from "react-native"

export function Text(props: TextProps) {
  const t = useTokens()
  return (
    <RNText
      {...props}
      style={[{ color: t.colors.text, fontSize: t.fontSize.md, fontFamily: t.fontFamily.regular }, props.style]}
    />
  )
}
