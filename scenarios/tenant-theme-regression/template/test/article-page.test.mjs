import assert from "node:assert/strict";
import test from "node:test";
import { auroraTheme } from "../clients/aurora/theme.mjs";
import { renderArticlePage, resolveArticleTheme } from "../src/rendering/article-page.mjs";
import { sharedTheme } from "../src/themes/shared-theme.mjs";

test("the renderer honors an explicit tenant hero text color", () => {
  const resolved = resolveArticleTheme(auroraTheme);
  assert.equal(resolved.text, auroraTheme.articleHero.text);
});

test("Aurora article hero meets WCAG AA contrast", () => {
  const resolved = resolveArticleTheme(auroraTheme);
  assert.ok(contrastRatio(resolved.surface, resolved.text) >= 4.5);
});

test("tenants without an article override preserve the shared appearance", () => {
  assert.deepEqual(resolveArticleTheme({}), sharedTheme.articleHero);
  assert.equal(
    renderArticlePage("borealis", "Release notes").heroStyle,
    `background:${sharedTheme.articleHero.surface};color:${sharedTheme.articleHero.text}`
  );
  assert.equal(
    renderArticlePage("cedar", "Field guide").heroStyle,
    `background:${sharedTheme.articleHero.surface};color:${sharedTheme.articleHero.text}`
  );
});

function contrastRatio(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}
function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
