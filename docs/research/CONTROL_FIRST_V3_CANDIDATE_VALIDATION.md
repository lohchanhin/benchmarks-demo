# Control-First v3 Prepublication Candidate Validation

Status: **non-formal, preregistered, 0/16 trials at preregistration**.

Plan: [`results/control-first-v3-candidate/plan.json`](../../results/control-first-v3-candidate/plan.json)

Manifest: [`results/control-first-v3-candidate/manifest.json`](../../results/control-first-v3-candidate/manifest.json)

Current progress: **4/16 trials complete**. See the audited
[small-local block report](./CONTROL_FIRST_V3_CANDIDATE_SMALL_LOCAL.md).

## Why this validation exists

The public npm release requires an interactive browser or security-key approval.
Before the operator is available to authorize that release, this study tests the
exact local `vertex-palace@0.3.0` tarball that is intended for publication. It
answers a narrow engineering question: do the 0.3.0 changes behave usefully in
the full 16-trial Agent matrix before publication?

This is not the formal v3 study. Its observations are stored in a separate
directory, use different trial IDs, and never enter the formal v3 manifest. The
formal plan remains unfrozen and its manifest remains 0/16.

## Frozen candidate inputs

- 16 trials: four seeds in each of four scenarios.
- 64 sequential Agent arms: Control, Route-only, Adaptive Palace, and Full Palace.
- Williams-balanced arm order with two warm and two cold trials per scenario.
- Model `gpt-5.6-sol`, reasoning effort `xhigh`, 600-second arm timeout.
- Hidden Oracle, strict changed-file scope, and treatment-fidelity checks.
- Exact package: `vertex-palace@0.3.0`.
- Source commit: `e901c1739c5aa907bc44ebcbd25bbdd7abd75e7a`.
- Evidence commit: `f2e0ccabb0f5a7af77a72b971524122469f47172`.
- Tarball SHA-1: `04602918f8e661a57c8286fb7b6d344baf9fb3aa`.
- The private decision-memory assignment key is not committed. Only its SHA-256
  commitment is public in the plan, so assignments cannot be changed after
  outcomes are seen.

The candidate plan also pins the byte-level SHA-256 of the formal source plan.
The runner refuses to execute if the plan, package, key commitment, Codex
version, or Palace version differs.

## Execution and publication

Each scenario block runs four trials and publishes only sanitized evidence:

```powershell
npm run run:control-first:v3:candidate -- `
  --scenario small-local-bug `
  --tarball <exact-0.3.0-tarball> `
  --key-file <operator-local-key-file>
```

Repeat for `cross-stack-regression`, `decision-memory-dependent`, and
`stale-memory-adversarial`. Raw transcripts stay under ignored
`.benchmark-runs/`; public evidence contains checksums and excludes session IDs
and local paths. Run:

```sh
npm run audit:control-first:v3:candidate
npm run analysis:control-first:v3:candidate
```

Evidence is committed after each four-trial scenario block. Negative, null,
invalid, and failed outcomes are retained. A package publish decision is made
only after all 16 trials and the candidate analysis are complete.
## Claim boundary

This run can reject a broken release candidate or provide prepublication
engineering evidence. It cannot establish a general performance claim, replace
the formal v3 study, or prove that Vertex Palace always saves tokens or time.
