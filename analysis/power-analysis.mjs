import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_DISCORDANT_RATES = Object.freeze([0.1, 0.2, 0.3]);
const DEFAULT_STANDARDIZED_EFFECTS = Object.freeze([0.3, 0.5, 0.8]);

export function buildPowerAnalysis(analysis) {
  const scenarios = {};
  for (const [name, result] of Object.entries(analysis.scenarios ?? {})) {
    const discordantRate = result.validPairs
      ? result.success.discordant.total / result.validPairs
      : null;
    const observedDifference = result.success.fullPalaceMinusControl.estimate;
    scenarios[name] = {
      pilotValidPairs: result.validPairs,
      observedSuccessDifference: observedDifference,
      observedDiscordantRate: discordantRate,
      estimatedPairsFromObservedPilot: pairedBinarySampleSize({
        discordantRate,
        alternativeDifference: observedDifference,
        nullBoundary: 0
      }),
      note: observedDifference === 0 && discordantRate === 0
        ? "All pilot pairs were concordant successes, so the pilot cannot provide a data-driven finite sample-size estimate."
        : "Observed-effect estimates are descriptive and must not define the confirmatory target after seeing pilot outcomes."
    };
  }

  const nonInferiority = {
    alpha: 0.05,
    power: 0.8,
    sidedness: "one-sided",
    nullBoundary: -0.1,
    alternativeDifference: 0,
    method: "normal approximation for a paired binary difference without continuity or attrition correction",
    sensitivity: DEFAULT_DISCORDANT_RATES.map((discordantRate) => {
      const pairsPerScenario = pairedBinarySampleSize({
        discordantRate,
        alternativeDifference: 0,
        nullBoundary: -0.1,
        alpha: 0.05,
        power: 0.8,
        oneSided: true
      });
      return {
        assumedDiscordantRate: discordantRate,
        pairsPerScenario,
        fourScenarioTrials: pairsPerScenario * 4,
        threeArmRuns: pairsPerScenario * 4 * 3
      };
    }),
    planningAnchor: {
      assumedDiscordantRate: 0.2,
      pairsPerScenario: pairedBinarySampleSize({
        discordantRate: 0.2,
        alternativeDifference: 0,
        nullBoundary: -0.1,
        alpha: 0.05,
        power: 0.8,
        oneSided: true
      }),
      rationale: "A 20% discordant-pair rate is a transparent sensitivity assumption, not an estimate supported by this all-concordant pilot."
    }
  };

  const continuousSensitivity = DEFAULT_STANDARDIZED_EFFECTS.map((standardizedEffect) => ({
    standardizedPairedEffect: standardizedEffect,
    approximatePairs: pairedContinuousSampleSize({ standardizedEffect })
  }));

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    pilotStatus: {
      plannedTrials: analysis.plannedTrials,
      loadedTrials: analysis.loadedTrials,
      allPrimaryPairsConcordant: Object.values(scenarios).every((scenario) => (
        scenario.observedSuccessDifference === 0 && scenario.observedDiscordantRate === 0
      ))
    },
    scenarios,
    nonInferiority,
    continuousEfficiency: {
      alpha: 0.05,
      power: 0.8,
      sidedness: "two-sided",
      method: "normal approximation for a paired standardized mean difference",
      sensitivity: continuousSensitivity,
      note: "The pilot efficiency direction was not uniformly favorable, so confirmatory H2 must use a prespecified scientifically meaningful effect rather than the observed Palace-favoring effect."
    },
    limitations: [
      "Five pairs per scenario cannot establish the preregistered -10 percentage-point non-inferiority claim.",
      "The binary sensitivity table varies unobserved discordance because this pilot had no discordant outcomes.",
      "These approximations omit continuity, small-sample, multiplicity, clustering, and attrition adjustments.",
      "A confirmatory protocol must freeze assumptions, exclusions, and analysis before collecting new outcomes."
    ]
  };
}

export function pairedBinarySampleSize({
  discordantRate,
  alternativeDifference,
  nullBoundary,
  alpha = 0.05,
  power = 0.8,
  oneSided = true
}) {
  if (![discordantRate, alternativeDifference, nullBoundary].every(Number.isFinite)) return null;
  const separation = alternativeDifference - nullBoundary;
  if (discordantRate <= 0 || separation <= 0) return null;
  const variance = discordantRate - alternativeDifference ** 2;
  if (variance <= 0) return null;
  const zAlpha = inverseStandardNormal(1 - (oneSided ? alpha : alpha / 2));
  const zPower = inverseStandardNormal(power);
  return Math.ceil(((zAlpha + zPower) ** 2 * variance) / (separation ** 2));
}

