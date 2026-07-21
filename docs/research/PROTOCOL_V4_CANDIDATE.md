# Real-Repository v4 Candidate Protocol

Protocol status at freeze: **human-reviewed and frozen, not executed**

Current study status: **16/16 trials completed after freeze; outcomes locked before reveal**
Protocol: `4.0.0-candidate.1`
Protocol field tag: `protocol-v4.0.0-candidate.1` (this is not a Git tag)
Primary comparison: Adaptive Palace versus Control

The protocol text below preserves the pre-outcome state. See the
[final report](REAL_REPOSITORY_V4_FINAL.md) for the completed result; the result
does not rewrite this frozen design.

## Why v4 exists

The completed control-first v3 study found a strong mechanism-level advantage in
decision-memory tasks, but it did not establish a general Token or speed win.
Its stale-memory condition also showed that safe rejection can carry a stable
cost. V4 therefore asks a narrower, more useful question on real repositories:

> Can Adaptive Palace reduce incorrect changed-file scope on real issues while
> preserving correctness and controlling the cost per successful solution?

V1, v2.2, and v3 artifacts remain unchanged. This candidate does not reuse any
of their outcomes as v4 evidence.

## Candidate fixtures

All workspaces will be clean checkouts at immutable 40-character commits.
Agent network access is disabled so an Agent cannot look up the later upstream
resolution. The public fixture manifest contains no accepted patch or expected
file set.

| Profile | Repository and issue | Frozen commit | Language | Verification |
| --- | --- | --- | --- | --- |
| simple-local | [Zod #4926](https://github.com/colinhacks/zod/issues/4926) | `7dd7484802b1351c8b81d3d523aadd876fcdf73e` | TypeScript | focused Vitest |
| cross-stack | [Open WebUI #25919](https://github.com/open-webui/open-webui/issues/25919) | `e473ab1231abedcb188c259b42ae7f2390739223` | Python + TypeScript | Svelte check + backend pytest |
| decision-memory-dependent | [Zod #5509](https://github.com/colinhacks/zod/issues/5509) | `6e968a3b49cb3bffc30c68634e80168e8f2a2e` | TypeScript | focused Vitest + exact scope oracle |
| stale-memory | [Requests #7432](https://github.com/psf/requests/issues/7432) | `0b401c76b6e80a4eecf3c690085b2553f6e261ca` | Python | focused pytest |

The decision fixture has owner-decision provenance in
[Zod #4688](https://github.com/colinhacks/zod/issues/4688#issuecomment-2967793697)
and frozen project documentation. The stale fixture uses the historical
[Requests typing migration](https://github.com/psf/requests/commit/561e4b6889f53584c39a67f8794c53a414f68481)
as deliberately stale advice. Current code, tests, and the external oracle
remain authoritative.

The repository owner explicitly approved the task wording, protocol, private
oracle commitment, and freeze in Codex session
`019f4280-40ee-7172-b94d-f5aa7aa46814`. Codex performed the technical audit.
The public receipt accurately records that this was not an independent
third-party review; independent reproduction remains recommended before runs.

## Design

- Four fixtures, one for each preregistered task profile.
- Four isolated paired trials per fixture: 16 trials and 32 Agent arm runs.
- Two cold and two warm repetitions per fixture.
- Balanced blinded `arm-a/arm-b` and `arm-b/arm-a` order within each fixture.
- Fresh worktree and fresh Agent session for every arm.
- Primary arms only: `adaptive-palace` and `control`.
- No network access during Agent execution.
- No formal retry except a preregistered infrastructure retry; every retry cost
  remains in the denominator.

The mapping from blinded labels to treatments and the exact oracle are kept in
evaluator-only files. The public plan records SHA-256 commitments to both.
Neither private artifact is copied into an Agent workspace.

## Hidden oracle

Each evaluator-only fixture entry contains:

- a reference resolution and immutable commit;
- behavioral correctness criteria;
- the exact changed-file set;
- forbidden paths;
- either `exact-files` or `no-code-change` scope policy.

The public repository commits only the canonical JSON hash. The ignored local
default is `.benchmark-private/v4/oracle.json`; an independent evaluator may
instead provide a file outside this repository. The committed template contains
placeholders only.

## Frozen analysis

The primary outcomes are ordered before any Agent run:

1. correctness against the external oracle;
2. forbidden or non-exact changed-file scope;
3. `cost_per_successful_solution`;
4. `success_weighted_reported_tokens`;
5. `retry_adjusted_cost`.

Definitions:

- `cost_per_successful_solution` is total observed cost from successful,
  failed, and retried attempts divided by successful solutions.
- `success_weighted_reported_tokens` is the mean reported Token count among
  oracle-successful solutions; the success rate is always reported beside it.
- `retry_adjusted_cost` includes the initial attempt and every allowed
  infrastructure retry, divided by ultimately successful solutions.
- `hierarchical_win` compares each pair by success, then exact scope, then
  lower reported Tokens, then lower wall time. Later criteria are used only
  when all earlier criteria tie.

Paired stratified bootstrap intervals use 10,000 resamples and a 95% confidence
level. Secondary Token, tool-call, adherence, and time analyses are descriptive.
They cannot replace the primary hierarchy or be promoted after results are seen.
No outcome-dependent exclusion is allowed.

## Freeze gate

The preserved pre-review draft is:

```text
frozen: false
humanReviewApproved: false
executionAllowed: false
formalAgentTrialsRun: 0
runnerAvailable: false
```

After owner authorization and an 11/11 local gate, `plan.frozen.json` is now:

```text
frozen: true
humanReviewApproved: true
executionAllowed: true
formalAgentTrialsRun: 0
runnerAvailable: false
```

The gate verifies protocol identity, fixtures, public-plan cleanliness,
preregistered statistics, oracle commitment, arm-key commitment, an exact human
review receipt, and an empty execution manifest. A failed gate cannot write a
frozen plan. There is intentionally no `v4-run` command.

```bash
npm run v4:plan
npm run v4:gate
npm run check:v4-prep
```

On the preparation machine, the private oracle, arm key, and public human review
receipt pass all 11 checks. A public clone cannot recompute four evaluator-secret
checks, so it reports those checks as blocked while verifying the receipt and
frozen audit. Both states are correct. PR5 intentionally provides no `v4-run`
command, so the frozen plan remains at zero formal trials.

## Review record and remaining pre-run audit

1. Independently verify every issue, frozen commit, and verification command.
2. Inspect the private oracle without moving it into the public repository.
3. Confirm exact and forbidden paths do not encode information visible to an Agent.
4. Confirm network isolation, clean worktrees, and session independence.
5. Confirm the statistical hierarchy and cost formulas before seeing outcomes.
6. Generate a receipt matching the exact plan, fixture, oracle, and arm-key hashes. Completed by owner authorization.
7. Run `v4-gate --require-ready`; freeze only if all checks pass. Completed 11/11 locally.

Freezing is not evidence of product benefit. V4 conclusions begin only after the
preregistered real-repository trials are completed and externally auditable.
