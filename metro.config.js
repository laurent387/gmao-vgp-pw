const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

// Ensure wasm assets resolve for expo-sqlite web worker
config.resolver.assetExts.push("wasm");
config.resolver.sourceExts = config.resolver.sourceExts.filter(
	(ext) => ext !== "wasm",
);

module.exports = withRorkMetro(config);
