export function parseCodexTranscript(source, workspaceFiles = []) {
  const events = [];
  let malformedLines = 0;
  for (const line of source.split(/\r?\n/).filter(Boolean)) {
    try {
      events.push(JSON.parse(line));
    } catch {
      malformedLines += 1;
    }
  }

  const searchable = normalizeSearch(events.flatMap(collectStrings).join("\n"));
  const commandItems = new Map();
  const toolItems = new Map();
  const usageCandidates = [];
  let sessionId;

  for (const event of events) {
    if (!sessionId && typeof event.thread_id === "string") sessionId = event.thread_id;
    if (!sessionId && typeof event.session_id === "string") sessionId = event.session_id;

    const item = event && typeof event.item === "object" ? event.item : null;
    if (item) {
      const id = String(item.id ?? `${event.type}:${commandItems.size + toolItems.size}`);
      if (item.type === "command_execution" && typeof item.command === "string") {
        commandItems.set(id, { command: item.command, status: item.status ?? event.type });
      } else if (String(item.type).includes("tool_call") || String(item.type).includes("mcp")) {
        const name = item.name ?? item.tool ?? item.tool_name;
        if (typeof name === "string") toolItems.set(id, { name, status: item.status ?? event.type });
      }
    }

    visit(event, (value) => {
      if (isUsage(value)) usageCandidates.push(value);
    });
  }

  const commands = [...commandItems.values()];
  const tools = [...toolItems.values()];
  const palaceCommands = commands.filter((item) => isPalaceCommand(item.command));
  const palaceTools = tools.filter((item) => /^palace_/i.test(item.name));
  const palaceCalls = palaceCommands.length + palaceTools.length;
  const successfulPalaceCalls = palaceCommands.filter((item) => completed(item.status)).length
    + palaceTools.filter((item) => completed(item.status)).length;
  const commandSearchable = normalizeSearch(commands.map((item) => item.command).join("\n"));
  const referencedFiles = workspaceFiles.filter((file) => searchable.includes(file.toLowerCase()));
  const inspectedFiles = workspaceFiles.filter((file) => commandSearchable.includes(file.toLowerCase()));
  const inspectionCommands = commands.filter((item) =>
    /(^|\s)(rg|grep|find|ls|dir|cat|type|sed|head|tail|tree)(\s|$)|get-content|get-childitem/i.test(item.command)
  );

  return {
    eventCount: events.length,
    malformedLines,
    sessionId,
    toolCalls: commandItems.size + toolItems.size,
    commandCalls: commandItems.size,
    inspectionCommands: inspectionCommands.length,
    palaceCalls,
    successfulPalaceCalls,
    inspectedFiles,
    referencedFiles,
    usage: combineUsage(usageCandidates)
  };
}

function isPalaceCommand(command) {
  return /(?:^|[;&|]\s*|-command\s+['"]?)&?\s*(?:palace|vertex-palace)(?:\.(?:cmd|ps1))?\s+(?:status|init|index|route|pack|evaluate|eval|memory)\b/i.test(command)
    || /palace\.cjs['"]?\s+(?:status|init|index|route|pack|evaluate|eval|memory)\b/i.test(command);
}

function completed(status) {
  return status === "completed" || status === "success" || status === "item.completed";
}

function normalizeSearch(value) {
  return value.replace(/\\+/g, "/").toLowerCase();
}

function collectStrings(value) {
  const values = [];
  visit(value, (candidate) => {
    if (typeof candidate === "string") values.push(candidate);
  });
  return values;
}

function visit(value, callback) {
  callback(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) visit(item, callback);
  }
}

function isUsage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return ["input_tokens", "output_tokens", "total_tokens", "cached_input_tokens"].some((key) => Number.isFinite(value[key]));
}

function combineUsage(candidates) {
  const result = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
  for (const candidate of candidates) {
    result.inputTokens = Math.max(result.inputTokens, number(candidate.input_tokens));
    result.cachedInputTokens = Math.max(result.cachedInputTokens, number(candidate.cached_input_tokens));
    result.outputTokens = Math.max(result.outputTokens, number(candidate.output_tokens));
    result.totalTokens = Math.max(result.totalTokens, number(candidate.total_tokens));
  }
  if (!result.totalTokens) result.totalTokens = result.inputTokens + result.outputTokens;
  return result;
}

function number(value) {
  return Number.isFinite(value) ? Number(value) : 0;
}
