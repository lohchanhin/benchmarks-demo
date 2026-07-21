import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathExists, readJson, writeJson, writeText } from "../lib/files.mjs";
import { loadRun, resolveRunDirectory } from "../lib/run-state.mjs";

export async function reportCommand(flags) {
  const runDirectory = await resolveRunDirectory(flags);
  const run = await loadRun(runDirectory);
  const report = await writeComparisonReport(run);
  console.log(`Markdown report: ${report.markdownPath}`);
  console.log(`JSON report: ${report.jsonPath}`);
}

export async function writeComparisonReport(run) {
  const artifacts = path.join(run.runDirectory, "artifacts");
  const evidence = {};
  const reportArms = Object.keys(run.manifest.arms ?? { control: true, palace: true });
  for (const arm of reportArms) {
    const source = path.join(artifacts, `${arm}-evidence.json`);
    if (!(await pathExists(source))) throw new Error(`Missing ${arm} evidence. Run verify first.`);
    evidence[arm] = await readJson(source);
  }

  const comparison = buildComparison(run, evidence);
  const reports = path.join(run.runDirectory, "reports");
  await mkdir(reports, { recursive: true });
  const markdownPath = path.join(reports, "comparison.md");
  const jsonPath = path.join(reports, "comparison.json");
  await Promise.all([
    writeText(markdownPath, renderMarkdown(comparison)),
    writeJson(jsonPath, comparison)
  ]);
  return { comparison, markdownPath, jsonPath };
}

export function buildComparison(run, evidence) {
  const control = summarize(evidence.control);
  const routeOnly = evidence["route-only"] ? summarize(evidence["route-only"]) : null;
  const palace = summarize(evidence["full-palace"] ?? evidence.palace);
  const adaptive = evidence["adaptive-palace"] ? summarize(evidence["adaptive-palace"]) : null;
  const controlFirst = Boolean(
    adaptive
    && (run.manifest.primaryComparison === "adaptive-vs-control"
      || String(run.manifest.protocolVersion).startsWith("3."))
  );
  const primaryBaseline = controlFirst ? control : adaptive ? palace : control;
  const primaryTreatment = adaptive ?? palace;
  const comparable = mutuallySuccessful(primaryBaseline, primaryTreatment);
  const primaryDelta = efficiencyDelta(primaryBaseline, primaryTreatment, comparable);
  const controlFullComparable = mutuallySuccessful(control, palace);
  const controlAdaptiveComparable = adaptive ? mutuallySuccessful(control, adaptive) : false;
  const routeOnlyComparable = routeOnly ? mutuallySuccessful(routeOnly, palace) : false;
  const fullAdaptiveComparable = adaptive ? mutuallySuccessful(palace, adaptive) : false;
  return {
    schemaVersion: controlFirst ? 5 : adaptive ? 4 : 3,
    runId: run.manifest.id,
    createdAt: new Date().toISOString(),
    scenario: run.manifest.scenario,
    scenarioTitle: run.manifest.scenarioTitle,
    task: run.manifest.task,
    repositoryTree: run.manifest.repositoryTree,
    generatedFileCount: run.manifest.generatedFileCount,
    cacheState: run.manifest.cacheState ?? "unrecorded",
    seed: run.manifest.seed ?? null,
    protocolVersion: run.manifest.protocolVersion ?? null,
    scenarioVariant: run.manifest.scenarioVariant ?? null,
    ...(controlFirst
      ? {
          primaryComparison: "adaptive-vs-control",
          primaryEfficiencyMetric: run.manifest.primaryEfficiencyMetric ?? "reportedTokens"
        }
      : {}),
    control,
    routeOnly,
    palace,
    adaptive,
    arms: {
      control,
      ...(routeOnly ? { "route-only": routeOnly } : {}),
      "full-palace": palace,
      ...(adaptive ? { "adaptive-palace": adaptive } : {})
    },
    comparable,
    execution: {
      mode: "sequential",
      order: executionOrder({
        control,
        ...(routeOnly ? { "route-only": routeOnly } : {}),
        "full-palace": palace,
        ...(adaptive ? { "adaptive-palace": adaptive } : {})
      })
    },
    delta: primaryDelta,
    pairwise: {
      controlVsFullPalace: {
        comparable: controlFullComparable,
        delta: efficiencyDelta(control, palace, controlFullComparable)
      },
      controlVsAdaptivePalace: adaptive
        ? {
            comparable: controlAdaptiveComparable,
            delta: efficiencyDelta(control, adaptive, controlAdaptiveComparable)
          }
        : null,
      fullPalaceVsAdaptivePalace: adaptive
        ? {
            comparable: fullAdaptiveComparable,
            delta: efficiencyDelta(palace, adaptive, fullAdaptiveComparable)
          }
        : null,
      routeOnlyVsFullPalace: {
        comparable: routeOnlyComparable,
        delta: routeOnly ? efficiencyDelta(routeOnly, palace, routeOnlyComparable) : null
      }
    },
    caveats: [
      "Distinct repository path strings are matched anywhere in the transcript. An inventory command can list every path without reading every file's contents.",
      "Command-named files and command-output characters are transcript-derived context proxies, not an operating-system file-access audit.",
      "Agent-adherence fields are ordered-transcript heuristics. They detect named paths, command classes, failures, and stop markers; they are not an operating-system file-access or semantic-intent audit.",
      "Codex input tokens are cumulative across model turns. Cached and uncached input are shown separately and are not an API billing statement.",
      "Paired arms run sequentially, never concurrently. Repeat pairs with alternating order and report medians to reduce order and service-load effects.",
      `Palace index cache state for this trial: ${run.manifest.cacheState ?? "unrecorded"}. This does not control provider-side model caching.`,
      "Root .palace paths are recorded as benchmark instrumentation and excluded from changed-file scope; raw Git status remains in each arm evidence file.",
      "A result is comparable only when both arms start from the recorded Git tree and pass their arm-validity checks.",
      "Correctness and scope determine the score. Speed and token metrics are reported, not rewarded."
    ]
  };
}

