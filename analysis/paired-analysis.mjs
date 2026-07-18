import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  median,
  pairedBootstrapMeanDifference,
  pairedBootstrapMedianDifference
} from "./bootstrap-ci.mjs";

const continuousMetrics = Object.freeze([
  "durationMs",
  "toolCalls",
  "failedCalls",
  "routerErrors",
  "inspectionCommands",
  "commandOutputChars",
  "inputTokens",
  "cachedInputTokens",
  "uncachedInputTokens",
  "outputTokens",
  "reportedTokens",
  "changedFilePrecision",
  "changedFileRecall"
]);

export async function analyzeManifest(manifestPath, options = {}) {
  const absoluteManifest = path.resolve(manifestPath);
  const manifest = JSON.parse(await readFile(absoluteManifest, "utf8"));
  const reports = [];
  const missing = [];
  for (const trial of manifest.trials ?? []) {
    if (!trial.report) {
      missing.push({ trialId: trial.trialId, reason: "report path missing", status: trial.status ?? null });
      continue;
    }
    const reportPath = path.resolve(path.dirname(absoluteManifest), trial.report);
    try {
      reports.push({ trial, report: JSON.parse(await readFile(reportPath, "utf8")) });
    } catch (error) {
      missing.push({ trialId: trial.trialId, reason: error.message, status: trial.status ?? null });
    }
  }
  return analyzeReports(reports, { ...options, manifest, missing });
}

export function analyzeReports(entries, options = {}) {
  const byScenario = new Map();
  for (const entry of entries) {
    const scenario = entry.report.scenario ?? entry.trial?.scenario ?? "unknown";
    if (!byScenario.has(scenario)) byScenario.set(scenario, []);
    byScenario.get(scenario).push(entry);
  }

  const scenarios = Object.fromEntries(
    [...byScenario.entries()].map(([scenario, scenarioEntries]) => [
      scenario,
      analyzeGroup(scenarioEntries, { ...options, bootstrapSeed: `${options.bootstrapSeed ?? "pilot-v1"}:${scenario}` })
    ])
  );
  const scenarioNames = Object.keys(scenarios);
  const rawPValues = scenarioNames.map((name) => scenarios[name].success.mcnemarExactPValue);
  const adjusted = holmAdjust(rawPValues);
  scenarioNames.forEach((name, index) => {
    scenarios[name].success.holmAdjustedPValue = adjusted[index];
  });

  return {
    schemaVersion: 1,
    protocolVersion: options.manifest?.protocolVersion ?? null,
    generatedAt: new Date().toISOString(),
    exploratory: true,
    attemptedTrials: options.manifest?.trials?.length ?? entries.length,
    loadedTrials: entries.length,
    missingTrials: options.missing ?? [],
    scenarios,
    overall: analyzeGroup(entries, { ...options, bootstrapSeed: `${options.bootstrapSeed ?? "pilot-v1"}:overall` }),
    multiplicity: {
      method: "Holm step-down",
      family: "scenario-level exact paired success tests",
      rawPValues,
      adjustedPValues: adjusted
    },
    caveats: [
      "This is an exploratory pilot and is not powered to establish non-inferiority.",
      "Efficiency metrics include only pairs where both compared arms achieved protocol-defined success.",
      "Invalid infrastructure or treatment runs are retained but excluded from paired estimates; agent failures and timeouts remain outcomes."
    ]
  };
}

export function analyzeGroup(entries, options = {}) {
  const pairs = entries.map(toPair);
  const validPairs = pairs.filter((pair) => pair.control?.valid === true && pair.fullPalace?.valid === true);
  const invalidPairs = pairs.filter((pair) => !validPairs.includes(pair)).map((pair) => pair.trialId);
  const controlSuccess = validPairs.map((pair) => Number(pair.control.success === true));
  const palaceSuccess = validPairs.map((pair) => Number(pair.fullPalace.success === true));
  const successEstimate = pairedBootstrapMeanDifference(palaceSuccess, controlSuccess, bootstrapOptions(options));
  const discordance = discordantPairs(controlSuccess, palaceSuccess);

  const metrics = {};
  for (const metric of continuousMetrics) {
    const successful = validPairs.filter((pair) => (
      pair.control.success === true
      && pair.fullPalace.success === true
      && Number.isFinite(pair.control[metric])
      && Number.isFinite(pair.fullPalace[metric])
    ));
    const controlValues = successful.map((pair) => pair.control[metric]);
    const palaceValues = successful.map((pair) => pair.fullPalace[metric]);
    metrics[metric] = {
      pairCount: successful.length,
      controlRaw: controlValues,
      fullPalaceRaw: palaceValues,
      controlMedian: median(controlValues),
      fullPalaceMedian: median(palaceValues),
      fullPalaceMinusControl: pairedBootstrapMedianDifference(
        palaceValues,
        controlValues,
        { ...bootstrapOptions(options), seed: `${options.bootstrapSeed}:${metric}` }
      )
    };
  }

  return {
    attemptedPairs: pairs.length,
    validPairs: validPairs.length,
    invalidPairIds: invalidPairs,
    success: {
      controlRaw: controlSuccess,
      fullPalaceRaw: palaceSuccess,
      controlRate: rate(controlSuccess),
      fullPalaceRate: rate(palaceSuccess),
      fullPalaceMinusControl: successEstimate,
      nonInferiorityMargin: -0.1,
      pilotIntervalAboveMargin: successEstimate.confidenceInterval[0] !== null
        ? successEstimate.confidenceInterval[0] > -0.1
        : null,
      discordant: discordance,
      mcnemarExactPValue: exactMcNemar(discordance.controlOnly, discordance.palaceOnly)
    },
    metrics,
    mechanisms: mechanismSummary(validPairs)
  };
}

