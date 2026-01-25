const fs = require("fs");
const path = require("path");

// Copy wa-sqlite.wasm into expo-sqlite web folder so Metro can bundle it
const wasmSrc = path.join(
  __dirname,
  "..",
  "node_modules",
  "wa-sqlite",
  "dist",
  "wa-sqlite.wasm",
);
const wasmDestDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-sqlite",
  "web",
  "wa-sqlite",
);
const wasmDest = path.join(wasmDestDir, "wa-sqlite.wasm");

try {
  if (!fs.existsSync(wasmSrc)) {
    console.warn("wa-sqlite.wasm not found at", wasmSrc);
    process.exit(0);
  }

  fs.mkdirSync(wasmDestDir, { recursive: true });
  fs.copyFileSync(wasmSrc, wasmDest);
  console.log("Copied wa-sqlite.wasm to expo-sqlite web dir");
} catch (err) {
  console.warn("Failed to copy wa-sqlite.wasm:", err.message);
  process.exit(0);
}
