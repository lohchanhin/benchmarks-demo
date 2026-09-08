import { createHash } from 'node:crypto';

const orders = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];
const indexStates = ['cold-index', 'warm-index'];
const digest = value => createHash('sha256').update(value).digest('hex');

export function evaluateEngineeringGate(attempts, artifact, checks) {
  const reasons = [];
  const requiredChecks = ['lint', 'test', 'build', 'mcp-smoke', 'release-candidate', 'temporary-install'];
  for (const name of requiredChecks) if (checks[name] !== 'passed') reasons.push(`check-not-passed:${name}`);
  const samples = ['synthetic-1000-files', 'synthetic-10000-files', 'private-vve-performance-snapshot'];
  const queryKinds = ['path', 'qualified-symbol', 'symbol', 'lexical', 'neighbors', 'memory', 'miss'];
  const matching = attempts.filter(attempt => !attempt.diagnosticOnly
    && attempt.artifacts?.cliSha256 === artifact.cliSha256 && attempt.artifacts?.mcpSha256 === artifact.mcpSha256);
  for (const id of samples) {
    const sample = matching.flatMap(attempt => attempt.samples ?? []).find(item => item.id === id);
    const indexObservations = [sample?.coldIndex, sample?.unchangedRebuild, sample?.changedRefresh];
    if (!indexObservations.every(observation => valid(observation?.wallMs)
      && ['scan', 'parse', 'graph', 'publish', 'total'].every(phase => valid(observation?.phases?.[phase])))) {
      reasons.push(`missing-index-observation:${id}`);
    }
    for (const kind of queryKinds) {
      const query = sample?.queries?.find(item => item.id === kind);
      if (!query || query.cliMs?.length !== 30 || query.mcpMs?.length !== 30
        || !query.cliMs.every(valid) || !query.mcpMs.every(valid)) {
        reasons.push(`incomplete-query:${id}:${kind}`); continue;
      }
      const p95 = values => [...values].sort((a, b) => a - b)[28];
      if (p95(query.cliMs) > 2000 || p95(query.mcpMs) > 1000) reasons.push(`latency-limit:${id}:${kind}`);
      if (!query.deterministic || !query.outputsWithinBudget) reasons.push(`delivery-contract:${id}:${kind}`);
    }
  }
  return { passed: reasons.length === 0, reasons, agentRunsAuthorized: reasons.length === 0 };
}

export function freezeSchedule({ candidate, targets, excludedRepositories, seed }) {
  if (candidate?.engineeringPassed !== true || !/^[a-f0-9]{64}$/.test(candidate.sha256 ?? '')) throw new Error('Engineering-qualified candidate hash is required');
  if (targets.length !== 12 || new Set(targets.map(target => target.id)).size !== 12) throw new Error('Exactly 12 unique tasks are required');
  const repositories = new Map();
  const excluded = new Set(excludedRepositories.map(value => value.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '')));
  for (const target of targets) {
    const repo = target.repository.toLowerCase().replace(/\.git$/, '').replace(/\/$/, '');
    if (excluded.has(repo)) throw new Error('Previously used repository is ineligible');
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Public repository URL is required');
    if (!/^[a-f0-9]{40}$/.test(target.commit ?? '') || !target.task?.trim() || !target.acceptance?.length) throw new Error('Frozen revision, task and acceptance commands are required');
    if (!/^[a-f0-9]{64}$/.test(target.historySha256 ?? '') || !Number.isFinite(Date.parse(target.historyCreatedAt))
      || !Number.isFinite(Date.parse(target.fixCreatedAt))
      || Date.parse(target.historyCreatedAt) >= Date.parse(target.fixCreatedAt)) throw new Error('History must predate the fix');
    const entries = repositories.get(repo) ?? []; entries.push(target); repositories.set(repo, entries);
  }
  if (repositories.size !== 4) throw new Error('Exactly four repositories are required');
  const languageCounts = { 'js-ts': 0, python: 0 };
  for (const group of repositories.values()) {
    if (group.length !== 3 || new Set(group.map(target => target.profile)).size !== 3
      || group.some(target => !['simple', 'cross-file', 'historical-decision'].includes(target.profile))) throw new Error('Each repository needs the three task profiles');
    if (new Set(group.map(target => target.languageGroup)).size !== 1 || !(group[0].languageGroup in languageCounts)) throw new Error('Repository language group must be fixed');
    languageCounts[group[0].languageGroup] += 1;
  }
  if (languageCounts['js-ts'] !== 2 || languageCounts.python !== 2) throw new Error('Language balance must be two JS/TS and two Python repositories');
  const blocks = targets.slice().sort((a, b) => a.id.localeCompare(b.id)).flatMap((target, position) => indexStates.map((state, repeat) => ({
    taskId: target.id, indexState: state, order: orders[(position * 2 + repeat) % orders.length]
  }))).sort((a, b) => digest(`${seed}:${a.taskId}:${a.indexState}`).localeCompare(digest(`${seed}:${b.taskId}:${b.indexState}`)));
  return blocks.flatMap(block => [...block.order].map(condition => ({ id: `${block.taskId}:${block.indexState}:${condition}`,
    taskId: block.taskId, indexState: block.indexState, condition, candidateSha256: candidate.sha256, timeoutMs: 900000 })));
}

