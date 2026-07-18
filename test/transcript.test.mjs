import assert from "node:assert/strict";
import test from "node:test";
import { parseCodexTranscript } from "../src/lib/transcript.mjs";

test("extracts session, commands, Palace calls, files, and usage from Codex JSONL", () => {
  const source = [
    JSON.stringify({ type: "thread.started", thread_id: "thread-123" }),
    JSON.stringify({
      type: "item.completed",
      item: { id: "command-1", type: "command_execution", status: "completed", command: "palace route task && Get-Content clients/aurora/theme.mjs" }
    }),
    JSON.stringify({
      type: "turn.completed",
      usage: { input_tokens: 1200, cached_input_tokens: 200, output_tokens: 300, total_tokens: 1500 }
    })
  ].join("\n");
  const result = parseCodexTranscript(source, ["clients/aurora/theme.mjs", "src/rendering/article-page.mjs"]);
  assert.equal(result.sessionId, "thread-123");
  assert.equal(result.commandCalls, 1);
  assert.equal(result.palaceCalls, 1);
  assert.equal(result.successfulPalaceCalls, 1);
  assert.deepEqual(result.inspectedFiles, ["clients/aurora/theme.mjs"]);
  assert.deepEqual(result.referencedFiles, ["clients/aurora/theme.mjs"]);
  assert.equal(result.usage.totalTokens, 1500);
});

test("tolerates non-JSON lines without inventing metrics", () => {
  const result = parseCodexTranscript("not json\n");
  assert.equal(result.malformedLines, 1);
  assert.equal(result.toolCalls, 0);
  assert.equal(result.usage.totalTokens, 0);
});

test("counts one command item once across lifecycle events", () => {
  const started = JSON.stringify({
    type: "item.started",
    item: { id: "command-1", type: "command_execution", status: "in_progress", command: "rg Aurora src" }
  });
  const completed = JSON.stringify({
    type: "item.completed",
    item: { id: "command-1", type: "command_execution", status: "completed", command: "rg Aurora src" }
  });
  const result = parseCodexTranscript(`${started}\n${completed}\n`);
  assert.equal(result.commandCalls, 1);
  assert.equal(result.inspectionCommands, 1);
});

test("does not mistake a .palace exclusion path for a Palace call", () => {
  const event = JSON.stringify({
    type: "item.completed",
    item: { id: "command-1", type: "command_execution", status: "completed", command: "rg --files -g '!**/.palace/**'" }
  });
  const result = parseCodexTranscript(`${event}\n`);
  assert.equal(result.palaceCalls, 0);
});
