import assert from "node:assert/strict";
import test from "node:test";
import { parseCodexTranscript } from "../src/lib/transcript.mjs";

test("extracts session, commands, Palace calls, files, and usage from Codex JSONL", () => {
  const source = [
    JSON.stringify({ type: "thread.started", thread_id: "thread-123" }),
    JSON.stringify({
      type: "item.completed",
      item: {
        id: "command-1",
        type: "command_execution",
        status: "completed",
        exit_code: 0,
        command: "palace context task && Get-Content clients/aurora/theme.mjs",
        aggregated_output: "routed output"
      }
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
  assert.equal(result.usage.uncachedInputTokens, 1000);
  assert.equal(result.commandOutputChars, 13);
  assert.equal(result.palaceContextOutputChars, 13);
  assert.equal(result.palaceContextOutputBytes, 13);
  assert.equal(result.palaceContextEstimatedTokens, 4);
  assert.equal(result.adaptivePayloadMatchesOutput, null);
  assert.equal(result.adaptiveRequested, false);
  assert.equal(result.failedCalls, 0);
});

test("parses Adaptive Palace mode and measured payload from command output", () => {
  const output = measuredAdaptiveOutput([
    "# Vertex Palace Adaptive Context",
    "",
    "Mode: route-lite",
    "",
    "## Payload",
    "",
    "Calls: 1 | Bytes: 0 | Estimated tokens: 726",
    "Route: 8 (2 primary, 5 support, 1 deferred)",
    "Memory: 0 items / ~0 tokens | Guardrails: 0"
  ].join("\n"));
  const source = JSON.stringify({
    type: "item.completed",
    item: {
      id: "adaptive-context",
      type: "command_execution",
      status: "completed",
      exit_code: 0,
      command: "palace context task --auto --budget 6000",
      aggregated_output: output
    }
  });

  const result = parseCodexTranscript(source);
  assert.equal(result.adaptiveRequested, true);
  assert.equal(result.palaceContextOutputBytes, Buffer.byteLength(output, "utf8"));
  assert.equal(result.adaptivePayloadMatchesOutput, true);
  assert.deepEqual(result.adaptivePayload, {
    mode: "route-lite",
    calls: 1,
    contextBytes: Buffer.byteLength(output, "utf8"),
    contextEstimatedTokens: 726,
    routeStepCount: 8,
    primaryCount: 2,
    supportCount: 5,
    deferredCount: 1,
    memoryItemCount: 0,
    memoryEstimatedTokens: 0,
    guardrailCount: 0
  });
});

test("detects an Adaptive payload byte count that does not match captured stdout", () => {
  const source = JSON.stringify({
    type: "item.completed",
    item: {
      id: "adaptive-context-mismatch",
      type: "command_execution",
      status: "completed",
      exit_code: 0,
      command: "palace context task --auto",
      aggregated_output: "# Vertex Palace Adaptive Context\n\nMode: bypass\n\n## Payload\n\nCalls: 1 | Bytes: 9999 | Estimated tokens: 20"
    }
  });

  assert.equal(parseCodexTranscript(source).adaptivePayloadMatchesOutput, false);
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

test("counts failed commands and keeps only the completed output", () => {
  const source = [
    JSON.stringify({
      type: "item.started",
      item: { id: "command-1", type: "command_execution", status: "in_progress", command: "apply_patch patch" }
    }),
    JSON.stringify({
      type: "item.completed",
      item: {
        id: "command-1",
        type: "command_execution",
        status: "failed",
        exit_code: 1,
        command: "apply_patch patch",
        aggregated_output: "patch failed"
      }
    })
  ].join("\n");
  const result = parseCodexTranscript(source);

  assert.equal(result.commandCalls, 1);
  assert.equal(result.failedCalls, 1);
  assert.equal(result.commandOutputChars, 12);
});

test("does not mistake a .palace exclusion path for a Palace call", () => {
  const event = JSON.stringify({
    type: "item.completed",
    item: { id: "command-1", type: "command_execution", status: "completed", command: "rg --files -g '!**/.palace/**'" }
  });
  const result = parseCodexTranscript(`${event}\n`);
  assert.equal(result.palaceCalls, 0);
});

function measuredAdaptiveOutput(source) {
  let output = source;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const next = output.replace(/Bytes: \d+/, `Bytes: ${Buffer.byteLength(output, "utf8")}`);
    if (next === output) return output;
    output = next;
  }
  return output;
}
