# Contributing to JailbreakChangelogs

First off, thank you for considering contributing to JailbreakChangelogs. It's people like you that make this project such a great tool.

## Environment Setup Required

**Important:** Before you can contribute to this project, you'll need to set up a local environment file with the necessary API endpoints and configuration variables. Due to resource abuse concerns, our API endpoints are not publicly available.

To get access to the required environment variables and API endpoints, you'll need to:

1. Reach out to [@jalenzz](https://discord.com/users/1019539798383398946) on Discord
2. Have a one-on-one discussion about what you're looking to contribute

Once you have the environment file (.env.local) set up, you can proceed with the contribution process outlined below.

**Note:** You can reference the [`.env.example`](.env.example) file to see the structure and required environment variables for the project.

### Signing in locally

Discord login cookies don't work on `localhost`, so local dev signs in with your session token instead.

1. Open [api.jailbreakchangelogs.com](https://api.jailbreakchangelogs.com) and copy the token under **Your Session Token**.
2. If no token shows, sign in on [jailbreakchangelogs.com](https://jailbreakchangelogs.com), then come back to the API homepage in the same browser.
3. Add these to `.env.local`:

```env
RAILWAY_ENVIRONMENT_NAME="development"
NEXT_PUBLIC_DEV_TOKEN="<your session token>"
```

The token is only used when `RAILWAY_ENVIRONMENT_NAME` is `development`. Restart `bun dev` after changing either value.

**Keep your token private.** It signs in as you, so never commit it or paste it in screenshots, issues, or PRs.

### Testing Discord previews

`DISCORD_EMBED_ORIGIN` is optional. Leave it empty for the production default, `https://jailbreakchangelogs.com`.

To test previews through a public tunnel before deploying, set it in `.env.local` to the tunnel's origin, for example:

```env
DISCORD_EMBED_ORIGIN="https://jbcl-frontend.jailbreakchangelogs.com"
```

Rebuild with `bun run build`, then run `bun start:cf`. Share the tunnel URL in Discord or use the [Embed Debugger](https://discord.com/developers/embeds). Discord must be able to fetch both the page and its linked JSON without signing in. Clear the override when you finish testing.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Discord server](https://discord.jailbreakchangelogs.com) in the issues channel to see if someone else in the community has already reported it. If not, go ahead and [submit an issue](https://jailbreakchangelogs.com?report-issue)!

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

## Formatting, Linting & Tests

We enforce Oxlint + Oxfmt via Git hooks (Husky + lint-staged).

- On commit: staged files are auto-fixed and formatted
  - Runs `oxlint --fix` and `oxfmt` on staged JS/TS files
  - Runs the full test suite with `bun run test`
  - If issues remain, the commit is blocked; fix and re-commit

- On push: formatting and linting are verified
  - Runs `bun run format:check` and `oxlint --deny-warnings`; push is blocked if any files are not formatted or have lint warnings/errors

Manual commands (if needed):

```
bun run format  # auto-fix formatting
bun run check   # formatting check + type-check + lint + tests
bun test        # run all tests
bun test src/utils/trading/values.test.ts  # run one test file
```

All tests must pass before submitting a Pull Request. GitHub Actions also runs the tests for every PR. For bug fixes and changes to business logic, add or update focused tests that cover the affected behavior. Keep test files beside the code they cover, using `.test.ts` or `.test.tsx`.

Notes:

- After a fresh clone, run `bun install` once to set up Husky hooks.

### Editor setup

- Install an Oxlint/Oxc extension in your editor.
  - VS Code: "Oxc" (official extension)

#### VS Code Configuration

**Settings (User Settings JSON):**
Add these to your VS Code User Settings (Settings JSON) if you want on-save formatting:

```json
{
  "editor.formatOnSave": true,
  "tailwindCSS.experimental.classRegex": [
    ["className\\s*:\\s*['\"]([^'\"]*)['\"]"]
  ]
}
```

**Extensions (Workspace Recommendations):**
If you want VS Code to prompt you to install recommended extensions when opening this project, create a `.vscode/extensions.json` file in the project root:

```json
{
  "recommendations": ["oxc.oxc"]
}
```

## Icons

We use [Iconify](https://iconify.design) with icon data bundled at build time, so icons render on the server without pop-in.

- Import the icon component from the wrapper, not from `@iconify/react` directly:

```tsx
import { Icon } from "@/components/ui/IconWrapper";

<Icon icon="heroicons:cube" className="h-5 w-5" />;
```

- Browse available icons at [icon-sets.iconify.design](https://icon-sets.iconify.design).
- Using an icon from a set already in the project just works — `bun dev` and `bun run build` regenerate the bundle automatically.
- Using a set for the first time: the build will fail and tell you to run `bun add -d @iconify-json/<set>`. Run it and you're done.
- Never edit `src/lib/icon-bundle.generated.ts` by hand; it's regenerated by `scripts/generate-icon-bundle.ts`. Commit it when it changes.
- Avoid building icon names at runtime (e.g. `` icon={`mdi:${x}`} ``) — the bundler can't see those, so they fall back to a client-side fetch with visible pop-in.

## Theme and palette contributions

Themes aren't stored in this repo. Maintainers manage them from the dashboard, and the site loads them from the API (`GET /v2/themes`), so the website and the desktop app both pick up a new theme without a code change or deploy. To contribute a theme, you write it as JSON, preview it locally, and send it to us; you don't need to open a pull request.

1. Copy an existing theme from [`/v2/themes`](https://api.jailbreakchangelogs.com/v2/themes) as a starting point. Pick one with the same `scheme` (`dark` or `light`) as yours.
2. Change its fields:
   - `slug`: the theme's ID, which becomes a CSS class. Lowercase letters, numbers, and hyphens; it must start with a letter.
   - `label`: the name shown in the theme picker.
   - `icon`: an [Iconify](https://icon-sets.iconify.design/) name, such as `lucide:moon`.
   - `scheme`: `dark` or `light`, so browser controls, toasts, and light-only styles match.
   - `vars`: every `--color-*` variable. Keep all of them, even unchanged ones, so nothing falls back to the dark theme's colors. Values can be any CSS color, including `color-mix()` and `var(--color-…)`; `{ } ; < > \`, `url(`, and `/*` are rejected.
   - `logo_filter`: the logo's CSS filter, or `null` for the original blue (see below).
   - `cursor_url` and `cursor_size`: the image for the optional theme cursor, or `null`. Include the image in your submission and we'll host it.
3. Preview it locally: run `bun dev`, and in `getThemes()` in `src/utils/api/themes.ts`, temporarily add your theme to the list, for example `themes = [...themes, ...sanitizeThemes([yourTheme])]`. Then select it in the theme picker. Don't commit this change.
4. [Submit an issue](https://jailbreakchangelogs.com?report-issue) or post in our [Discord server](https://discord.jailbreakchangelogs.com) with your theme's JSON and the screenshots listed below.

### Matching the logo to a palette

The header and footer share `public/logos/JBCL_Header.webp` through `src/components/ui/SiteLogo.tsx` and the `.header-logo` CSS class. The collaboration version uses `public/logos/collab/JBCL_Collab_Dark.webp` or `JBCL_Collab_Light.webp`; only the JBCL side receives the same filter. The image's original accent is blue. New themes keep that blue unless their `logo_filter` is set; a new image is not needed.

One `logo_filter` updates both the standalone JBCL logo and the JBCL side of the collaboration logo. Keep Trading Core's blue and orange unchanged. The neutral “X” stays white on dark backgrounds and black on light backgrounds. Dark and AMOLED use the same unfiltered blue artwork in both logo versions; their different backgrounds can make the colors appear different.

Use these existing filters as starting points:

| Accent | Filter |
| --- | --- |
| Original blue | `none` |
| Purple (Catppuccin Latte) | `hue-rotate(45deg)` |
| Muted purple (Catppuccin Mocha) | `hue-rotate(45deg) saturate(0.55)` |
| Red (Halloween) | `hue-rotate(135deg) saturate(1.8)` |
| Pink (Future Tone) | `hue-rotate(100deg)` |
| Muted teal (OG) | `hue-rotate(-30deg) saturate(0.7) brightness(0.9)` |

For example, a purple theme could use:

```json
"logo_filter": "hue-rotate(45deg)"
```

There is no direct hex-color-to-angle mapping: the filter transforms the existing image colors, rather than replacing them with your palette's accent. Choose the value by previewing it:

1. Run `bun dev`, open `http://localhost:5500`, and select your theme.
2. Inspect the logo in browser DevTools. In the Styles panel, edit its filter temporarily; try angles from `0deg` to `360deg` in roughly `15deg` steps, then fine-tune the closest result.
3. Add `saturate()` if needed. `1` keeps the resulting saturation, values below `1` soften it, and values above `1` intensify it. OG also uses `brightness(0.9)` to give the white highlights a light gray tone. Keep the same filter order as the examples above.
4. Copy the chosen filter into your theme's `logo_filter`. DevTools edits are temporary.
5. Check the desktop header, mobile header, and footer against the theme backgrounds, including the white highlights and black outlines. Also check the collaboration header on `/values` and the partnership banner on an item detail page: the JBCL side should follow the theme, Trading Core's colors should stay unchanged, and the neutral “X” should remain visible on light and dark backgrounds.

With your theme, include screenshots of the theme picker, header, and footer, and state the chosen logo filter or that the original blue is intentional. Also include a few varied pages so reviewers can assess the palette across the site: for example, the homepage, a values table or item detail page, and a changelog or settings page. Show desktop and mobile layouts, including text, cards, buttons, links, and form controls where available.

### Logo examples across themes

These full-resolution sheets are reference snapshots of the standalone and collaboration logos using the themes available when they were exported. Use them as color references when choosing a filter for a new palette. They are saved examples; theme changes do not regenerate them automatically.

- [Download the standalone logo sheet (4000 × 8000)](https://assets.jailbreakchangelogs.com/assets/theme-previews/JBCL_Logo_All_Theme_Variants.png).
- [Download the collaboration logo sheet (4000 × 11200)](https://assets.jailbreakchangelogs.com/assets/theme-previews/JBCL_Collab_Logo_All_Theme_Variants.png).

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

By contributing to JailbreakChangelogs, you agree that your contributions will be licensed under its [LICENSE](./LICENSE).
