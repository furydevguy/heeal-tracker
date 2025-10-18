// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

// Hide frames that have a bogus file like "<anonymous>"
config.symbolicator = {
  customizeFrame: (frame) => {
    if (!frame.file || frame.file.includes("<anonymous>")) {
      return { ...frame, collapse: true };
    }
    return frame;
  },
  customizeStack: (stack) => stack.filter((f) => f.file && !f.file.includes("<anonymous>")),
};

module.exports = config;
