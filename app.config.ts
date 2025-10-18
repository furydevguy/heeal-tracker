import { ConfigContext, ExpoConfig } from "expo/config";
import firebase from "./firebase.client.json";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Aura Wellness Coach",
  slug: "aura-wellness-coach",
  scheme: "aura-wellness-coach",
  userInterfaceStyle: "automatic",
  owner: "mss-dev",
  web: {
    themeColor: "#2ECC71",
    backgroundColor: "#ffffff"
  },
  android: {
    package: "com.anonymous.aurawellnesscoach",
    versionCode: 1
  },
  ios: {
    bundleIdentifier: "com.anonymous.aurawellnesscoach",
    buildNumber: "1",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  extra: {
    firebase,
    eas: { projectId: "ca27fb72-e048-4170-be3f-29f21b31bf3c" }
  },
  experiments: {
    tsconfigPaths: true
  },
  plugins: [
    "expo-font"
  ]
});
