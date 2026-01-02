module.exports = {
  git: {
    commitMessage: "chore: release v${version}",
    tagName: "v${version}",
  },
  npm: {
    publish: false,
  },
  github: {
    release: true,
  },
  plugins: {
    "@release-it/conventional-changelog": {
      infile: "CHANGELOG.md",
      preset: "conventionalcommits",
      whatBump: (commits) => {
        let level = 2;
        let breakings = 0;
        let features = 0;

        commits.forEach((commit) => {
          if (commit.notes.find((note) => note.title === "BREAKING CHANGE")) {
            breakings++;
            level = 0;
          } else if (commit.type === "feat") {
            features++;
            if (level === 2) {
              level = 1;
            }
          }
        });

        return {
          level,
          reason:
            breakings === 1
              ? `There is ${breakings} BREAKING CHANGE and ${features} features`
              : `There are ${breakings} BREAKING CHANGES and ${features} features`,
        };
      },
    },
  },
};
