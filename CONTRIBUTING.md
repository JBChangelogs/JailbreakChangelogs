# Contributing to JailbreakChangelogs

First off, thank you for considering contributing to JailbreakChangelogs. It's people like you that make this project such a great tool.

## Environment Setup Required

**Important:** Before you can contribute to this project, you'll need to set up a local environment file with the necessary API endpoints and configuration variables. Due to resource abuse concerns, our API endpoints are not publicly available.

To get access to the required environment variables and API endpoints, you'll need to:

1. Reach out to [@jalenzz](https://discord.com/users/1019539798383398946) on Discord
2. Have a one-on-one discussion about what you're looking to contribute

Once you have the environment file (.env.local) set up, you can proceed with the contribution process outlined below.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Discord server](https://discord.jailbreakchangelogs.xyz) in the issues channel to see if someone else in the community has already reported it. If not, go ahead and [submit an issue](https://www.jailbreakchangelogs.xyz?report-issue)!

## Fork & create a branch

If this is something you think you can fix, then fork the project and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```
git checkout -b 325-fixing-sidebar-images
```

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

## Get the style right

Your patch should follow the same coding conventions & pass the same code quality checks as the rest of the project. Make sure all features work as intended before you make a Pull Request.

## Formatting

We enforce ESLint + Prettier via Git hooks (Husky + lint-staged).

- On commit: staged files are auto-fixed and formatted
  - Runs `eslint --fix` on staged JS/TS files, then `prettier --write` on all staged files
  - If issues remain, the commit is blocked; fix and re-commit

- On push: formatting is verified
  - Runs `bun run format:check`; push is blocked if any files are not formatted

Manual commands (if needed):

```
bun run format       # write formatting changes
bun run format:check # check formatting without writing
```

Notes:

- After a fresh clone, run `bun install` once to set up Husky hooks.

### Editor setup

- Install Prettier and ESLint extensions in your editor.
  - VS Code: "Prettier - Code Formatter" (esbenp.prettier-vscode) and "ESLint" (dbaeumer.vscode-eslint)
- Add these to your VS Code User Settings (Settings JSON):

```
{
  "editor.formatOnSave": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.format.enable": true
}
```

- The Prettier extension will use the project-local Prettier version by default.

## Make a Pull Request

At this point, you should switch back to your main branch and make sure it's up to date with JailbreakChangelogs' main branch:

```
git remote add upstream git@github.com:JBChangelogs/JailbreakChangelogs.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of main, and push it!

```
git checkout 325-fixing-sidebar-images
git rebase main
git push --set-upstream origin 325-fixing-sidebar-images
```

Finally, go to GitHub and [make a Pull Request](https://github.com/JBChangelogs/JailbreakChangelogs/pulls) :D

## Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

```
git checkout 325-fixing-sidebar-images
git pull --rebase upstream main
git push --force-with-lease 325-fixing-sidebar-images
```

## Code review

We will review your PR and may request changes. Address these changes and push your fixes to the same branch.

## What happens next?

We will review your PR and may request changes. Once approved, your PR will be merged into the main branch. Congratulations! You've just contributed to JailbreakChangelogs!

Thank you for your contribution!

## License

By contributing to JailbreakChangelogs, you agree that your contributions will be licensed under its [GNU GENERAL PUBLIC LICENSE](./LICENSE)