export function decideRetention(schedule, results) {
  const planned = new Set(schedule.map(run => run.id));
  const observed = new Map();
  for (const result of results) {
    if (!planned.has(result.id) || observed.has(result.id)) throw new Error('Unplanned or duplicate execution; replacement runs are forbidden');
    if (!['success', 'failed', 'timeout', 'environment-error'].includes(result.status)) throw new Error('Unknown execution status');
    observed.set(result.id, result);
  }
  if (schedule.length !== 72 || results.length !== 72 || results.some(result => result.status === 'environment-error' || !Array.isArray(result.safetyViolations))) {
    return { decision: 'incomplete', observed: results.length, planned: 72, performanceClaims: false };
  }
  const tasks = [...new Set(schedule.map(run => run.taskId))];
  if (tasks.length !== 12) throw new Error('Twelve independent tasks are required');
  const byTask = Object.fromEntries(tasks.map(task => [task, Object.fromEntries(['A', 'B', 'C'].map(condition => [condition,
    schedule.filter(run => run.taskId === task && run.condition === condition).map(run => observed.get(run.id))]))]));
  const compare = (candidate, baseline) => {
    let candidateSuccess = 0, baselineSuccess = 0, improvedTasks = 0, violations = 0;
    const pairedTimeRatios = [], pairedTokenRatios = [];
    for (const task of Object.values(byTask)) {
      const left = task[candidate], right = task[baseline];
      const leftSuccess = left.filter(run => run.status === 'success').length, rightSuccess = right.filter(run => run.status === 'success').length;
      candidateSuccess += leftSuccess; baselineSuccess += rightSuccess;
      if (leftSuccess > rightSuccess) improvedTasks += 1;
      violations += left.reduce((count, run) => count + (run.safetyViolations?.length ?? 0), 0);
      if (leftSuccess !== 2 || rightSuccess !== 2) continue;
      const timeA = left.map(totalTime), timeB = right.map(totalTime);
      const tokenA = left.map(run => run.reportedTokens), tokenB = right.map(run => run.reportedTokens);
      if (timeA.every(valid) && timeB.every(value => valid(value) && value > 0)) pairedTimeRatios.push(median(timeA) / median(timeB));
      if (tokenA.every(valid) && tokenB.every(value => valid(value) && value > 0)) pairedTokenRatios.push(median(tokenA) / median(tokenB));
    }
    const timeRatio = median(pairedTimeRatios), tokenRatio = median(pairedTokenRatios);
    const efficiency = pairedTimeRatios.length >= 8 && pairedTokenRatios.length === pairedTimeRatios.length && timeRatio <= 0.8 && tokenRatio <= 1.1;
    return { candidateSuccess, baselineSuccess, improvedTasks, violations,
      commonSuccessfulTasksWithTime: pairedTimeRatios.length, timeRatio, tokenRatio,
      meets: candidateSuccess >= baselineSuccess && violations === 0 && (improvedTasks >= 2 || efficiency) };
  };
  const ca = compare('C', 'A'), ba = compare('B', 'A'), cb = compare('C', 'B');
  const memoryOnly = ba.meets && cb.improvedTasks === 0 && cb.timeRatio !== null && cb.timeRatio > 0.9;
  return { decision: memoryOnly ? 'retain-memory' : ca.meets ? 'retain-lightweight' : 'stop-active-development',
    comparisons: { C_minus_A: ca, B_minus_A: ba, C_minus_B: cb }, performanceClaims: false,
    limitation: 'Investment criteria, not statistical correctness noninferiority or demonstrated acceleration.' };
}

function totalTime(run) {
  const values = [run.wallMs, run.indexCostMs, run.memoryMaintenanceMs];
  return values.every(valid) ? values.reduce((a, b) => a + b, 0) : null;
}
function valid(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
