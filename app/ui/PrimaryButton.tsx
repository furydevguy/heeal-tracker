import { useTokens } from "@app/providers/ThemeProvider";
import { Pressable, Text, ViewStyle } from "react-native";

type Props = { title: string; onPress?: () => void; style?: ViewStyle; disabled?: boolean }
export function PrimaryButton({ title, onPress, style, disabled }: Props) {
  const t = useTokens()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          backgroundColor: t.colors.primary,
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.lg,
          borderRadius: t.radius.lg,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: t.fontSize.md,
          fontFamily: t.fontFamily.bold,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </Pressable>
  )
}
