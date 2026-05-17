const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Prevent Metro from resolving react-native-svg to its TS source files
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
