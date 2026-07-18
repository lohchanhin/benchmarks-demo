import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = path.resolve(process.argv[2] ?? "results/pilot/analysis.json");
const outputPath = path.resolve(process.argv[3] ?? "results/pilot/power-analysis.json");
const analysis = JSON.parse(await readFile(inputPath, "utf8"));
const scenarios = {};

for (const [name, result] of Object.entries(analysis.scenarios ?? {})) {
  const discordantRate = result.validPairs
    ? result.success.discordant.total / result.validPairs
    : null;
  const observedDifference = result.success.fullPalaceMinusControl.estimate;
  scenarios[name] = {
    pilotValidPairs: result.validPairs,
    observedSuccessDifference: observedDifference,
    discordantRate,
    estimatedPairsForObservedDifference: pairedBinarySampleSize(discordantRate, observedDifference),
    note: observedDifference === 0
      ? "No finite sample size can be estimated from a zero observed effect; choose a scientifically meaningful target effect."
      : "Approximate planning value only; freeze the confirmatory effect size before collecting confirmatory data."
  };
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  alpha: 0.05,
  power: 0.8,
  method: "normal approximation for paired binary differences",
  scenarios
};
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Power analysis: ${outputPath}`);

function pairedBinarySampleSize(discordantRate, difference) {
  if (!Number.isFinite(discordantRate) || !Number.isFinite(difference) || difference === 0) return null;
  const zAlpha = 1.959963984540054;
  const zPower = 0.8416212335729143;
  const variance = Math.max(0.0001, discordantRate - difference ** 2);
  return Math.ceil(((zAlpha + zPower) ** 2 * variance) / (difference ** 2));
}
