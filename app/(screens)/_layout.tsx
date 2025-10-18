import { HeaderAvatar } from "@ui/HeaderAvatar";
import { Stack } from "expo-router";

export default function AppStackLayout() {  
  return (
    <Stack
      screenOptions={{
        headerRight: () => <HeaderAvatar />,
      }}
    />
  )
}
