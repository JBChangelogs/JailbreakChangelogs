import { $ } from "bun";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const CONTENT_DIR = "dev-changelog/content";

async function getLatestDocumentedCommit(): Promise<string | null> {
  if (!existsSync(CONTENT_DIR)) return null;

  const files = await readdir(CONTENT_DIR);
  // Look for .mdx files
  const mdxFiles = files.filter((f) => f.endsWith(".mdx"));

  const documentedVersions = new Set<string>();

  // Extract versions from file frontmatter
  for (const file of mdxFiles) {
    const content = await readFile(join(CONTENT_DIR, file), "utf-8");
    const match = content.match(/^version:\s*["']?([a-zA-Z0-9]+)["']?/m);
    if (match && match[1] && match[1] !== "HEAD" && match[1] !== "Unreleased") {
      documentedVersions.add(match[1]);
    }
  }

  if (documentedVersions.size === 0) return null;

  // Find which of these versions is the most recent ancestor of HEAD
  // We stream git log history and stop as soon as we find a match
  const proc = Bun.spawn(["git", "log", "--format=%h"]);
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value);
    const lines = buffer.split("\n");
    // Keep the last partial line in buffer
    buffer = lines.pop() || "";

    for (const hash of lines) {
      const trimmedHash = hash.trim();

      for (const ver of documentedVersions) {
        if (
          trimmedHash === ver ||
          trimmedHash.startsWith(ver) ||
          ver.startsWith(trimmedHash)
        ) {
          return trimmedHash;
        }
      }
    }
  }

  return null;
}

async function generateChangelogForCommit(hash: string) {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filename = join(CONTENT_DIR, `${date}-${hash}.mdx`);

  let range = "";
  try {
    // Check if parent exists
    await $`git rev-parse --quiet --verify ${hash}~1`;
    range = `${hash}~1..${hash}`;
  } catch {
    // No parent, this is the initial commit (or a shallow clone root)
    // We leave range empty to let git-cliff default to "everything up to this point"
    // which for the initial commit is just that commit.
    range = "";
  }

  console.log(
    `📝 Generating changelog for ${hash} (${range || "initial"}) -> ${filename}`,
  );

  if (range) {
    await $`bunx git-cliff ${range} --output ${filename}`;
  } else {
    // If we are processing the very first commit, full history is correct.
    // Note: If this runs in a large repo with NO changelogs on first run, we limit to HEAD elsewhere
    // so this else block hits only if we are effectively processing a root commit.
    await $`bunx git-cliff --output ${filename}`;
  }

  // Post-process to inject the correct version and title
  let content = (await readFile(filename, "utf-8")).trim();

  // Get the commit message of the specific commit
  const commitMsgRaw = (await $`git log -1 --format=%s ${hash}`.text()).trim();

  const commitMsg = commitMsgRaw
    .replace(/^[a-z]+(\(.*\))?!?: /i, "")
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // Replace version: "..." with actual hash
  content = content.replace(/^version:\s*".*?"/m, () => `version: "${hash}"`);
  content = content.replace(/^title:\s*".*?"/m, () => `title: "${commitMsg}"`);
  content = content.replace(
    /^description:\s*".*?"/m,
    () => `description: "Changelog for ${hash}"`,
  );
  content = content.replace(
    /^commitUrl:\s*".*?"/m,
    () =>
      `commitUrl: "https://github.com/JBChangelogs/JailbreakChangelogs/commit/${hash}"`,
  );

  await writeFile(filename, content);
  console.log(`✅ Created: ${filename}`);
}

async function main() {
  try {
    // Ensure content directory exists
    if (!existsSync(CONTENT_DIR)) {
      mkdirSync(CONTENT_DIR, { recursive: true });
    }

    const headHash = (await $`git rev-parse --short HEAD`.text()).trim();
    const startHash = await getLatestDocumentedCommit();

    let commitsToProcess: string[] = [];

    if (startHash) {
      if (startHash === headHash) {
        console.log("✨ No new commits since the last changelog.");
        return;
      }
      console.log(`🔍 Last documented version: ${startHash}`);

      // Get all commits from startHash (exclusive) to HEAD (inclusive)
      // --reverse ensures we process them in chronological order
      const logOutput =
        await $`git log --format="%h" --reverse ${startHash}..HEAD`.text();
      commitsToProcess = logOutput
        .trim()
        .split("\n")
        .filter((line) => line.length > 0);

      console.log(
        `🚀 Found ${commitsToProcess.length} new commits to document.`,
      );
    } else {
      console.log("⚠️  No previous changelogs found with version hashes.");
      console.log(
        "   First run detected. Generating changelog for the latest commit only to avoid spamming history.",
      );

      // Default to just the current HEAD for safety on first run
      commitsToProcess = [headHash];
    }

    for (const hash of commitsToProcess) {
      await generateChangelogForCommit(hash);
    }
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();
