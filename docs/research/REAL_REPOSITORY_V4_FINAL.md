# Real-Repository V4 Final Report

Status: **completed, outcome-locked, revealed, and reproducible**

Protocol: `4.0.0-candidate.1`

Product: `vertex-palace@0.3.0` at `322b15ec6cbbbc9c86f0a03e54e7a13ebf050c5e`
Outcome lock: `cc493b198bdff95138805b18b2b4dff2dec940ee`

[Simplified Chinese](../zh-CN/REAL_REPOSITORY_V4_FINAL.md) | [Frozen protocol](PROTOCOL_V4_CANDIDATE.md) | [Machine analysis](../../results/real-repository-v4/analysis.json) | [Blinding reveal](../../results/real-repository-v4/blinding-reveal.json) | [Post-hoc mechanism audit](../../results/real-repository-v4/mechanism-audit.post-hoc.json)

## Bottom line

This study does **not** support deploying Vertex Palace 0.3.0 as a general
correctness or efficiency improvement over ordinary Codex on real repository
tasks. Adaptive Palace achieved strict success in **3/16** arms; Control
achieved **11/16**. The paired difference was -50 percentage points (95%
stratified bootstrap interval -62.5 to -37.5 points), with two-sided exact
McNemar `p=0.0078125`. There were eight Control-only successes and zero
Adaptive-only successes.

Adaptive used less context on several descriptive Token measures, but that is
not an efficiency win: it also failed substantially more often. Its
retry-adjusted wall-time cost per strict success was **40.59 minutes**, versus
**10.31 minutes** for Control. Its reported-Token cost per success was at least
**7.30M**, versus **2.73M** for Control; the Adaptive number is only a lower
bound because one 900-second timed-out attempt emitted no final usage event.

The useful result is diagnostic. Version 0.3.0 often made the Agent read less,
but the bounded route did not preserve enough evidence for these issues.

## Study design

- Four public real issues at immutable commits: Zod #4926, Open WebUI #25919,
  Zod #5509, and Requests #7432.
- Four isolated paired repetitions per issue: 16 trials and 32 Agent arms.
- Two cold and two warm repetitions per issue, with balanced AB/BA order.
- One fresh workspace and Agent session per arm; Agent network access disabled.
- Exact Codex build, model, runtime, dependencies, Palace tarball, and runner
  hashes frozen before execution.
- Correctness and exact changed-file scope scored by an evaluator-private
  oracle whose commitment was frozen before execution.
- Arm labels stayed blinded until all outcomes were committed. The published
  key reproduces all 32 assignments without publishing the private oracle.

One Requests Adaptive attempt timed out before producing a final usage event.
The preregistered infrastructure retry completed. Its 900,215 ms cost remains
in wall-time accounting; its unobserved Token cost is `null`, never zero.

## Primary outcomes

Adaptive minus Control is the direction of every difference.

| Outcome | Adaptive | Control | Difference (95% paired stratified bootstrap) | Exact paired p |
| --- | ---: | ---: | ---: | ---: |
| Oracle correctness | 5/16 (31.25%) | 12/16 (75.00%) | -43.75 pp (-50.00 to -31.25) | 0.015625 |
| Strict success | 3/16 (18.75%) | 11/16 (68.75%) | -50.00 pp (-62.50 to -37.50) | 0.0078125 |
| Exact changed-file scope | 10/16 (62.50%) | 15/16 (93.75%) | -31.25 pp (-50.00 to -12.50) | 0.0625 |
| Forbidden-file violation | 2/16 (12.50%) | 1/16 (6.25%) | +6.25 pp (0 to +18.75) | 1.0 |

Strict success required oracle correctness, exact scope, no forbidden file,
a valid diff, and completed execution. No outcome-dependent exclusion was
applied.

The frozen hierarchical comparison produced 7 Adaptive wins and 9 Control
wins (`p=0.8036`, ignoring ties). This does not override strict success. Seven
hierarchical Adaptive wins include pairs where both arms were wrong and the
tie-breaker selected the lower-Token failure. A cheaper failed answer is not a
successful solution.

## Task profiles

Each profile has only four pairs; these rows are descriptive.

| Real issue profile | Adaptive success | Control success | Hierarchical A/C | Median reported-Token delta | Median uncached-input delta | Median time delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Zod transform/refine, small local | 1/4 | 4/4 | 1 / 3 | +257,625.5 | +0.5 | +11.482 s |
| Open WebUI analytics, cross-stack | 0/4 | 4/4 | 0 / 4 | -1,287,951 | -29,244.5 | -46.476 s |
| Zod report-input decision | 2/4 | 3/4 | 3 / 1 | -387,839 | -20,061 | +24.871 s |
| Requests stream regression, stale memory | 0/4 | 0/4 | 3 / 1 | -608,595 | -32,772 | -99.574 s |