function summarize(evidence) {
  return {
    model: evidence.model,
    valid: evidence.validity.passed,
    validityVerified: evidence.validity.verified,
    validityReason: evidence.validity.reason,
    testsPassed: evidence.tests.passed,
    publicTestsPassed: evidence.tests.publicPassed ?? evidence.tests.passed,
    oraclePassed: evidence.tests.oraclePassed ?? null,
    success: evidence.success ?? (evidence.validity.passed && evidence.tests.passed && !evidence.score.forbiddenViolation),
    score: evidence.score.total,
    durationMs: evidence.execution?.durationMs ?? null,
    startedAt: evidence.execution?.startedAt ?? null,
    sequence: evidence.execution?.sequence ?? null,
    toolCalls: evidence.transcript.toolCalls,
    deliveredFullPathReopenedCount: evidence.transcript.deliveredFullPathReopenedCount ?? 0,
    deferredOpenedWithoutConflictCount: evidence.transcript.deferredOpenedWithoutConflictCount ?? 0,
    excludedPathOpenedCount: evidence.transcript.excludedPathOpenedCount ?? 0,
    toolCallsBeforeFirstEdit: evidence.transcript.toolCallsBeforeFirstEdit ?? null,
    toolCallsAfterTestsPassed: evidence.transcript.toolCallsAfterTestsPassed ?? null,
    callsAfterStopConditionSatisfied: evidence.transcript.callsAfterStopConditionSatisfied ?? null,
    batchedVerificationUsed: evidence.transcript.batchedVerificationUsed ?? false,
    repeatedTaskRestatementCount: evidence.transcript.repeatedTaskRestatementCount ?? 0,
    failedCalls: evidence.transcript.failedCalls ?? null,
    commandOutputChars: evidence.transcript.commandOutputChars ?? null,
    palaceContextOutputChars: evidence.transcript.palaceContextOutputChars ?? null,
    palaceContextOutputBytes: evidence.transcript.palaceContextOutputBytes ?? null,
    palaceContextEstimatedTokens: evidence.transcript.palaceContextEstimatedTokens ?? null,
    adaptivePayload: evidence.transcript.adaptivePayload ?? null,
    adaptivePayloadMatchesOutput: evidence.transcript.adaptivePayloadMatchesOutput ?? null,
    palaceReceivedTask: evidence.transcript.palaceReceivedTask ?? null,
    taskFidelity: evidence.taskFidelityPassed ?? null,
    inspectionCommands: evidence.transcript.inspectionCommands,
    palaceCalls: evidence.transcript.palaceCalls,
    successfulPalaceCalls: evidence.transcript.successfulPalaceCalls ?? 0,
    inspectedFiles: evidence.transcript.inspectedFiles?.length ?? 0,
    referencedFiles: evidence.transcript.referencedFiles.length,
    referencedFilePaths: evidence.transcript.referencedFiles,
    inputTokens: tokenValue(evidence.transcript.usage.inputTokens),
    cachedInputTokens: tokenValue(evidence.transcript.usage.cachedInputTokens),
    uncachedInputTokens: tokenValue(
      evidence.transcript.usage.uncachedInputTokens
        ?? Math.max(0, (evidence.transcript.usage.inputTokens ?? 0) - (evidence.transcript.usage.cachedInputTokens ?? 0))
    ),
    outputTokens: tokenValue(evidence.transcript.usage.outputTokens),
    reportedTokens: tokenValue(evidence.transcript.usage.totalTokens),
    routerErrors: evidence.runtimeDiagnostics?.routerErrors ?? null,
    applyPatchVerificationErrors: evidence.runtimeDiagnostics?.applyPatchVerificationErrors ?? null,
    sandboxPreparationErrors: evidence.runtimeDiagnostics?.sandboxPreparationErrors ?? null,
    changedFiles: evidence.git.changedFiles,
    gitStatus: evidence.git.status ?? [],
    instrumentationFiles: evidence.git.instrumentationFiles ?? [],
    instrumentationUntrackedFiles: evidence.git.instrumentationUntrackedFiles ?? [],
    forbiddenChanged: evidence.score.forbiddenChanged,
    unexpectedChanged: evidence.score.unexpectedChanged,
    expectedCoverage: evidence.score.expectedCoverage,
    changedFilePrecision: evidence.score.changedFilePrecision ?? null,
    changedFileRecall: evidence.score.changedFileRecall ?? evidence.score.expectedCoverage,
    forbiddenViolation: evidence.score.forbiddenViolation ?? evidence.score.forbiddenChanged.length > 0,
    timedOut: evidence.execution?.timedOut ?? false,
    route: evidence.route ?? null,
    memory: evidence.memory ?? null,
    palaceEvaluation: evidence.palaceEvaluation
  };
}