export function pairedContinuousSampleSize({
  standardizedEffect,
  alpha = 0.05,
  power = 0.8,
  oneSided = false
}) {
  if (!Number.isFinite(standardizedEffect) || standardizedEffect <= 0) return null;
  const zAlpha = inverseStandardNormal(1 - (oneSided ? alpha : alpha / 2));
  const zPower = inverseStandardNormal(power);
  return Math.ceil(((zAlpha + zPower) / standardizedEffect) ** 2);
}

export function renderPowerAnalysisMarkdown(analysis) {
  const lines = [
    "# Confirmatory Study Power Sensitivity",
    "",
    `Pilot evidence: ${analysis.pilotStatus.loadedTrials}/${analysis.pilotStatus.plannedTrials} trials loaded.`,
    "",
    "All 20 Full Palace versus Control pairs were concordant successes. That is reassuring descriptive evidence, but zero discordance means the pilot cannot estimate a finite confirmatory sample size from its observed binary effect.",
    "",
    "## H1 Non-Inferiority Sensitivity",
    "",
    "The table assumes a true paired success difference of 0 against the preregistered -10 percentage-point null boundary, one-sided alpha 0.05, and 80% power. Values are planning approximations before attrition or multiplicity adjustments.",
    "",
    "| Assumed discordant-pair rate | Pairs per scenario | Four-scenario trials | Three-arm runs |",
    "| ---: | ---: | ---: | ---: |"
  ];
  for (const row of analysis.nonInferiority.sensitivity) {
    lines.push(
      `| ${percent(row.assumedDiscordantRate)} | ${integer(row.pairsPerScenario)} | ${integer(row.fourScenarioTrials)} | ${integer(row.threeArmRuns)} |`
    );
  }
  lines.push(
    "",
    `Planning anchor: assuming 20% discordant pairs requires approximately **${integer(analysis.nonInferiority.planningAnchor.pairsPerScenario)} paired trials per scenario**. This assumption is deliberately external to the all-concordant pilot and must be frozen before confirmatory collection.`,
    "",
    "## Continuous Efficiency Sensitivity",
    "",
    "For a two-sided paired continuous comparison at alpha 0.05 and 80% power:",
    "",
    "| Standardized paired effect | Approximate pairs |",
    "| ---: | ---: |"
  );
  for (const row of analysis.continuousEfficiency.sensitivity) {
    lines.push(`| ${row.standardizedPairedEffect.toFixed(1)} | ${integer(row.approximatePairs)} |`);
  }
  lines.push(
    "",
    "The pilot did not show a consistent Palace efficiency advantage, so a confirmatory H2 effect must be chosen for scientific relevance rather than selected from the most favorable observed metric.",
    "",
    "## Limitations",
    "",
    ...analysis.limitations.map((limitation) => `- ${limitation}`),
    ""
  );
  return lines.join("\n");
}

function inverseStandardNormal(probability) {
  if (!(probability > 0 && probability < 1)) return Number.NaN;
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const low = 0.02425;
  const high = 1 - low;
  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (probability > high) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5])
      / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
    / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function integer(value) {
  return value === null || value === undefined ? "n/a" : Number(value).toLocaleString("en-US");
}

function percent(value) {
  return value === null || value === undefined ? "n/a" : `${(value * 100).toFixed(0)}%`;
}

async function main() {
  const inputPath = path.resolve(process.argv[2] ?? "results/pilot/analysis.json");
  const outputPath = path.resolve(process.argv[3] ?? "results/pilot/power-analysis.json");
  const pilot = JSON.parse(await readFile(inputPath, "utf8"));
  const analysis = buildPowerAnalysis(pilot);
  await writeFile(outputPath, `${JSON.stringify(analysis, null, 2)}\n`, "utf8");
  await writeFile(outputPath.replace(/\.json$/i, ".md"), renderPowerAnalysisMarkdown(analysis), "utf8");
  console.log(`Power analysis: ${outputPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
