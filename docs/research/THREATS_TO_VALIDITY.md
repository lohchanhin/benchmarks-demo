# Threats To Validity

## Internal Validity

- Online model latency and queue load vary. Arms are sequential, order is
  randomized, cooldown is fixed, and wall time is secondary.
- Model behavior is stochastic. Fixtures use paired seeds and the pilot reports
  all runs rather than a selected example.
- Palace setup can leak task information. Route-only and Full Palace use the
  same context command; only historical memory differs.
- Public tests may reveal the solution. An external oracle evaluates behavior
  that is not copied into the agent workspace.
- Transcript parsing is not an OS access audit. Path counts and command output
  are explicitly labeled as proxies.

## Construct Validity

- Token counters are cumulative Codex telemetry, not invoice totals.
- Changed-file precision can penalize legitimate supporting changes. Raw diffs
  and oracle outcomes are therefore published beside the metric.
- A seeded pitfall is a controlled approximation of organic long-term memory.
  Later sequential-task studies are needed for stronger memory claims.
- Route Recall@K uses preregistered file ground truth and cannot measure every
  useful conceptual clue.

## External Validity

- Four JavaScript/JSON fixture scenarios do not represent every language,
  monorepo, team, or task type.
- The small scenario is deliberately unfavorable to Palace; the larger
  scenarios are deliberately structured. Neither should be generalized alone.
- Results for Codex and Vertex Palace versions in the manifest may not transfer
  to later versions.

## Statistical Conclusion Validity

- Five pilot pairs per scenario are underpowered. Confidence intervals and raw
  values take priority over significance labels.
- Multiple scenario comparisons inflate false-positive risk; Holm correction
  is mandatory.
- Efficiency is analyzed only for mutually successful pairs to avoid rewarding
  a fast incorrect answer. Success itself remains the primary outcome.

## Reproducibility Risks

- Hosted model behavior can change without a local code change. CLI/model
  identifiers, timestamps, versions, order, and hashes are recorded.
- Raw transcripts can expose local paths. Reviewed evidence is public; raw
  JSONL remains available to the experimenter and is never silently discarded.
- Protocol amendments can create researcher degrees of freedom. The frozen tag
  and prospective amendment log define which rules apply to each run.