function renderMarkdown(report) {
  const routeOnly = report.routeOnly;
  const rows = [
    resultRow("Protocol success", report, (arm) => yesNo(arm.success)),
    resultRow("Public tests", report, (arm) => yesNo(arm.publicTestsPassed)),
    resultRow("Hidden oracle", report, (arm) => arm.oraclePassed === null ? "n/a" : yesNo(arm.oraclePassed)),
    resultRow("Timed out", report, (arm) => yesNo(arm.timedOut)),
    resultRow("Arm valid", report, validity),
    resultRow("Scope score", report, (arm) => `${arm.score}/100`),
    resultRow("Changed-file precision", report, (arm) => percent(arm.changedFilePrecision)),
    resultRow("Changed-file recall", report, (arm) => percent(arm.changedFileRecall)),
    resultRow("Forbidden-file violation", report, (arm) => yesNo(arm.forbiddenViolation)),
    metricRow("Elapsed time", report, "durationMs", duration, signedDuration, "durationMsSaved"),
    metricRow("Recorded command/tool calls", report, "toolCalls", number, signed, "toolCallsSaved"),
    metricRow("Delivered full paths reopened", report, "deliveredFullPathReopenedCount", number, signed, "deliveredFullPathReopenedCountSaved"),
    metricRow("Deferred paths opened without conflict", report, "deferredOpenedWithoutConflictCount", number, signed, "deferredOpenedWithoutConflictCountSaved"),
    metricRow("Excluded paths opened", report, "excludedPathOpenedCount", number, signed, "excludedPathOpenedCountSaved"),
    metricRow("Calls before first edit", report, "toolCallsBeforeFirstEdit", number, signed, "toolCallsBeforeFirstEditSaved"),
    metricRow("Calls after tests passed", report, "toolCallsAfterTestsPassed", number, signed, "toolCallsAfterTestsPassedSaved"),
    metricRow("Calls after stop condition", report, "callsAfterStopConditionSatisfied", number, signed, "callsAfterStopConditionSatisfiedSaved"),
    resultRow("Batched verification used", report, (arm) => yesNo(arm.batchedVerificationUsed)),
    metricRow("Repeated task restatements", report, "repeatedTaskRestatementCount", number, signed, "repeatedTaskRestatementCountSaved"),
    metricRow("Failed recorded calls", report, "failedCalls", number, signed, "failedCallsSaved"),
    metricRow("Codex router errors in stderr", report, "routerErrors", number, signed, "routerErrorsSaved"),
    metricRow("Native patch verification errors", report, "applyPatchVerificationErrors", number, signed, "applyPatchVerificationErrorsSaved"),
    metricRow("Sandbox preparation errors", report, "sandboxPreparationErrors", number, signed, "sandboxPreparationErrorsSaved"),
    metricRow("Inspection commands", report, "inspectionCommands", number, signed, "inspectionCommandsSaved"),
    metricRow("Files named in commands", report, "inspectedFiles", number, signed, "inspectedFilesSaved"),
    metricRow("Distinct repository path strings observed", report, "referencedFiles", number, signed, "referencedFilesSaved"),
    metricRow("Command output characters", report, "commandOutputChars", number, signed, "commandOutputCharsSaved"),
    metricRow("Palace context output characters", report, "palaceContextOutputChars", number, signed, "palaceContextOutputCharsSaved"),
    metricRow("Palace context output bytes", report, "palaceContextOutputBytes", number, signed, "palaceContextOutputBytesSaved"),
    metricRow("Palace context estimated tokens", report, "palaceContextEstimatedTokens", number, signed, "palaceContextEstimatedTokensSaved"),
    metricRow("Cumulative input tokens", report, "inputTokens", number, signed, "inputTokensSaved"),
    metricRow("Cached input tokens", report, "cachedInputTokens", number, signed, "cachedInputTokensSaved"),
    metricRow("Uncached input tokens", report, "uncachedInputTokens", number, signed, "uncachedInputTokensSaved"),
    metricRow("Output tokens", report, "outputTokens", number, signed, "outputTokensSaved"),
    metricRow("Cumulative reported tokens", report, "reportedTokens", number, signed, "reportedTokensSaved"),
    resultRow("Palace calls", report, (arm) => number(arm.palaceCalls))
  ];
  const controlFirst = report.primaryComparison === "adaptive-vs-control";
  const primaryDeltaLabel = controlFirst
    ? "Control minus Adaptive"
    : report.adaptive ? "Full Palace minus Adaptive" : "Control minus Full Palace";
  const lines = [
    controlFirst
      ? "# Vertex Palace Control-First Four-Arm Benchmark"
      : report.adaptive ? "# Vertex Palace Four-Arm Adaptive Benchmark" : "# Vertex Palace Three-Arm Benchmark",
    "",
    `Run: \`${report.runId}\``,
    `Scenario: ${report.scenarioTitle}`,
    `Shared Git tree: \`${report.repositoryTree}\``,
    `Generated fixture files: ${report.generatedFileCount}`,
    `Palace index state: ${report.cacheState}`,
    `Comparable result: ${report.comparable ? "yes" : "no"}`,
    `Execution: sequential (${report.execution.order.map(armLabel).join(" -> ")})`,
    "",
    "## Task",
    "",
    report.task,
    "",
    "## Results",
    "",
    `| Metric | Control | Route-only | Full Palace | Adaptive Palace | ${primaryDeltaLabel} |`,
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    report.comparable
      ? `Positive values in the final column mean ${controlFirst ? "Adaptive Palace used less than Control" : report.adaptive ? "Adaptive Palace used less than Full Palace" : "Full Palace used less than Control"} for that measured resource.`
      : "Efficiency deltas are withheld because the primary baseline and treatment did not both complete as valid, passing runs.",
    "",
    "## Changed Files",
    "",
    "### Control",
    "",
    ...fileLines(report.control.changedFiles),
    "",
    ...(routeOnly ? ["### Route-only", "", ...fileLines(routeOnly.changedFiles), ""] : []),
    "### Full Palace",
    "",
    ...fileLines(report.palace.changedFiles),
    "",
    ...(report.adaptive ? ["### Adaptive Palace", "", ...fileLines(report.adaptive.changedFiles)] : []),
    "",
    "## Instrumentation Excluded From Scope",
    "",
    "Raw Git status is preserved in each arm evidence file. Only root `.palace` state is excluded from correctness and changed-file precision/recall.",
    "",
    `- Control: ${inlineFiles(report.control.instrumentationFiles)}`,
    ...(routeOnly ? [`- Route-only: ${inlineFiles(routeOnly.instrumentationFiles)}`] : []),
    `- Full Palace: ${inlineFiles(report.palace.instrumentationFiles)}`,
    ...(report.adaptive ? [`- Adaptive Palace: ${inlineFiles(report.adaptive.instrumentationFiles)}`] : []),
    "",
    "## Validity",
    "",
    `- Control: ${report.control.validityReason}`,
    ...(routeOnly ? [`- Route-only: ${routeOnly.validityReason}`] : []),
    `- Full Palace: ${report.palace.validityReason}`,
    ...(report.adaptive ? [`- Adaptive Palace: ${report.adaptive.validityReason}`] : []),
    "",
    "## Route And Memory Signals",
    "",
    `- Route-only Recall@K / Precision@K: ${routeMetric(routeOnly?.route)}`,
    `- Full Palace Recall@K / Precision@K: ${routeMetric(report.palace.route)}`,
    ...(report.adaptive ? [`- Adaptive Palace Recall@K / Precision@K: ${routeMetric(report.adaptive.route)}`] : []),
    `- Control pitfall violation / wrong-memory adoption: ${memoryMetric(report.control.memory)}`,
    `- Route-only pitfall violation / wrong-memory adoption: ${memoryMetric(routeOnly?.memory)}`,
    `- Full Palace pitfall violation / wrong-memory adoption: ${memoryMetric(report.palace.memory)}`,
    ...(report.adaptive
      ? [
          `- Adaptive Palace pitfall violation / wrong-memory adoption: ${memoryMetric(report.adaptive.memory)}`,
          `- Adaptive selected mode: ${report.adaptive.adaptivePayload?.mode ?? "not captured"}`,
          `- Adaptive self-reported payload: ${payloadMetric(report.adaptive.adaptivePayload)}`,
          `- Adaptive self-reported memory: ${payloadMemoryMetric(report.adaptive.adaptivePayload)}`
        ]
      : []),
    "",
    "## Caveats",
    "",
    ...report.caveats.map((item) => `- ${item}`),
    ""
  ];

  const evaluation = report.palace.palaceEvaluation;
  if (evaluation?.context) {
    lines.splice(lines.indexOf("## Changed Files"), 0,
      "## Palace Context Evaluation",
      "",
      `- Repository estimate: ${number(evaluation.context.repositoryTokens)} tokens`,
      `- Context pack: ${number(evaluation.context.packTokens)} tokens`,
      `- Estimated reduction: ${number(evaluation.context.tokenReductionPercent)}%`,
      ""
    );
  }
  return lines.join("\n");
}

