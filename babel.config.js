module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ["module-resolver", {
        extensions: [".ts", ".tsx", ".js", ".json"],
        alias: {
            "@app": "./app",
            "@features": "./app/features",
            "@habits": "./app/features/habits",
            "@ui": "./components/ui",
            "@lib": "./app/lib",
            "@config": "./app/config",
            "@chat": "./app/(features)/chat",
            "@components": "./components",
            "@assets": "./assets"
        }
      }],
      "react-native-reanimated/plugin"
    ]
  }
}
