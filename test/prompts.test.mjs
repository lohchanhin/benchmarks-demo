import assert from "node:assert/strict";
import test from "node:test";
import { buildPrompts } from "../src/lib/prompts.mjs";

test("both Palace arms use one context command and distinguish memory", () => {
  const { routeOnly, fullPalace } = buildPrompts({ task: "Fix the Aurora contrast regression." });

  for (const prompt of [routeOnly, fullPalace]) {
    assert.match(prompt, /palace context "Fix the Aurora contrast regression\."/);
    assert.match(prompt, /exactly one Vertex Palace preparation command/);
    assert.match(prompt, /Do not call palace status, init, index, route, pack, help, open, evaluate, or memory separately/);
    assert.match(prompt, /outside this timed routing comparison/);
  }
  assert.match(routeOnly, /without historical task memory/);
  assert.match(fullPalace, /Historical memory may be incomplete or stale/);
});