function resultRow(label, report, format) {
  return [
    label,
    format(report.control),
    report.routeOnly ? format(report.routeOnly) : "n/a",
    format(report.palace),
    report.adaptive ? format(report.adaptive) : "n/a",
    "-"
  ];
}

function metricRow(label, report, field, format, deltaFormat, deltaField) {
  return [
    label,
    format(report.control[field]),
    report.routeOnly ? format(report.routeOnly[field]) : "n/a",
    format(report.palace[field]),
    report.adaptive ? format(report.adaptive[field]) : "n/a",
    deltaFormat(report.delta[deltaField])
  ];
}

function fileLines(files) {
  return files.length ? files.map((file) => `- \`${file}\``) : ["- None"];
}

function inlineFiles(files) {
  return files.length ? files.map((file) => `\`${file}\``).join(", ") : "None";
}

function subtract(first, second) {
  return first === null || second === null ? null : first - second;
}

function mutuallySuccessful(first, second) {
  return first.valid === true && second.valid === true && first.success === true && second.success === true;
}

function efficiencyDelta(first, second, comparable) {
  const value = (field) => comparable ? subtract(first[field], second[field]) : null;
  return {
    durationMsSaved: value("durationMs"),
    toolCallsSaved: value("toolCalls"),
    deliveredFullPathReopenedCountSaved: value("deliveredFullPathReopenedCount"),
    deferredOpenedWithoutConflictCountSaved: value("deferredOpenedWithoutConflictCount"),
    excludedPathOpenedCountSaved: value("excludedPathOpenedCount"),
    toolCallsBeforeFirstEditSaved: value("toolCallsBeforeFirstEdit"),
    toolCallsAfterTestsPassedSaved: value("toolCallsAfterTestsPassed"),
    callsAfterStopConditionSatisfiedSaved: value("callsAfterStopConditionSatisfied"),
    repeatedTaskRestatementCountSaved: value("repeatedTaskRestatementCount"),
    failedCallsSaved: value("failedCalls"),
    routerErrorsSaved: value("routerErrors"),
    applyPatchVerificationErrorsSaved: value("applyPatchVerificationErrors"),
    sandboxPreparationErrorsSaved: value("sandboxPreparationErrors"),
    inspectionCommandsSaved: value("inspectionCommands"),
    inspectedFilesSaved: value("inspectedFiles"),
    referencedFilesSaved: value("referencedFiles"),
    commandOutputCharsSaved: value("commandOutputChars"),
    palaceContextOutputCharsSaved: value("palaceContextOutputChars"),
    palaceContextOutputBytesSaved: value("palaceContextOutputBytes"),
    palaceContextEstimatedTokensSaved: value("palaceContextEstimatedTokens"),
    inputTokensSaved: value("inputTokens"),
    cachedInputTokensSaved: value("cachedInputTokens"),
    uncachedInputTokensSaved: value("uncachedInputTokens"),
    outputTokensSaved: value("outputTokens"),
    reportedTokensSaved: value("reportedTokens")
  };
}

