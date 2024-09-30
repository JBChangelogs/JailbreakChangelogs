# Contributing to JailbreakChangelogs

First off, thank you for considering contributing to JailbreakChangelogs. It's people like you that make this project such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/JBChangelogs/JailbreakChangelogs/issues) page to see if someone else in the community has already created a ticket. If not, go ahead and [make one](https://github.com/JBChangelogs/JailbreakChangelogs/issues/new)!

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

A team member will review your PR and may request changes. Address these changes and push your fixes to the same branch.

## What happens next?

We will review your PR and may request changes. Once approved, your PR will be merged into the main branch. Congratulations! You've just contributed to JailbreakChangelogs!

Thank you for your contribution!

## License

By contributing to JailbreakChangelogs, you agree that your contributions will be licensed under its [GNU GENERAL PUBLIC LICENSE](./LICENSE)
