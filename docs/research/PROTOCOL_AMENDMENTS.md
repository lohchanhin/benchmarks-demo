# Protocol Amendments

The protocol was frozen as version 1.0.0 at tag `protocol-v1.0.0` before new
four-scenario pilot data were collected.

## A-001: Post-Pilot Three-Arm And Power Reporting

- Date: 2026-07-19
- Author: project maintainer with Codex
- Timing disclosure: all 20 pilot outcomes had already been inspected.
- Reason: the frozen protocol specified Route-only as a secondary mechanism
  analysis but the original renderer summarized only Full Palace versus
  Control. It also requested an observed-discordance power estimate; all
  primary pairs were concordant successes, making that estimate undefined.
- Old analysis output: Full Palace versus Control scenario summaries and a
  null observed-effect sample-size field.
- New analysis output: the unchanged primary comparison plus exploratory
  Route-only-minus-Control and Full-Palace-minus-Route-only paired summaries;
  power planning uses an explicitly assumed discordance sensitivity grid and
  labels it as post-outcome planning rather than observed evidence.
- Affected data: all four scenarios and all 20 pilot trials are reanalyzed.
  No arm outcome, exclusion, fixture, metric definition, or raw evidence was
  changed or removed.
- Applicability: reporting and planning only; no new hypothesis test is used
  to upgrade an H1-H5 conclusion.
- Commit and tag: the completion commit tagged `pilot-v1-complete`.

## A-002: Post-Outcome Task-Transport Fidelity Check

- Date: 2026-07-19
- Author: project maintainer with Codex
- Timing disclosure: the command output and all four outcomes from
  `small-local-bug-adaptive-pilot-01` had already been inspected when this
  defect was discovered.
- Reason: the benchmark embedded the task in a PowerShell double-quoted
  command. PowerShell expanded `$0` in the required `$0.00` output, so the
  three Palace arms received `.00` while Control received the frozen task.
- Old task transport: `palace context "<task>"`, with no exact comparison
  between the frozen task and the task rendered by Palace.
- New task transport: `palace context '<task>'`, with embedded single quotes
  escaped as `''`. Verification extracts the `## Task` value from captured
  Palace output and requires exact equality with the frozen manifest task.
- Affected run: `small-local-bug-adaptive-pilot-01`. Its raw transcripts and
  generated evidence are retained. Control remains individually valid;
  Route-only, Full Palace, and Adaptive Palace are reclassified invalid for
  treatment fidelity, and the run is not eligible for any cross-arm
  efficiency comparison.
- Outcome handling: no duration, token, tool-call, correctness, or scope value
  was edited or removed. The regenerated report sets `comparable` to `false`
  and all comparative deltas to `null`.
- Applicability: the correction applies only to a fresh successor protocol
  with new trial ids and seeds. The frozen `protocol-v2.0.0` tag and its plan
  are not rewritten, and the invalid run will not be silently rerun.
- Commit and tag: task-fidelity correction frozen at `protocol-v2.1.0`
  before any successor agent execution.

## Successor Protocol Disclosure

Protocol v2.0.0 is a new preregistered treatment study, not an amendment that
changes v1 outcomes. It adds Adaptive Palace, a fourth arm, payload metrics,
Williams order balance, and warm/cold local-index strata. The v1 protocol,
plans, evidence, and published analyses remain unchanged. See
[`PROTOCOL_V2.md`](./PROTOCOL_V2.md).

Protocol v2.1.0 supersedes v2.0.0 for future execution because A-002 changes
task transport and validity checks after one v2.0.0 outcome was seen. It must
use fresh trial ids and seeds and be frozen under a new tag before execution.

Protocol v2.2.0 supersedes the unexecuted remainder of v2.1.0 because A-003
changes the Windows sandbox and adds infrastructure-conformance validity after
one v2.1.0 outcome was seen. It uses fresh ids and seeds, and its empty results
manifest is frozen at `protocol-v2.2.0` before any v2.2 agent execution.

## A-003: Post-Outcome Windows Sandbox Conformance Correction

- Date: 2026-07-19
- Author: project maintainer with Codex
- Timing disclosure: all four outcomes from the first v2.1 trial had already
  been inspected when the infrastructure defect was diagnosed.
- Reason: every arm encountered a Codex native `apply_patch` failure because
  the fixed `workspace-write/windows-unelevated` profile could not enforce the
  writable-root set required by the Windows patch wrapper. Agents used slower
  fallbacks, and fallback attempts differed by arm.
