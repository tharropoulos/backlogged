export default {
  clearMocks: true,
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "node",
  coverageProvider: "v8",
  preset: "ts-jest",
  setupFiles: ["dotenv/config"],
  moduleDirectories: ["node_modules", "src/"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest-setup.ts"],
  transform: {
    "^.+\\.mjs$": "ts-jest",
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.test.json" }],
  },
};
