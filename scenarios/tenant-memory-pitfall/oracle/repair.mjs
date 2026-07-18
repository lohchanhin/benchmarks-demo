import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const workspace = path.resolve(requiredWorkspace());
await replace(
  "src/rendering/article-page.mjs",
  "text: sharedTheme.articleHero.text",
  "text: articleHero.text ?? sharedTheme.articleHero.text"
);
await replace("clients/aurora/theme.mjs", 'text: "#f8fafc"', 'text: "#172033"');

async function replace(relative, before, after) {
  const target = path.join(workspace, relative);
  const source = await readFile(target, "utf8");
  const fixed = source.replace(before, after);
  if (fixed === source) throw new Error(`canonical repair pattern was not found in ${relative}`);
  await writeFile(target, fixed, "utf8");
}

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
