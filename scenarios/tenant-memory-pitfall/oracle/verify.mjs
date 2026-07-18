import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspace = path.resolve(requiredWorkspace());
const { auroraTheme } = await load("clients/aurora/theme.mjs");
const { renderArticlePage, resolveArticleTheme } = await load("src/rendering/article-page.mjs");
const { sharedTheme } = await load("src/themes/shared-theme.mjs");

const aurora = resolveArticleTheme(auroraTheme);
assert.equal(aurora.text, auroraTheme.articleHero.text);
assert.ok(contrastRatio(aurora.surface, aurora.text) >= 4.5);
assert.deepEqual(resolveArticleTheme({}), sharedTheme.articleHero);
assert.equal(
  renderArticlePage("borealis", "Release notes").heroStyle,
  `background:${sharedTheme.articleHero.surface};color:${sharedTheme.articleHero.text}`
);

async function load(relative) {
  const url = pathToFileURL(path.join(workspace, relative)).href;
  return import(`${url}?oracle=${Date.now()}`);
}

function contrastRatio(first, second) {
  const values = [first, second].map(luminance);
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

function luminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function requiredWorkspace() {
  if (!process.argv[2]) throw new Error("workspace argument is required");
  return process.argv[2];
}