- Initial hypothesis: the last-message file outside the arm workspace created
  the second writable root. Three non-study smokes kept that file inside the
  workspace and removed inherited Codex environment variables; the same error
  persisted, so this hypothesis was rejected as the sole cause.
- Correction: use `workspace-write/windows-elevated`, write the
  temporary last message inside the arm workspace, and move it to ignored
  artifacts only after Codex exits. Record platform, sandbox profile, and
  last-message transport in each run plan, execution record, and evidence
  validity check.
- Development evidence: D1-D3 failed under `unelevated`; D4 passed native
  `apply_patch` under `elevated`; D5 passed the exact repository-local Adaptive
  pipeline, public tests, and hidden oracle with zero router errors. These
  disposable checks are explicitly not treatment outcomes. See
  [`HARNESS_DIAGNOSTICS.md`](./HARNESS_DIAGNOSTICS.md).
- Affected run: the v2.1 trial remains immutable and valid for task fidelity,
  correctness, and scope observations, but its efficiency metrics are marked
  infrastructure-noisy and must not be treated as clean routing effects.
- Outcome handling: no raw duration, token, tool-call, correctness, or scope
  value is edited or removed. The remaining v2.1 plan is retired rather than
  silently continued.
- Applicability: the correction applies only to fresh protocol v2.2 ids and
  seeds. The repository-local Palace smoke passed, and no v2.2 agent may run
  before the new tag is pushed.
- Commit and tag: the diagnostic checkpoint was published before protocol
  v2.2; the final applicability commit is tagged `protocol-v2.2.0`.

## A-004: Post-Outcome v2.2 Publication Directory Registration

- Date: 2026-07-19
- Author: project maintainer with Codex
- Timing disclosure: all four outcomes from
  `small-local-bug-adaptive-v2-2-pilot-01` had already been generated and
  inspected, but no v2.2 evidence had been published.
- Reason: the publication helper explicitly mapped protocols v2.0 and v2.1,
  then silently fell back to the legacy `results/pilot` directory for an
  unknown version. Protocol v2.2 therefore would have been published under the
  wrong study root.
- Old behavior: `resultDirectoryForProtocol("2.2.0")` returned `pilot`.
- New behavior: v2.2 maps to `adaptive-pilot-v2.2`; any unregistered `2.x`
  version throws instead of silently falling back.
- Affected data: publication location only. No prompt, fixture, seed, order,
  arm execution, duration, Token count, test, oracle, validity, or comparison
  value is changed or recomputed.
- Outcome handling: the local raw run remains unchanged. Publication waits
  until this amendment, implementation, and regression test are pushed.
- Applicability: reporting only, beginning with the first v2.2 result. It does
  not authorize a rerun and does not alter the frozen treatment protocol.
- Commit: the publication-only correction is committed and pushed before the
  first v2.2 evidence bundle is generated.

## A-005: Post-Outcome Adaptive Memory Omission Observation

- Date: 2026-07-19
- Author: project maintainer with Codex
- Timing disclosure: all four outcomes from
  `tenant-memory-pitfall-adaptive-v2-2-pilot-01` had already been generated and
  inspected when the treatment behavior was identified.
- Observation: fixture preparation successfully seeded the same Aurora history
  into Full and Adaptive Palace. Full Palace emitted both seeded pitfall
  notices. Adaptive selected `full-palace` but reported zero memory items and
  zero guardrails and omitted both notices.
- Classification: this is an observed behavior of the frozen
  `vertex-palace@0.2.1` Adaptive treatment, not a benchmark infrastructure
  failure. The Adaptive arm still used the required `--auto` command, matched
  its captured output, and passed every frozen validity check.
- Outcome handling: the trial remains valid and unchanged. Its four arms all
  passed correctness and scope checks and none edited the forbidden shared
  theme, so this trial alone does not show a correctness effect from memory.
- Protocol handling: v2.2 continues unchanged. Adaptive memory retrieval will
  not be fixed in place after outcomes are known. A product correction requires
  a new package version and fresh protocol ids and seeds for confirmatory
  testing.
- Evidence: see [`ADAPTIVE_MEMORY_OMISSION.md`](./ADAPTIVE_MEMORY_OMISSION.md)
  and the sanitized machine-readable record in `docs/research/evidence/`.

## Amendment Template

Each future entry must contain:

- amendment id and date;
- author;
- reason discovered without consulting affected outcome data, or an explicit
  statement that outcome data had already been inspected;
- exact old and new text;
- affected scenarios and first applicable trial id;
- whether prior runs are retained, reanalyzed, or marked incompatible;
- commit and tag containing the amendment.
