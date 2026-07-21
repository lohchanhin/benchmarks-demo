# V4 Execution Harness Design

Status: implementation preflight; no formal v4 Agent arm has run.

The frozen v4 research plan fixes the fixtures, trial schedule, hidden-oracle
commitment, blinding commitment, and analysis. It deliberately does not bind an
execution harness. Formal execution therefore requires a separate, reviewed
execution amendment before the first arm.

## Frozen execution amendment

The amendment must bind:

- the SHA-256 of `protocol/v4/plan.frozen.json`;
- the first Git commit containing that frozen plan;
- the exact Vertex Palace source commit and packed tarball hashes;
- the exact runner source commit and runner file hash;
- Codex CLI version, model, reasoning effort, timeout, and cooldown;
- `workspace-write` sandboxing with network access disabled;
- one fresh detached checkout per arm at each fixture's frozen commit;
- dependency setup commands executed before the timed Agent session;
- evaluator-only oracle and blinding commitments;
- an empty formal results manifest.

The amendment is created only after the runner implementation is committed, so
the runner commit can be named without a circular hash. A second public review
receipt freezes the amendment. Formal execution starts from that reviewed
binding commit; resume commits may change only `results/real-repository-v4/`.

## Execution flow

1. Validate the frozen plan, public review receipt, private oracle, arm key, and
   empty result state.
2. Acquire each upstream repository outside the timed session and verify the
   frozen commit object.
3. Create fresh, independent detached workspaces for each blinded arm.
4. Install dependencies and verify a clean tracked baseline.
5. Prepare and pre-index Vertex Palace only for the Adaptive workspace; seed
   only the preregistered decision or stale-memory profile.
6. Start Codex with ignored user config/rules, ephemeral JSONL output, approvals
   disabled, workspace-write sandboxing, and network access disabled.
7. Capture transcript, stderr, last message, timing, versions, and Git evidence.
8. Run public verification and the external hidden oracle after the Agent exits.
9. Publish sanitized evidence without session IDs, private paths, oracle
   contents, or the blinding key.
10. Commit completed results incrementally. Resume only completed immutable arm
    records; fail closed on partial or conflicting evidence.

## Dry-run boundary

The first implementation phase may clone sources, validate commits, materialize
workspaces, resolve blinded orders, and exercise the evaluator with local test
fixtures. It must not invoke a task Agent. A separate diagnostic may probe Codex
network isolation, but it is labeled non-formal and cannot enter the v4 result
manifest.

No npm publication, Git tag, or GitHub Release is part of this phase.

## Windows preflight amendment

The actual preflight is recorded in
`docs/research/REAL_REPOSITORY_V4_AGENT_PREFLIGHT.md` and its machine-readable evidence.
It binds an ASCII-only workspace root, exact Node/Python tooling, a hashed Requests
dependency lock, one unrelated Windows symlink-test exclusion, and baseline-delta
interpretation for the already-failing Open WebUI check. The nonexistent Open WebUI
`backend/tests` command remains visible as preflight-invalid and is not silently replaced.
