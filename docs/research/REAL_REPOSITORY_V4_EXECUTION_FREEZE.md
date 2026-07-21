# Real-repository V4 execution freeze

Status: superseding owner-reviewed amendment frozen. Execution gate: **10/10
passed**. Formal Agent arms run at freeze time: **0/32**.

Post-freeze status: all **32/32** arms completed, outcomes were locked at
`cc493b198bdff95138805b18b2b4dff2dec940ee`, and the assignment key was then
revealed. See the [final report](REAL_REPOSITORY_V4_FINAL.md). This note does
not alter the frozen execution identity below.

This amendment closes the gap between the frozen V4 research design and the
executable runner. It records the exact code, product artifact, Agent runtime,
dependency profile, verification baselines, and privacy boundary that must be
revalidated before every formal arm.

## Bound execution identity

- Runner source commit: `5c4e39355962b60c627c663083da0d2e2022abf9`.
- Runner source SHA-256: `756eecd5514651b82864c99e67325ca99cd9263643ba6587e4f1a38e432709fd`.
- Vertex Palace source commit: `322b15ec6cbbbc9c86f0a03e54e7a13ebf050c5e`.
- Packed product SHA-256: `1b042d3816f66108825bfecd44e5f4ac05cea0dec777ea424c866b8196187b09`.
- Execution profile SHA-256: `98a5417aae286f7fdc04951783dfb6b4ed0b789b6bcc90be8a879715bed24af6`.
- Private evaluator source SHA-256: `667daedc0b47b94f121085d6ced431d03aeee6b07c5af6297eb4b3b155532788`.
- Codex CLI `0.145.0-alpha.28`, model `gpt-5.6-sol`, and `xhigh` reasoning.
- Fresh detached workspaces, ignored user rules/config, and Agent network access
  disabled.

The exact Node, npm, pnpm, Python, uv, upstream dependency, baseline, and
platform-adaptation facts are embedded in
`protocol/v4/execution.binding.frozen.json`.

## Freeze gate

All ten checks passed: binding structure, frozen-study identity, private-oracle
commitment, blinded-key commitment, runner identity, product artifact, Codex
runtime, execution profile, owner review, and an empty formal result state.
The public repository contains commitments and hashes, not the oracle, arm
mapping, private reference resolutions, raw transcripts, or local paths.

The receipt is an owner authorization after a Codex technical audit. It is
explicitly **not** represented as independent third-party review.

## Superseding technical amendments

The first bound invocation exposed a Codex CLI argument-position incompatibility.
Three fail-closed attempts exited before session creation with zero Agent JSON
events, zero completed arms, no code changes, and no model outcome to inspect.
The public [incident record](../../results/real-repository-v4/incidents/001-codex-cli-argument-order.json)
was committed before the correction.

The correction moves the unchanged global approval option before the `exec`
subcommand and adds an exact argument-order regression test. It does not change
the task, fixture, product, model, reasoning effort, sandbox, oracle, blinding,
verification, or statistics. The corrected command passed the reviewed CLI's
real parser without starting an Agent, after which this binding passed all ten
freeze checks again.

The next invocation exposed a second pre-session Windows shim issue: embedded
TOML quotes were escaped into an invalid strict-config field. It again produced
three infrastructure attempts, zero Agent JSON events, zero completed arms,
and no outcome. The second [incident record](../../results/real-repository-v4/incidents/002-codex-config-quoting.json)
was committed before replacing the quoted values with Codex's equivalent raw
TOML fallback strings. The exact amended command then loaded strict-config
through the reviewed Windows shim and stopped on an intentionally absent
workspace, proving it passed configuration without starting an Agent.

Both original bindings remain visible in Git history. Neither correction
changed a treatment, outcome definition, or analysis decision.

## Reproduce the public audit

```powershell
npm ci
node --test test/v4-execution-artifacts.test.mjs
npm run check
```

Formal execution uses result-only descendant commits under
`results/real-repository-v4/`. It starts with an empty blinded ledger, then a
no-Agent dependency dry run, and only then the 16 paired trials. Runtime checks
recompute the frozen binding and fail closed if runner code, hashes, private
commitments, environment facts, or unrelated repository files change.

Passing this freeze is not evidence that Vertex Palace improves correctness,
scope, time, or Token use. Those claims remain unanswered until formal results
are complete, unblinded, and analyzed under the frozen statistics plan.
