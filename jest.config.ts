export default {
  clearMocks: true,
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  coverageProvider: "v8",
  preset: "ts-jest/presets/js-with-ts",
  setupFiles: ["dotenv/config"],
  moduleDirectories: ["node_modules", "src/"],
  transform: {
    "^.+\\.mjs$": "ts-jest", // Without this testing breaks
  },
};
