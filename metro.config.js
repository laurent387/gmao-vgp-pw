const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure wasm assets resolve for expo-sqlite web worker
config.resolver.assetExts.push("wasm");
config.resolver.sourceExts = config.resolver.sourceExts.filter(
	(ext) => ext !== "wasm",
);

module.exports = config;
