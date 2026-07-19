import assert from "node:assert/strict";
import test from "node:test";
import { main } from "../src/cli.mjs";

test("subcommand --help prints help without executing the command", async () => {
  const originalLog = console.log;
  const output = [];
  console.log = (...values) => output.push(values.join(" "));

  try {
    await main(["prepare", "--help"]);
  } finally {
    console.log = originalLog;
  }

  assert.match(output.join("\n"), /Vertex Palace A\/B Benchmark/);
  assert.match(output.join("\n"), /prepare\s+Create identical Control/);
});
