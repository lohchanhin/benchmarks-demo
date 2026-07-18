export function buildPrompts(scenario) {
  const task = scenario.task.trim();
  const quotedTask = JSON.stringify(task);
  const shared = [
    "Work directly in the repository and complete the task end to end.",
    "Run the complete test suite before finishing.",
    "Keep changes narrowly scoped and do not rewrite tests to make them pass.",
    "",
    "TASK",
    task
  ].join("\n");

  const control = [
    "BENCHMARK ARM: CONTROL",
    "This run measures normal Codex repository exploration without Vertex Palace.",
    "Do not call palace_* tools, the palace CLI, or inspect any .palace data.",
    "Use the repository inspection methods you would normally choose.",
    "",
    shared
  ].join("\n");

  const routeOnly = [
    "BENCHMARK ARM: ROUTE-ONLY",
    "This run measures Vertex Palace structural routing without historical task memory.",
    `Before ordinary repository exploration, run exactly one Vertex Palace preparation command: palace context ${quotedTask} --budget 6000 --route-limit 8 --max-drawers 4`,
    "The context command refreshes the index when needed, routes the task, and returns a compact context pack.",
    "Do not call palace status, init, index, route, pack, help, open, evaluate, or memory separately during this benchmark arm.",
    "Inspect routed files first. Post-task evaluation, memory writing, and index maintenance are intentionally outside this timed routing comparison.",
    "",
    shared
  ].join("\n");

  const fullPalace = [
    "BENCHMARK ARM: FULL PALACE",
    "This run measures Vertex Palace structural routing plus the project history already stored in the local palace.",
    `Before ordinary repository exploration, run exactly one Vertex Palace preparation command: palace context ${quotedTask} --budget 6000 --route-limit 8 --max-drawers 4`,
    "Treat routed context and memory as evidence to check against current code, tests, scope, and dates. Historical memory may be incomplete or stale.",
    "Do not call palace status, init, index, route, pack, help, open, evaluate, or memory separately during this benchmark arm.",
    "Inspect routed files first. Post-task evaluation, memory writing, and index maintenance are intentionally outside this timed routing comparison.",
    "",
    shared
  ].join("\n");

  return { task, control, routeOnly, fullPalace, palace: fullPalace };
}
