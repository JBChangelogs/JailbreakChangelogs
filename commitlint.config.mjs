const config = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    (commit) => commit.startsWith("Bump"),
    (commit) => commit.startsWith("Updating"),
    (commit) => commit.startsWith("Update"),
  ],
};

export default config;