The cross-stack row is the clearest warning: Adaptive reported far fewer
Tokens because all four Adaptive attempts were incorrect, while all four
Control attempts succeeded. In the stale-memory row both treatments failed,
so Token and hierarchy differences say nothing about task utility.

## Cost and Token accounting

| Measure | Adaptive | Control | Interpretation |
| --- | ---: | ---: | --- |
| Final-attempt reported Tokens | 21,887,074 | 30,068,933 | Adaptive total is lower, alongside 3 versus 11 successes. |
| Final-attempt uncached input | 1,298,001 | 1,693,306 | Reported input is heavily cached; uncached input is shown separately. |
| All-attempt wall time | 121.77 min | 113.45 min | Adaptive includes the timed-out attempt and retry. |
| Wall time per strict success | 40.59 min | 10.31 min | Adaptive is 30.28 min higher per success. |
| Reported Tokens per strict success | >=7.30M | 2.73M | Adaptive is a lower bound because retry usage is unobserved. |
| Mean Tokens among successful answers | 0.935M, n=3 | 2.158M, n=11 | Different successful subsets; always read with the success rates. |

Across all 16 paired final attempts, Adaptive had a median -221,872 reported
Tokens (95% interval -666,550 to -42,951) and -24,687 uncached input Tokens
(-29,244.5 to -21,804.5). It added a median 3 tool calls (-0.5 to +8). Final-
attempt wall time was -18.181 seconds (-49.728 to +38.203); after including
the retry, the median paired difference was +3.070 seconds (-46.476 to
+39.095). These are descriptive secondary outcomes. Reported Tokens include
cached input and are not a direct billing measure.

## Post-hoc mechanism audit

This audit was performed only after outcome lock and cannot replace the primary
analysis. A sanitized artifact publishes aggregate routing telemetry and source
hashes, not raw Agent events.

- All 16 Adaptive arms received the exact task text, ruling out the earlier
  task-transport failure mode.
- Adaptive selected `full-palace` 8 times and `guarded-memory-palace` 8 times.
  It selected `bypass` or `route-lite` **zero** times.
- The median Palace-related call count was 3; the median context payload was
  about 3,640.5 estimated Tokens.
- The decision-memory fixture received zero memory items in all four runs,
  despite entering a guarded mode. The stale-memory fixture received one stale
  item and two guardrails in all four runs.

The direct Palace payload was too small to explain million-Token run totals by
itself. The stronger hypothesis is behavioral: the route and stop contract
changed what the Agent investigated and when it stopped. That hypothesis is
post-hoc and must be tested in a fresh protocol.

## Development decision

Do not market 0.3.0 as faster, cheaper, or more correct than Codex. Preserve
the release and this negative result as the baseline. The next product work
should target correctness before another efficiency claim:

1. Make route output advisory by default. A route may prioritize evidence but
   must not prohibit expansion before dependency and test coverage is known.
2. Add an evidence-sufficiency gate. Low intent coverage, missing cross-stack
   dependencies, or absent decision provenance must produce `insufficient`,
   not high-confidence bounded context.
3. Separate routing confidence from memory confidence and task confidence.
   Each must expose why evidence is present, absent, stale, or conflicting.
4. Build real-issue retrieval gates for implementation files, tests, indirect
   dependencies, and owner decisions before launching more Agent trials.
5. Redesign `palace evaluate` to detect omitted necessary files and unjustified
   stopping, not merely confirm that changed files appeared in a route.
6. Test a future advisory treatment on fresh issues and trial IDs. V4 outcomes
   must not be overwritten or reused as confirmation data.

## Reproduce the public analysis

These commands do not rerun the expensive Agent sessions:

```bash
npm ci
npm run verify:retry-cost:real-repository:v4
npm run verify:reveal:real-repository:v4
npm run verify:analysis:real-repository:v4
npm run verify:mechanism-audit:real-repository:v4
```

The 32 public evidence files, locked manifest, revealed assignment key,
sanitized retry accounting, machine analysis, and post-hoc telemetry are under
[`results/real-repository-v4/`](../../results/real-repository-v4/).

## Limits

This is an exploratory study of four issues, one Windows machine, one Codex
build, one model configuration, and one product version. Repetitions are not
independent repositories. The hidden oracle is committed but not published,
so an independent evaluator can verify its hash but cannot reconstruct private
acceptance details from the public repository alone. The results are strong
enough to reject a benefit claim for this sample, not to prove Palace can never
help any repository task.
