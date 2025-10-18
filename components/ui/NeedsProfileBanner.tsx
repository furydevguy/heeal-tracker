// simple banner to drop into any screen
import { useAuth } from "@app/providers/AuthProvider"
import { Text, View } from "react-native"
export function NeedsProfileBanner(){
  const { needsProfile } = useAuth()
  if (!needsProfile) return null
  return (
    <View style={{ padding:12, backgroundColor:"#FFF3CD", borderColor:"#FFEEA3", borderWidth:1, borderRadius:12, margin:12 }}>
      <Text>Finish your profile to unlock the full app. 🎯</Text>
    </View>
  )
}
