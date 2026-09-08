import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freezeSchedule, decideRetention, evaluateEngineeringGate } from '../src/net-benefit/protocol.mjs';

const input = () => ({ candidate: { engineeringPassed: true, sha256: 'a'.repeat(64) }, excludedRepositories: [], seed: 'frozen-seed',
  targets: Array.from({ length: 4 }, (_, repo) => ['simple', 'cross-file', 'historical-decision'].map(profile => ({
    id: `${repo}-${profile}`, repository: `https://github.com/fixture/repo-${repo}`, languageGroup: repo < 2 ? 'js-ts' : 'python',
    profile, commit: 'b'.repeat(40), task: 'Repair an observable behavior', acceptance: ['node test.mjs'],
    historySha256: 'c'.repeat(64), historyCreatedAt: '2025-01-01', fixCreatedAt: '2025-02-01'
  }))).flat() });
test('freezes exactly 72 balanced serial runs with no previously used repository', () => {
  const schedule = freezeSchedule(input());
  assert.equal(schedule.length, 72);
  assert.equal(new Set(schedule.map(run => run.id)).size, 72);
  assert.deepEqual(schedule, freezeSchedule(input()));
  const positions = [0, 1, 2].map(position => schedule.filter((_, index) => index % 3 === position).map(run => run.condition));
  for (const list of positions) for (const condition of 'ABC') assert.equal(list.filter(value => value === condition).length, 8);
  assert.throws(() => freezeSchedule({ ...input(), excludedRepositories: ['https://github.com/fixture/repo-0'] }));
  assert.throws(() => freezeSchedule({ ...input(), candidate: null }));
});
const resultsFor = schedule => schedule.map(run => ({ id: run.id, status: 'success', wallMs: 1000,
  indexCostMs: 0, memoryMaintenanceMs: 0, reportedTokens: 100, safetyViolations: [] }));
test('does not qualify empty, timed-out, diagnostic or different-artifact engineering samples', () => {
  const artifact = { cliSha256: 'a', mcpSha256: 'b' };
  const checks = Object.fromEntries(['lint', 'test', 'build', 'mcp-smoke', 'release-candidate', 'temporary-install'].map(name => [name, 'passed']));
  const indexObservation = { wallMs: 5, phases: { scan: 1, parse: 1, graph: 1, publish: 1, total: 4 } };
  const attempt = { artifacts: artifact, samples: ['synthetic-1000-files', 'synthetic-10000-files', 'private-vve-performance-snapshot'].map(id => ({
    id, coldIndex: indexObservation, unchangedRebuild: indexObservation, changedRefresh: indexObservation,
    queries: ['path', 'qualified-symbol', 'symbol', 'lexical', 'neighbors', 'memory', 'miss'].map(id => ({ id,
      cliMs: Array(30).fill(500), mcpMs: Array(30).fill(100), deterministic: true, outputsWithinBudget: true }))
  })) };
  assert.equal(evaluateEngineeringGate([attempt], artifact, checks).passed, true);
  assert.equal(evaluateEngineeringGate([attempt], { cliSha256: 'new', mcpSha256: 'b' }, checks).passed, false);
  assert.equal(evaluateEngineeringGate([{ ...attempt, diagnosticOnly: true }], artifact, checks).passed, false);
  attempt.samples[2].coldIndex = {};
  assert.equal(evaluateEngineeringGate([attempt], artifact, checks).passed, false);
  attempt.samples[2].coldIndex = indexObservation;
  attempt.samples[2].queries = [];
  assert.equal(evaluateEngineeringGate([attempt], artifact, checks).agentRunsAuthorized, false);
  const readEvidence = name => JSON.parse(readFileSync(new URL(`../results/net-benefit-v1/${name}`, import.meta.url)));
  const published = readEvidence('stage-status.json');
  const raw = published.measurementSources.map(readEvidence);
  assert.deepEqual(evaluateEngineeringGate(raw, published.artifact, published.checks), published.gate);
  assert.equal(published.gate.agentRunsAuthorized, false);
  assert.equal(published.agentExecutions, 0);
  assert.equal(raw.flatMap(value => value.samples).flatMap(sample => sample.queries)
    .reduce((sum, query) => sum + query.cliMs.length + query.mcpMs.length, 0), published.warmObservations);
});
test('does not call neutral results a win and retains unknown usage as unknown', () => {
  const schedule = freezeSchedule(input()), results = resultsFor(schedule);
  assert.equal(decideRetention(schedule, results).decision, 'stop-active-development');
  assert.equal(decideRetention(schedule, results.slice(1)).decision, 'incomplete');
  assert.throws(() => decideRetention(schedule, [...results, results[0]]));
  results.forEach((result, i) => { if (schedule[i].condition === 'C') { result.wallMs = 600; result.reportedTokens = null; } });
  assert.equal(decideRetention(schedule, results).decision, 'stop-active-development');
});
test('counts task-level benefit and includes indexing and memory maintenance costs', () => {
  const schedule = freezeSchedule(input()), results = resultsFor(schedule);
  results.forEach((result, i) => { if (schedule[i].condition === 'C') result.wallMs = 700; });
  assert.equal(decideRetention(schedule, results).decision, 'retain-lightweight');
  results.forEach((result, i) => { if (schedule[i].condition === 'C') result.indexCostMs = 400; });
  assert.equal(decideRetention(schedule, results).decision, 'stop-active-development');
});
