// Temporary fallback to legacy config due to Next.js v16 compatibility issues
module.exports = {
  extends: ["next/core-web-vitals", "prettier"],
  ignorePatterns: [
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ],
};
