export function scoreArm({ testsPassed, expectedFiles, changedFiles, forbiddenFiles, diffCheckPassed }) {
  const changed = new Set(changedFiles);
  const expectedMatched = expectedFiles.filter((file) => changed.has(file));
  const forbiddenChanged = forbiddenFiles.filter((file) => changed.has(file));
  const unexpectedChanged = changedFiles.filter((file) => !expectedFiles.includes(file));
  const expectedCoverage = expectedFiles.length ? expectedMatched.length / expectedFiles.length : 1;

  const correctnessPoints = testsPassed ? 60 : 0;
  const coveragePoints = Math.round(expectedCoverage * 20);
  const scopePenalty = forbiddenChanged.length * 20 + unexpectedChanged.length * 5 + (diffCheckPassed ? 0 : 5);
  const scopePoints = Math.max(0, 20 - scopePenalty);

  return {
    total: correctnessPoints + coveragePoints + scopePoints,
    points: {
      correctness: correctnessPoints,
      expectedCoverage: coveragePoints,
      scope: scopePoints
    },
    testsPassed,
    expectedCoverage,
    expectedMatched,
    expectedMissed: expectedFiles.filter((file) => !changed.has(file)),
    forbiddenChanged,
    unexpectedChanged
  };
}