function executionOrder(arms) {
  return Object.entries(arms)
    .map(([name, arm]) => ({ name, sequence: arm.sequence, startedAt: arm.startedAt }))
    .sort((first, second) => {
      if (first.sequence !== null && second.sequence !== null) return first.sequence - second.sequence;
      return String(first.startedAt ?? "").localeCompare(String(second.startedAt ?? ""));
    })
    .map((item) => item.name);
}

function armLabel(value) {
  if (value === "full-palace" || value === "palace") return "Full Palace";
  if (value === "adaptive-palace") return "Adaptive Palace";
  if (value === "route-only") return "Route-only";
  return "Control";
}

function tokenValue(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function number(value) {
  return value === null || value === undefined ? "n/a" : new Intl.NumberFormat("en-US").format(value);
}

function signed(value) {
  if (value === null) return "n/a";
  return `${value > 0 ? "+" : ""}${number(value)}`;
}

function duration(value) {
  return value === null ? "n/a" : `${(value / 1000).toFixed(1)}s`;
}

function signedDuration(value) {
  if (value === null) return "n/a";
  return `${value > 0 ? "+" : ""}${(value / 1000).toFixed(1)}s`;
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function percent(value) {
  return value === null || value === undefined ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function routeMetric(route) {
  return route ? `${percent(route.recallAtK)} / ${percent(route.precisionAtK)} (K=${route.k})` : "n/a";
}

function memoryMetric(memory) {
  if (!memory) return "n/a / n/a";
  const value = (item) => item === null || item === undefined ? "n/a" : yesNo(item);
  return `${value(memory.pitfallViolation)} / ${value(memory.wrongMemoryAdopted)}`;
}

function payloadMetric(payload) {
  return payload
    ? `${number(payload.contextBytes)} bytes / ~${number(payload.contextEstimatedTokens)} tokens`
    : "n/a";
}

function payloadMemoryMetric(payload) {
  if (!payload || payload.memoryItemCount === null || payload.memoryItemCount === undefined) return "n/a";
  return `${number(payload.memoryItemCount)} included / ${number(payload.memoryCandidateCount)} candidates / ${number(payload.memoryExcludedCount)} excluded`;
}

function validity(arm) {
  if (!arm.validityVerified) return "unverified";
  return arm.valid ? "valid" : "invalid";
}
