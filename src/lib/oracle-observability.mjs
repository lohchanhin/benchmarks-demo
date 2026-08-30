export function classifyOracleObservability({
  basePaths = [],
  implementationFiles = [],
  testFiles = [],
  auxiliaryFiles = []
} = {}) {
  const base = new Set(normalizePaths(basePaths));
  const implementation = classifyLayer(implementationFiles, base);
  const tests = classifyLayer(testFiles, base);
  const auxiliary = classifyLayer(auxiliaryFiles, base);
  const core = mergeLayers(implementation, tests);

  return {
    schemaVersion: 1,
    baseObservable: {
      implementationFiles: implementation.baseObservable,
      testFiles: tests.baseObservable,
      auxiliaryFiles: auxiliary.baseObservable,
      coreFiles: core.baseObservable
    },
    futureOnly: {
      implementationFiles: implementation.futureOnly,
      testFiles: tests.futureOnly,
      auxiliaryFiles: auxiliary.futureOnly,
      coreFiles: core.futureOnly
    },
    creationSurfaceRequired: {
      implementation: implementation.futureOnly.length > 0,
      tests: tests.futureOnly.length > 0,
      auxiliary: auxiliary.futureOnly.length > 0
    },
    counts: {
      basePaths: base.size,
      baseObservableCore: core.baseObservable.length,
      futureOnlyCore: core.futureOnly.length,
      baseObservableAuxiliary: auxiliary.baseObservable.length,
      futureOnlyAuxiliary: auxiliary.futureOnly.length
    }
  };
}

function classifyLayer(files, base) {
  const normalized = normalizePaths(files);
  return {
    baseObservable: normalized.filter((file) => base.has(file)),
    futureOnly: normalized.filter((file) => !base.has(file))
  };
}

function mergeLayers(...layers) {
  return {
    baseObservable: unique(layers.flatMap((layer) => layer.baseObservable)),
    futureOnly: unique(layers.flatMap((layer) => layer.futureOnly))
  };
}

function normalizePaths(values) {
  if (!Array.isArray(values)) throw new TypeError("Oracle path collections must be arrays");
  return unique(values.map(pathKey).filter(Boolean));
}

function pathKey(value) {
  if (typeof value !== "string") throw new TypeError("Oracle paths must be strings");
  return value.replaceAll("\\", "/").replace(/^\.\//, "").trim();
}

function unique(values) {
  return [...new Set(values)];
}
