export function buildPrompts(scenario) {
  const task = scenario.task.trim();
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

  const palace = [
    "BENCHMARK ARM: VERTEX PALACE",
    "Use Vertex Palace before ordinary repository exploration.",
    "Start with palace status, read the entrance pitfall board, refresh the index if stale, route the exact task, and build a minimal context pack.",
    "Inspect routed files first. After testing, write task memory. If the installed CLI supports route evaluation, evaluate the route against the files actually changed.",
    "If MCP tools are unavailable, use the palace CLI.",
    "",
    shared
  ].join("\n");

  return { task, control, palace };
}
