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

async function main() {
  try {
    // Ensure content directory exists
    if (!existsSync(CONTENT_DIR)) {
      mkdirSync(CONTENT_DIR, { recursive: true });
    }

    const headHash = (await $`git rev-parse --short HEAD`.text()).trim();
    const startHash = await getLatestDocumentedCommit();

    let range = "";
    if (startHash) {
      if (startHash === headHash) {
        console.log("✨ No new commits since the last changelog.");
        return;
      }
      console.log(`🔍 Last documented version: ${startHash}`);
      range = `${startHash}..HEAD`;
    } else {
      console.log("⚠️  No previous changelogs found with version hashes.");

      // FALLBACK: To avoid generating the entire history, we default to the last 24 hours of commits
      // or just the last commit if it's the very first run.
      // Ideally, the user should have manually created a baseline, but we want to be helpful.
      // Let's grab just the commits from the last 24 hours?
      // Or safer: just the "HEAD" commit for the first run so we don't spam 4000 lines.
      console.log(
        "   First run detected. Generating changelog for the latest commit only to avoid spamming history.",
      );

      // Using HEAD~1..HEAD to get just the last commit
      // Check if there is a parent first to avoid error on init repo (unlikely here but good practice)
      try {
        await $`git rev-parse HEAD~1`;
        range = "HEAD~1..HEAD";
      } catch {
        range = ""; // Single commit repo, full history is fine
      }
    }

    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = join(CONTENT_DIR, `${date}-${headHash}.mdx`);

    console.log(
      `📝 Generating changelog for ${range || "all history"} -> ${filename}`,
    );

    if (range) {
      await $`bunx git-cliff ${range} --output ${filename}`;
    } else {
      await $`bunx git-cliff --output ${filename}`; // Full history
    }

    // Post-process to inject the correct version and title
    let content = await readFile(filename, "utf-8");

    // Get the commit message of the HEAD commit for the title
    const commitMsg = (await $`git log -1 --format=%s HEAD`.text())
      .trim()
      .replace(/"/g, '\\"');

    // Replace version: "..." with actual hash
    content = content.replace(/^version:\s*".*?"/m, `version: "${headHash}"`);
    content = content.replace(/^title:\s*".*?"/m, `title: "${commitMsg}"`);
    content = content.replace(
      /^description:\s*".*?"/m,
      `description: "Changelog for ${headHash}"`,
    );

    await writeFile(filename, content);

    console.log(`✅ Changelog created: ${filename}`);
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

main();
