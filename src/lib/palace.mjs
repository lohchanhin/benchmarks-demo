import path from "node:path";
import { readJson } from "./files.mjs";
import { runProcess } from "./process.mjs";

export async function seedPalace(workspace, scenario, invocation, options = {}) {
  const commandOptions = { cwd: workspace, check: true, windowsShim: invocation.windowsShim };
  const call = (args) => runProcess(invocation.command, [...invocation.prefix, ...args], commandOptions);
  await call(["init"]);
  await call(["index"]);
  if (!options.withMemory || !scenario.history) return { routeId: null, memorySeeded: false };

  await call(["route", scenario.history.task]);

  const route = await readJson(path.join(workspace, ".palace", "routes", "latest-route.json"));
  const changedFiles = scenario.history.changedFiles ?? scenario.expectedChangedFiles;
  const tags = scenario.history.tags ?? ["benchmark", scenario.id];
  await call(
    [
      "memory",
      "write",
      "--task",
      scenario.history.task,
      "--outcome",
      "success",
      "--client",
      scenario.history.client,
      "--route-id",
      route.id,
      "--changed-file",
      ...changedFiles,
      "--decision",
      scenario.history.decision,
      "--test",
      `${scenario.testCommand.join(" ")}|passed|Historical task passed in its original scope`,
      "--tag",
      ...tags,
      ...(scenario.history.failedAttempt ? ["--failed-attempt", scenario.history.failedAttempt] : []),
      ...(scenario.history.pitfall ? ["--pitfall", scenario.history.pitfall] : []),
      ...(scenario.history.notes ? ["--notes", scenario.history.notes] : [])
    ]
  );

  return { routeId: route.id, memorySeeded: true };
}
