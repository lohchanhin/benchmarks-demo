import path from "node:path";
import { readJson } from "./files.mjs";
import { runProcess } from "./process.mjs";

export async function seedPalace(workspace, scenario, invocation) {
  const commandOptions = { cwd: workspace, check: true, windowsShim: invocation.windowsShim };
  const call = (args) => runProcess(invocation.command, [...invocation.prefix, ...args], commandOptions);
  await call(["init"]);
  await call(["index"]);
  await call(["route", scenario.history.task]);

  const route = await readJson(path.join(workspace, ".palace", "routes", "latest-route.json"));
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
      ...scenario.expectedChangedFiles,
      "--decision",
      scenario.history.decision,
      "--failed-attempt",
      scenario.history.failedAttempt,
      "--pitfall",
      scenario.history.pitfall,
      "--test",
      `${scenario.testCommand.join(" ")}|passed|All tenant snapshots passed after the scoped fix`,
      "--tag",
      "benchmark",
      "tenant-isolation"
    ]
  );

  return { routeId: route.id };
}
