# Real-repository V4 Agent preflight

Status: passed with preregistered platform adaptations. Formal Agent arms run: **0/32**.

This preflight tested the four frozen upstream checkouts, exact toolchain, dependency
installation, and public verification commands before the first formal Agent session.
It found two environment facts that would otherwise have produced invalid outcome
labels. Both are now bound in `protocol/v4/execution.profile.json`.

## Reproducible runtime

- Node.js 22.23.1 from the official Windows x64 archive; SHA-256 verified.
- npm 10.9.8 and pnpm 10.12.1 through the reviewed Node distribution/Corepack.
- CPython 3.11.9 and uv 0.11.30.
- Codex CLI 0.145.0-alpha.28 from an isolated private installation.
- ASCII-only Windows formal workspaces and `core.autocrlf=false` checkouts.
- Agent network access disabled; dependencies are installed before timed execution.

All four frozen commits and their private reference-resolution commits are present in
the verified local mirrors. The Requests dependency solution is hash-locked in
`protocol/v4/dependencies/requests-win-py311.txt`.

## Baselines and adaptations

The two Zod focused suites pass cleanly at baseline: 34 tests for the transform fixture
and 54 tests for the decision fixture.

Requests passes 335 tests with one skip, one expected failure, and one predeclared
deselection. The deselected TLS test requires a repository symlink that this Windows
account cannot create and is unrelated to stream detection. The exclusion is fixed
before outcomes and is applied symmetrically to both arms.

Open WebUI's frozen `npm run check` already exits nonzero with 9,702 errors and 274
warnings in 386 files. V4 therefore scores whether an arm adds diagnostics relative to
that committed baseline rather than treating the inherited nonzero exit as an Agent
failure. The second advertised command, `python -m pytest -q backend/tests`, is invalid
because that directory does not exist at the frozen commit. It remains visible in the
protocol and is marked preflight-invalid; external hidden checks cover backend syntax
and task correctness.

## Integrity boundary

The public evidence records hashes for the Requests lock, the raw Open WebUI baseline,
and the private evaluator without publishing oracle contents. Control and Adaptive use
the same checkout, runtime, dependency bundle, task, verification policy, and evaluator.
Only the preregistered Palace treatment differs.

No task Agent was invoked while discovering or binding these adaptations.
