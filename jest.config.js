module.exports = {
  roots: ["<rootDir>/src"],
  testTimeout: 60000,
  preset: "@shelf/jest-dynamodb",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
}
