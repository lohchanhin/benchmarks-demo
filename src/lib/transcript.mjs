export function parseCodexTranscript(source, workspaceFiles = [], expectedTask = null) {
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
  const agentMessages = new Map();
  const itemOrder = new Map();
  const usageCandidates = [];
  let nextOrder = 0;
  let sessionId;

  for (const event of events) {
    if (!sessionId && typeof event.thread_id === "string") sessionId = event.thread_id;
    if (!sessionId && typeof event.session_id === "string") sessionId = event.session_id;

    const item = event && typeof event.item === "object" ? event.item : null;
    if (item) {
      const id = String(item.id ?? `${event.type}:${commandItems.size + toolItems.size}`);
      if (!itemOrder.has(id)) itemOrder.set(id, nextOrder++);
      const order = itemOrder.get(id);
      if (item.type === "command_execution" && typeof item.command === "string") {
        const output = commandOutput(item);
        commandItems.set(id, {
          order,
          command: item.command,
          status: item.status ?? event.type,
          exitCode: Number.isFinite(item.exit_code) ? Number(item.exit_code) : undefined,
          outputChars: output.length,
          output
        });
      } else if (String(item.type).includes("tool_call") || String(item.type).includes("mcp")) {
        const name = item.name ?? item.tool ?? item.tool_name;
        if (typeof name === "string") {
          toolItems.set(id, {
            order,
            name,
            status: item.status ?? event.type,
            error: item.error ?? event.error
          });
        }
      } else if (item.type === "agent_message" && typeof item.text === "string") {
        agentMessages.set(id, { order, text: item.text });
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
  const inspectionCommands = commands.filter((item) => isInspectionCommand(item.command));
  const palaceCommandOutputChars = palaceCommands.reduce((total, item) => total + item.outputChars, 0);
  const palaceCommandOutputBytes = palaceCommands.reduce(
    (total, item) => total + Buffer.byteLength(item.output, "utf8"),
    0
  );
  const adaptivePayloads = palaceCommands.map((item) => parseAdaptivePayload(item.output)).filter(Boolean);
  const adaptivePayload = adaptivePayloads.at(-1) ?? null;
  const adaptiveOutput = palaceCommands.at(-1)?.output ?? "";
  const palaceReceivedTask = parsePackedTask(adaptiveOutput);
  const palaceCommandMatchesExpectedTask = typeof expectedTask === "string" && palaceCommands.length
    ? commandContainsTask(palaceCommands.at(-1).command, expectedTask)
    : null;
  const adaptiveRequested = palaceCommands.some((item) => /\bcontext\b[^\r\n]*\s--auto(?:\s|$)/i.test(item.command));
  const adherence = analyzeAgentAdherence({
    commands,
    tools,
    agentMessages: [...agentMessages.values()],
    palaceCommand: palaceCommands.at(-1) ?? null,
    adaptiveOutput,
    expectedTask
  });

  return {
    eventCount: events.length,
    malformedLines,
    sessionId,
    toolCalls: commandItems.size + toolItems.size,
    commandCalls: commandItems.size,
    failedCalls: commands.filter(failedCommand).length + tools.filter(failedTool).length,
    commandOutputChars: commands.reduce((total, item) => total + item.outputChars, 0),
    agentMessageChars: [...agentMessages.values()].reduce((total, value) => total + value.text.length, 0),
    inspectionCommands: inspectionCommands.length,
    palaceCalls,
    successfulPalaceCalls,
    palaceContextOutputChars: palaceCommands.length ? palaceCommandOutputChars : null,
    palaceContextOutputBytes: palaceCommands.length ? palaceCommandOutputBytes : null,
    palaceContextEstimatedTokens: palaceCommands.length ? Math.ceil(palaceCommandOutputBytes / 4) : null,
    adaptivePayload,
    adaptivePayloadMatchesOutput: adaptivePayload
      ? adaptivePayload.contextBytes === Buffer.byteLength(adaptiveOutput, "utf8")
      : null,
    palaceReceivedTask,
    palaceCommandMatchesExpectedTask,
    adaptiveRequested,
    ...adherence,
    inspectedFiles,
    referencedFiles,
    usage: combineUsage(usageCandidates)
  };
}

function parsePackedTask(output) {
  return /^## Task\s*\r?\n(?:\r?\n)?([^\r\n]+)$/m.exec(output)?.[1]?.trim() ?? null;
}

function parseAdaptivePayload(output) {
  const compactBypass = /^Mode: bypass\s*$[\s\S]*^Primary candidate: ([^\r\n]+)\s*$[\s\S]*^Reason: ([^\r\n]+)\s*$/m.exec(output);
  if (compactBypass) {
    return {
      mode: "bypass",
      calls: 1,
      contextBytes: Buffer.byteLength(output, "utf8"),
      contextEstimatedTokens: Math.ceil(Buffer.byteLength(output, "utf8") / 4),
      routeStepCount: 1,
      primaryCount: 1,
      supportCount: 0,
      deferredCount: 0,
      memoryItemCount: 0,
      memoryCandidateCount: 0,
      memoryExcludedCount: 0,
      memoryEstimatedTokens: 0,
      guardrailCount: 0,
      primaryCandidate: compactBypass[1].trim(),
      reason: compactBypass[2].trim()
    };
  }
  if (!output.includes("# Vertex Palace Adaptive Context") || !output.includes("## Payload")) return null;
  const mode = /^Mode: ([^\r\n]+)$/m.exec(output)?.[1] ?? null;
  const payload = /^Calls: (\d+) \| Bytes: (\d+) \| Estimated tokens: (\d+)$/m.exec(output);
  const route = /^Route: (\d+) \((\d+) primary, (\d+) support, (\d+) deferred\)$/m.exec(output);
  const memory = parseMemoryPayload(output);
  const sectionMetrics = parseSectionMetrics(output);
  if (!payload) return null;
  return {
    mode,
    calls: Number(payload[1]),
    contextBytes: Number(payload[2]),
    contextEstimatedTokens: Number(payload[3]),
    routeStepCount: route ? Number(route[1]) : null,
    primaryCount: route ? Number(route[2]) : null,
    supportCount: route ? Number(route[3]) : null,
    deferredCount: route ? Number(route[4]) : null,
    memoryItemCount: memory?.included ?? null,
    memoryCandidateCount: memory?.candidates ?? null,
    memoryExcludedCount: memory?.excluded ?? null,
    memoryEstimatedTokens: memory?.estimatedTokens ?? null,
    guardrailCount: memory?.guardrails ?? null,
    ...(sectionMetrics ? { sectionMetrics } : {})
  };
}

function parseSectionMetrics(output) {
  const line = /^Section metrics \(bytes\/tokens\): ([^\r\n]+)$/m.exec(output)?.[1];
  const overhead = /^Serialization overhead bytes: (\d+)$/m.exec(output)?.[1];
  if (!line || overhead === undefined) return null;
  const metrics = {};
  for (const part of line.split(" | ")) {
    const match = /^([A-Za-z]+)=(\d+)\/(\d+)$/.exec(part.trim());
    if (!match) return null;
    metrics[match[1]] = { bytes: Number(match[2]), estimatedTokens: Number(match[3]) };
  }
  metrics.serializationOverheadBytes = Number(overhead);
  return metrics;
}

function parseMemoryPayload(output) {
  const telemetry = /^Memory: (\d+) included \/ (\d+) candidates \/ (\d+) excluded \/ ~(\d+) tokens \| Guardrails: (\d+)$/m.exec(output);
  if (telemetry) {
    return {
      included: Number(telemetry[1]),
      candidates: Number(telemetry[2]),
      excluded: Number(telemetry[3]),
      estimatedTokens: Number(telemetry[4]),
      guardrails: Number(telemetry[5])
    };
  }

  const legacy = /^Memory: (\d+) items \/ ~(\d+) tokens \| Guardrails: (\d+)$/m.exec(output);
  if (!legacy) return null;
  return {
    included: Number(legacy[1]),
    candidates: Number(legacy[1]),
    excluded: 0,
    estimatedTokens: Number(legacy[2]),
    guardrails: Number(legacy[3])
  };
}

function analyzeAgentAdherence({ commands, tools, agentMessages, palaceCommand, adaptiveOutput, expectedTask }) {
  const calls = [
    ...commands.map((item) => ({ ...item, kind: "command" })),
    ...tools.map((item) => ({ ...item, kind: "tool" }))
  ].sort((first, second) => first.order - second.order);
  const contract = parseAdaptiveRouteContract(adaptiveOutput);
  const postPalaceCommands = commands
    .filter((item) => palaceCommand && item.order > palaceCommand.order)
    .sort((first, second) => first.order - second.order);
  const inspectedAfterPalace = postPalaceCommands.filter((item) => isInspectionCommand(item.command));
  const deliveredFullPathReopenedCount = countCommandPathPairs(inspectedAfterPalace, contract.deliveredFullPaths);
  const excludedPathOpenedCount = countCommandPathPairs(inspectedAfterPalace, contract.excludedPaths);

  let conflictObserved = false;
  let deferredOpenedWithoutConflictCount = 0;
  for (const command of postPalaceCommands) {
    if (!conflictObserved && isInspectionCommand(command.command)) {
      deferredOpenedWithoutConflictCount += countReferencedPaths(command.command, contract.deferredPaths);
    }
    if (failedCommand(command) || hasConflictEvidence(command.output)) conflictObserved = true;
  }

  const editCommands = commands.filter((item) => isEditCommand(item.command));
  const firstEditOrder = editCommands.length ? Math.min(...editCommands.map((item) => item.order)) : null;
  const lastEditOrder = editCommands.length ? Math.max(...editCommands.map((item) => item.order)) : -1;
  const passingTest = commands
    .filter((item) => item.order > lastEditOrder && isTestCommand(item.command) && successfulCommand(item))
    .sort((first, second) => first.order - second.order)[0] ?? null;
  const stopSatisfied = passingTest
    ? commands
        .filter((item) => item.order >= passingTest.order && isFinalScopeCommand(item.command) && successfulCommand(item))
        .sort((first, second) => first.order - second.order)[0] ?? null
    : null;
  const batchedVerificationUsed = commands.some((item) => (
    item.order > lastEditOrder
    && successfulCommand(item)
    && isBatchedVerificationCommand(item.command)
  ));
  const restatements = typeof expectedTask === "string"
    ? agentMessages.filter((item) => messageRestatesTask(item.text, expectedTask)).length
    : 0;

  return {
    deliveredFullPathReopenedCount,
    deferredOpenedWithoutConflictCount,
    excludedPathOpenedCount,
    toolCallsBeforeFirstEdit: firstEditOrder === null
      ? null
      : calls.filter((item) => item.order < firstEditOrder).length,
    toolCallsAfterTestsPassed: passingTest
      ? calls.filter((item) => item.order > passingTest.order).length
      : null,
    callsAfterStopConditionSatisfied: stopSatisfied
      ? calls.filter((item) => item.order > stopSatisfied.order).length
      : null,
    batchedVerificationUsed,
    repeatedTaskRestatementCount: Math.max(0, restatements - 1)
  };
}

function parseAdaptiveRouteContract(output) {
  if (!output.includes("# Vertex Palace Adaptive Context")) {
    return { deliveredFullPaths: [], deferredPaths: [], excludedPaths: [] };
  }
  const fullReferences = new Set(
    [...output.matchAll(/^- ([^\r\n]+?) \((?:primary|support|deferred), (?:full_file|full_symbol)\):/gm)]
      .map((match) => stripSourceLocation(match[1]))
  );
  const routedContext = markdownSection(output, "Routed Context");
  const deliveredPaths = [...routedContext.matchAll(/^### (?:primary|support|deferred): ([^\r\n]+)$/gm)]
    .map((match) => stripSourceLocation(match[1]));
  const deferredPaths = [...markdownSection(output, "Deferred").matchAll(/^- ([^\r\n]+?) \((?:primary|support|deferred), [^)]+\):/gm)]
    .map((match) => stripSourceLocation(match[1]));
  const excludedPaths = [...markdownSection(output, "Excluded").matchAll(/^- ([^:\r\n]+):/gm)]
    .map((match) => stripSourceLocation(match[1]))
    .filter((value) => value.toLowerCase() !== "none");
  return {
    deliveredFullPaths: unique(deliveredPaths.filter((value) => fullReferences.has(value))),
    deferredPaths: unique(deferredPaths),
    excludedPaths: unique(excludedPaths)
  };
}

function markdownSection(output, heading) {
  const marker = `## ${heading}`;
  const start = output.indexOf(marker);
  if (start < 0) return "";
  const contentStart = start + marker.length;
  const next = output.indexOf("\n## ", contentStart);
  return output.slice(contentStart, next < 0 ? output.length : next);
}

function stripSourceLocation(value) {
  return value.trim().replace(/:\d+(?:-\d+)?$/, "");
}

function unique(values) {
  return [...new Set(values)];
}

function countCommandPathPairs(commands, paths) {
  return commands.reduce((total, command) => total + countReferencedPaths(command.command, paths), 0);
}

function countReferencedPaths(command, paths) {
  return paths.filter((sourcePath) => commandReferencesPath(command, sourcePath)).length;
}

function commandReferencesPath(command, sourcePath) {
  const normalizedCommand = normalizeSearch(command);
  const normalizedPath = normalizeSearch(sourcePath).replace(/^\.\//, "");
  if (!normalizedPath) return false;
  if (normalizedPath.includes("/") || normalizedPath.includes(".")) return normalizedCommand.includes(normalizedPath);
  return new RegExp(`(?:^|[\\s/'\"]|\./)${escapeRegExp(normalizedPath)}(?:$|[/\\s'\"])`, "i").test(normalizedCommand);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isInspectionCommand(command) {
  return /(^|\s)(rg|grep|find|ls|dir|cat|type|sed|head|tail|tree)(\s|$)|get-content|get-childitem/i.test(command);
}

function isEditCommand(command) {
  return /\bapply_patch\b|\bgit\s+apply\b|\bsed\s+-i\b|\bset-content\b|\badd-content\b|\bout-file\b|(?:^|\s)>>?\s*[^&|]/i.test(command);
}

function isTestCommand(command) {
  return /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test\b|\b(?:vitest|jest|pytest)\b|\bpython\s+-m\s+pytest\b|\bgo\s+test\b|\bcargo\s+test\b/i.test(command);
}

function isFinalScopeCommand(command) {
  return /\bgit\s+diff\s+--check\b/i.test(command) && /\bgit\s+status\b/i.test(command);
}

function isBatchedVerificationCommand(command) {
  if (!/(?:&&|;|\r?\n)/.test(command)) return false;
  const kinds = new Set();
  if (isTestCommand(command)) kinds.add("test");
  if (/\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?lint\b|\beslint\b/i.test(command)) kinds.add("lint");
  if (/\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:build|typecheck|check)\b|\btsc\b/i.test(command)) kinds.add("build");
  if (isFinalScopeCommand(command)) kinds.add("scope");
  return kinds.size >= 2;
}

function successfulCommand(item) {
  return completed(item.status) && (item.exitCode === undefined || item.exitCode === 0);
}

function hasConflictEvidence(output) {
  return /\b(?:[1-9]\d*\s+(?:tests?\s+)?failed|tests?\s+failed|error|conflict|mismatch|unexpected)\b/i.test(output);
}

function messageRestatesTask(message, task) {
  const taskTokens = unique(semanticTokens(task));
  if (taskTokens.length < 5) return false;
  const messageTokens = new Set(semanticTokens(message));
  const matched = taskTokens.filter((token) => messageTokens.has(token)).length;
  return matched / taskTokens.length >= 0.8;
}

function commandContainsTask(command, task) {
  const commandTokens = semanticTokens(command);
  const taskTokens = semanticTokens(task);
  if (!taskTokens.length) return false;
  for (let start = 0; start <= commandTokens.length - taskTokens.length; start += 1) {
    if (taskTokens.every((token, offset) => commandTokens[start + offset] === token)) return true;
  }
  return false;
}

function semanticTokens(value) {
  return String(value).toLocaleLowerCase("en-US").match(/[\p{L}\p{N}]+/gu) ?? [];
}

function isPalaceCommand(command) {
  return /(?:^|[;&|]\s*|-command\s+['"]?)&?\s*(?:palace|vertex-palace)(?:\.(?:cmd|ps1))?\s+(?:context|task|status|init|index|route|pack|evaluate|eval|memory)\b/i.test(command)
    || /palace\.cjs['"]?\s+(?:context|task|status|init|index|route|pack|evaluate|eval|memory)\b/i.test(command);
}

function completed(status) {
  return status === "completed" || status === "success" || status === "item.completed";
}

function failedCommand(item) {
  return item.status === "failed" || (item.exitCode !== undefined && item.exitCode !== 0);
}

function failedTool(item) {
  return item.status === "failed" || item.status === "error" || item.error !== undefined;
}

function commandOutput(item) {
  if (typeof item.aggregated_output === "string") return item.aggregated_output;
  if (typeof item.output === "string") return item.output;
  return "";
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
  result.uncachedInputTokens = Math.max(0, result.inputTokens - result.cachedInputTokens);
  return result;
}

function number(value) {
  return Number.isFinite(value) ? Number(value) : 0;
}
