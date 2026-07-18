import { createHash } from "node:crypto";

export function pairedBootstrapMedianDifference(first, second, options = {}) {
  return pairedBootstrapDifference(first, second, median, options);
}

export function pairedBootstrapMeanDifference(first, second, options = {}) {
  return pairedBootstrapDifference(first, second, mean, options);
}

export function pairedBootstrapDifference(first, second, statistic, options = {}) {
  if (first.length !== second.length) throw new Error("paired samples must have equal length");
  if (!first.length) return { estimate: null, confidenceInterval: [null, null], iterations: 0 };
  const differences = first.map((value, index) => Number(value) - Number(second[index]));
  if (differences.some((value) => !Number.isFinite(value))) {
    throw new Error("paired samples must contain only finite numbers");
  }
  return bootstrapStatistic(differences, statistic, options);
}

export function bootstrapStatistic(values, statistic, options = {}) {
  if (!values.length) return { estimate: null, confidenceInterval: [null, null], iterations: 0 };
  const iterations = positiveInteger(options.iterations ?? 10000, "iterations");
  const confidence = Number(options.confidence ?? 0.95);
  if (!(confidence > 0 && confidence < 1)) throw new Error("confidence must be between 0 and 1");
  const random = seededRandom(String(options.seed ?? "vertex-palace-bootstrap-v1"));
  const samples = new Array(iterations);
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sample = new Array(values.length);
    for (let index = 0; index < values.length; index += 1) {
      sample[index] = values[Math.floor(random() * values.length)];
    }
    samples[iteration] = statistic(sample);
  }
  samples.sort((first, second) => first - second);
  const alpha = 1 - confidence;
  return {
    estimate: statistic(values),
    confidenceInterval: [quantile(samples, alpha / 2), quantile(samples, 1 - alpha / 2)],
    iterations,
    confidence,
    seed: String(options.seed ?? "vertex-palace-bootstrap-v1")
  };
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function quantile(sortedValues, probability) {
  if (!sortedValues.length) return null;
  const index = (sortedValues.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function positiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function seededRandom(seed) {
  let state = createHash("sha256").update(seed).digest().readUInt32BE(0);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
