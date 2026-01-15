const config = {
  extends: ["@commitlint/config-conventional"],
  ignores: [(commit) => commit.startsWith("Bump")],
};

export default config;