export function exactMcNemar(controlOnly, palaceOnly) {
  const discordant = controlOnly + palaceOnly;
  if (!discordant) return 1;
  const lower = Math.min(controlOnly, palaceOnly);
  let cumulative = 0;
  for (let successes = 0; successes <= lower; successes += 1) {
    cumulative += combination(discordant, successes) * (0.5 ** discordant);
  }
  return Math.min(1, 2 * cumulative);
}

export function holmAdjust(pValues) {
  const indexed = pValues.map((value, index) => ({ value: Number.isFinite(value) ? value : 1, index }))
    .sort((first, second) => first.value - second.value);
  const adjusted = new Array(pValues.length).fill(1);
  let previous = 0;
  indexed.forEach((item, rank) => {
    const candidate = Math.min(1, (indexed.length - rank) * item.value);
    previous = Math.max(previous, candidate);
    adjusted[item.index] = previous;
  });
  return adjusted;
}

function toPair(entry) {
  const arms = entry.report.arms ?? {};
  return {
    trialId: entry.trial?.trialId ?? entry.report.runId,
    control: arms.control ?? entry.report.control,
    routeOnly: arms["route-only"] ?? entry.report.routeOnly ?? null,
    fullPalace: arms["full-palace"] ?? entry.report.palace
  };
}

function discordantPairs(control, palace) {
  let controlOnly = 0;
  let palaceOnly = 0;
  for (let index = 0; index < control.length; index += 1) {
    if (control[index] === 1 && palace[index] === 0) controlOnly += 1;
    if (control[index] === 0 && palace[index] === 1) palaceOnly += 1;
  }
  return { controlOnly, palaceOnly, total: controlOnly + palaceOnly };
}

function mechanismSummary(pairs) {
  const withRouteOnly = pairs.filter((pair) => pair.routeOnly?.valid === true);
  return {
    routeOnlyPairs: withRouteOnly.length,
    routeRecallAtK: rawMechanism(withRouteOnly, (arm) => arm.route?.recallAtK),
    routePrecisionAtK: rawMechanism(withRouteOnly, (arm) => arm.route?.precisionAtK),
    pitfallViolationRate: booleanMechanism(withRouteOnly, "pitfallViolation"),
    wrongMemoryAdoptionRate: booleanMechanism(withRouteOnly, "wrongMemoryAdopted")
  };
}

function rawMechanism(pairs, read) {
  return {
    routeOnly: pairs.map((pair) => read(pair.routeOnly)).filter(Number.isFinite),
    fullPalace: pairs.map((pair) => read(pair.fullPalace)).filter(Number.isFinite)
  };
}

function booleanMechanism(pairs, field) {
  const values = (arm) => pairs.map((pair) => pair[arm].memory?.[field]).filter((value) => typeof value === "boolean");
  const routeOnly = values("routeOnly");
  const fullPalace = values("fullPalace");
  return {
    routeOnlyRaw: routeOnly,
    fullPalaceRaw: fullPalace,
    routeOnlyRate: rate(routeOnly.map(Number)),
    fullPalaceRate: rate(fullPalace.map(Number))
  };
}

function combination(total, selected) {
  let value = 1;
  for (let index = 1; index <= selected; index += 1) {
    value = value * (total - selected + index) / index;
  }
  return value;
}

function rate(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function bootstrapOptions(options) {
  return {
    iterations: options.iterations ?? 10000,
    confidence: 0.95,
    seed: options.bootstrapSeed ?? "pilot-v1"
  };
}

export function renderAnalysisMarkdown(analysis) {
  const lines = [
    "# Vertex Palace Exploratory Pilot Analysis",
    "",
    `Loaded trials: ${analysis.loadedTrials}/${analysis.attemptedTrials}`,
    "",
    "| Scenario | Valid pairs | Control success | Full Palace success | Paired difference (95% bootstrap CI) | Exact p | Holm p |",
    "| --- | ---: | ---: | ---: | --- | ---: | ---: |"
  ];
  for (const [scenario, result] of Object.entries(analysis.scenarios)) {
    const difference = result.success.fullPalaceMinusControl;
    lines.push(
      `| ${scenario} | ${result.validPairs} | ${percent(result.success.controlRate)} | ${percent(result.success.fullPalaceRate)} | `
      + `${percent(difference.estimate)} [${percent(difference.confidenceInterval[0])}, ${percent(difference.confidenceInterval[1])}] | `
      + `${fixed(result.success.mcnemarExactPValue)} | ${fixed(result.success.holmAdjustedPValue)} |`
    );
  }
  lines.push(
    "",
    "Efficiency metrics are calculated only for mutually successful pairs. Raw values and bootstrap intervals are available in the JSON report.",
    "",
    "This exploratory pilot does not guarantee that Vertex Palace is faster on every task.",
    ""
  );
  return lines.join("\n");
}

function percent(value) {
  return value === null || value === undefined ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function fixed(value) {
  return value === null || value === undefined ? "n/a" : Number(value).toFixed(4);
}

async function main() {
  const args = parseCli(process.argv.slice(2));
  const manifestPath = args.manifest ?? "results/manifest.json";
  const outputPath = path.resolve(args.out ?? "results/pilot/analysis.json");
  const analysis = await analyzeManifest(manifestPath, {
    iterations: Number(args.iterations ?? 10000),
    bootstrapSeed: args.seed ?? "pilot-v1"
  });
  await writeFile(outputPath, `${JSON.stringify(analysis, null, 2)}\n`, "utf8");
  await writeFile(outputPath.replace(/\.json$/i, ".md"), renderAnalysisMarkdown(analysis), "utf8");
  console.log(`Analysis JSON: ${outputPath}`);
}

function parseCli(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    values[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return values;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
